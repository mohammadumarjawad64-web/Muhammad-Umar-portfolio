/**
 * App Controller - Full Frontend Client Application Logic
 * Integrates with Backend REST API (server.js) with seamless offline fallback.
 */

class AppControllerClient {
  constructor() {
    this.storageKey = 'app_controller_state_v3';
    this.apiBase = window.location.origin.includes('http') ? window.location.origin : 'http://localhost:3000';
    this.isBackendOnline = false;

    this.simTimer = null;
    this.clockTimer = null;
    this.lockdownTimer = null;
    this.breathingTimer = null;
    this.breathingActive = false;
    this.audioCtx = null;
    this.chartInstance = null;

    // Default Fallback State (Matches Backend Database)
    this.state = {
      user: { name: 'Hamza Ahmed', planCreated: true },
      activeMode: 'normal', // 'normal' | 'strict' (Buzurg)
      simSpeed: 30, // 1, 10, 30, 60
      audioEnabled: true,
      parentalEnabled: true,
      remoteDeviceLocked: false,
      childDeviceName: "Hamza's Phone",
      syncCode: "APP-8492",
      activeView: 'dashboard',
      wizardStep: 1,

      apps: {
        instagram: {
          id: 'instagram',
          name: 'Instagram',
          icon: '📸',
          category: 'Social Media',
          dailyLimit: 30,
          usedMinutes: 30,
          lockedUntil: Date.now() + (23 * 3600 + 58 * 60 + 45) * 1000,
          isParentLocked: true,
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

      budgets: {
        socialMedia: 45,
        gaming: 90
      },

      simSession: {
        active: false,
        appId: 'instagram',
        elapsedSeconds: 0,
        lastAlertMilestone: 0
      },

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
          msg: '20 minutes elapsed on Instagram. Stay mindful of screen time.'
        }
      ]
    };

    this.init();
  }

  async init() {
    this.loadLocalState();
    this.initClock();
    this.renderAll();
    this.startLockdownTicker();

    // Check backend health & sync
    await this.checkBackendStatus();

    // Poll backend state every 4 seconds if online
    setInterval(() => {
      if (this.isBackendOnline) {
        this.fetchBackendState();
      }
    }, 4000);
  }

  // ==========================================
  // BACKEND API CONNECTIVITY
  // ==========================================
  async checkBackendStatus() {
    const indicator = document.getElementById('backend-status-indicator');
    const label = document.getElementById('backend-status-text');

    try {
      const res = await fetch(`${this.apiBase}/api/health`, { method: 'GET' });
      if (res.ok) {
        this.isBackendOnline = true;
        if (indicator) indicator.className = 'status-indicator';
        if (label) label.innerText = 'Backend Live (Port 3000)';
        console.log('[AppController] Connected to Backend REST Server successfully.');
        await this.fetchBackendState();
        return;
      }
    } catch (e) {
      // Backend not running on localhost:3000
    }

    this.isBackendOnline = false;
    if (indicator) indicator.className = 'status-indicator offline';
    if (label) label.innerText = 'Standalone Browser Mode';
    console.info('[AppController] Operating in Standalone Browser Mode with LocalStorage engine.');
  }

  async fetchBackendState() {
    try {
      const res = await fetch(`${this.apiBase}/api/state`);
      if (res.ok) {
        const remoteState = await res.json();
        if (remoteState && remoteState.apps) {
          this.state = Object.assign(this.state, remoteState);
          this.renderAll();
        }
      }
    } catch (e) {
      console.warn('[AppController] Backend state fetch skipped');
    }
  }

