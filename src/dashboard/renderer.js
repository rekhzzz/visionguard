const { ipcRenderer } = require('electron');
const translations = require('../shared/translations');

// Local UI state
let currentSettings = {};
let currentStats = {};

// DOM Elements - Timer
const timerDisplay = document.getElementById('timer-display');
const timerLabel = document.getElementById('timer-label');
const statusBadge = document.getElementById('status-badge');
const statusText = document.getElementById('status-text');
const btnTakeBreak = document.getElementById('btn-take-break');
const btnPauseResume = document.getElementById('btn-pause-resume');
const btnMode202020 = document.getElementById('btn-mode-202020');
const btnModeExercise = document.getElementById('btn-mode-exercise');

// DOM Elements - Stats
const statScoreValue = document.getElementById('stat-score-value');
const statScoreBar = document.getElementById('stat-score-bar');
const statScoreLabel = document.getElementById('stat-score-label');
const statCompletedValue = document.getElementById('stat-completed-value');
const statCompletedLabel = document.getElementById('stat-completed-label');
const statSkippedValue = document.getElementById('stat-skipped-value');
const statSkippedLabel = document.getElementById('stat-skipped-label');
const statScreenTimeValue = document.getElementById('stat-screentime-value');
const statScreenTimeLabel = document.getElementById('stat-screentime-label');

// DOM Elements - Settings
const appTitle = document.getElementById('app-title');
const appTagline = document.getElementById('app-tagline');
const settingsTitle = document.getElementById('settings-title');
const labelLang = document.getElementById('label-lang');
const labelInterval = document.getElementById('label-interval');
const labelDuration = document.getElementById('label-duration');
const labelStrict = document.getElementById('label-strict');
const descStrict = document.getElementById('desc-strict');
const labelSound = document.getElementById('label-sound');
const descSound = document.getElementById('desc-sound');
const labelStartup = document.getElementById('label-startup');
const descStartup = document.getElementById('desc-startup');
const labelBreakMode = document.getElementById('label-breakmode');
const optMode202020 = document.getElementById('opt-mode-202020');
const optModeExercise = document.getElementById('opt-mode-exercise');

// Setting inputs
const settingLang = document.getElementById('setting-lang');
const settingBreakMode = document.getElementById('setting-breakmode');
const settingInterval = document.getElementById('setting-interval');
const settingDuration = document.getElementById('setting-duration');
const settingStrict = document.getElementById('setting-strict');
const settingSound = document.getElementById('setting-sound');
const settingStartup = document.getElementById('setting-startup');

// Display Slider Readings
const valInterval = document.getElementById('val-interval');
const valDuration = document.getElementById('val-duration');

// Toast Notification
const toastSaved = document.getElementById('toast-saved');
const btnResetSettings = document.getElementById('btn-reset-settings');
const btnResetHistory = document.getElementById('btn-reset-history');

// SVG Ring Initialization
const circle = document.querySelector('.progress-ring-circle');
const radius = circle.r.baseVal.value;
const circumference = radius * 2 * Math.PI;

circle.style.strokeDasharray = `${circumference} ${circumference}`;
circle.style.strokeDashoffset = 0;

function setProgress(percent) {
  // Safe bounds [0, 100]
  const pct = Math.max(0, Math.min(100, percent));
  const offset = circumference - (pct / 100 * circumference);
  circle.style.strokeDashoffset = offset;
}

