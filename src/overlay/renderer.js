const { ipcRenderer } = require('electron');
const translations = require('../shared/translations');

// Local settings
let settings = {};
let countdownInterval = null;
let eyeTrackerInterval = null;
let durationRemaining = 20;

// DOM Elements
const panelRelax = document.getElementById('panel-relax');
const panelCompleted = document.getElementById('panel-completed');
const countdownText = document.getElementById('countdown-text');
const countdownUnitText = document.getElementById('countdown-unit-text');
const overlayTitle = document.getElementById('overlay-title');
const overlayDesc = document.getElementById('overlay-desc');
const btnSkipBreak = document.getElementById('btn-skip-break');
const strictToastElement = document.getElementById('strict-toast-element');
const completedTitle = document.getElementById('completed-title');
const completedDesc = document.getElementById('completed-desc');
const eyeTrackerDot = document.getElementById('eye-tracker-dot');

// Audio Synthesizer (Zero-Dependency Web Audio API)
const AudioSynth = {
  ctx: null,

  init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
  },

  // Play a beautiful, soft, high-pitched crystal bell double chime (E6 then A6)
  playStartChime() {
    try {
      this.init();
      const now = this.ctx.currentTime;
      const notes = [1318.51, 1760.00]; // E6 and A6 (pure crystal chime pitches)

      notes.forEach((f, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, now + idx * 0.15); // Staggered by 150ms

        gain.gain.setValueAtTime(0, now + idx * 0.15);
        gain.gain.linearRampToValueAtTime(0.06, now + idx * 0.15 + 0.03); // Very gentle soft attack
        gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.15 + 1.8); // Long beautiful decay fadeout

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now + idx * 0.15);
        osc.stop(now + idx * 0.15 + 1.8);
      });
    } catch (e) {
      console.error('Audio start chime synthesis error:', e);
    }
  },

  // Play a sharp, crisp high-pitched watch metronome tick ("tit")
  playTick() {
    try {
      this.init();
      const now = this.ctx.currentTime;
      
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1050, now); // Sharp 1050Hz crisp digital "tit" tone
      
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.04); // very short instant decay (0.04s)
      
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      
      osc.start(now);
      osc.stop(now + 0.04);
    } catch (e) {
      console.error('Audio tick synthesis error:', e);
    }
  },

  // Play a shimmering upward chime arpeggio (C5, E5, G5, C6)
  playEndChime() {
    try {
      this.init();
      const now = this.ctx.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.50];

      notes.forEach((f, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, now + idx * 0.1); // staggered delays

        gain.gain.setValueAtTime(0, now + idx * 0.1);
        gain.gain.linearRampToValueAtTime(0.12, now + idx * 0.1 + 0.05); // quick attack
        gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.1 + 1.5); // long shimmer release

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now + idx * 0.1);
        osc.stop(now + idx * 0.1 + 1.5);
      });
    } catch (e) {
      console.error('Audio end chime synthesis error:', e);
    }
  }
};

// Lemniscate of Bernoulli (Infinity Symbol Loop) Eye Tracker Movement
let angle = 0;
function initEyeTracker() {
  // Move eye tracker dot immediately on start
  moveEyeTracker();

  // Move dot every 1000ms. CSS transitions will smoothly glide the dot between these coordinates.
  eyeTrackerInterval = setInterval(moveEyeTracker, 1000);
}

function moveEyeTracker() {
  const w = window.innerWidth;
  const h = window.innerHeight;

  // Keep margins to avoid getting stuck at screen edges
  const scaleX = w * 0.38;
  const scaleY = h * 0.28;

  // Lemniscate of Bernoulli Formulas:
  // x = a * cos(t) / (1 + sin^2(t))
  // y = a * sin(t) * cos(t) / (1 + sin^2(t))
  const denom = 1 + Math.sin(angle) * Math.sin(angle);
  const x = (scaleX * Math.cos(angle)) / denom + w / 2;
  const y = (scaleX * Math.sin(angle) * Math.cos(angle)) / denom + h / 2;

  // Apply coordinates programmatically
  eyeTrackerDot.style.left = `${x}px`;
  eyeTrackerDot.style.top = `${y}px`;

  // Increment angle for next point
  angle += Math.PI / 6; // 12-point loop for smooth coverage
  if (angle >= Math.PI * 2) {
    angle = 0;
  }
}

