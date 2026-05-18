const { app, BrowserWindow, Tray, Menu, ipcMain, screen, powerMonitor } = require('electron');
const path = require('path');
const store = require('./src/shared/store');

// Global references
let dashboardWindow = null;
let overlayWindow = null;
let tray = null;
let timerIntervalId = null;

// Timer State
let timerState = 'active'; // 'active' or 'paused'
let secondsRemaining = 20 * 60; // Default 20 mins in seconds
let isOverlayActive = false;

// Prevent multiple instances
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (dashboardWindow) {
      if (dashboardWindow.isMinimized()) dashboardWindow.restore();
      dashboardWindow.show();
      dashboardWindow.focus();
    }
  });
}

// Initialize application
app.whenReady().then(() => {
  // Load initial settings
  const settings = store.getSettings();
  secondsRemaining = settings.interval * 60;

  // Create windows and tray
  createDashboardWindow();
  setupTray();
  
  // Start the background countdown timer
  initTimer();

  // Power monitor listeners to automatically pause timer when PC is locked/sleep
  powerMonitor.on('lock-screen', () => {
    console.log('PC locked: pausing timer');
    pauseTimerInternal();
  });

  powerMonitor.on('unlock-screen', () => {
    console.log('PC unlocked: resuming timer');
    resumeTimerInternal();
  });

  powerMonitor.on('suspend', () => {
    console.log('PC suspended: pausing timer');
    pauseTimerInternal();
  });

  powerMonitor.on('resume', () => {
    console.log('PC resumed: resuming timer');
    resumeTimerInternal();
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createDashboardWindow();
    }
  });
});

// Create settings and dashboard window
function createDashboardWindow() {
  dashboardWindow = new BrowserWindow({
    width: 760,
    height: 600,
    minWidth: 700,
    minHeight: 550,
    resizable: true,
    show: true,
    icon: path.join(__dirname, 'src', 'shared', 'icon.ico'),
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      backgroundThrottling: false
    }
  });

  dashboardWindow.removeMenu(); // Remove default Electron menu bar (clean look)
  dashboardWindow.loadFile(path.join(__dirname, 'src', 'dashboard', 'index.html'));

  // Minimize to tray instead of closing
  dashboardWindow.on('close', (event) => {
    if (!app.isQuitting) {
      event.preventDefault();
      dashboardWindow.hide();
    }
  });

  dashboardWindow.on('closed', () => {
    dashboardWindow = null;
  });
}

// Create fullscreen overlay break window
function createOverlayWindow() {
  if (isOverlayActive) return;
  isOverlayActive = true;

  const primaryDisplay = screen.getPrimaryDisplay();
  const { width, height } = primaryDisplay.bounds;

  overlayWindow = new BrowserWindow({
    x: 0,
    y: 0,
    width: width,
    height: height,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    focusable: true,
    resizable: false,
    fullscreen: true,
    icon: path.join(__dirname, 'src', 'shared', 'icon.ico'),
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      backgroundThrottling: false
    }
  });

  overlayWindow.setAlwaysOnTop(true, 'screen-saver'); // Show above Windows taskbar & start menu
  overlayWindow.loadFile(path.join(__dirname, 'src', 'overlay', 'index.html'));

  overlayWindow.on('closed', () => {
    overlayWindow = null;
    isOverlayActive = false;
  });
}

// Initialize Timer
function initTimer() {
  if (timerIntervalId) clearInterval(timerIntervalId);

  timerIntervalId = setInterval(() => {
    const settings = store.getSettings();

    if (timerState === 'active' && !isOverlayActive) {
      secondsRemaining--;

      // Broadcast sisa waktu ke dashboard (jika terbuka)
      if (dashboardWindow && dashboardWindow.isVisible()) {
        dashboardWindow.webContents.send('timer-tick', {
          secondsRemaining,
          totalSeconds: settings.interval * 60,
          state: timerState
        });
      }

      // Hitung screen time harian setiap 60 detik (1 menit)
      if (secondsRemaining > 0 && secondsRemaining % 60 === 0) {
        store.addScreenTime(1);
        if (dashboardWindow && dashboardWindow.isVisible()) {
          dashboardWindow.webContents.send('stats-updated', store.getStats());
        }
      }

      // Jika waktu habis, jalankan overlay break!
      if (secondsRemaining <= 0) {
        triggerBreak();
      }
    }
  }, 1000);
}

// Trigger Break Overlay
function triggerBreak() {
  createOverlayWindow();
  
  // Pause countdown while overlay is running
  timerState = 'paused';
  updateTrayMenu();

  if (dashboardWindow && dashboardWindow.isVisible()) {
    dashboardWindow.webContents.send('timer-tick', {
      secondsRemaining: 0,
      totalSeconds: store.getSettings().interval * 60,
      state: 'paused'
    });
  }
}

// Setup System Tray
function setupTray() {
  try {
    const iconPath = path.join(__dirname, 'src', 'shared', 'icon.ico');
    tray = new Tray(iconPath);
    tray.setToolTip('VisionGuard - 20-20-20 Rule Reminder');
    
    // Double click tray icon opens/shows Dashboard
    tray.on('double-click', () => {
      if (dashboardWindow) {
        if (dashboardWindow.isVisible()) {
          dashboardWindow.hide();
        } else {
          dashboardWindow.show();
          dashboardWindow.focus();
        }
      }
    });

    updateTrayMenu();
  } catch (err) {
    console.error('Failed to initialize System Tray:', err);
  }
}