// Format seconds into MM:SS
function formatTime(totalSeconds) {
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// Update translation UI
function applyTranslations(lang) {
  const t = translations[lang] || translations.id;

  // App & headings
  appTitle.textContent = t.appTitle;
  appTagline.textContent = t.tagline;
  settingsTitle.textContent = t.settings;

  const navDashboard = document.getElementById('nav-dashboard');
  const navSettings = document.getElementById('nav-settings');
  if (navDashboard) navDashboard.textContent = t.navDashboard;
  if (navSettings) navSettings.textContent = t.navSettings;

  const lblHistoryTitle = document.getElementById('lbl-history-title');
  if (lblHistoryTitle) lblHistoryTitle.textContent = t.weeklyHistoryTitle;

  const yLabelTop = document.getElementById('y-label-top');
  const yLabelMid = document.getElementById('y-label-mid');
  const yLabelLow = document.getElementById('y-label-low');
  if (yLabelTop && yLabelMid && yLabelLow) {
    const hrStr = t.hoursShort || 'jam';
    yLabelTop.textContent = `12 ${hrStr}`;
    yLabelMid.textContent = `6 ${hrStr}`;
    yLabelLow.textContent = `0 ${hrStr}`;
  }

  // Stats Card labels
  statScoreLabel.textContent = t.eyeCareScore;
  statCompletedLabel.textContent = t.breaksCompleted;
  statSkippedLabel.textContent = t.breaksSkipped;
  statScreenTimeLabel.textContent = t.screenTime;

  // Settings labels
  labelLang.textContent = t.language;
  labelInterval.textContent = t.intervalLabel;
  labelDuration.textContent = t.durationLabel;
  labelStrict.textContent = t.strictMode;
  descStrict.textContent = t.strictModeDesc;
  labelSound.textContent = t.soundEnabled;
  descSound.textContent = t.soundEnabledDesc;
  labelStartup.textContent = t.autoStart;
  descStartup.textContent = t.autoStartDesc;
  if (labelBreakMode) labelBreakMode.textContent = t.breakModeLabel;
  if (optMode202020) optMode202020.textContent = t.mode202020;
  if (optModeExercise) optModeExercise.textContent = t.modeExercise;

  // Translate Segmented Switcher buttons
  if (btnMode202020 && btnModeExercise) {
    if (lang === 'en') {
      btnMode202020.textContent = "Rule 20-20-20";
      btnModeExercise.textContent = "Eye Exercises";
    } else if (lang === 'es') {
      btnMode202020.textContent = "Regla 20-20-20";
      btnModeExercise.textContent = "Ejercicios";
    } else if (lang === 'ja') {
      btnMode202020.textContent = "20-20-20ルール";
      btnModeExercise.textContent = "目のストレッチ";
    } else { // 'id'
      btnMode202020.textContent = "Aturan 20-20-20";
      btnModeExercise.textContent = "Latihan Mata";
    }
  }

  // Timer displays
  timerLabel.textContent = t.nextBreak;
  btnTakeBreak.textContent = t.takeBreakNowBtn;
  btnResetSettings.textContent = t.resetBtn;
  if (btnResetHistory) btnResetHistory.textContent = t.resetStatsBtn;

  // Update dynamic values (min/sec units)
  valInterval.textContent = `${settingInterval.value} ${t.minutes}`;
  valDuration.textContent = `${settingDuration.value} ${t.seconds}`;

  // Update stats layout to show correct translated units
  updateStats(currentStats);

  // Update active/paused state texts
  updateTimerStateText(statusBadge.classList.contains('active') ? 'active' : 'paused');
}

function updateModeSwitcherUI(mode) {
  if (!btnMode202020 || !btnModeExercise) return;
  if (mode === 'exercise') {
    btnMode202020.classList.remove('active');
    btnModeExercise.classList.add('active');
  } else {
    btnMode202020.classList.add('active');
    btnModeExercise.classList.remove('active');
  }
}

function updateTimerStateText(state) {
  const t = translations[currentSettings.language] || translations.id;
  if (state === 'active') {
    statusBadge.className = 'status-badge active';
    statusText.textContent = t.statusActive;
    btnPauseResume.textContent = t.pauseBtn;
    btnPauseResume.className = 'btn btn-secondary';
  } else {
    statusBadge.className = 'status-badge paused';
    statusText.textContent = t.statusPaused;
    btnPauseResume.textContent = t.resumeBtn;
    btnPauseResume.className = 'btn btn-primary';
  }
}

function formatHistoryDate(dateStr, lang) {
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    
    const day = date.getDate();
    const year = date.getFullYear();
    
    const monthsId = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    const monthsEn = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthsEs = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
    const monthsJa = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
    
    const monthIdx = date.getMonth();
    
    if (lang === 'id') {
      return `${day} ${monthsId[monthIdx]} ${year}`;
    } else if (lang === 'en') {
      return `${monthsEn[monthIdx]} ${day}, ${year}`;
    } else if (lang === 'es') {
      return `${day} de ${monthsEs[monthIdx]} de ${year}`;
    } else if (lang === 'ja') {
      return `${year}年${monthsJa[monthIdx]}${day}日`;
    }
    return dateStr;
  } catch (e) {
    return dateStr;
  }
}