  loadLocalState() {
    try {
      const saved = localStorage.getItem(this.storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
          if (parsed.apps) {
            Object.keys(parsed.apps).forEach((k) => {
              if (this.state.apps[k]) {
                this.state.apps[k] = Object.assign(this.state.apps[k], parsed.apps[k]);
              }
            });
          }
          if (parsed.activeMode) this.state.activeMode = parsed.activeMode;
          if (parsed.simSpeed) this.state.simSpeed = parsed.simSpeed;
          if (Array.isArray(parsed.notifications) && parsed.notifications.length > 0) {
            this.state.notifications = parsed.notifications;
          }
        }
      }
    } catch (e) {
      console.warn('LocalStorage error:', e);
    }
  }

  saveLocalState() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.state));
    } catch (e) {
      // Storage unavailable
    }
  }

  // ==========================================
  // VIEW SWITCHING
  // ==========================================
  switchView(viewName) {
    this.state.activeView = viewName;

    document.querySelectorAll('.nav-tab-btn').forEach((btn) => {
      if (btn.getAttribute('data-view') === viewName) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

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
  async setActiveMode(mode) {
    this.state.activeMode = mode;
    this.updateModeUI();
    this.saveLocalState();

    if (this.isBackendOnline) {
      try {
        await fetch(`${this.apiBase}/api/mode`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ mode })
        });
      } catch (e) {}
    }

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
        btnStrict.className = 'px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-600 text-white transition shadow';
      }
      if (btnNormal) {
        btnNormal.className = 'px-3 py-1.5 rounded-lg text-xs font-semibold text-muted hover:text-main transition';
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
        btnStrict.className = 'px-3 py-1.5 rounded-lg text-xs font-semibold text-muted hover:text-main transition';
      }
    }
  }

  // ==========================================
  // SIMULATION & 5-MIN ALERTS ENGINE
  // ==========================================
  setSimSpeed(speedValue) {
    this.state.simSpeed = parseInt(speedValue, 10) || 1;
    this.showToast(`Simulation speed set to ${this.state.simSpeed}x`, 'normal');
  }

  async startSimSession() {
    const select = document.getElementById('sim-app-selector');
    const appId = select ? select.value : 'instagram';
    const app = this.state.apps[appId];

    if (!app) return;

    if (this.isAppLocked(appId)) {
      this.showToast(`${app.name} is currently locked for 24 hours under Strict Mode!`, 'danger');
      this.showLockdownModal(app);
      return;
    }

    if (this.isBackendOnline) {
      try {
        const res = await fetch(`${this.apiBase}/api/session/start`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ appId })
        });
        if (!res.ok) {
          const errData = await res.json();
          this.showToast(errData.message || 'Cannot start session', 'danger');
          this.showLockdownModal(app);
          return;
        }
      } catch (e) {}
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

  async stopSimSession() {
    if (this.simTimer) clearInterval(this.simTimer);
    this.state.simSession.active = false;

    if (this.isBackendOnline) {
      try {
        await fetch(`${this.apiBase}/api/session/stop`, { method: 'POST' });
      } catch (e) {}
    }

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

  async tickSimSession() {
    if (!this.state.simSession.active) return;

    const appId = this.state.simSession.appId;
    const app = this.state.apps[appId];
    if (!app) return;

    if (this.isBackendOnline) {
      try {
        const res = await fetch(`${this.apiBase}/api/session/tick`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ speed: this.state.simSpeed })
        });
        if (res.ok) {
          const tickData = await res.json();
          if (tickData.state) {
            this.state.apps = tickData.state.apps;
            this.state.notifications = tickData.state.notifications;
          }
          if (tickData.event) {
            if (tickData.event.type === '5_MIN_ALERT') {
              this.trigger5MinuteAlert(app, tickData.event.milestone);
            } else if (tickData.event.type === 'STRICT_LOCKDOWN') {
              this.stopSimSession();
              this.showToast(tickData.event.message, 'danger');
              this.playLockdownAlertTone();
              this.showLockdownModal(app);
              this.renderAll();
              return;
            } else if (tickData.event.type === 'NORMAL_LIMIT_REACHED') {
              this.stopSimSession();
              this.showToast(tickData.event.message, 'warning');
              this.playCalmChime(440);
              this.renderAll();
              return;
            }
          }
        }
      } catch (e) {}
    }

    // Client-side simulation calculations
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

    // Milestone Check in Standalone Mode
    if (!this.isBackendOnline) {
      const currentMilestone = Math.floor(elapsedMinutes / 5) * 5;
      if (currentMilestone > 0 && currentMilestone > this.state.simSession.lastAlertMilestone && currentMilestone < app.dailyLimit) {
        this.state.simSession.lastAlertMilestone = currentMilestone;
        this.trigger5MinuteAlert(app, currentMilestone);
      }

      if (elapsedMinutes >= app.dailyLimit) {
        this.triggerLimitReachedStandalone(app);
      }
    }
  }

  trigger5MinuteAlert(app, milestoneMinutes) {
    const msg = `You have spent ${milestoneMinutes} minutes on ${app.name}. Stay mindful of your screen time!`;
    this.addNotificationLog(app.name, 'milestone', `${milestoneMinutes}-Minute Milestone`, msg);
    this.showToast(msg, 'normal');
    this.showPhoneNotification(milestoneMinutes, msg);
    this.playCalmChime(587);
  }

  triggerLimitReachedStandalone(app) {
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
    this.saveLocalState();
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
              this.saveLocalState();
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

  async emergencyUnlockDemo() {
    if (this.isBackendOnline) {
      try {
        await fetch(`${this.apiBase}/api/reset-demo`, { method: 'POST' });
        await this.fetchBackendState();
      } catch (e) {}
    } else {
      if (this.state.apps) {
        Object.values(this.state.apps).forEach((app) => {
          app.lockedUntil = null;
          app.isParentLocked = false;
        });
      }
      this.state.remoteDeviceLocked = false;
      this.saveLocalState();
    }

    this.closeSimModal();
    this.showToast('All 24-hour locks and restrictions reset for demo testing!', 'success');
    this.playCalmChime(528);
    this.renderAll();
  }

  // ==========================================
  // PARENTAL CONTROL HUB
  // ==========================================
  async toggleParentAppLock(appId) {
    const app = this.state.apps[appId];
    if (!app) return;

    const currentlyLocked = app.isParentLocked || (app.lockedUntil && app.lockedUntil > Date.now());

    if (this.isBackendOnline) {
      const endpoint = currentlyLocked ? '/api/parent/unlock-app' : '/api/parent/lock-app';
      try {
        await fetch(`${this.apiBase}${endpoint}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ appId })
        });
        await this.fetchBackendState();
      } catch (e) {}
    } else {
      app.isParentLocked = !currentlyLocked;
      if (!app.isParentLocked) app.lockedUntil = null;
      this.saveLocalState();
    }

    if (currentlyLocked) {
      this.showToast(`Parent remotely unlocked ${app.name} on child device`, 'success');
      this.playCalmChime(528);
    } else {
      this.showToast(`Parent remotely locked ${app.name} on child device`, 'danger');
      this.playLockdownAlertTone();
    }

    this.renderParentalView();
    this.renderAppCards();
  }

  async toggleRemoteDeviceLock() {
    const targetLockState = !this.state.remoteDeviceLocked;
    this.state.remoteDeviceLocked = targetLockState;

    if (this.isBackendOnline) {
      try {
        await fetch(`${this.apiBase}/api/parent/lock-device`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ locked: targetLockState })
        });
      } catch (e) {}
    } else {
      this.saveLocalState();
    }

    const btn = document.getElementById('btn-remote-device-lock');
    const deviceLockScreen = document.getElementById('phone-remote-device-lock-screen');

    if (targetLockState) {
      if (btn) {
        btn.innerText = '🔓 Unlock Connected Device';
        btn.className = 'btn-secondary text-xs py-1.5 px-3';
      }
      this.showToast("Parent remotely locked child's entire device!", 'danger');
      this.playLockdownAlertTone();
      if (deviceLockScreen) deviceLockScreen.classList.remove('hidden');
      this.openSimModal();
    } else {
      if (btn) {
        btn.innerText = '🔒 Remotely Lock Device';
        btn.className = 'btn-outline-danger';
      }
      this.showToast("Child's device unlocked remotely", 'success');
      this.playCalmChime(528);
      if (deviceLockScreen) deviceLockScreen.classList.add('hidden');
    }
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

  async savePersonalizedPlan() {
    const checkedBoxes = document.querySelectorAll('input[name="wizard-apps"]:checked');
    const chosenAppIds = Array.from(checkedBoxes).map((cb) => cb.value);

    const igLimit = parseInt(document.getElementById('input-limit-instagram')?.value || '30', 10);
    const pubgLimit = parseInt(document.getElementById('input-limit-pubg')?.value || '90', 10);
    const tiktokLimit = parseInt(document.getElementById('input-limit-tiktok')?.value || '25', 10);

    const limits = {
      instagram: igLimit,
      pubg: pubgLimit,
      tiktok: tiktokLimit
    };

    const socialBudget = parseInt(document.getElementById('wizard-social-budget')?.value || '45', 10);
    const gamingBudget = parseInt(document.getElementById('wizard-gaming-budget')?.value || '90', 10);

    const selectedMode = document.querySelector('input[name="wizard-mode-choice"]:checked')?.value || 'normal';
    const parentalToggle = document.getElementById('wizard-parental-toggle');
    const parentalEnabled = !!(parentalToggle && parentalToggle.checked);

    if (this.isBackendOnline) {
      try {
        const res = await fetch(`${this.apiBase}/api/setup`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            monitoredApps: chosenAppIds,
            limits,
            budgets: { socialMedia: socialBudget, gaming: gamingBudget },
            activeMode: selectedMode,
            parentalEnabled
          })
        });
        if (res.ok) {
          const respData = await res.json();
          if (respData.state) this.state = respData.state;
        }
      } catch (e) {}
    } else {
      if (this.state.apps.instagram) this.state.apps.instagram.dailyLimit = igLimit;
      if (this.state.apps.pubg) this.state.apps.pubg.dailyLimit = pubgLimit;
      if (this.state.apps.tiktok) this.state.apps.tiktok.dailyLimit = tiktokLimit;
      Object.keys(this.state.apps).forEach((id) => {
        this.state.apps[id].monitored = chosenAppIds.includes(id);
      });
      this.state.budgets.socialMedia = socialBudget;
      this.state.budgets.gaming = gamingBudget;
      this.state.activeMode = selectedMode;
      this.state.parentalEnabled = parentalEnabled;
      this.saveLocalState();
    }

    this.renderAll();
    this.switchView('dashboard');
    this.showToast('Your personalized screen-time plan is now saved & active!', 'success');
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
      if (circle) circle.style.transform = 'scale(1)';
    } else {
      this.breathingActive = true;
      if (btn) btn.innerText = 'End Breathing Session';
      let phase = 0; // 0: Inhale, 1: Hold, 2: Exhale, 3: Rest

      const runPhase = () => {
        if (!this.breathingActive) return;
        if (phase === 0) {
          if (text) text.innerText = 'Inhale (4s)';
          if (circle) circle.style.transform = 'scale(1.22)';
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
      simPhoneMode.className = this.state.activeMode === 'strict' ? 'text-rose-600 font-bold' : 'text-emerald-600 font-bold';
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

        <div class="flex items-center justify-between pt-2 border-t">
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
    this.saveLocalState();
  }

  async clearNotificationLog() {
    this.state.notifications = [];
    if (this.isBackendOnline) {
      try {
        await fetch(`${this.apiBase}/api/notifications`, { method: 'DELETE' });
      } catch (e) {}
    } else {
      this.saveLocalState();
    }
    this.renderNotificationLog();
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
        <div class="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-start gap-3">
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

        this.chartInstance = new Chart(canvas, {
          type: 'doughnut',
          data: {
            labels: ['Social Media', 'Gaming', 'Other / Video', 'Remaining Budget'],
            datasets: [
              {
                data: [social, gaming, other, Math.max(0, 180 - (social + gaming + other))],
                backgroundColor: ['#06b6d4', '#f59e0b', '#6366f1', '#e2e8f0'],
                borderWidth: 2,
                borderColor: '#ffffff',
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
                  color: '#475569',
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
  // AUDIO SYNTHESIZER
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
        if (btn) btn.className = 'icon-btn text-emerald-600';
        this.playCalmChime(528);
        this.showToast('Calming audio chimes enabled', 'normal');
      } else {
        onIcon.classList.add('hidden');
        offIcon.classList.remove('hidden');
        if (btn) btn.className = 'icon-btn text-slate-400';
        this.showToast('Audio muted', 'normal');
      }
    }
    this.saveLocalState();
  }

  playCalmChime(freq = 528, type = 'sine') {
    if (!this.state.audioEnabled) return;
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      if (!this.audioCtx) this.audioCtx = new AudioContext();
      if (this.audioCtx.state === 'suspended') this.audioCtx.resume();

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
    } catch (e) {}
  }

  playLockdownAlertTone() {
    if (!this.state.audioEnabled) return;
    this.playCalmChime(396, 'triangle');
    setTimeout(() => this.playCalmChime(330, 'sine'), 160);
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
  // TOAST NOTIFICATIONS
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

// Bulletproof initiation
function initAppController() {
  if (!window.appController) {
    try {
      window.appController = new AppControllerClient();
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
