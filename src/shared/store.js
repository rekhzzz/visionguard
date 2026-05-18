const fs = require('fs');
const path = require('path');
const { app } = require('electron');

const DEFAULT_SETTINGS = {
  language: 'id',        // 'id' or 'en'
  interval: 20,          // in minutes
  duration: 20,          // in seconds
  strictMode: false,     // if true, can't skip break overlay
  soundEnabled: true,    // play sound chimes and ticking sound
  autoStart: true,       // run on Windows startup
  breakMode: '20-20-20'  // '20-20-20' (default) or 'exercise'
};

const DEFAULT_STATS = {
  lastActiveDate: '',    // YYYY-MM-DD
  completedBreaks: 0,
  skippedBreaks: 0,
  screenTimeMinutes: 0,
  history: []            // Array of 7 days break logs
};

class Store {
  constructor() {
    // Get application user data path
    // Under Windows, this resolves to AppData\Roaming\VisionGuard
    try {
      this.userDataPath = app.getPath('userData');
    } catch (e) {
      // In case app is not fully initialized in some context (e.g., testing)
      this.userDataPath = path.join(process.env.APPDATA || '', 'VisionGuard');
    }

    if (!fs.existsSync(this.userDataPath)) {
      fs.mkdirSync(this.userDataPath, { recursive: true });
    }

    this.settingsPath = path.join(this.userDataPath, 'settings.json');
    this.statsPath = path.join(this.userDataPath, 'stats.json');

    this.settings = this.loadJSON(this.settingsPath, DEFAULT_SETTINGS);
    this.stats = this.loadJSON(this.statsPath, DEFAULT_STATS);
    
    this.verifyStatsDate();

    // Automatic Migration: Purge old mock data from May 10 to May 16, 2026
    const mockDates = ['2026-05-10', '2026-05-11', '2026-05-12', '2026-05-13', '2026-05-14', '2026-05-15', '2026-05-16'];
    if (this.stats.history && this.stats.history.length > 0) {
      const hasMock = this.stats.history.some(h => mockDates.includes(h.date));
      if (hasMock) {
        this.stats.history = [];
        this.saveJSON(this.statsPath, this.stats);
      }
    }
  }

  loadJSON(filePath, defaults) {
    try {
      if (fs.existsSync(filePath)) {
        const data = fs.readFileSync(filePath, 'utf8');
        return { ...defaults, ...JSON.parse(data) };
      }
    } catch (error) {
      console.error(`Error loading file ${filePath}:`, error);
    }
    return { ...defaults };
  }

  saveJSON(filePath, data) {
    try {
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    } catch (error) {
      console.error(`Error saving file ${filePath}:`, error);
    }
  }

  // Get all settings
  getSettings() {
    return this.settings;
  }

  // Update multiple or single settings
  saveSettings(newSettings) {
    this.settings = { ...this.settings, ...newSettings };
    this.saveJSON(this.settingsPath, this.settings);
    return this.settings;
  }

  // Get daily statistics
  getStats() {
    this.verifyStatsDate();
    return this.stats;
  }

  // Update statistics
  saveStats(newStats) {
    this.verifyStatsDate();
    this.stats = { ...this.stats, ...newStats };
    this.saveJSON(this.statsPath, this.stats);
    return this.stats;
  }

  // Ensure stats reset daily
  verifyStatsDate() {
    const today = new Date().toISOString().split('T')[0];
    
    // Initialize history array if not present (backward compatibility)
    if (!this.stats.history) {
      this.stats.history = [];
    }

    if (this.stats.lastActiveDate !== today) {
      // Save yesterday's stats if active
      if (this.stats.lastActiveDate) {
        const oldDay = {
          date: this.stats.lastActiveDate,
          completedBreaks: this.stats.completedBreaks,
          skippedBreaks: this.stats.skippedBreaks,
          screenTimeMinutes: this.stats.screenTimeMinutes
        };
        // Deduplicate
        this.stats.history = this.stats.history.filter(h => h.date !== oldDay.date);
        this.stats.history.push(oldDay);
        
        // Keep last 7 days only
        if (this.stats.history.length > 7) {
          this.stats.history.shift();
        }
      }

      this.stats = {
        lastActiveDate: today,
        completedBreaks: 0,
        skippedBreaks: 0,
        screenTimeMinutes: 0,
        history: this.stats.history
      };
      this.saveJSON(this.statsPath, this.stats);
    }
  }

  // Add 1 completed break
  incrementCompleted() {
    this.verifyStatsDate();
    this.stats.completedBreaks += 1;
    this.saveJSON(this.statsPath, this.stats);
    return this.stats;
  }

  // Add 1 skipped break
  incrementSkipped() {
    this.verifyStatsDate();
    this.stats.skippedBreaks += 1;
    this.saveJSON(this.statsPath, this.stats);
    return this.stats;
  }

  // Add screen time
  addScreenTime(minutes) {
    this.verifyStatsDate();
    this.stats.screenTimeMinutes += minutes;
    this.saveJSON(this.statsPath, this.stats);
    return this.stats;
  }

  // Reset daily statistics history
  resetStats() {
    const today = new Date().toISOString().split('T')[0];
    this.stats = {
      lastActiveDate: today,
      completedBreaks: 0,
      skippedBreaks: 0,
      screenTimeMinutes: 0,
      history: []
    };
    this.saveJSON(this.statsPath, this.stats);
    return this.stats;
  }
}

module.exports = new Store();