// Calculate and render Eye Care score & stats
function updateStats(stats) {
  currentStats = stats;
  const t = translations[currentSettings.language] || translations.id;

  // Render numbers
  statCompletedValue.textContent = stats.completedBreaks;
  statSkippedValue.textContent = stats.skippedBreaks;

  // Calculate Eye Care Score
  const total = stats.completedBreaks + stats.skippedBreaks;
  let score = 100;
  if (total > 0) {
    score = Math.round((stats.completedBreaks / total) * 100);
  }

  statScoreValue.textContent = score;
  statScoreBar.style.width = `${score}%`;

  // Color grade based on health score (Emerald, Yellow, Red)
  if (score >= 80) {
    statScoreBar.style.background = 'linear-gradient(90deg, var(--color-emerald) 0%, var(--color-emerald-light) 100%)';
    statScoreBar.style.boxShadow = '0 0 8px var(--color-emerald)';
    statScoreValue.parentElement.style.color = 'var(--color-emerald-light)';
  } else if (score >= 50) {
    statScoreBar.style.background = 'linear-gradient(90deg, var(--color-yellow) 0%, #fbbf24 100%)';
    statScoreBar.style.boxShadow = '0 0 8px var(--color-yellow)';
    statScoreValue.parentElement.style.color = 'var(--color-yellow)';
  } else {
    statScoreBar.style.background = 'linear-gradient(90deg, var(--color-red) 0%, #f87171 100%)';
    statScoreBar.style.boxShadow = '0 0 8px var(--color-red)';
    statScoreValue.parentElement.style.color = '#f87171';
  }

  // Render screen time human readable
  const minutes = stats.screenTimeMinutes || 0;
  if (minutes < 60) {
    statScreenTimeValue.textContent = `${minutes} ${t.minsShort || 'mnt'}`;
  } else {
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    statScreenTimeValue.textContent = `${hrs} ${t.hoursShort || 'jam'} ${mins} ${t.minsShort || 'mnt'}`;
  }

  // Render 7-day performance stock chart
  const stockChart = document.getElementById('stock-chart');
  if (stockChart && stats) {
    // Generate exactly 7 days ending with today [6 days ago ... today]
    const fullHistory = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      
      if (i === 0) {
        // Today uses active live daily stats
        fullHistory.push({
          date: dateStr,
          completedBreaks: stats.completedBreaks || 0,
          skippedBreaks: stats.skippedBreaks || 0,
          screenTimeMinutes: stats.screenTimeMinutes || 0
        });
      } else {
        const existingDay = (stats.history || []).find(h => h.date === dateStr);
        if (existingDay) {
          fullHistory.push(existingDay);
        } else {
          fullHistory.push({
            date: dateStr,
            completedBreaks: 0,
            skippedBreaks: 0,
            screenTimeMinutes: 0
          });
        }
      }
    }
    
    const points = [];
    const paddingLeft = 40;
    const paddingRight = 20;
    const chartWidth = 500;
    const widthStep = (chartWidth - paddingLeft - paddingRight) / 6;

    fullHistory.forEach((day, idx) => {
      // Calculate Screen Time Hours for Y coordinate plotting
      const mins = day.screenTimeMinutes || 0;
      const hours = mins / 60;
      const cappedHours = Math.min(hours, 12);
      
      const x = paddingLeft + idx * widthStep;
      const y = 130 - (cappedHours / 12) * 110; // Map 0-12 hours to Y: 130 to 20
      
      // Calculate Eye Care Score for the floating hover tooltip
      const total = day.completedBreaks + day.skippedBreaks;
      let score = 100;
      if (total > 0) {
        score = Math.round((day.completedBreaks / total) * 100);
      } else {
        score = 0;
      }
      
      points.push({ x, y, day, score });
    });

    // 1. Generate line stroke & filled area paths
    const chartLine = document.getElementById('chart-line');
    const chartArea = document.getElementById('chart-area');
    
    if (points.length > 0) {
      const lineD = points.map((p, idx) => (idx === 0 ? 'M' : 'L') + ` ${p.x} ${p.y}`).join(' ');
      const areaD = lineD + ` L ${points[points.length - 1].x} 130 L ${points[0].x} 130 Z`;
      
      chartLine.setAttribute('d', lineD);
      chartArea.setAttribute('d', areaD);
    }

    // 2. Generate interactive coordinate dots
    const dotsContainer = document.getElementById('chart-dots');
    if (dotsContainer) {
      dotsContainer.innerHTML = '';
      points.forEach(p => {
        const circleElement = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circleElement.setAttribute('cx', p.x);
        circleElement.setAttribute('cy', p.y);
        circleElement.setAttribute('r', '4');
        circleElement.setAttribute('fill', '#10b981');
        circleElement.setAttribute('stroke', '#07090e');
        circleElement.setAttribute('stroke-width', '1.5');
        circleElement.setAttribute('class', 'chart-dot');

        circleElement.addEventListener('mouseenter', () => {
          const tooltip = document.getElementById('chart-tooltip');
          const formattedDate = formatHistoryDate(p.day.date, currentSettings.language);
          
          let screenTimeStr = "";
          if (p.day.screenTimeMinutes < 60) {
            screenTimeStr = `${p.day.screenTimeMinutes}m`;
          } else {
            const hrs = Math.floor(p.day.screenTimeMinutes / 60);
            const mins = p.day.screenTimeMinutes % 60;
            screenTimeStr = `${hrs}j ${mins}m`;
          }

          const t = translations[currentSettings.language] || translations.id;
          const scoreLabel = t.eyeCareScore || "Skor Perawatan Mata";
          const completedLabel = t.breaksCompleted || "Istirahat Selesai";
          const skippedLabel = t.breaksSkipped || "Istirahat Dilewati";
          const screenTimeLabel = t.screenTime || "Waktu Layar";

          tooltip.innerHTML = `
            <div class="chart-tooltip-date">${formattedDate}</div>
            <div class="chart-tooltip-stat">
              <span>${scoreLabel}:</span>
              <span style="color: #34d399;">${p.score}%</span>
            </div>
            <div class="chart-tooltip-stat">
              <span>${completedLabel}:</span>
              <span>✅ ${p.day.completedBreaks}</span>
            </div>
            <div class="chart-tooltip-stat">
              <span>${skippedLabel}:</span>
              <span>⚠️ ${p.day.skippedBreaks}</span>
            </div>
            <div class="chart-tooltip-stat">
              <span>${screenTimeLabel}:</span>
              <span>🕒 ${screenTimeStr}</span>
            </div>
          `;
          
          tooltip.style.opacity = '1';
          
          // Position tooltip bubble floating right above the dot!
          const svgElement = document.getElementById('stock-chart');
          const rect = svgElement.getBoundingClientRect();
          const tooltipWidth = tooltip.offsetWidth || 150;
          
          const pixelX = (p.x / 500) * rect.width;
          const pixelY = (p.y / 160) * rect.height;
          
          tooltip.style.left = `${pixelX - tooltipWidth / 2}px`;
          tooltip.style.top = `${pixelY - 110}px`;
        });

        circleElement.addEventListener('mouseleave', () => {
          const tooltip = document.getElementById('chart-tooltip');
          tooltip.style.opacity = '0';
        });

        dotsContainer.appendChild(circleElement);
      });
    }

    // 3. Generate X-Axis Labels
    const xLabelsContainer = document.getElementById('chart-x-labels');
    if (xLabelsContainer) {
      xLabelsContainer.innerHTML = '';
      points.forEach(p => {
        const date = new Date(p.day.date);
        let shortLabel = p.day.date;
        if (!isNaN(date.getTime())) {
          const day = date.getDate();
          const monthsIdShort = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
          const monthsEnShort = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
          
          if (currentSettings.language === 'id') {
            shortLabel = `${day} ${monthsIdShort[date.getMonth()]}`;
          } else {
            shortLabel = `${monthsEnShort[date.getMonth()]} ${day}`;
          }
        }
        
        const textElement = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        textElement.setAttribute('x', p.x);
        textElement.setAttribute('y', '152');
        textElement.setAttribute('fill', '#64748b');
        textElement.setAttribute('font-size', '8.5');
        textElement.setAttribute('font-family', "'Outfit', sans-serif");
        textElement.setAttribute('text-anchor', 'middle');
        textElement.textContent = shortLabel;
        
        xLabelsContainer.appendChild(textElement);
      });
    }
  }
}

