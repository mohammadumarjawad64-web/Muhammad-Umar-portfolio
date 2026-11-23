/**
 * App Controller - Digital Well-Being & Screen Time Management
 * Clean, calm, and comforting application logic.
 */

class AppController {
  constructor() {
    this.storageKey = 'app_controller_data_v2';
    this.broadcastChannel = null;
    this.simTimer = null;
    this.clockTimer = null;
    this.lockdownTimer = null;
    this.breathingTimer = null;
    this.breathingActive = false;
    this.audioCtx = null;
    this.chartInstance = null;

    // Default State
    this.state = {
      theme: 'dark',
      activeMode: 'normal', // 'normal' | 'strict' (Buzurg)
      simSpeed: 30, // 1x, 10x, 30x, 60x (60x = 1 sec is 1 min)
      audioEnabled: true,
      parentalEnabled: true,
      remoteDeviceLocked: false,
      childDeviceName: "Hamza's Phone",
      syncCode: "APP-8492",
      activeView: 'dashboard',
      wizardStep: 1,

      // Monitored Apps
      apps: {
        instagram: {
          id: 'instagram',
          name: 'Instagram',
          icon: '📸',
          category: 'Social Media',
          dailyLimit: 30, // in minutes
          usedMinutes: 30, // started at limit for testing Buzurg Mode
          lockedUntil: null, // timestamp if locked for 24h
          isParentLocked: true, // child started with Instagram locked as in user description
          monitored: true
        },
        pubg: {
          id: 'pubg',
          name: 'PUBG Mobile',
          icon: '🎮',
          category: 'Gaming',
          dailyLimit: 90,
          usedMinutes: 40,
          lockedUntil: null,
          isParentLocked: false,
          monitored: true
        },
        tiktok: {
          id: 'tiktok',
          name: 'TikTok',
          icon: '🎵',
          category: 'Social Media',
          dailyLimit: 25,
          usedMinutes: 15,
          lockedUntil: null,
          isParentLocked: false,
          monitored: true
        },
        whatsapp: {
          id: 'whatsapp',
          name: 'WhatsApp',
          icon: '💬',
          category: 'Messaging',
          dailyLimit: 45,
          usedMinutes: 20,
          lockedUntil: null,
          isParentLocked: false,
          monitored: true
        },
        youtube: {
          id: 'youtube',
          name: 'YouTube',
          icon: '▶️',
          category: 'Video Streaming',
          dailyLimit: 60,
          usedMinutes: 30,
          lockedUntil: null,
          isParentLocked: false,
          monitored: false
        },
        freefire: {
          id: 'freefire',
          name: 'Free Fire',
          icon: '🔥',
          category: 'Gaming',
          dailyLimit: 45,
          usedMinutes: 10,
          lockedUntil: null,
          isParentLocked: false,
          monitored: false
        }
      },

      // Category budgets
      budgets: {
        socialMedia: 45,
        gaming: 90
      },

      // Active simulator session
      simSession: {
        active: false,
        appId: 'instagram',
        elapsedSeconds: 0,
        lastAlertMilestone: 0
      },

      // Milestone notification log
      notifications: [
        {
          id: 1,
          time: 'Just now',
          app: 'Instagram',
          type: 'limit',
          title: '30-Minute Limit Reached',
          msg: 'You have reached your 30-minute daily goal on Instagram. Time for a mindful break!'
        },
        {
          id: 2,
          time: '5m ago',
          app: 'Instagram',
          type: 'milestone',
          title: '25 Minutes Milestone',
          msg: '25 minutes elapsed on Instagram. 5 minutes remaining before your limit.'
        },
        {
          id: 3,
          time: '10m ago',
          app: 'Instagram',
          type: 'milestone',
          title: '20 Minutes Milestone',
          msg: '20 minutes elapsed on Instagram. Stay mindful.'
        }
      ]
    };

    this.init();
  }

  init() {
    this.loadState();
    this.initBroadcastChannel();
    this.initTheme();
    this.initClock();
    this.renderAll();
    this.startLockdownTicker();

    // Check if initial locked Instagram has a lockedUntil, if not set one for demo
    if (this.state.apps && this.state.apps.instagram) {
      if (this.state.apps.instagram.isParentLocked && !this.state.apps.instagram.lockedUntil) {
        this.state.apps.instagram.lockedUntil = Date.now() + (23 * 3600 + 58 * 60 + 45) * 1000;
      }
    }
  }