// Update System Tray Menu dynamically (Pause/Resume text changes based on state)
function updateTrayMenu() {
  if (!tray) return;

  const settings = store.getSettings();
  const lang = settings.language || 'id';

  // Labels based on selected language
  const labels = {
    id: { open: 'Buka Dashboard', breakNow: 'Istirahat Sekarang 👁️', pause: 'Jeda Pengingat', resume: 'Lanjutkan Pengingat', exit: 'Keluar Aplikasi' },
    en: { open: 'Open Dashboard', breakNow: 'Take Break Now 👁️', pause: 'Pause Reminder', resume: 'Resume Reminder', exit: 'Exit Application' },
    es: { open: 'Abrir Dashboard', breakNow: 'Tomar Descanso Ahora 👁️', pause: 'Pausar Recordatorio', resume: 'Reanudar Recordatorio', exit: 'Salir de la Aplicación' },
    ja: { open: 'ダッシュボードを開く', breakNow: '今すぐ休憩する 👁️', pause: 'リマインダーを一時停止', resume: 'リマインダーを再開', exit: 'アプリを終了' }
  };

  const currentLabels = labels[lang] || labels.id;
  const pauseResumeLabel = timerState === 'active' ? currentLabels.pause : currentLabels.resume;

  const contextMenu = Menu.buildFromTemplate([
    {
      label: currentLabels.open,
      click: () => {
        if (dashboardWindow) {
          dashboardWindow.show();
          dashboardWindow.focus();
        }
      }
    },
    {
      label: currentLabels.breakNow,
      enabled: !isOverlayActive,
      click: () => {
        triggerBreak();
      }
    },
    {
      label: pauseResumeLabel,
      enabled: !isOverlayActive,
      click: () => {
        togglePauseTimer();
      }
    },
    { type: 'separator' },
    {
      label: currentLabels.exit,
      click: () => {
        app.isQuitting = true;
        app.quit();
      }
    }
  ]);

  tray.setContextMenu(contextMenu);
}

// Internal pause and resume functions
function pauseTimerInternal() {
  timerState = 'paused';
  updateTrayMenu();
  if (dashboardWindow && dashboardWindow.isVisible()) {
    dashboardWindow.webContents.send('timer-tick', {
      secondsRemaining,
      totalSeconds: store.getSettings().interval * 60,
      state: timerState
    });
  }
}

function resumeTimerInternal() {
  timerState = 'active';
  updateTrayMenu();
  if (dashboardWindow && dashboardWindow.isVisible()) {
    dashboardWindow.webContents.send('timer-tick', {
      secondsRemaining,
      totalSeconds: store.getSettings().interval * 60,
      state: timerState
    });
  }
}

// Toggle Pause State via Tray/Dashboard
function togglePauseTimer() {
  if (timerState === 'active') {
    timerState = 'paused';
  } else {
    timerState = 'active';
  }
  updateTrayMenu();
  
  if (dashboardWindow && dashboardWindow.isVisible()) {
    dashboardWindow.webContents.send('timer-tick', {
      secondsRemaining,
      totalSeconds: store.getSettings().interval * 60,
      state: timerState
    });
  }
  return timerState;
}

// Reset countdown timer to user interval
function resetTimer() {
  const settings = store.getSettings();
  secondsRemaining = settings.interval * 60;
  timerState = 'active';
  updateTrayMenu();

  if (dashboardWindow && dashboardWindow.isVisible()) {
    dashboardWindow.webContents.send('timer-tick', {
      secondsRemaining,
      totalSeconds: settings.interval * 60,
      state: timerState
    });
  }
}

// IPC Channels definitions for communication
ipcMain.on('get-settings', (event) => {
  event.returnValue = store.getSettings();
});

ipcMain.on('get-stats', (event) => {
  event.returnValue = store.getStats();
});

ipcMain.on('save-settings', (event, newSettings) => {
  const updatedSettings = store.saveSettings(newSettings);
  
  // Apply auto-start registry on Windows
  try {
    app.setLoginItemSettings({
      openAtLogin: updatedSettings.autoStart,
      path: app.getPath('exe')
    });
  } catch (err) {
    console.error('Failed to configure Windows login settings:', err);
  }

  // Update timer interval if it was changed
  if (newSettings.interval) {
    secondsRemaining = newSettings.interval * 60;
  }

  // Refresh tray menu to update languages
  updateTrayMenu();

  // Notify dashboard of update
  event.reply('settings-saved', updatedSettings);

  // Broadast language change to active windows
  if (dashboardWindow) dashboardWindow.webContents.send('language-changed', updatedSettings.language);
  if (overlayWindow) overlayWindow.webContents.send('language-changed', updatedSettings.language);
});

ipcMain.on('get-timer-state', (event) => {
  const settings = store.getSettings();
  event.returnValue = {
    secondsRemaining,
    totalSeconds: settings.interval * 60,
    state: timerState
  };
});

ipcMain.on('toggle-pause', (event) => {
  const newState = togglePauseTimer();
  event.reply('pause-status', newState);
});

ipcMain.on('take-break-now', () => {
  triggerBreak();
});

ipcMain.on('reset-stats', (event) => {
  const resetStats = store.resetStats();
  event.reply('stats-updated', resetStats);
});

// Close overlay on break complete
ipcMain.on('break-complete', () => {
  if (overlayWindow) {
    overlayWindow.close();
  }
  store.incrementCompleted();
  
  // Refresh stats in dashboard
  if (dashboardWindow && !dashboardWindow.isDestroyed()) {
    dashboardWindow.webContents.send('stats-updated', store.getStats());
  }

  resetTimer();
});

// Close overlay on break skip
ipcMain.on('break-skip', () => {
  if (overlayWindow) {
    overlayWindow.close();
  }
  store.incrementSkipped();

  // Refresh stats in dashboard
  if (dashboardWindow && !dashboardWindow.isDestroyed()) {
    dashboardWindow.webContents.send('stats-updated', store.getStats());
  }

  resetTimer();
});

// Close app completely
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  app.isQuitting = true;
});