// Show saved notification toast
function showToast(message) {
  toastSaved.textContent = message;
  toastSaved.classList.add('show');
  setTimeout(() => {
    toastSaved.classList.remove('show');
  }, 2500);
}

// Save all Settings via IPC
function saveSettings() {
  const newSettings = {
    language: settingLang.value,
    interval: parseInt(settingInterval.value, 10),
    duration: parseInt(settingDuration.value, 10),
    strictMode: settingStrict.checked,
    soundEnabled: settingSound.checked,
    autoStart: settingStartup.checked,
    breakMode: settingBreakMode.value
  };

  ipcRenderer.send('save-settings', newSettings);
}

// Initialize on Load
function init() {
  // Request settings and stats synchronously or from IPC
  currentSettings = ipcRenderer.sendSync('get-settings');
  currentStats = ipcRenderer.sendSync('get-stats');
  const timerState = ipcRenderer.sendSync('get-timer-state');

  // Set initial settings inputs values
  settingLang.value = currentSettings.language;
  settingBreakMode.value = currentSettings.breakMode || '20-20-20';
  settingInterval.value = currentSettings.interval;
  settingDuration.value = currentSettings.duration;
  settingStrict.checked = currentSettings.strictMode;
  settingSound.checked = currentSettings.soundEnabled;
  settingStartup.checked = currentSettings.autoStart;

  // Load translations, stats & active mode button state
  applyTranslations(currentSettings.language);
  updateModeSwitcherUI(currentSettings.breakMode);
  updateStats(currentStats);

  // Load current timer tick values
  updateTimerUI(timerState.secondsRemaining, timerState.totalSeconds);
  updateTimerStateText(timerState.state);

  // Set up listeners for sliders input (drag feedback)
  settingInterval.addEventListener('input', () => {
    const t = translations[currentSettings.language] || translations.id;
    valInterval.textContent = `${settingInterval.value} ${t.minutes}`;
  });

  settingDuration.addEventListener('input', () => {
    const t = translations[currentSettings.language] || translations.id;
    valDuration.textContent = `${settingDuration.value} ${t.seconds}`;
  });

  // Save on change triggers
  settingLang.addEventListener('change', () => {
    saveSettings();
  });
  settingInterval.addEventListener('change', saveSettings);
  settingDuration.addEventListener('change', saveSettings);
  settingStrict.addEventListener('change', saveSettings);
  settingSound.addEventListener('change', saveSettings);
  settingStartup.addEventListener('change', saveSettings);
  
  settingBreakMode.addEventListener('change', () => {
    updateModeSwitcherUI(settingBreakMode.value);
    saveSettings();
  });

  if (btnMode202020) {
    btnMode202020.addEventListener('click', () => {
      settingBreakMode.value = '20-20-20';
      updateModeSwitcherUI('20-20-20');
      saveSettings();
    });
  }

  if (btnModeExercise) {
    btnModeExercise.addEventListener('click', () => {
      settingBreakMode.value = 'exercise';
      updateModeSwitcherUI('exercise');
      saveSettings();
    });
  }

  // Button actions
  btnTakeBreak.addEventListener('click', () => {
    ipcRenderer.send('take-break-now');
  });

  btnPauseResume.addEventListener('click', () => {
    ipcRenderer.send('toggle-pause');
  });

  // Reset settings action
  btnResetSettings.addEventListener('click', () => {
    const defaultSettings = {
      language: 'id',
      interval: 20,
      duration: 20,
      strictMode: false,
      soundEnabled: true,
      autoStart: true,
      breakMode: '20-20-20'
    };

    // Update UI elements to defaults
    settingLang.value = defaultSettings.language;
    settingBreakMode.value = defaultSettings.breakMode;
    updateModeSwitcherUI(defaultSettings.breakMode);
    settingInterval.value = defaultSettings.interval;
    settingDuration.value = defaultSettings.duration;
    settingStrict.checked = defaultSettings.strictMode;
    settingSound.checked = defaultSettings.soundEnabled;
    settingStartup.checked = defaultSettings.autoStart;

    // Trigger labels updates
    const t = translations[defaultSettings.language] || translations.id;
    valInterval.textContent = `${defaultSettings.interval} ${t.minutes}`;
    valDuration.textContent = `${defaultSettings.duration} ${t.seconds}`;

    // Save defaults to filesystem via IPC
    ipcRenderer.send('save-settings', defaultSettings);

    // Show reset toast success
    showToast(t.resetSuccess);
  });

  // Reset history action
  if (btnResetHistory) {
    btnResetHistory.addEventListener('click', () => {
      const t = translations[currentSettings.language] || translations.id;
      
      // Send reset statistics IPC signal
      ipcRenderer.send('reset-stats');
      
      // Show history cleared toast success
      showToast(t.resetStatsSuccess);
    });
  }
}

