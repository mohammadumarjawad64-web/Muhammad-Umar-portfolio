# App Controller – Digital Well-Being & Screen Time Management

> A calm, comforting, and intuitive platform designed to help users manage screen time, overcome gaming and social media distractions, and build mindful digital balance.

---

## 🌟 Core Features

### 1. User Registration & Initial Setup (Personalized Plan Wizard)
Step-by-step onboarding wizard that tailors a plan to your personal goals:
1. **Regular App Usage:** Select apps you use the most (Instagram, PUBG Mobile, TikTok, WhatsApp, YouTube, Free Fire).
2. **Individual App Time Limits:** Set daily target minutes using intuitive sliders.
3. **Category Budgets:** Allocate overall daily caps for **Social Media** (e.g. 45 min) and **Gaming** (e.g. 90 min).
4. **Choose Control Mode:** Decide between **Normal Mode** (gentle awareness) or **Strict Buzurg Mode** (24h lock).
5. **Parental Controls & Confirmation:** Enable device pairing and activate your custom well-being plan.

---

### 2. Two Main Operational Modes

#### A. Normal Mode (Mindful Awareness)
- Sets individual daily targets (e.g., 30 minutes for Instagram).
- **Periodic 5-Minute Milestone Notifications:** Alerts chime at 5m, 10m, 15m, 20m, 25m, and 30m.
- Keeps users aware of their phone usage without forcefully locking applications.

#### B. Strict Mode (Buzurg Mode – High Discipline)
- Designed for users seeking deep study focus or overcoming addiction.
- Sends 5-minute milestone notifications as the clock counts down.
- **Automatic 24-Hour Quarantine Lock:** Once the selected time limit is reached, the application is **automatically locked for 24 hours**.
- The user cannot reopen or access the restricted app during the 24-hour lockdown.
- Automatically unlocks after exactly 24 hours (with a live countdown timer).

---

### 3. Parental Remote Control Hub
- **Device Pairing:** Link parent and child phones with a secure sync code (`APP-8492`).
- **Live Telemetry:** Monitor real-time running apps, daily elapsed minutes, and battery status.
- **Remote App Lockout:** Parents can lock or unlock specific apps (Instagram, PUBG, TikTok) with a single click.
- **Remote Full Device Lock:** Option to lock the child's entire screen during bedtime or study hours.
- **Cross-Tab Live Sync:** Uses the modern `BroadcastChannel` API so opening two tabs simulates real-time parent and child interaction.

---

### 4. Calm & Comforting Design System
- **Soothing Color Palette:** Gentle sage green (`#52b788`), serene teal, chamomile, and warm twilight tones.
- **Theme Switcher:** 1-click toggle between **Peaceful Twilight (Dark)** and **Calm Meadow (Light)**.
- **Gentle Audio Chimes:** Built-in Web Audio API soft harmonic bells (528Hz healing Solfeggio tones) for milestone alerts.
- **Mindful Pause Center:** Includes a guided **Box Breathing Exercise (4-4-4-4)** to ground users when feeling the urge to doomscroll.
- **Rapid Demo Speed:** Adjust demo simulation speed from **1x (Real Time)** to **10x**, **30x**, or **60x (1 second = 1 minute)** to test 5-minute alerts and 24-hour locks instantly.

---

## 🚀 How to Run

1. Open `app-controller/index.html` directly in any modern web browser (Google Chrome, Microsoft Edge, Safari, Firefox).
2. No complex build tools or servers needed — works completely offline and standalone!
