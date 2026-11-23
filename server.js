/**
 * App Controller - Full Backend Server
 * Node.js Native HTTP Server with REST API & File-based Persistence
 * Port: 3000 (or process.env.PORT)
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'database.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Initial Database State
const DEFAULT_STATE = {
  user: {
    name: 'Hamza Ahmed',
    registered: true,
    planCreated: true
  },
  activeMode: 'normal', // 'normal' | 'strict' (Buzurg)
  simSpeed: 30, // 1, 10, 30, 60
  parentalEnabled: true,
  remoteDeviceLocked: false,
  childDeviceName: "Hamza's Phone",
  syncCode: 'APP-8492',
  lastSyncTime: new Date().toISOString(),

  // Monitored Apps
  apps: {
    instagram: {
      id: 'instagram',
      name: 'Instagram',
      icon: '📸',
      category: 'Social Media',
      dailyLimit: 30, // in minutes
      usedMinutes: 30, // started at limit for instant demonstration
      lockedUntil: Date.now() + (23 * 3600 + 58 * 60 + 45) * 1000, // 24h strict lock
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

  // Category Budgets
  budgets: {
    socialMedia: 45,
    gaming: 90
  },

  // Active Simulator Session
  simSession: {
    active: false,
    appId: 'instagram',
    elapsedSeconds: 0,
    lastAlertMilestone: 0
  },

  // Milestone Notification History
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

// Database helper functions
function loadDatabase() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.warn('[DB] Error reading database, re-initializing default state:', err.message);
  }
  saveDatabase(DEFAULT_STATE);
  return DEFAULT_STATE;
}

function saveDatabase(state) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(state, null, 2), 'utf8');
  } catch (err) {
    console.error('[DB] Error saving database:', err.message);
  }
}

// In-memory state cache synced with file
let db = loadDatabase();

// Clean up expired 24h locks automatically on the server
function auditLockdowns() {
  const now = Date.now();
  let changed = false;
  if (db.apps) {
    Object.values(db.apps).forEach((app) => {
      if (app.lockedUntil && app.lockedUntil <= now) {
        app.lockedUntil = null;
        changed = true;
        addNotification(app.name, 'unlocked', '24-Hour Quarantine Ended', `${app.name} has unlocked automatically after 24 hours.`);
      }
    });
  }
  if (changed) saveDatabase(db);
}
setInterval(auditLockdowns, 5000);

function addNotification(appName, type, title, msg) {
  const now = new Date();
  const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  db.notifications.unshift({
    id: Date.now(),
    time: timeStr,
    app: appName,
    type: type,
    title: title,
    msg: msg
  });
  if (db.notifications.length > 30) {
    db.notifications.pop();
  }
}

// MIME Types for Static File Serving
const MIME_TYPES = {
  '.html': 'text/html; charset=UTF-8',
  '.css': 'text/css; charset=UTF-8',
  '.js': 'application/javascript; charset=UTF-8',
  '.json': 'application/json; charset=UTF-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

// HTTP Request Parser helper
function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (e) {
        resolve({});
      }
    });
    req.on('error', reject);
  });
}

function sendJSON(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  });
  res.end(JSON.stringify(data));
}

// Create Native HTTP Server
const server = http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  const method = req.method;

  // Handle CORS preflight
  if (method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    });
    return res.end();
  }

  // ==========================================
  // BACKEND REST API ROUTES
  // ==========================================

  // GET /api/health
  if (pathname === '/api/health' && method === 'GET') {
    return sendJSON(res, 200, {
      status: 'online',
      message: 'App Controller Backend Server running smoothly',
      time: new Date().toISOString()
    });
  }

  // GET /api/state
  if (pathname === '/api/state' && method === 'GET') {
    auditLockdowns();
    return sendJSON(res, 200, db);
  }

  // POST /api/setup (User Registration & Initial Setup Wizard)
  if (pathname === '/api/setup' && method === 'POST') {
    const payload = await parseBody(req);
    const { monitoredApps, limits, budgets, activeMode, parentalEnabled } = payload;

    if (limits) {
      Object.keys(limits).forEach((appId) => {
        if (db.apps[appId]) {
          db.apps[appId].dailyLimit = parseInt(limits[appId], 10) || db.apps[appId].dailyLimit;
        }
      });
    }

    if (monitoredApps && Array.isArray(monitoredApps)) {
      Object.keys(db.apps).forEach((appId) => {
        db.apps[appId].monitored = monitoredApps.includes(appId);
      });
    }

    if (budgets) {
      if (budgets.socialMedia) db.budgets.socialMedia = parseInt(budgets.socialMedia, 10);
      if (budgets.gaming) db.budgets.gaming = parseInt(budgets.gaming, 10);
    }

    if (activeMode) db.activeMode = activeMode;
    if (typeof parentalEnabled === 'boolean') db.parentalEnabled = parentalEnabled;

    db.user.planCreated = true;
    db.lastSyncTime = new Date().toISOString();
    saveDatabase(db);

    addNotification('Plan Setup', 'setup', 'Screen Time Plan Activated', 'Your personalized daily screen-time plan has been saved to the backend.');

    return sendJSON(res, 200, {
      success: true,
      message: 'Screen time plan successfully saved and activated on the server.',
      state: db
    });
  }

  // POST /api/mode (Switch Normal Mode vs Strict Mode)
  if (pathname === '/api/mode' && method === 'POST') {
    const payload = await parseBody(req);
    const { mode } = payload;
    if (mode === 'normal' || mode === 'strict') {
      db.activeMode = mode;
      saveDatabase(db);
      addNotification('Mode Switch', 'mode', `Switched to ${mode === 'strict' ? 'Strict (Buzurg) Mode' : 'Normal Mode'}`, `Active system mode changed.`);
      return sendJSON(res, 200, { success: true, mode: db.activeMode });
    }
    return sendJSON(res, 400, { error: 'Invalid mode specified. Must be "normal" or "strict".' });
  }

  // POST /api/session/start
  if (pathname === '/api/session/start' && method === 'POST') {
    const payload = await parseBody(req);
    const { appId } = payload;
    const app = db.apps[appId];

    if (!app) {
      return sendJSON(res, 404, { error: 'App not found' });
    }

    // Check if app is quarantined under 24h strict lock or parental lock
    const now = Date.now();
    if (app.isParentLocked || (app.lockedUntil && app.lockedUntil > now)) {
      return sendJSON(res, 403, {
        error: 'Locked',
        message: `${app.name} is currently locked! Cannot start session.`,
        lockedUntil: app.lockedUntil
      });
    }

    db.simSession.active = true;
    db.simSession.appId = appId;
    db.simSession.elapsedSeconds = 0;
    db.simSession.lastAlertMilestone = 0;
    saveDatabase(db);

    return sendJSON(res, 200, { success: true, simSession: db.simSession });
  }

  // POST /api/session/tick (Advances time, checks 5-min alert & 24h lock)
  if (pathname === '/api/session/tick' && method === 'POST') {
    const payload = await parseBody(req);
    const speed = parseInt(payload.speed, 10) || db.simSpeed || 30;

    if (!db.simSession.active) {
      return sendJSON(res, 200, { active: false, state: db });
    }

    const app = db.apps[db.simSession.appId];
    if (!app) {
      db.simSession.active = false;
      return sendJSON(res, 400, { error: 'Invalid session app' });
    }

    db.simSession.elapsedSeconds += speed;
    const elapsedMinutes = Math.floor(db.simSession.elapsedSeconds / 60);

    let eventTriggered = null;

    // Check 5-minute milestone notifications (5m, 10m, 15m, 20m, 25m)
    const currentMilestone = Math.floor(elapsedMinutes / 5) * 5;
    if (currentMilestone > 0 && currentMilestone > db.simSession.lastAlertMilestone && currentMilestone < app.dailyLimit) {
      db.simSession.lastAlertMilestone = currentMilestone;
      eventTriggered = {
        type: '5_MIN_ALERT',
        milestone: currentMilestone,
        message: `You have spent ${currentMilestone} minutes on ${app.name}. Stay mindful of your screen time!`
      };
      addNotification(app.name, 'milestone', `${currentMilestone}-Minute Milestone`, eventTriggered.message);
    }

    // Check daily limit reached
    if (elapsedMinutes >= app.dailyLimit) {
      db.simSession.active = false;
      app.usedMinutes = app.dailyLimit;

      if (db.activeMode === 'strict') {
        // Enforce 24-hour quarantine lockout
        const lockDurationMs = 24 * 60 * 60 * 1000;
        app.lockedUntil = Date.now() + lockDurationMs;

        eventTriggered = {
          type: 'STRICT_LOCKDOWN',
          appId: app.id,
          appName: app.name,
          lockedUntil: app.lockedUntil,
          message: `${app.name} reached its ${app.dailyLimit}-minute limit. Application is locked for 24 hours to enforce healthy habits.`
        };
        addNotification(app.name, 'strict-lock', `Strict Mode: ${app.name} Locked (24h)`, eventTriggered.message);
      } else {
        eventTriggered = {
          type: 'NORMAL_LIMIT_REACHED',
          appId: app.id,
          appName: app.name,
          message: `Daily limit of ${app.dailyLimit} minutes reached for ${app.name}. Normal Mode keeps you aware without locking.`
        };
        addNotification(app.name, 'limit', `Limit Reached (${app.name})`, eventTriggered.message);
      }
    }

    saveDatabase(db);
    return sendJSON(res, 200, {
      simSession: db.simSession,
      event: eventTriggered,
      state: db
    });
  }

  // POST /api/session/stop
  if (pathname === '/api/session/stop' && method === 'POST') {
    db.simSession.active = false;
    saveDatabase(db);
    return sendJSON(res, 200, { success: true, message: 'Session stopped' });
  }

  // POST /api/parent/lock-app
  if (pathname === '/api/parent/lock-app' && method === 'POST') {
    const payload = await parseBody(req);
    const { appId } = payload;
    if (db.apps[appId]) {
      db.apps[appId].isParentLocked = true;
      db.lastSyncTime = new Date().toISOString();
      saveDatabase(db);
      addNotification(db.apps[appId].name, 'parent-lock', 'Remote Lock Enforced', `Parent remotely locked ${db.apps[appId].name} on connected device.`);
      return sendJSON(res, 200, { success: true, app: db.apps[appId] });
    }
    return sendJSON(res, 404, { error: 'App not found' });
  }

  // POST /api/parent/unlock-app
  if (pathname === '/api/parent/unlock-app' && method === 'POST') {
    const payload = await parseBody(req);
    const { appId } = payload;
    if (db.apps[appId]) {
      db.apps[appId].isParentLocked = false;
      db.apps[appId].lockedUntil = null;
      db.lastSyncTime = new Date().toISOString();
      saveDatabase(db);
      addNotification(db.apps[appId].name, 'parent-unlock', 'Remote Unlock Granted', `Parent remotely unlocked ${db.apps[appId].name}.`);
      return sendJSON(res, 200, { success: true, app: db.apps[appId] });
    }
    return sendJSON(res, 404, { error: 'App not found' });
  }

  // POST /api/parent/lock-device
  if (pathname === '/api/parent/lock-device' && method === 'POST') {
    const payload = await parseBody(req);
    const lock = typeof payload.locked === 'boolean' ? payload.locked : !db.remoteDeviceLocked;
    db.remoteDeviceLocked = lock;
    db.lastSyncTime = new Date().toISOString();
    saveDatabase(db);

    const title = lock ? 'Child Device Remotely Paused' : 'Child Device Remotely Resumed';
    const msg = lock ? 'Parent has paused screen access on the connected child device.' : 'Device screen access restored.';
    addNotification('Parental Hub', 'device-lock', title, msg);

    return sendJSON(res, 200, { success: true, remoteDeviceLocked: db.remoteDeviceLocked });
  }

  // POST /api/reset-demo (Clears all 24h locks and resets test data)
  if (pathname === '/api/reset-demo' && method === 'POST') {
    Object.values(db.apps).forEach((app) => {
      app.lockedUntil = null;
      app.isParentLocked = false;
      app.usedMinutes = Math.min(app.usedMinutes, app.dailyLimit - 5);
    });
    db.remoteDeviceLocked = false;
    db.simSession.active = false;
    saveDatabase(db);
    addNotification('System', 'demo-reset', 'Demo Restrictions Cleared', 'All 24-hour quarantine locks and parental locks have been reset for testing.');
    return sendJSON(res, 200, { success: true, state: db });
  }

  // GET /api/notifications
  if (pathname === '/api/notifications' && method === 'GET') {
    return sendJSON(res, 200, db.notifications);
  }

  // DELETE /api/notifications
  if (pathname === '/api/notifications' && method === 'DELETE') {
    db.notifications = [];
    saveDatabase(db);
    return sendJSON(res, 200, { success: true, message: 'Notifications cleared' });
  }

  // ==========================================
  // STATIC FILE SERVING
  // ==========================================
  let filePath = path.join(__dirname, pathname === '/' ? 'index.html' : pathname);
  const ext = path.extname(filePath).toLowerCase();

  // If path doesn't exist, try falling back to index.html for SPA routes
  if (!fs.existsSync(filePath)) {
    filePath = path.join(__dirname, 'index.html');
  }

  try {
    const fileContent = fs.readFileSync(filePath);
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(fileContent);
  } catch (err) {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('404 Not Found');
  }
});

server.listen(PORT, () => {
  console.log(`\n=======================================================`);
  console.log(`🌿 App Controller - Digital Well-Being Platform`);
  console.log(`🌐 Backend Server & Frontend live at: http://localhost:${PORT}`);
  console.log(`📦 Database persisted at: ${DB_FILE}`);
  console.log(`=======================================================\n`);
});

module.exports = server;