// Show warning modal if Strict Mode is active and user tries to skip
function triggerStrictWarning() {
  strictToastElement.classList.add('show');
  setTimeout(() => {
    strictToastElement.classList.remove('show');
  }, 3500);
}

let isPreparing = true;
let prepRemaining = 5;

function applyPrepTranslations(lang) {
  let titleText = "";
  let descText = "";
  let unitText = "";

  if (lang === "en") {
    titleText = "Get Ready...";
    unitText = "Ready";
    if (settings.breakMode === 'exercise') {
      descText = "Prepare to follow the green circle with your eyes to relax your eye muscles.";
    } else {
      descText = "Prepare to look at an object 20 feet (6 meters) away to relieve eye strain.";
    }
  } else if (lang === "es") {
    titleText = "Prepárate...";
    unitText = "Prepárate";
    if (settings.breakMode === 'exercise') {
      descText = "Prepárate para seguir el círculo verde con la mirada para relajar los músculos oculares.";
    } else {
      descText = "Prepárate para mirar un objeto a 20 pies (6 metros) de distancia.";
    }
  } else if (lang === "ja") {
    titleText = "準備をしましょう...";
    unitText = "準備中";
    if (settings.breakMode === 'exercise') {
      descText = "目の筋肉をほぐすために、緑色の円を視線で追いかける準備をしてください。";
    } else {
      descText = "目の負担を軽減するために、20フィート（6メートル）先にある物体を見つめる準備をしてください。";
    }
  } else { // "id"
    titleText = "Bersiap-siap...";
    unitText = "Bersiap ya";
    if (settings.breakMode === 'exercise') {
      descText = "Bersiaplah mengikuti lingkaran hijau di layar dengan pandangan Anda untuk melatih otot mata.";
    } else {
      descText = "Bersiaplah memalingkan pandangan Anda ke benda berjarak 20 kaki (6 meter) untuk melepas lelah mata.";
    }
  }

  overlayTitle.textContent = titleText;
  overlayDesc.textContent = descText;
  countdownUnitText.textContent = unitText;
  
  // Show skip button during prep if not in strict mode
  if (!settings.strictMode) {
    btnSkipBreak.style.display = 'block';
  } else {
    btnSkipBreak.style.display = 'none';
  }
}

function applyActiveTranslations(lang) {
  const t = translations[lang] || translations.id;
  let titleText = "";
  let descText = "";

  if (lang === "en") {
    if (settings.breakMode === 'exercise') {
      titleText = "Relax Your Eyes Now!";
      descText = "Follow the moving green circle smoothly with your eyes.";
    } else {
      titleText = "Look Away Now!";
      descText = "Look at an object 20 feet away to relax your eye focus.";
    }
  } else if (lang === "es") {
    if (settings.breakMode === 'exercise') {
      titleText = "¡Relaja tus ojos ahora!";
      descText = "Sigue el círculo verde en movimiento con los ojos.";
    } else {
      titleText = "¡Mira hacia otro lado ahora!";
      descText = "Mira a un objeto lejano para relajar el enfoque.";
    }
  } else if (lang === "ja") {
    if (settings.breakMode === 'exercise') {
      titleText = "目を休めましょう！";
      descText = "動く緑色の円をスムーズに目で追いかけてください。";
    } else {
      titleText = "画面から目を離しましょう！";
      descText = "遠くの物体を見つめて、目の焦点をほぐしましょう。";
    }
  } else { // "id"
    if (settings.breakMode === 'exercise') {
      titleText = "Relaksasi Otot Mata!";
      descText = "Ikuti pergerakan bola hijau yang bergerak di layar dengan pandangan Anda.";
    } else {
      titleText = "Palingkan Pandangan!";
      descText = "Pandang benda yang jauh (sekitar 20 kaki atau 6 meter) untuk melepas lelah mata.";
    }
  }

  overlayTitle.textContent = titleText;
  overlayDesc.textContent = descText;

  countdownUnitText.textContent = t.overlayRemaining;
  btnSkipBreak.textContent = t.overlaySkipBtn;

  completedTitle.textContent = t.overlayCompletedTitle;
  completedDesc.textContent = t.overlayCompletedDesc;
  
  strictToastElement.textContent = `⚠️ ${t.overlayStrictWarning}`;
}

