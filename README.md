# 🐱 Swinging Cat

**Swinging Cat** è un gioco web (endless runner 2D) sviluppato in HTML5, CSS3, JavaScript (ES6 Modules) e integrato con la piattaforma **Firebase v12**. Il giocatore si basa su un gatto che dondola di corda in corda per coprire la massima distanza possibile, accumulare punteggi elevati e scalare la classifica globale o sfidare gli amici in tempo reale.

---

## 🚀 Caratteristiche Principali

- **Fisica del Pendolo & Meccanica di Rilascio:** Sistema personalizzato basato sulla trigonometria e conservazione della quantità di moto per simulare l'oscillazione sulle corde.
- **Tipi di Corde Variabili:**
  - *Corda Standard:* Consente dondolii stabili e continui.
  - *Corda Scivolosa (Slippery):* Rilascia il gatto dopo un lasso di tempo di 300ms.
  - *Corda Fragile:* Si spezza se l'angolo di oscillazione diventa è di 17.2°(0.3 rad).
- **Autenticazione Firebase (Firebase Auth):**
  - Accesso / Registrazione tramite Email e Password.
  - Modalità **Ospite / Anonima** con salvataggio locale dei record.
  - **Upgrade dell'account anonimo:** Possibilità di registrare l'account mantenendo progressi e UID.
  - Recupero password e gestione della cancellazione definitiva dell'account (GDPR compliant).
- **Classifica Globale (Cloud Firestore):**
  - Tabella Top 10 mondiale con aggiornamenti dinamici.
  - Barra in basso che segna la propria posizione dall'11° al 250° posto.
  - Calcolo relativo della propria posizione percentuale rispetto all'intera community a partirea dal 251° posto.
- **Modalità Multiplayer in Tempo Reale:**
  - Creazione e unione a stanze private tramite codice a 6 caratteri con circa 1.54 miliardi di combinazioni possibili(34⁶).
  - Lobby d'attesa per ogni giocatore.
  - Tabella dei punteggi Live sincronizzata mediante `onSnapshot` di Firestore.
  - Schermata di fine partita unificata per la sessione multiplayer.
- **Audio & Sound Design:**
  - Effetti sonori di salto, caduta e colonna sonora dinamica a loop.
  - Controlli separati per volume Musica ed Effetti SFX.
- **Conformità Privacy & Legal:**
  - Integrazione con i widget **Iubenda** per Cookie Policy e Privacy Policy.
  - Controlli sull'età (18+) e accettazione termini di servizio.

---

## 🛠️ Tecnologie Utilizzate

- **Frontend:** HTML5, Canvas 2D API, CSS3 (Flexbox, CSS Variables, Animations)
- **Logic Engine:** JavaScript (ES6 Modules)
- **Backend as a Service (BaaS):** 
  - Firebase Authentication (`12.16.0`)
  - Cloud Firestore (`12.16.0`)
  - Firebase Emulators (Firestore & UI per sviluppo locale)
- **Privacy & Compliance:** Iubenda Cookie & Privacy Solution

---

## 📁 Struttura del Progetto

```text
.
├── index.html            # Markup della UI, popup, HUD di gioco e modali
├── style.css             # Stili globali, layout responsivo e temi
├── game.js               # Ciclo di gioco principale, fisica, input e rendering Canvas
├── auth.js               # Helper per autenticazione e interrogazione Firestore (Leaderboard)
├── multiplayer.js        # Gestione della lobby multiplayer, stanze e sincronizzazione live
├── firebase-init.js      # Inizializzazione centralizzata dell'app Firebase Auth e Firestore
├── .firebaserc           # Configurazione del progetto Firebase CLI (`swingingcat-87b69`)
├── firebase.json         # Configurazione degli emulatori Firebase locali
├── .gitignore            # Esclusione log, moduli, dipendenze ed elementi sensibili
├── terms_conds.html      # Termini e condizioni
├── LICENSE               # Licenza sul copyright
└── assets/               # Risorse grafiche (immagini del gatto, corde) ed audio (.ogg)
```

---

## ⚙️ Configurazione e Installazione

### Pre-requisiti
- Un server web locale (es. **Live Server** per VS Code, `npx serve`, o `python3 -m http.server`).
- Node.js (opzionale, consigliato se si utilizzano la Firebase CLI e gli emulatori).

### 1. Clona il Repository
```bash
git clone https://github.com/tuo-username/swinging-cat.git
cd swinging-cat
```

### 2. Configurazione Firebase
L'applicazione si collega al progetto Firebase `swingingcat-87b69`. La configurazione è memorizzata nel file `firebase-init.js`:

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

### 3. Avvio degli Emulatori Firebase (Opzionale per Sviluppo Locale)
Se desideri testare il database senza influenzare il progetto in produzione:
```bash
firebase emulators:start
```
- **Firestore Port:** `8080`
- **Emulator UI:** `http://localhost:4000`

### 4. Esecuzione del Gioco
Apri `index.html` attraverso il tuo server locale:
```bash
# Esempio con Python:
python3 -m http.server 8000
```
Apri il browser all'indirizzo `http://localhost:8000`.

---

## 👥 Crediti & Team
**TEAM BICTRON**
- **Sviluppo, Design & Asset Grafici:** Zen C. Novi
- **Musica & Comparto Sonoro:** Ivan G. Novi

---

## 📜 Licenza
 &copy; 2026 Swinging Cat. Tutti i diritti sono riservati al **TEAM BICTRON**.
