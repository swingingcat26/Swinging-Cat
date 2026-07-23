# 🐱 Swinging Cat

**Swinging Cat** is a 2D web-based endless runner game built with HTML5, CSS3, JavaScript (ES6 Modules), and integrated with the **Firebase v12** platform. The gameplay centers on a cat swinging from rope to rope to cover the maximum distance possible, achieve high scores, climb the global leaderboard, or challenge friends in real time.

---

## 🚀 Key Features

- **Pendulum Physics & Release Mechanics:** Custom system based on trigonometry and conservation of momentum to simulate swinging on ropes.
- **Variable Rope Types:**
  - *Standard Rope:* Allows stable and continuous swinging.
  - *Slippery Rope:* Releases the cat automatically after a duration of 300ms.
  - *Fragile Rope:* Breaks if the swing angle reaches or exceeds 17.2° (0.3 rad).
- **Firebase Authentication (Firebase Auth):**
  - Sign Up / Log In via Email and Password.
  - **Guest / Anonymous** mode with local record saving.
  - **Anonymous Account Upgrade:** Ability to register an account while preserving progress and UID.
  - Password recovery and permanent account deletion management (GDPR compliant).
- **Global Leaderboard (Cloud Firestore):**
  - World Top 10 leaderboard table with dynamic updates.
  - Bottom bar displaying the user's specific rank from 11th to 250th place.
  - Relative calculation of the user's percentile position compared to the entire community starting from 251st place.
- **Real-Time Multiplayer Mode:**
  - Create and join private rooms via a 6-character code with approximately 1.54 billion possible combinations (34⁶). Room codes are automatically deleted 1 hour after creation.
  - Waiting lobby for all participants.
  - Live score table synchronized via Firestore's `onSnapshot`.
  - Unified end-game screen for the multiplayer session.
- **Audio & Sound Design:**
  - Sound effects for jumping, falling, and a dynamic looping background soundtrack.
  - Separate volume controls for Music and SFX.
- **Privacy & Legal Compliance:**
  - Integration with **Iubenda** widgets for Cookie Policy and Privacy Policy.
  - Age verification controls (18+) and Terms of Service acceptance.

---

## 🛠️ Tech Stack

- **Frontend:** HTML5, Canvas 2D API, CSS3 (Flexbox, CSS Variables, Animations)
- **Logic Engine:** JavaScript (ES6 Modules)
- **Backend as a Service (BaaS):** 
  - Firebase Authentication (`12.16.0`)
  - Cloud Firestore (`12.16.0`)
  - Firebase Emulators (Firestore & UI for local development)
- **Privacy & Compliance:** Iubenda Cookie & Privacy Solution

---

## 📁 Project Structure

```text
.
├── index.html            # UI markup, popups, in-game HUD, and modals
├── style.css             # Global styles, responsive layout, and themes
├── game.js               # Main game loop, physics, user input, and Canvas rendering
├── auth.js               # Helpers for authentication and Firestore queries (Leaderboard)
├── multiplayer.js        # Multiplayer lobby management, rooms, and live synchronization
├── firebase-init.js      # Centralized initialization of Firebase Auth and Firestore apps
├── .firebaserc           # Firebase CLI project configuration (`swingingcat-87b69`)
├── firebase.json         # Local Firebase Emulators configuration
├── .gitignore            # Excludes logs, modules, dependencies, and sensitive data
├── terms_conds.html      # Terms and Conditions
├── LICENSE               # Copyright license
└── assets/               # Graphical resources (cat images, ropes) and audio (.ogg)
```

---

## ⚙️ Setup and Installation

### Prerequisites
- A local web server (e.g. **Live Server** for VS Code, `npx serve`, or `python3 -m http.server`).
- Node.js (optional, recommended if using Firebase CLI and emulators).

### 1. Clone the Repository
```bash
git clone https://github.com/tuo-username/swinging-cat.git
cd swinging-cat
```

### 2. Firebase Configuration
The application connects to the Firebase project `swingingcat-87b69`. The configuration is stored in the `firebase-init.js` file :

```javascript
const firebaseConfig = {
    apiKey: "AIzaSy...",
    authDomain: "swingingcat-87b69.firebaseapp.com",
    projectId: "swingingcat-87b69",
    storageBucket: "swingingcat-87b69.firebasestorage.app",
    messagingSenderId: "627037719328",
    appId: "1:627037719328:web:..."
};
```

### 3. Start Firebase Emulators (Optional for Local Development)
If you wish to test database operations without affecting the production project:
```bash
firebase emulators:start
```
- **Firestore Port:** `8080`
- **Emulator UI:** `http://localhost:4000`

### 4. Running the Game
Serve `index.html` through your local web server:
```bash
# Example using Python:
python3 -m http.server 8000
```
Open your browser and navigate to `http://localhost:8000`.

---

## 👥 Credits & Team
**TEAM BICTRON**
- **Development, Design & Graphic Assets:** Zen C. Novi
- **Music:** Ivan G. Novi

---

## 📜 License
 &copy; 2026 Swinging Cat. All rights reserved by **TEAM BICTRON**.