// Countdown timer loop
function startCountdown() {
  durationRemaining = prepRemaining;
  updateCountdownUI();

  // Play sound for initial number 5 immediately!
  if (settings.soundEnabled) {
    AudioSynth.playTick();
  }

  countdownInterval = setInterval(() => {
    if (isPreparing) {
      prepRemaining--;
      durationRemaining = prepRemaining;
      updateCountdownUI();

      // Play sound for countdown numbers 4, 3, 2, 1
      if (prepRemaining > 0 && settings.soundEnabled) {
        AudioSynth.playTick();
      }

      if (prepRemaining <= 0) {
        // Transition from prep to active break!
        isPreparing = false;
        durationRemaining = settings.duration;
        
        // Play active start chime!
        if (settings.soundEnabled) {
          AudioSynth.playStartChime();
        }

        // Set up normal active UI translations
        applyActiveTranslations(settings.language);

        // Show skip button if not in strict mode
        if (!settings.strictMode) {
          btnSkipBreak.style.display = 'block';
        }

        // Start eye exercise dot if in exercise mode!
        if (settings.breakMode === 'exercise') {
          eyeTrackerDot.style.opacity = 1;
          eyeTrackerDot.style.display = 'block';
          initEyeTracker();
        } else {
          eyeTrackerDot.style.display = 'none';
        }

        updateCountdownUI();
      }
    } else {
      // Main break countdown!
      durationRemaining--;
      updateCountdownUI();



      // Play ticking heartbeat every 1 second
      if (durationRemaining > 0 && settings.soundEnabled) {
        AudioSynth.playTick();
      }

      // Finished break!
      if (durationRemaining <= 0) {
        clearInterval(countdownInterval);
        clearInterval(eyeTrackerInterval);
        handleBreakComplete();
      }
    }
  }, 1000);
}

function updateCountdownUI() {
  countdownText.textContent = durationRemaining;
}

// Transition into final completed state before close
function handleBreakComplete() {
  // Play finished arpeggio
  if (settings.soundEnabled) {
    AudioSynth.playEndChime();
  }

  // Fade out exercise dot
  eyeTrackerDot.style.opacity = 0;

  // Transition UI panels
  panelRelax.classList.add('hidden');
  panelCompleted.classList.remove('hidden');

  // Keep success screen visible for 2.5 seconds to let them read it, then close overlay
  setTimeout(() => {
    ipcRenderer.send('break-complete');
  }, 2500);
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  // Sync initial settings
  settings = ipcRenderer.sendSync('get-settings');
  
  // Set preparing state
  isPreparing = true;
  prepRemaining = 5;

  applyPrepTranslations(settings.language);

  // Configure Strict Mode rules
  if (settings.strictMode) {
    // Hide skip button
    btnSkipBreak.style.display = 'none';

    // Intercept keyboard bypass attempts
    window.addEventListener('keydown', (e) => {
      // Prevent ESC and common close triggers, show alert
      if (e.key === 'Escape') {
        e.preventDefault();
        triggerStrictWarning();
      }
    });
  } else {
    // Allow skip button clicks
    btnSkipBreak.addEventListener('click', () => {
      clearInterval(countdownInterval);
      clearInterval(eyeTrackerInterval);
      ipcRenderer.send('break-skip');
    });
  }

  // Ensure tracker dot is hidden during prep phase
  eyeTrackerDot.style.display = 'none';

  startCountdown();
});

// Watch for manual language broadcasts
ipcRenderer.on('language-changed', (event, newLang) => {
  settings.language = newLang;
  if (isPreparing) {
    applyPrepTranslations(newLang);
  } else {
    applyActiveTranslations(newLang);
  }
});