  // ==========================================
  // PERSISTENCE & BROADCAST CHANNEL
  // ==========================================
  saveState() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.state));
    } catch (e) {
      console.warn('LocalStorage save failed:', e);
    }
    this.broadcastState();
  }

  loadState() {
    try {
      const saved = localStorage.getItem(this.storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
          if (parsed.apps && typeof parsed.apps === 'object') {
            Object.keys(parsed.apps).forEach((key) => {
              if (this.state.apps[key]) {
                this.state.apps[key] = Object.assign(this.state.apps[key], parsed.apps[key]);
              }
            });
          }
          if (parsed.activeMode) this.state.activeMode = parsed.activeMode;
          if (parsed.theme) this.state.theme = parsed.theme;
          if (parsed.simSpeed) this.state.simSpeed = parsed.simSpeed;
          if (parsed.budgets) this.state.budgets = Object.assign(this.state.budgets, parsed.budgets);
          if (Array.isArray(parsed.notifications) && parsed.notifications.length > 0) {
            this.state.notifications = parsed.notifications;
          }
        }
      }
    } catch (e) {
      console.warn('LocalStorage load failed:', e);
    }
  }

  initBroadcastChannel() {
    if (window.BroadcastChannel) {
      try {
        this.broadcastChannel = new BroadcastChannel('app_controller_sync');
        this.broadcastChannel.onmessage = (event) => {
          if (event.data && event.data.type === 'STATE_SYNC') {
            this.state = event.data.state;
            this.renderAll();
            this.showToast('Remote sync received from connected device', 'normal');
          }
        };
      } catch (e) {
        // BroadcastChannel unavailable
      }
    }
  }

  broadcastState() {
    if (this.broadcastChannel) {
      try {
        this.broadcastChannel.postMessage({
          type: 'STATE_SYNC',
          state: this.state
        });
      } catch (e) {
        // Post message error
      }
    }
  }

  // ==========================================
  // THEME MANAGEMENT
  // ==========================================
  initTheme() {
    const html = document.documentElement;
    if (html) html.setAttribute('data-theme', this.state.theme);
    this.updateThemeIcons();
  }

  toggleTheme() {
    this.state.theme = this.state.theme === 'dark' ? 'light' : 'dark';
    const html = document.documentElement;
    if (html) html.setAttribute('data-theme', this.state.theme);
    this.updateThemeIcons();
    this.renderChart();
    this.saveState();
    this.showToast(`Switched to ${this.state.theme === 'dark' ? 'Peaceful Twilight' : 'Calm Meadow'} theme`, 'normal');
  }

  updateThemeIcons() {
    const sunIcon = document.getElementById('theme-icon-sun');
    const moonIcon = document.getElementById('theme-icon-moon');
    if (sunIcon && moonIcon) {
      if (this.state.theme === 'light') {
        sunIcon.classList.remove('hidden');
        moonIcon.classList.add('hidden');
      } else {
        sunIcon.classList.add('hidden');
        moonIcon.classList.remove('hidden');
      }
    }
  }

  // ==========================================
  // AUDIO SYNTHESIZER (Calming Web Audio API)
  // ==========================================
  toggleAudio() {
    this.state.audioEnabled = !this.state.audioEnabled;
    const onIcon = document.getElementById('icon-audio-on');
    const offIcon = document.getElementById('icon-audio-off');
    const btn = document.getElementById('btn-audio-toggle');
    if (onIcon && offIcon) {
      if (this.state.audioEnabled) {
        onIcon.classList.remove('hidden');
        offIcon.classList.add('hidden');
        if (btn) btn.className = 'icon-btn text-emerald-400';
        this.playCalmChime(528); // 528Hz Solfeggio harmonic
        this.showToast('Calming audio chimes enabled', 'normal');
      } else {
        onIcon.classList.add('hidden');
        offIcon.classList.remove('hidden');
        if (btn) btn.className = 'icon-btn text-slate-500';
        this.showToast('Audio muted', 'normal');
      }
    }
    this.saveState();
  }

  playCalmChime(freq = 528, type = 'sine') {
    if (!this.state.audioEnabled) return;
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      if (!this.audioCtx) {
        this.audioCtx = new AudioContext();
      }
      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }

      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.audioCtx.currentTime);

      gain.gain.setValueAtTime(0, this.audioCtx.currentTime);
      gain.gain.linearRampToValueAtTime(0.2, this.audioCtx.currentTime + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.audioCtx.currentTime + 1.2);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start();
      osc.stop(this.audioCtx.currentTime + 1.25);
    } catch (e) {
      // Audio autoplay policy fallback
    }
  }

  playLockdownAlertTone() {
    if (!this.state.audioEnabled) return;
    this.playCalmChime(396, 'triangle');
    setTimeout(() => this.playCalmChime(330, 'sine'), 160);
  }

  // ==========================================
  // VIEW SWITCHING
  // ==========================================
  switchView(viewName) {
    this.state.activeView = viewName;

    // Update active tab buttons
    document.querySelectorAll('.nav-tab-btn').forEach((btn) => {
      if (btn.getAttribute('data-view') === viewName) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    // Update view panels
    document.querySelectorAll('.app-view').forEach((panel) => {
      panel.classList.remove('active');
    });

    const targetView = document.getElementById(`view-${viewName}`);
    if (targetView) {
      targetView.classList.add('active');
    }

    if (viewName === 'dashboard') {
      this.renderAppCards();
      this.renderChart();
    }
  }

  // ==========================================
  // MODES (Normal vs Strict Buzurg Mode)
  // ==========================================
  setActiveMode(mode) {
    this.state.activeMode = mode;
    this.updateModeUI();
    this.saveState();

    if (mode === 'strict') {
      this.showToast('Strict Mode (Buzurg) activated: Reaching limit locks apps for 24 hours!', 'danger');
      this.playCalmChime(440);
    } else {
      this.showToast('Normal Mode activated: Gentle 5-minute milestone notifications active.', 'normal');
      this.playCalmChime(528);
    }
    this.renderAppCards();
  }

  updateModeUI() {
    const badge = document.getElementById('active-mode-badge');
    const btnNormal = document.getElementById('btn-mode-normal');
    const btnStrict = document.getElementById('btn-mode-strict');

    if (this.state.activeMode === 'strict') {
      if (badge) {
        badge.className = 'badge badge-strict';
        badge.innerText = 'Strict (Buzurg) Mode';
      }
      if (btnStrict) {
        btnStrict.className = 'px-3 py-1.5 rounded-lg text-xs font-semibold bg-orange-600 text-white transition shadow';
      }
      if (btnNormal) {
        btnNormal.className = 'px-3 py-1.5 rounded-lg text-xs font-semibold text-muted hover:text-white transition';
      }
    } else {
      if (badge) {
        badge.className = 'badge badge-normal';
        badge.innerText = 'Normal Mode';
      }
      if (btnNormal) {
        btnNormal.className = 'px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 text-white transition shadow';
      }
      if (btnStrict) {
        btnStrict.className = 'px-3 py-1.5 rounded-lg text-xs font-semibold text-muted hover:text-white transition';
      }
    }
  }

  // ==========================================
  // SIMULATION CONTROLS & 5-MIN ALERTS
  // ==========================================
  setSimSpeed(speedValue) {
    this.state.simSpeed = parseInt(speedValue, 10) || 1;
    this.showToast(`Simulation speed set to ${this.state.simSpeed}x`, 'normal');
  }

  startSimSession() {
    const select = document.getElementById('sim-app-selector');
    const appId = select ? select.value : 'instagram';
    const app = this.state.apps[appId];

    if (!app) return;

    if (this.isAppLocked(appId)) {
      this.showToast(`${app.name} is currently locked for 24 hours under Strict Mode!`, 'danger');
      this.showLockdownModal(app);
      return;
    }

    this.state.simSession.active = true;
    this.state.simSession.appId = appId;
    this.state.simSession.elapsedSeconds = 0;
    this.state.simSession.lastAlertMilestone = 0;

    document.getElementById('sim-start-btn')?.classList.add('hidden');
    document.getElementById('sim-stop-btn')?.classList.remove('hidden');
    const statusBadge = document.getElementById('simulator-status-badge');
    if (statusBadge) {
      statusBadge.className = 'badge badge-normal';
      statusBadge.innerText = `Active: ${app.name}`;
    }

    this.updatePhoneMockupUI(app);

    if (this.simTimer) clearInterval(this.simTimer);
    this.simTimer = setInterval(() => {
      this.tickSimSession();
    }, 1000);

    this.showToast(`Started session for ${app.name}`, 'normal');
    this.playCalmChime(660);
  }

  stopSimSession() {
    if (this.simTimer) clearInterval(this.simTimer);
    this.state.simSession.active = false;

    document.getElementById('sim-start-btn')?.classList.remove('hidden');
    document.getElementById('sim-stop-btn')?.classList.add('hidden');
    const statusBadge = document.getElementById('simulator-status-badge');
    if (statusBadge) {
      statusBadge.className = 'badge badge-normal';
      statusBadge.innerText = 'Idle';
    }

    const app = this.state.apps[this.state.simSession.appId];
    if (app) {
      this.showToast(`Exited ${app.name}. Session ended.`, 'normal');
    }
    this.hidePhoneNotification();
  }

  tickSimSession() {
    if (!this.state.simSession.active) return;

    const appId = this.state.simSession.appId;
    const app = this.state.apps[appId];
    if (!app) return;

    this.state.simSession.elapsedSeconds += this.state.simSpeed;
    const elapsedMinutes = Math.floor(this.state.simSession.elapsedSeconds / 60);

    const mm = String(Math.floor(this.state.simSession.elapsedSeconds / 60)).padStart(2, '0');
    const ss = String(this.state.simSession.elapsedSeconds % 60).padStart(2, '0');
    const timeStr = `${mm}:${ss}`;

    const simSessionTimeEl = document.getElementById('sim-session-time');
    if (simSessionTimeEl) simSessionTimeEl.innerText = timeStr;

    const phoneCounterEl = document.getElementById('sim-phone-session-counter');
    if (phoneCounterEl) phoneCounterEl.innerText = timeStr;

    const limitSeconds = app.dailyLimit * 60;
    const pct = Math.min(100, Math.round((this.state.simSession.elapsedSeconds / limitSeconds) * 100));
    const barEl = document.getElementById('sim-session-bar');
    if (barEl) {
      barEl.style.width = `${pct}%`;
      if (pct > 90) barEl.className = 'progress-fill danger';
      else if (pct > 70) barEl.className = 'progress-fill warning';
      else barEl.className = 'progress-fill safe';
    }

    const nextMilestoneSeconds = (this.state.simSession.lastAlertMilestone + 5) * 60;
    const secondsToNext = Math.max(0, nextMilestoneSeconds - this.state.simSession.elapsedSeconds);
    const nextMm = String(Math.floor(secondsToNext / 60)).padStart(2, '0');
    const nextSs = String(secondsToNext % 60).padStart(2, '0');
    const nextAlertEl = document.getElementById('sim-next-alert');
    if (nextAlertEl) nextAlertEl.innerText = `${nextMm}:${nextSs}`;

    // 5-Minute Milestone Notification Check
    const currentMilestone = Math.floor(elapsedMinutes / 5) * 5;
    if (currentMilestone > 0 && currentMilestone > this.state.simSession.lastAlertMilestone && currentMilestone < app.dailyLimit) {
      this.state.simSession.lastAlertMilestone = currentMilestone;
      this.trigger5MinuteAlert(app, currentMilestone);
    }

    // Daily Time Limit Reached Check
    if (elapsedMinutes >= app.dailyLimit) {
      this.triggerLimitReached(app);
    }
  }

  trigger5MinuteAlert(app, milestoneMinutes) {
    const msg = `You have spent ${milestoneMinutes} minutes on ${app.name}. Stay mindful of your screen time!`;
    this.addNotificationLog(app.name, 'milestone', `${milestoneMinutes}-Minute Milestone`, msg);
    this.showToast(msg, 'normal');
    this.showPhoneNotification(milestoneMinutes, msg);
    this.playCalmChime(587);
  }

  triggerLimitReached(app) {
    this.stopSimSession();
    app.usedMinutes = app.dailyLimit;

    if (this.state.activeMode === 'strict') {
      const lockDurationMs = 24 * 60 * 60 * 1000;
      app.lockedUntil = Date.now() + lockDurationMs;

      const title = `Strict Mode: ${app.name} Locked for 24 Hours`;
      const msg = `${app.name} reached its ${app.dailyLimit}-minute limit. Application is locked for 24 hours to enforce healthy habits.`;

      this.addNotificationLog(app.name, 'strict-lock', title, msg);
      this.showToast(msg, 'danger');
      this.playLockdownAlertTone();
      this.showLockdownModal(app);
    } else {
      const title = `Daily Limit of ${app.dailyLimit} Minutes Reached`;
      const msg = `You have reached your daily limit for ${app.name}. Normal Mode keeps you aware without locking your app.`;

      this.addNotificationLog(app.name, 'limit', title, msg);
      this.showToast(msg, 'warning');
      this.playCalmChime(440);
    }

    this.renderAll();
    this.saveState();
  }

  isAppLocked(appId) {
    const app = this.state.apps[appId];
    if (!app) return false;
    if (app.isParentLocked) return true;
    if (app.lockedUntil && app.lockedUntil > Date.now()) return true;
    return false;
  }

  // ==========================================
  // BUZURG 24-HOUR LOCKDOWN TICKER
  // ==========================================
  startLockdownTicker() {
    if (this.lockdownTimer) clearInterval(this.lockdownTimer);

    this.lockdownTimer = setInterval(() => {
      let anyLocked = false;
      let primaryLockedApp = null;
      const now = Date.now();

      if (this.state.apps) {
        Object.values(this.state.apps).forEach((app) => {
          if (app.lockedUntil) {
            if (app.lockedUntil > now) {
              anyLocked = true;
              if (!primaryLockedApp) primaryLockedApp = app;
            } else {
              app.lockedUntil = null;
              this.showToast(`${app.name} 24-hour lockdown has expired. Application is now unlocked!`, 'success');
              this.playCalmChime(528);
              this.renderAll();
              this.saveState();
            }
          }
        });
      }

      const banner = document.getElementById('buzurg-active-banner');
      const bannerText = document.getElementById('buzurg-banner-text');
      const bannerTimer = document.getElementById('buzurg-lockdown-countdown');
      const phoneTimer = document.getElementById('phone-lockdown-timer');

      if (anyLocked && primaryLockedApp) {
        if (banner) banner.classList.remove('hidden');
        const remainingMs = Math.max(0, primaryLockedApp.lockedUntil - now);
        const hours = Math.floor(remainingMs / (1000 * 60 * 60));
        const mins = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));
        const secs = Math.floor((remainingMs % (1000 * 60)) / 1000);
        const timeStr = `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

        if (bannerTimer) bannerTimer.innerText = timeStr;
        if (phoneTimer) phoneTimer.innerText = `${hours}h ${mins}m ${secs}s`;
        if (bannerText) {
          bannerText.innerText = `${primaryLockedApp.name} reached its ${primaryLockedApp.dailyLimit}-minute limit. Application is locked for 24 hours.`;
        }
      } else {
        if (banner) banner.classList.add('hidden');
      }
    }, 1000);
  }

  emergencyUnlockDemo() {
    if (this.state.apps) {
      Object.values(this.state.apps).forEach((app) => {
        app.lockedUntil = null;
        app.isParentLocked = false;
      });
    }
    this.closeSimModal();
    this.showToast('All apps unlocked for demo testing!', 'success');
    this.renderAll();
    this.saveState();
  }

  // ==========================================
  // PARENTAL CONTROL HUB
  // ==========================================
  toggleParentAppLock(appId) {
    const app = this.state.apps[appId];
    if (!app) return;

    app.isParentLocked = !app.isParentLocked;
    if (app.isParentLocked) {
      this.showToast(`Parent remotely locked ${app.name} on connected device`, 'danger');
      this.playLockdownAlertTone();
    } else {
      this.showToast(`Parent remotely unlocked ${app.name} on connected device`, 'success');
      this.playCalmChime(528);
    }

    this.renderParentalView();
    this.renderAppCards();
    this.saveState();
  }

  toggleRemoteDeviceLock() {
    this.state.remoteDeviceLocked = !this.state.remoteDeviceLocked;
    const btn = document.getElementById('btn-remote-device-lock');

    if (this.state.remoteDeviceLocked) {
      if (btn) {
        btn.innerText = '🔓 Unlock Connected Device';
        btn.className = 'btn-secondary text-xs py-1.5 px-3';
      }
      this.showToast("Parent remotely locked child's entire device!", 'danger');
      this.playLockdownAlertTone();

      const deviceLockScreen = document.getElementById('phone-remote-device-lock-screen');
      if (deviceLockScreen) deviceLockScreen.classList.remove('hidden');
      this.openSimModal();
    } else {
      if (btn) {
        btn.innerText = '🔒 Remotely Lock Device';
        btn.className = 'btn-outline-danger';
      }
      this.showToast("Child's device unlocked remotely", 'success');
      this.playCalmChime(528);

      const deviceLockScreen = document.getElementById('phone-remote-device-lock-screen');
      if (deviceLockScreen) deviceLockScreen.classList.add('hidden');
    }

    this.saveState();
  }

  renderParentalView() {
    ['instagram', 'pubg', 'tiktok'].forEach((id) => {
      const app = this.state.apps[id];
      if (!app) return;

      const statusEl = document.getElementById(`parent-status-${id}`);
      const btnEl = document.getElementById(`btn-parent-toggle-${id}`);
      const detailEl = document.getElementById(`parent-detail-${id}`);

      if (detailEl) {
        detailEl.innerText = `Child limit: ${app.dailyLimit}m • Current usage: ${app.usedMinutes}m`;
      }

      if (app.isParentLocked || (app.lockedUntil && app.lockedUntil > Date.now())) {
        if (statusEl) {
          statusEl.className = 'badge badge-strict';
          statusEl.innerText = 'Locked';
        }
        if (btnEl) {
          btnEl.innerText = 'Unlock App';
          btnEl.className = 'btn-secondary text-xs py-1.5 px-3';
        }
      } else {
        if (statusEl) {
          statusEl.className = 'badge badge-normal';
          statusEl.innerText = 'Allowed';
        }
        if (btnEl) {
          btnEl.innerText = 'Lock App Now';
          btnEl.className = 'btn-danger text-xs py-1.5 px-3';
        }
      }
    });
  }

  // ==========================================
  // PERSONALIZED PLAN ONBOARDING WIZARD
  // ==========================================
  wizardNext(targetStep) {
    for (let i = 1; i <= 5; i++) {
      const stepContent = document.getElementById(`wizard-step-${i}`);
      const stepNode = document.getElementById(`wizard-step-node-${i}`);
      if (stepContent) stepContent.classList.remove('active');
      if (stepNode) {
        stepNode.classList.remove('active');
        if (i < targetStep) stepNode.classList.add('completed');
        else stepNode.classList.remove('completed');
      }
    }

    const currentContent = document.getElementById(`wizard-step-${targetStep}`);
    const currentNode = document.getElementById(`wizard-step-node-${targetStep}`);
    if (currentContent) currentContent.classList.add('active');
    if (currentNode) currentNode.classList.add('active');

    this.state.wizardStep = targetStep;
  }

  savePersonalizedPlan() {
    const checkedBoxes = document.querySelectorAll('input[name="wizard-apps"]:checked');
    const chosenAppIds = Array.from(checkedBoxes).map((cb) => cb.value);

    const igLimit = parseInt(document.getElementById('input-limit-instagram')?.value || '30', 10);
    const pubgLimit = parseInt(document.getElementById('input-limit-pubg')?.value || '90', 10);
    const tiktokLimit = parseInt(document.getElementById('input-limit-tiktok')?.value || '25', 10);

    if (this.state.apps.instagram) this.state.apps.instagram.dailyLimit = igLimit;
    if (this.state.apps.pubg) this.state.apps.pubg.dailyLimit = pubgLimit;
    if (this.state.apps.tiktok) this.state.apps.tiktok.dailyLimit = tiktokLimit;

    Object.keys(this.state.apps).forEach((id) => {
      this.state.apps[id].monitored = chosenAppIds.includes(id);
    });

    const socialBudget = parseInt(document.getElementById('wizard-social-budget')?.value || '45', 10);
    const gamingBudget = parseInt(document.getElementById('wizard-gaming-budget')?.value || '90', 10);
    this.state.budgets.socialMedia = socialBudget;
    this.state.budgets.gaming = gamingBudget;

    const selectedMode = document.querySelector('input[name="wizard-mode-choice"]:checked')?.value || 'normal';
    this.setActiveMode(selectedMode);

    const parentalToggle = document.getElementById('wizard-parental-toggle');
    this.state.parentalEnabled = !!(parentalToggle && parentalToggle.checked);

    this.saveState();
    this.renderAll();
    this.switchView('dashboard');
    this.showToast('Your personalized screen-time plan is now active!', 'success');
    this.playCalmChime(528);
  }

  // ==========================================
  // MINDFUL PAUSE & BOX BREATHING
  // ==========================================
  toggleBreathingExercise() {
    const btn = document.getElementById('btn-breathing');
    const circle = document.getElementById('breathing-circle');
    const text = document.getElementById('breathing-instruction');

    if (this.breathingActive) {
      clearInterval(this.breathingTimer);
      this.breathingActive = false;
      if (btn) btn.innerText = 'Start 2-Minute Breathing Session';
      if (text) text.innerText = 'Rest';
      if (circle) {
        circle.style.transform = 'scale(1)';
        circle.className = 'w-36 h-36 rounded-full bg-emerald-600 opacity-90 flex items-center justify-center text-white font-bold transition-all duration-1000 shadow-lg';
      }
    } else {
      this.breathingActive = true;
      if (btn) btn.innerText = 'End Breathing Session';
      let phase = 0; // 0: Inhale, 1: Hold, 2: Exhale, 3: Rest

      const runPhase = () => {
        if (!this.breathingActive) return;
        if (phase === 0) {
          if (text) text.innerText = 'Inhale (4s)';
          if (circle) circle.style.transform = 'scale(1.25)';
          this.playCalmChime(440);
        } else if (phase === 1) {
          if (text) text.innerText = 'Hold (4s)';
          this.playCalmChime(528);
        } else if (phase === 2) {
          if (text) text.innerText = 'Exhale (4s)';
          if (circle) circle.style.transform = 'scale(0.85)';
          this.playCalmChime(396);
        } else if (phase === 3) {
          if (text) text.innerText = 'Rest & Calm (4s)';
        }
        phase = (phase + 1) % 4;
      };

      runPhase();
      this.breathingTimer = setInterval(runPhase, 4000);
    }
  }

  // ==========================================
  // PHONE SIMULATOR MODAL & NOTIFICATIONS
  // ==========================================
  openSimModal() {
    const modal = document.getElementById('simulator-modal');
    if (modal) modal.classList.add('active');
    const appId = this.state.simSession.appId || 'instagram';
    const app = this.state.apps[appId];
    if (app) this.updatePhoneMockupUI(app);
  }

  closeSimModal() {
    const modal = document.getElementById('simulator-modal');
    if (modal) modal.classList.remove('active');
  }

  updatePhoneMockupUI(app) {
    const phoneAppTitle = document.getElementById('phone-app-title');
    const simAppIcon = document.getElementById('sim-app-icon');
    const simAppHeading = document.getElementById('sim-app-heading');
    const simPhoneLimit = document.getElementById('sim-phone-limit-display');
    const simPhoneMode = document.getElementById('sim-phone-mode-display');

    if (phoneAppTitle) phoneAppTitle.innerText = app.name;
    if (simAppIcon) simAppIcon.innerText = app.icon;
    if (simAppHeading) simAppHeading.innerText = `${app.name} (${app.category})`;
    if (simPhoneLimit) simPhoneLimit.innerText = `${app.dailyLimit}:00`;
    if (simPhoneMode) {
      simPhoneMode.innerText = this.state.activeMode === 'strict' ? 'Strict Mode (Buzurg)' : 'Normal Mode';
      simPhoneMode.className = this.state.activeMode === 'strict' ? 'text-orange-400 font-bold' : 'text-emerald-400 font-bold';
    }

    const lockdownScreen = document.getElementById('phone-lockdown-screen');
    if (lockdownScreen) {
      if (this.isAppLocked(app.id)) {
        lockdownScreen.classList.remove('hidden');
      } else {
        lockdownScreen.classList.add('hidden');
      }
    }
  }

  showPhoneNotification(minutes, msg) {
    const notifBox = document.getElementById('sim-phone-notification');
    const timeEl = document.getElementById('sim-phone-notif-time');
    const msgEl = document.getElementById('sim-phone-notif-msg');

    if (notifBox && timeEl && msgEl) {
      timeEl.innerText = `${minutes} Mins`;
      msgEl.innerText = msg;
      notifBox.classList.remove('hidden');
      setTimeout(() => this.hidePhoneNotification(), 6000);
    }
  }

  hidePhoneNotification() {
    const notifBox = document.getElementById('sim-phone-notification');
    if (notifBox) notifBox.classList.add('hidden');
  }

  showLockdownModal(app) {
    this.openSimModal();
    const lockdownScreen = document.getElementById('phone-lockdown-screen');
    if (lockdownScreen) lockdownScreen.classList.remove('hidden');
  }

  // ==========================================
  // RENDERING COMPONENTS
  // ==========================================
  renderAll() {
    this.updateModeUI();
    this.renderAppCards();
    this.renderParentalView();
    this.renderNotificationLog();
    this.renderStats();
    this.renderChart();
  }

  renderStats() {
    let totalUsed = 0;
    let socialUsed = 0;
    let gamingUsed = 0;

    if (this.state.apps) {
      Object.values(this.state.apps).forEach((app) => {
        totalUsed += app.usedMinutes;
        if (app.category.includes('Social') || app.category.includes('Messaging')) {
          socialUsed += app.usedMinutes;
        }
        if (app.category.includes('Gaming')) {
          gamingUsed += app.usedMinutes;
        }
      });
    }

    const totalHours = Math.floor(totalUsed / 60);
    const totalMins = totalUsed % 60;
    const statTotalEl = document.getElementById('stat-total-screentime');
    if (statTotalEl) statTotalEl.innerText = `${totalHours}h ${totalMins}m`;

    const statSocialEl = document.getElementById('stat-social-screentime');
    if (statSocialEl) statSocialEl.innerText = `${socialUsed}m / ${this.state.budgets.socialMedia}m`;

    const statGamingEl = document.getElementById('stat-gaming-screentime');
    if (statGamingEl) statGamingEl.innerText = `${gamingUsed}m / ${this.state.budgets.gaming}m`;
  }

  renderAppCards() {
    const container = document.getElementById('app-cards-container');
    if (!container || !this.state.apps) return;

    container.innerHTML = '';

    Object.values(this.state.apps).forEach((app) => {
      const locked = this.isAppLocked(app.id);
      const pct = Math.min(100, Math.round((app.usedMinutes / app.dailyLimit) * 100));
      const card = document.createElement('div');
      card.className = `app-item-card ${locked ? 'is-locked' : ''}`;
      card.id = `card-app-${app.id}`;

      let statusBadge = '';
      if (locked) {
        statusBadge = `<span class="badge badge-strict">🔒 Locked (24h)</span>`;
      } else if (app.usedMinutes >= app.dailyLimit) {
        statusBadge = `<span class="badge badge-strict">Limit Reached</span>`;
      } else {
        statusBadge = `<span class="badge badge-normal">Active</span>`;
      }

      card.innerHTML = `
        <div class="app-item-header">
          <div class="app-identity">
            <div class="app-avatar">${app.icon}</div>
            <div>
              <div class="app-name">${app.name}</div>
              <div class="app-category">${app.category}</div>
            </div>
          </div>
          <div>${statusBadge}</div>
        </div>

        <div class="space-y-1.5">
          <div class="progress-labels">
            <span>Used: <strong class="text-main">${app.usedMinutes}m</strong> / ${app.dailyLimit}m</span>
            <span>${pct}%</span>
          </div>
          <div class="progress-container">
            <div class="progress-fill ${pct >= 100 ? 'danger' : pct >= 70 ? 'warning' : 'safe'}" style="width: ${pct}%"></div>
          </div>
        </div>

        <div class="flex items-center justify-between pt-2 border-t border-white/5">
          <div class="text-[11px] text-muted">
            Alerts: <strong>Every 5m</strong>
          </div>
          <button onclick="appController.selectAndTestApp('${app.id}')" class="btn-secondary text-xs py-1.5 px-3">
            ${locked ? 'View Lock Screen' : 'Test in Simulator &rarr;'}
          </button>
        </div>
      `;

      container.appendChild(card);
    });
  }

  selectAndTestApp(appId) {
    const select = document.getElementById('sim-app-selector');
    if (select) select.value = appId;
    const app = this.state.apps[appId];

    if (this.isAppLocked(appId)) {
      this.showLockdownModal(app);
    } else {
      this.startSimSession();
      this.openSimModal();
    }
  }

  addNotificationLog(appName, type, title, msg) {
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    this.state.notifications.unshift({
      id: Date.now(),
      time: timeStr,
      app: appName,
      type: type,
      title: title,
      msg: msg
    });

    if (this.state.notifications.length > 25) {
      this.state.notifications.pop();
    }

    this.renderNotificationLog();
    this.saveState();
  }

  clearNotificationLog() {
    this.state.notifications = [];
    this.renderNotificationLog();
    this.saveState();
    this.showToast('Milestone notification feed cleared', 'normal');
  }

  renderNotificationLog() {
    const container = document.getElementById('notification-log-list');
    if (!container) return;

    if (!this.state.notifications || this.state.notifications.length === 0) {
      container.innerHTML = `
        <div class="p-4 text-center text-xs text-muted">
          No notifications yet. Launch an app in the simulator to see 5-minute milestone alerts appear here!
        </div>
      `;
      return;
    }

    container.innerHTML = this.state.notifications
      .map(
        (n) => `
        <div class="p-3 bg-black/20 rounded-xl border border-white/5 flex items-start gap-3">
          <div class="mt-0.5 text-base">
            ${n.type.includes('strict') ? '🔒' : n.type === 'limit' ? '⚠️' : '⏱️'}
          </div>
          <div class="flex-1 text-xs">
            <div class="flex items-center justify-between">
              <span class="font-bold text-main">${n.title}</span>
              <span class="text-[10px] text-muted">${n.time}</span>
            </div>
            <p class="text-muted mt-0.5 leading-snug">${n.msg}</p>
          </div>
        </div>
      `
      )
      .join('');
  }

  renderChart() {
    const canvas = document.getElementById('usageDoughnutChart');
    if (!canvas) return;

    let social = 0;
    let gaming = 0;
    let other = 0;

    if (this.state.apps) {
      Object.values(this.state.apps).forEach((app) => {
        if (app.category.includes('Social') || app.category.includes('Messaging')) {
          social += app.usedMinutes;
        } else if (app.category.includes('Gaming')) {
          gaming += app.usedMinutes;
        } else {
          other += app.usedMinutes;
        }
      });
    }

    if (window.Chart) {
      try {
        if (this.chartInstance) {
          this.chartInstance.destroy();
        }

        const isDark = this.state.theme === 'dark';
        const textColor = isDark ? '#95a79f' : '#4e6357';

        this.chartInstance = new Chart(canvas, {
          type: 'doughnut',
          data: {
            labels: ['Social Media', 'Gaming', 'Other / Video', 'Remaining Budget'],
            datasets: [
              {
                data: [social, gaming, other, Math.max(0, 180 - (social + gaming + other))],
                backgroundColor: ['#48bfe3', '#f4a261', '#a3b18a', isDark ? '#22312b' : '#d8e2dc'],
                borderWidth: 0,
                hoverOffset: 4
              }
            ]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                position: 'right',
                labels: {
                  color: textColor,
                  font: {
                    family: 'Plus Jakarta Sans',
                    size: 11
                  },
                  boxWidth: 12
                }
              }
            },
            cutout: '70%'
          }
        });
      } catch (e) {
        console.warn('Chart render error:', e);
      }
    }
  }

  // ==========================================
  // REAL-TIME SYSTEM CLOCK
  // ==========================================
  initClock() {
    const updateTime = () => {
      const now = new Date();
      const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const clockEl = document.getElementById('phone-sim-clock');
      if (clockEl) clockEl.innerText = timeStr;
    };
    updateTime();
    this.clockTimer = setInterval(updateTime, 10000);
  }

  // ==========================================
  // TOAST NOTIFICATION SYSTEM
  // ==========================================
  showToast(message, type = 'normal') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    let icon = 'ℹ️';
    if (type === 'danger') icon = '🔒';
    else if (type === 'warning') icon = '⚠️';
    else if (type === 'success') icon = '✓';

    toast.innerHTML = `
      <span class="text-base">${icon}</span>
      <div class="text-xs leading-snug">
        <strong class="block text-main">${type === 'danger' ? 'Strict Lockdown' : type === 'warning' ? 'Alert' : 'Notice'}</strong>
        ${message}
      </div>
    `;

    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(100%)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 4500);
  }
}

// Immediate and bulletproof initialization
function initAppController() {
  if (!window.appController) {
    try {
      window.appController = new AppController();
    } catch (err) {
      console.error('AppController init error:', err);
    }
  }
}

if (document.readyState === 'loading') {
  window.addEventListener('DOMContentLoaded', initAppController);
} else {
  initAppController();
}