function updateTimerUI(remaining, total) {
  // Update text MM:SS
  timerDisplay.textContent = formatTime(remaining);

  // Update SVG Progress Ring percentage
  const percent = (remaining / total) * 100;
  setProgress(percent);
}

// Listen to countdown timer tick from Main process
ipcRenderer.on('timer-tick', (event, data) => {
  updateTimerUI(data.secondsRemaining, data.totalSeconds);
  updateTimerStateText(data.state);
});

// Settings saved receiver
ipcRenderer.on('settings-saved', (event, updatedSettings) => {
  currentSettings = updatedSettings;
  updateModeSwitcherUI(updatedSettings.breakMode);
  applyTranslations(updatedSettings.language);
  
  const t = translations[updatedSettings.language] || translations.id;
  showToast(t.saveSuccess);
});

// Update stats from background
ipcRenderer.on('stats-updated', (event, newStats) => {
  updateStats(newStats);
});

// Language changed broadcast
ipcRenderer.on('language-changed', (event, newLang) => {
  currentSettings.language = newLang;
  applyTranslations(newLang);
});

// Tab Switching Controller
function initTabSwitching() {
  const navItems = document.querySelectorAll('.nav-item');
  const tabContents = document.querySelectorAll('.tab-content');

  navItems.forEach(item => {
    item.addEventListener('click', () => {
      const targetTab = item.getAttribute('data-tab');

      // Update active nav item
      navItems.forEach(nav => nav.classList.remove('active'));
      item.classList.add('active');

      // Update visible tab content
      tabContents.forEach(content => {
        if (content.id === `tab-${targetTab}`) {
          content.classList.add('active');
        } else {
          content.classList.remove('active');
        }
      });
    });
  });
}

// Trigger init
document.addEventListener('DOMContentLoaded', () => {
  init();
  initTabSwitching();
});
