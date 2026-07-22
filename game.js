import { getPersonalRecord, registerWithEmail, loginWithEmail, signInAnonymously, getGlobalLeaderboard, recoverPassword, upgradeAnonymousAccount } from './auth.js';
import { getAuth, onAuthStateChanged, signOut, deleteUser } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, updateDoc, onSnapshot, deleteDoc, serverTimestamp, deleteField } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";
import { initMultiplayer, deleteRoom, leaveRoomCleanup } from './multiplayer.js';

const auth = getAuth();
const authPopup = document.getElementById('authPopup');
const profileMenu = document.getElementById('profileMenu');
const userProfile = document.getElementById('userProfile');
const db = getFirestore();
let lastClickTime = Date.now();

const savedEmail = window.localStorage.getItem('emailForSignIn');
if (savedEmail) {
    completeMagicLinkLogin(savedEmail);
}

// Verifica se siamo in un loop di login senza codice valido
const emailSaved = window.localStorage.getItem('emailForSignIn');
if (emailSaved && !window.location.href.includes('apiKey=')) {
    console.warn("Flag di login trovato senza parametri URL: pulizia forzata.");
    window.localStorage.removeItem('emailForSignIn');
}

// Funzione helper per sincronizzare e aggiornare la UI
async function loadAndSyncHighScore(user) {
    const dbRecord = await getPersonalRecord(user.uid);
    // Il database è la fonte della verità assoluta
    highScore = dbRecord;
    localStorage.setItem('highScore2', highScore);
}


onAuthStateChanged(auth, async (user) => {
    if (user) {
        authPopup.classList.add('hidden');
        authPopup.style.display = 'none';

        // 🟢 USA L'ID UTENTE PER LA CHIAVE LOCALE
        const localKey = `highScore2_${user.uid}`;
        const dbRecord = await getPersonalRecord(user.uid);
        const localRecord = parseInt(localStorage.getItem(localKey)) || 0;

        // Calcola il massimo tra il DB e il record locale di QUESTO specifico utente
        highScore = Math.max(dbRecord, localRecord);
        localStorage.setItem(localKey, highScore);

        // Se il locale è più alto, sincronizza il DB
        if (localRecord > dbRecord && auth.currentUser && !auth.currentUser.isAnonymous) {
        const userRef = doc(db, "users", user.uid);
            try {
                // Usiamo setDoc con merge:true invece di updateDoc per gestire l'eventuale assenza del documento
                await setDoc(userRef, {
                    score: highScore,
                    lastUpdateAt: serverTimestamp()
                }, { merge: true });
            } catch (error) {
                console.error("Errore durante la sincronizzazione iniziale dell'utente:", error.message);
            }
    } else {
        authPopup.style.display = 'flex';
    }
}
});

// ====== GESTIONE UI E STATO DI GIOCO (Mappatura MainActivity.kt) ======
const mainMenu = document.getElementById('mainMenu');
const gameContainer = document.getElementById('gameContainer');
const buttonGame2 = document.getElementById('buttonGame2');
const pauseButton = document.getElementById('pauseButton');
const resumeButton = document.getElementById('resumeButton');
const soundOn = document.getElementById('soundOn');
const soundOff = document.getElementById('soundOff');
const exitButton = document.getElementById('exitButton');
const tutorialButton = document.getElementById('tutorialButton');
const tutorialPanel = document.getElementById('tutorialPanel');
const gameOverPanel = document.getElementById('gameOverPanel');
const finalScoreText = document.getElementById('finalScore');
const uiElements = {
    mainMenu: document.getElementById('mainMenu'),
    multiplayerBtn: document.getElementById('multiplayerBtn'),
    multiplayerLobby: document.getElementById('multiplayerLobby'),
    backToMenuBtn: document.getElementById('backToMenuBtn'),
    backToLobbyBtn: document.getElementById('backToLobbyBtn'),
    createRoomBtn: document.getElementById('createRoomBtn'),
    roomCodeInput: document.getElementById('roomCodeInput'),
    joinRoomBtn: document.getElementById('joinRoomBtn'),
    roomWaitingScreen: document.getElementById('roomWaitingScreen'),
    displayRoomCode: document.getElementById('displayRoomCode'),
    playersList: document.getElementById('playersList'),
    readyBtn: document.getElementById('readyBtn'),
    startGameBtn: document.getElementById('startGameBtn')
};

// Riferimenti agli elementi del DOM
const leaderboardPopup = document.getElementById('leaderboardPopup');
const leaderboardContent = document.getElementById('leaderboardContent');
const closeLeaderboardBtn = document.getElementById('closeLeaderboardBtn');
const settingsPanel = document.getElementById('settingsPanel');
const settingsBtn = document.getElementById('settingsBtn');
const musicVolume = document.getElementById('musicVolume');
const sfxVolume = document.getElementById('sfxVolume');
const userEmailDisplay = document.getElementById('userEmailDisplay');

let isMatchOver = false;

// Chiudi il popup quando si clicca la X
closeLeaderboardBtn.addEventListener('click', () => {
    leaderboardPopup.classList.add('hidden');
});

// Gestione click sul pulsante "Classifica Globale"
document.getElementById('ranking2').addEventListener('click', async () => {
    if (!auth.currentUser || auth.currentUser.isAnonymous) {
        alert("La classifica globale è disponibile solo per gli utenti registrati.");
        return;
    }

    leaderboardPopup.style.zIndex = "10000";
    leaderboardContent.innerHTML = '<p style="text-align: center; color: #333;">Caricamento in corso...</p>';
    leaderboardPopup.classList.remove('hidden');

    try {
        // 🟢 Qui riceviamo l'oggetto completo
        const { top10, myPos, totalUsers, myScore } = await getGlobalLeaderboard();

        if (!top10 || top10.length === 0) {
            leaderboardContent.innerHTML = '<p style="text-align: center; color: #333;">Non hai ancora giocato nessuna partita. Fai il tuo primo record!</p>';
            return;
        }

        let htmlClassifica = '<ul style="list-style: none; padding: 0; margin: 0; color: #333;">';

        // 🟢 Usiamo top10 per il ciclo
        top10.forEach((score, index) => {
            let medal = (index === 0) ? '🥇 ' : (index === 1) ? '🥈 ' : (index === 2) ? '🥉 ' : '';
            htmlClassifica += `
                <li style="display: flex; justify-content: space-between; padding: 12px 6px; border-bottom: 1px solid #f1f5f9;">
                    <span style="font-weight: 600;">${medal}${index + 1}. ${score.displayName || "Sconosciuto"}</span>
                    <span style="font-weight: 700; color: #2575fc;">${score.score} pt</span>
                </li>`;
        });
        htmlClassifica += '</ul>';

        // 🟢 AGGIUNTA SBARRA IN FONDO
        if (myPos) {
            let footerText = (myPos <= 250)
                ? `La tua posizione: ${myPos}°  <span style="font-weight: 700; color: #2575fc; margin-left: 10px;">${myScore} pt</span>`
                : `Sei migliore del ${(((totalUsers - myPos) / totalUsers) * 100).toFixed(1)}% dei giocatori`;

            htmlClassifica += `
                <div style="border-top: 2px solid #e2e8f0; padding: 15px; margin-top: 10px; font-weight: bold; text-align: center; background: #f8fafc; border-radius: 0 0 8px 8px;">
                    ${footerText}
                </div>`;
        }

        leaderboardContent.innerHTML = htmlClassifica;

        console.log("Total Users:", totalUsers)

    } catch (error) {
        console.error("Errore: ", error);
        leaderboardContent.innerHTML = '<p style="color: red; text-align: center;">Errore nel caricamento.</p>';
    }
});

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

let w = window.innerWidth;
let h = window.innerHeight;
canvas.width = w;
canvas.height = h;

window.addEventListener('resize', () => {
    w = window.innerWidth;
    h = window.innerHeight;
    canvas.width = w;
    canvas.height = h;
});

// ====== CONFIGURAZIONE ASSET (Immagini e Audio con Fallback Automatici) ======
// Spazio predisposto per i tuoi file. Se non presenti, il gioco userà forme geometriche colorate senza crashare.
const images = {
    catAttached: new Image(),
    slippingCatAttached: new Image(),
    catFlying: new Image(),
    catFalling: new Image(),
    rope: new Image(),
    ropeSlippery: new Image()
};

images.catAttached.src = 'assets/cat_on_rope.png';
images.slippingCatAttached.src = 'assets/cat_on_slippery_rope.png';
images.catFlying.src = 'assets/flying_cat.png';
images.catFalling.src = 'assets/falling_cat.png';
images.rope.src = 'assets/rope.png';
images.ropeSlippery.src = 'assets/slippery_rope.png';

const sounds = {
    swing: new Audio('assets/jump_cat_sound.ogg'),
    falling: new Audio('assets/fall_cat_sound.ogg'),
    bgm1: new Audio('assets/backsound_002.ogg'),
    bgm2: new Audio('assets/backsound_002.ogg')

};

sounds.swing.volume = 0.2;      // Lascia il salto del gatto un po' più alto (80%)
sounds.falling.volume = 0.4;    // Lascia la caduta all'80%
sounds.bgm2.volume = 0.5;

// Configurazione loop BGM (Backsound 1 -> Backsound 2 loop come da GameView2.kt)
let currentBgm = sounds.bgm1;
function setupAudioLoop() {
    sounds.bgm1.addEventListener('ended', () => {
        if (isMusicPlaying && gameState === 'PLAYING') {
            currentBgm = sounds.bgm2;
            currentBgm.play().catch(e => console.log("Audio play blocked"));
        }
    });
    sounds.bgm2.addEventListener('ended', () => {
        if (isMusicPlaying && gameState === 'PLAYING') {
            currentBgm = sounds.bgm1;
            currentBgm.play().catch(e => console.log("Audio play blocked"));
        }
    });
}
setupAudioLoop();

let isMusicPlaying = true;
let hasPlayedBefore = localStorage.getItem('hasPlayedBefore') === 'true';

// ====== LOGICA CORE DEL GIOCO (Mappatura GameView2.kt) ======
let gameState = 'NOT_STARTED'; // NOT_STARTED, PLAYING, PAUSED, GAME_OVER
let playerState = 'FLYING';    // ATTACHED, FLYING, STOPPED
let isCatFalling = false;
let score = 0;
let highScore = parseInt(localStorage.getItem('highScore2')) || 0;
let frame = 0;
let graceFramesAfterReset = 0;
let showTutorialPanel = false;

// Fisica del Giocatore
let playerX = 150;
let playerY = 100;
const playerWidth = 60;
const playerHeight = 100;
let velocityX = 0;
let velocityY = 0;
const gravity = 0.8;
let cameraOffsetX = 0;
const cameraFollowSpeed = 0.35;

// Fisica del Pendolo / Corda
let anchorX = 0;
let anchorY = 0;
let attachedRope = null;
let ropeLength = 500;
let angle = Math.PI / 4;
let angularVelocity = 0.0;
let isSlipping = false;
let lastScoredRopeX = 0;
let ropes = [];

function checkPrivacy() {
    const privacyCheck = document.getElementById('privacyCheck');
    if (!privacyCheck.checked) {
        alert("Devi accettare l'informativa sulla privacy per continuare.");
        return false;
    }
    return true;
}

// Funzioni Audio Ausiliarie
function startMusic() {
    // RIMOSSO: currentBgm.load(); perché rompe il contesto del gesto dell'utente nei browser mobile

    console.log("Stato della traccia bgm1:", {
        src: currentBgm.src,
        readyState: currentBgm.readyState, // 0 = nessun dato, 4 = pronto
        error: currentBgm.error ? currentBgm.error.code : "Nessun errore",
        paused: currentBgm.paused
    });

    // Assicuriamoci che riparta da capo
    currentBgm.currentTime = 0;

    // Tenta la riproduzione e gestisci il fallimento
    const playPromise = currentBgm.play();

    if (playPromise !== undefined) {
        playPromise.then(_ => {
        }).catch(error => {
            console.error("Autoplay bloccato. Attendere interazione utente.", error);
        });
    }
}
function pauseMusic() { currentBgm.pause(); }
function resumeMusic() {
    // Controlla se la musica dovrebbe essere in riproduzione secondo le preferenze utente
    if (isMusicPlaying && gameState === 'PLAYING') {
        currentBgm.play().catch(e => { });
        soundOn.classList.remove('hidden');
        soundOff.classList.add('hidden');
    } else {
        // Se isMusicPlaying è false, forza il tasto su "Muto"
        soundOn.classList.add('hidden');
        soundOff.classList.remove('hidden');
    }
}
function stopAndReleaseMusic() {
    sounds.bgm1.pause(); sounds.bgm1.currentTime = 0;
    sounds.bgm2.pause(); sounds.bgm2.currentTime = 0;
    currentBgm = sounds.bgm1;
}
function playSound(sound) {
    if (isMusicPlaying) {
        sound.currentTime = 0;
        sound.play().catch(e => { });
    }
}

const cookieDiv = document.getElementById('cookiePrivacyLinks');

// Inizializzazione cicli e flussi di gioco
buttonGame2.addEventListener('click', () => {
    sounds.bgm1.play().catch(e => { });
    sounds.bgm1.pause();
    sounds.bgm1.currentTime = 0;

    sounds.bgm2.play().catch(e => { });
    sounds.bgm2.pause();
    sounds.bgm2.currentTime = 0;

    mainMenu.classList.add('hidden');
    settingsPanel.classList.add('hidden');
    settingsBtn.classList.add('hidden');
    gameContainer.classList.remove('hidden');
    cookieDiv.classList.add('hide-ui');



    // Forza dimensioni canvas all'attivazione
    w = window.innerWidth;
    h = window.innerHeight;
    canvas.width = w;
    canvas.height = h;

    if (!hasPlayedBefore) {
        showTutorialPanel = true;
        tutorialPanel.classList.remove('hidden');
        gameState = 'PAUSED';
    } else {
        resetGame();
        gameState = 'PLAYING';
        startMusic();
    }
    // Avvia stabilmente il ciclo di disegno e fisica
    requestAnimationFrame(gameLoop);
});

exitButton.addEventListener('click', async (e) => {
    e.stopPropagation();
    const roomIdToLeave = currentRoomId;
    // 1. Disiscrizione immediata da tutti i listener attivi di Firebase
    if (unsubscribeGameSession) {
        unsubscribeGameSession();
        unsubscribeGameSession = null;
    }
    leaveRoomCleanup(); // Ferma il listener di multiplayer.js e resetta l'ID stanza lì
     currentRoomId = null;
    if (roomIdToLeave && auth.currentUser) {
        const roomRef = doc(db, "rooms", roomIdToLeave);
        try {
            const roomSnap = await getDoc(roomRef);
            if (roomSnap.exists()) {
                const roomData = roomSnap.data();
                if (roomData.creator === auth.currentUser.uid) {
                    await deleteRoom(roomIdToLeave);
                } else {
                    await updateDoc(roomRef, {
                        [`players.${auth.currentUser.uid}`]: deleteField()
                    });
                }
            }
        } catch (err) {
            console.log("Errore durante l'uscita dalla stanza:", err);
        }
    }

    // 3. Pulizia totale della UI e degli stati di gioco
    isMatchOver = false;
    isGameRunning = false;
    const scoreboard = document.getElementById('liveScoreboard');
    const returnLobbyBtn = document.getElementById('returnLobbyBtn');
    gameContainer.classList.add('hidden');
    mainMenu.classList.remove('hidden');
    cookieDiv.classList.remove('hide-ui');
    settingsBtn.classList.remove('hidden');
    returnLobbyBtn.classList.add('hidden');
    scoreboard.classList.add('hidden');
    scoreboard.classList.remove('center-zoomed');
    stopGameLoop();
    stopAndReleaseMusic();
    gameState = 'NOT_STARTED';
});

pauseButton.addEventListener('click', (e) => {
    e.stopPropagation();
    if (gameState === 'PLAYING') {
        gameState = 'PAUSED';
        pauseMusic();
        pauseButton.classList.add('hidden');
        resumeButton.classList.remove('hidden');
    }
});

resumeButton.addEventListener('click', (e) => {
    e.stopPropagation();
    if (showTutorialPanel) {
        closeTutorialAndResume();
    } else {
        gameState = 'PLAYING';
        resumeMusic();
    }
    resumeButton.classList.add('hidden');
    pauseButton.classList.remove('hidden');
});

soundOn.addEventListener('click', (e) => {
    e.stopPropagation();
    soundOn.classList.add('hidden');
    soundOff.classList.remove('hidden');
    isMusicPlaying = false;
    pauseMusic();
});

soundOff.addEventListener('click', (e) => {
    e.stopPropagation();
    soundOff.classList.add('hidden');
    soundOn.classList.remove('hidden');
    isMusicPlaying = true;
    resumeMusic();
});

tutorialButton.addEventListener('click', (e) => {
    e.stopPropagation();
    if (gameState === 'PLAYING' || gameState === 'PAUSED') {
        gameState = 'PAUSED';
        pauseMusic();
        showTutorialPanel = true;
        tutorialPanel.classList.remove('hidden');
        pauseButton.classList.add('hidden');
        resumeButton.classList.remove('hidden');
    }
});


// Nel game.js, sostituisci il listener del vecchio MagicLinkBtn
// In game.js
document.getElementById('magicLinkBtn').addEventListener('click', async () => {
    if (!checkPrivacy()) return;
    const isOver18 = document.getElementById('ageCheck').checked;
    const email = document.getElementById('emailInput').value;
    const password = document.getElementById('passwordInput').value;
    const displayName = document.getElementById('nameInput').value

    if (auth.currentUser) {
        await signOut(auth);
    }

    // 1. FLUSSO MINORI: Accesso anonimo esclusivo
    if (!isOver18) {
        try {
            await signInAnonymously(auth);
            document.getElementById('authPopup').style.display = 'none';
        } catch (error) {
            alert("Errore accesso anonimo: " + error.message);
        }
        return; // <--- FONDAMENTALE: Interrompe qui, non esegue il resto
    }

    try {
        await loginWithEmail(email, password);
        alert("Bentornato!");
    } catch (error) {
        if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
            try {
                // Passiamo il nome alla funzione di registrazione
                await registerWithEmail(email, password, displayName);
                alert("Account creato!");
            } catch (regError) {
                alert("Errore: " + regError.message);
            }
        }
    }
});

// Gestione Ospite
// In game.js - dentro il listener di guestBtn
document.getElementById('guestBtn').addEventListener('click', async () => {
    if (!checkPrivacy()) return;
    try {
        // Esegue lo stesso flusso di "signInAnonymously" usato per i minori
        await signInAnonymously(auth);

        localStorage.setItem('playingAsGuest', 'true');
        authPopup.style.display = 'none';

        alert("Stai giocando in modalità anonima. Le tue partite saranno salvate solo in locale.");
    } catch (error) {
        alert("Errore accesso ospite: " + error.message);
    }
});



document.getElementById('joinRoomBtn').addEventListener('click', () => {
    const code = document.getElementById('roomCodeInput').value;
    joinGame(code);
});

// In game.js
document.getElementById('returnLobbyBtn').addEventListener('click', async () => {
    if (!currentRoomId || !auth.currentUser) return;

    // 🟢 B: Nascondi SUBITO la tabella prima di toccare il database
    document.getElementById('liveScoreboard').classList.add('hidden');

    isGameRunning = false;
    isMatchOver = false;

    stopGameLoop()

    const roomRef = doc(db, "rooms", currentRoomId);

    // 1. Reset dello stato del giocatore corrente nel DB
    await updateDoc(roomRef, {
        [`players.${auth.currentUser.uid}.isGameOver`]: false,
        [`players.${auth.currentUser.uid}.ready`]: false, // Forza lo stato "Non Pronto"
        [`players.${auth.currentUser.uid}.score`]: 0,
        status: 'WAITING' // Riporta la stanza in attesa
    });

    // 2. Pulizia UI locale
    document.getElementById('liveScoreboard').classList.remove('center-zoomed');
    document.getElementById('liveScoreboard').classList.add('hidden');
    document.getElementById('returnLobbyBtn').classList.add('hidden');
    document.getElementById('gameContainer').classList.add('hidden');
    document.getElementById('roomWaitingScreen').classList.remove('hidden');
    cookieDiv.classList.remove('hide-ui');
    settingsBtn.classList.remove('hidden');

    // 3. Reset dei bottoni locali
    const readyBtn = document.getElementById('readyBtn');
    readyBtn.innerText = "Non Pronto";
    readyBtn.style.backgroundColor = "#e74c3c";

    // 4. Reset stato di gioco
    gameState = 'NOT_STARTED';
});

settingsBtn.addEventListener('click', () => {
    // 🟢 Aggiorna l'email prima di mostrare il pannello
    const upgradeBtn = document.getElementById('btnUpgradeAccount');
    const user = auth.currentUser;
    if (user && !user.isAnonymous) {
        userEmailDisplay.innerText = "Account: " + user.email;
        upgradeBtn.classList.add('hidden');
    } else if (user && user.isAnonymous) {
        userEmailDisplay.innerText = "Account: Ospite_ " + auth.currentUser.uid.substring(0, 4);
        upgradeBtn.classList.remove('hidden');
    } else {
        userEmailDisplay.innerText = "Non loggato";
        upgradeBtn.classList.add('hidden');
    }

    settingsPanel.classList.toggle('hidden');
});;

document.getElementById('btnUpgradeAccount').addEventListener('click', async () => {
    const isOver18 = confirm("Per convertire il tuo account anonimo in un account registrato e salvare i record nel cloud, devi avere almeno 18 anni. Cliccando 'OK' confermi di essere maggiorenne?");
    
    if (!isOver18) {
        alert("Siamo spiacenti, la registrazione è riservata ai soli utenti maggiorenni.");
        return; // Interrompe qui, senza eseguire nulla
    }
    // Apri un mini-form o usa degli input già presenti
    const email = prompt("Inserisci la tua email:");
    const password = prompt("Inserisci una password:");
    const name = prompt("Scegli il tuo nome:");

    if (email && password && name) {
        try {
            await upgradeAnonymousAccount(email, password, name);
            alert("Account registrato con successo! I tuoi record sono ora al sicuro sul cloud.");
            location.reload(); // Ricarica per pulire lo stato da ospite
        } catch (error) {
            alert("Errore: " + error.message);
        }
    }
});

// 3. Regolazione Volume
musicVolume.addEventListener('input', (e) => {
    sounds.bgm1.volume = e.target.value;
    sounds.bgm2.volume = e.target.value;
});

sfxVolume.addEventListener('input', (e) => {
    sounds.swing.volume = e.target.value;
    sounds.falling.volume = e.target.value;
});

// 4. Logout e Cambio Account dal pannello
document.getElementById('btnLogoutSettings').addEventListener('click', async () => {
    await signOut(auth);
    location.reload();
});

document.getElementById('btnChangeAccountSettings').addEventListener('click', async () => {
    await signOut(auth);
    settingsPanel.classList.add('hidden');
    document.getElementById('authPopup').style.display = 'flex';
    location.reload();
});

document.getElementById('btnDeleteAccount').addEventListener('click', async () => {
    const auth = getAuth();
    const user = auth.currentUser;

    if (!user) return;

    const confirmDelete = confirm("Sei sicuro? Questa operazione eliminerà permanentemente il tuo account e tutti i tuoi punteggi. Non è reversibile.");

    if (confirmDelete) {
        try {
            // 1. Elimina i dati da Firestore
            const db = getFirestore();
            await deleteDoc(doc(db, "users", user.uid));

            // 2. Elimina l'utente da Firebase Auth
            await deleteUser(user);

            alert("Account eliminato con successo.");
            localStorage.removeItem('playingAsGuest');
            location.reload(); // Ricarica per tornare allo stato di avvio
        } catch (error) {
            console.error("Errore durante l'eliminazione:", error);
            if (error.code === 'auth/requires-recent-login') {
                alert("Per sicurezza, effettua di nuovo il login prima di eliminare l'account.");
                await signOut(auth);
                settingsPanel.classList.add('hidden');
                document.getElementById('authPopup').style.display = 'flex';
                location.reload();
            } else {
                alert("Errore: " + error.message);
            }
        }
    }
});

document.getElementById('forgotPasswordBtn').addEventListener('click', async () => {
    const email = document.getElementById('emailInput').value;

    if (!email) {
        alert("Per favore, inserisci la tua email nel campo sopra per procedere con il recupero.");
        return;
    }

    try {
        await recoverPassword(email);
        alert("Email di recupero inviata! Controlla la tua casella di posta (anche nello spam).");
    } catch (error) {
        console.error("Errore recupero password:", error);
        alert("Errore: " + error.message);
    }
});

initMultiplayer(uiElements);

let isGameRunning = false;
let unsubscribeGameSession = null;

// Questa funzione viene chiamata in automatico da multiplayer.js quando il creatore clicca "Avvia"
window.startMultiplayerSession = async function (roomId) {
    const roomRef = doc(db, "rooms", roomId);
    const roomSnap = await getDoc(roomRef);
    const players = roomSnap.data().players || {};

    if (isGameRunning) return; // Impedisce il doppio avvio
    isGameRunning = true;

    currentRoomId = roomId;
    isMatchOver = false;

    const gameContainer = document.getElementById('gameContainer');
    const mainMenu = document.getElementById('mainMenu');
    const roomWaitingScreen = document.getElementById('roomWaitingScreen');

    pauseButton.classList.add('hidden');
    resumeButton.classList.add('hidden');
    tutorialButton.classList.add('hidden');
    mainMenu.classList.add('hidden');
    settingsBtn.classList.add('hidden');
    settingsPanel.classList.add('hidden');
    roomWaitingScreen.classList.add('hidden');
    gameContainer.classList.remove('hidden'); // Rimuove la schermata nera
    cookieDiv.classList.add('hide-ui');

    // Inizializza lo stato del gioco
    resetGame();
    gameState = 'PLAYING';
    startMusic();
    requestAnimationFrame(gameLoop);

    // Mostra la UI della tabella punteggi live
    document.getElementById('liveScoreboard').classList.remove('hidden');

    // AGGIUNGI QUESTO BLOCCO: Ascoltatore in tempo reale della stanza
    onSnapshot(roomRef, (docSnap) => {
        if (currentRoomId !== roomId) return;
        if (docSnap.exists()) {
            const data = docSnap.data();
            if (!data.players || !data.players[auth.currentUser.uid]) {
                return; // Ignora gli aggiornamenti se sei stato rimosso o sei uscito
            }
            if (data.players) {
                // Aggiorna la tabella ogni volta che un punteggio cambia
                if (isMatchOver && !document.getElementById('returnLobbyBtn').classList.contains('hidden')) {
                    return;
                }
                updateScoreboardUI(data.players, isMatchOver);

                const playersArray = Object.values(data.players);
                // Controlla se ogni giocatore ha "isGameOver" impostato a true
                const allDead = playersArray.length > 0 && playersArray.every(p => p.isGameOver === true);

                // Dentro window.startMultiplayerSession, nel blocco onSnapshot:
                if (allDead && !isMatchOver) {
                    // 1. Aggiorna lo stato per bloccare il loop
                    isMatchOver = true;
                    gameState = 'GAME_OVER';
                    updateScoreboardUI(data.players, isMatchOver);
                    stopGameLoop();


                    // 2. Forza l'animazione della tabella
                    const scoreboard = document.getElementById('liveScoreboard');
                    scoreboard.classList.remove('hidden'); // Assicurati che sia visibile
                    scoreboard.classList.add('center-zoomed'); // Aggiunge l'animazione

                    // 3. Mostra il tasto per tornare alla lobby
                    document.getElementById('returnLobbyBtn').classList.remove('hidden');

                    // 4. Stop audio
                    stopAndReleaseMusic();
                }
            }
        }
    });
};

// 4. Logica speciale per gli Ospiti
// Se l'utente è ospite, il profilo in alto dovrebbe essere diverso
function checkUserStatus() {
    const auth = getAuth();
    const user = auth.currentUser;
    const btnAuth = document.getElementById('btnAuth');

    if (localStorage.getItem('playingAsGuest') === 'true' && !user) {
        // È ospite: mostra bottone "Accedi" nel menu
        btnAuth.classList.remove('hidden');
    }
}

function closeTutorialAndResume() {
    showTutorialPanel = false;
    tutorialPanel.classList.add('hidden');
    localStorage.setItem('hasPlayedBefore', 'true');
    hasPlayedBefore = true;
    resumeButton.classList.add('hidden');
    pauseButton.classList.remove('hidden');

    resetGame();
    gameState = 'PLAYING';
    startMusic();
}

function resetGame() {
    playerState = 'FLYING';
    playerX = w / 4 - 50;
    playerY = 150;
    velocityX = 6;
    velocityY = 0;
    angularVelocity = 0;
    angle = -Math.PI / 4;
    cameraOffsetX = 0;

    ropes = [];
    score = 0;
    frame = 0;
    lastScoredRopeX = 0;
    graceFramesAfterReset = 5;
    isCatFalling = false;

    // Prima corda iniziale di salvataggio
    ropes.push({ x: w / 4, y: 0, length: h * 0.6, isFragile: false, isSlippery: false, isBroken: false });

    gameOverPanel.classList.add('hidden');
    gameOverPanel.style.display = 'none';
    if (currentRoomId) {
        pauseButton.classList.add('hidden');
        resumeButton.classList.add('hidden');
    } else {
        pauseButton.classList.remove('hidden');
        resumeButton.classList.add('hidden');
    }
    soundOn.classList.remove('hidden');
    soundOff.classList.add('hidden');
}

function generateRopes() {
    if (graceFramesAfterReset > 0) {
        graceFramesAfterReset--;
        return;
    }

    const rightEdge = cameraOffsetX + w;
    const lastRopeX = ropes.length > 0 ? ropes[ropes.length - 1].x : w / 4;

    if (lastRopeX < rightEdge + 600) {
        const newRopeX = lastRopeX + 260;
        const chance = Math.random();
        let fragile = false, slippery = false;

        if (chance < 0.25) slippery = true;
        else if (chance >= 0.25 && chance < 0.5) fragile = true;

        ropes.push({
            x: newRopeX,
            y: 0,
            length: h * 0.6,
            isFragile: fragile,
            isSlippery: slippery,
            isBroken: false
        });
    }

    // Ottimizzazione memoria array corde uscite a sinistra dello schermo
    if (ropes.length > 15) {
        ropes = ropes.filter(r => r.x >= cameraOffsetX - 300);
    }
}

function checkRopeCollision() {
    if (gameState !== 'PLAYING') return false;
    if (frame < 5) return false;

    for (let rope of ropes) {
        if (rope.isBroken) continue;

        // Margine di tolleranza collisione orizzontale
        const isHorizontallyAligned = playerX > (rope.x - 45) && playerX < (rope.x + 45);
        // Verifica allineamento verticale lungo l'asse della corda
        const isVerticallyAligned = playerY > rope.y && playerY < (rope.y + rope.length + 30);
        const isFalling = velocityY > 0;

        if (isHorizontallyAligned && isVerticallyAligned && isFalling) {
            if (rope.x > lastScoredRopeX) {
                score++;
                lastScoredRopeX = rope.x;
                sendMyScore(score);
            }

            playerState = 'ATTACHED';
            isCatFalling = false;
            attachedRope = rope;
            anchorX = rope.x;
            anchorY = rope.y;
            ropeLength = playerY - anchorY; // Aggancio dinamico basato sull'altezza corrente

            // Calcola l'angolo di aggancio iniziale basato sulla trigonometria della posizione reale
            angle = Math.atan2(playerX - anchorX, playerY - anchorY);
            angularVelocity = velocityX / ropeLength; // Trasferimento quantità di moto lineare in angolare
            return true;
        }
    }
    return false;
}

async function updateGameLogic() {
    if (gameState !== 'PLAYING') return;

    frame++;

    if (playerState === 'ATTACHED') {
        const g = 0.6; // Gravità pendolare bilanciata
        const damping = 0.998; // Conservazione energia del moto armonico

        const acceleration = (-g / ropeLength) * Math.sin(angle);
        angularVelocity += acceleration;
        angularVelocity *= damping;
        angle += angularVelocity;

        // Calcolo della posizione orbitale del gatto rispetto al perno (anchor)
        playerX = anchorX + (ropeLength * Math.sin(angle));
        playerY = anchorY + (ropeLength * Math.cos(angle));

        // Gestione corda fragile (isFragile) come da file sorgente Kotlin
        if (attachedRope && attachedRope.isFragile && Math.abs(angle) > 0.3) {
            attachedRope.isBroken = true;
            playerState = 'STOPPED';

            const tangentialVelocity = angularVelocity * ropeLength;
            velocityX = tangentialVelocity * Math.cos(angle);
            velocityY = -tangentialVelocity * Math.sin(angle);
        }

        // Se oscilla troppo lentamente, si ferma
        if (Math.abs(angularVelocity) < 0.001 && Math.abs(angle) < 0.03) {
            playerState = 'STOPPED';
        }

    } else if (playerState === 'STOPPED') {
        // Se il gatto era attaccato ma ha perso slancio, si stacca
        if (!isCatFalling) {
            isCatFalling = true;
        }
        velocityY += gravity;
        playerX += velocityX;
        playerY += velocityY;

    } else if (playerState === 'FLYING') {
        velocityY += gravity;
        velocityX *= 0.995; // Attrito dell'aria passivo

        playerX += velocityX;
        playerY += velocityY;
        checkRopeCollision();
    }

    const targetX = playerX - (w * 0.33);

    // Inseguimento fluido solo in avanti. Impedisce alla camera di tornare indietro se il gatto oscilla.
    if (targetX > cameraOffsetX) {
        cameraOffsetX += (targetX - cameraOffsetX) * 0.1;
    }

    generateRopes();


    // Condizione di Game Over (Caduta oltre il limite inferiore dello schermo)
    if (playerY > h + playerHeight + 100) {
        // 1. BLOCCO IMMEDIATO: Se siamo già in Game Over, esci subito dalla funzione
        if (gameState === 'GAME_OVER') return;

        gameState = 'GAME_OVER'; // Cambio stato prima di ogni altra cosa

        // 2. LOGICA DI SALVATAGGIO (Eseguita una sola volta)

            // Salvataggio Locale (sempre attivo)
            const localKey = auth.currentUser ? `highScore2_${auth.currentUser.uid}` : 'highScore2_guest';
            const currentLocal = parseInt(localStorage.getItem(localKey)) || 0;

            highScore = Math.max(score, currentLocal, highScore);
            localStorage.setItem(localKey, highScore);

            // Salvataggio Cloud (solo per utenti non anonimi)
if (auth.currentUser && !auth.currentUser.isAnonymous) {
        const userRef = doc(db, "users", auth.currentUser.uid);
    
    try {
        // Inviamo solo le informazioni necessarie verificate dalle nuove regole
        await setDoc(userRef, {
            score: highScore,
            lastUpdateAt: serverTimestamp()
        }, { merge: true });
    } catch (error) {
        console.error("Firebase ha rifiutato il salvataggio a fine partita. Verifica le Security Rules:", error.message);
    };
}

        // 3. CAMBIO STATO E UI (Eseguito una sola volta)

        playSound(sounds.falling);
        stopAndReleaseMusic();

        finalScoreText.innerText = `Score: ${score}`;
        gameOverPanel.classList.remove('hidden');
        gameOverPanel.style.display = 'flex';

        // 4. Gestione Multiplayer
        if (currentRoomId && auth.currentUser) {
            const roomRef = doc(db, "rooms", currentRoomId);
            updateDoc(roomRef, {
                [`players.${auth.currentUser.uid}.isGameOver`]: true
            });
        }
    }
}

function draw() {
    ctx.clearRect(0, 0, w, h);

    // Rendering Sfondo Sfumato Dinamico (Statico rispetto alla camera)
    let skyGradient = ctx.createLinearGradient(0, 0, 0, h);
    skyGradient.addColorStop(0, '#0392f1');
    skyGradient.addColorStop(1, '#ffffff');
    ctx.fillStyle = skyGradient;
    ctx.fillRect(0, 0, w, h);

    // APPLICHIAMO LA TELECAMERA SUL MONDO
    ctx.save();
    ctx.translate(-Math.floor(cameraOffsetX), 0);

    // ====== DA QUI IN POI USIAMO SOLO LE COORDINATE MONDO (SENZA SOTTRARRE CAMERAOFFSTX) ======

    // Disegno Corde e Perni superiori
    for (let rope of ropes) {
        if (rope.isBroken) continue;

        if (rope === attachedRope && playerState === 'ATTACHED') {
            // Corda attiva sotto tensione oscillante (Usa coordinate pure del mondo)
            ctx.strokeStyle = attachedRope.isSlippery ? '#3a8a5c' : '#0000a5';
            ctx.lineWidth = 12;
            ctx.beginPath();
            ctx.moveTo(anchorX, anchorY);
            ctx.lineTo(playerX, playerY);
            ctx.stroke();
        } else {
            // Corda statica verticale (Usa coordinate pure del mondo)
            let currentRopeImg = rope.isSlippery ? images.ropeSlippery : images.rope;
            const wRope = rope.isSlippery ? 70 : 150;
            const drawX = rope.x - (wRope / 2); // Centrato rispetto a rope.x del mondo

            if (currentRopeImg.complete && currentRopeImg.naturalHeight !== 0) {
                ctx.drawImage(currentRopeImg, drawX, rope.y, wRope, rope.length);
            } else {
                // Fallback geometrico visivo colorato
                ctx.strokeStyle = rope.isSlippery ? '#2ecc71' : (rope.isFragile ? '#e74c3c' : '#7f8c8d');
                ctx.lineWidth = 5;
                ctx.beginPath();
                ctx.moveTo(rope.x, rope.y);
                ctx.lineTo(rope.x, rope.y + rope.length);
                ctx.stroke();
            }
        }

        // Perno superiore della corda (Usa coordinata pura del mondo)
        ctx.fillStyle = '#2c3e50';
        ctx.beginPath();
        ctx.arc(rope.x, rope.y, 10, 0, Math.PI * 2);
        ctx.fill();
    }

    // Selezione dell'immagine del Gatto
    let currentCatImg = images.catFlying;
    if (playerState === 'ATTACHED') {
        currentCatImg = attachedRope?.isSlippery ? images.slippingCatAttached : images.catAttached;
    } else {
        if (isCatFalling) currentCatImg = images.catFalling;
    }

    // Rendering ed orientamento grafico del Gatto
    ctx.save();
    ctx.translate(playerX, playerY); // Si posiziona sulla coordinata pura del mondo

    if (playerState === 'ATTACHED') {
        ctx.rotate(-angle - 0.04);
    } else {
        let flightAngle = Math.atan2(velocityY, velocityX + 0.001) * 0.3;
        ctx.rotate(flightAngle);
    }

    if (currentCatImg.complete && currentCatImg.naturalHeight !== 0) {
        ctx.drawImage(currentCatImg, -playerWidth / 2, -playerHeight / 2, playerWidth, playerHeight);
    } else {
        // Fallback Geometrico
        ctx.fillStyle = playerState === 'ATTACHED' ? '#f39c12' : '#e67e22';
        ctx.beginPath();
        ctx.arc(0, 0, playerWidth / 2, 0, Math.PI * 2);
        ctx.fill();

        // Occhi di orientamento
        ctx.fillStyle = '#ffffff';
        ctx.beginPath(); ctx.arc(12, -8, 6, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#000000';
        ctx.beginPath(); ctx.arc(14, -8, 3, 0, Math.PI * 2); ctx.fill();
    }

    ctx.restore(); // Ripristina rotazione gatto
    ctx.restore(); // Rilascia la traslazione della telecamera globale

    // ====== DA QUI IN POI LA UI FISSA (Non subisce la telecamera) ======
    ctx.fillStyle = '#2c3e50';
    ctx.font = 'bold 26px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`Score: ${score}`, 60, h - 40);

    ctx.textAlign = 'right';
    ctx.fillText(`HighScore: ${highScore}`, w - 30, h - 40);
}

let animationFrameId = null; // Aggiungi in alto

function gameLoop(timestamp) {
    updateGameLogic();
    draw();
    animationFrameId = requestAnimationFrame(gameLoop);
}

// Quando il gioco finisce o torni alla lobby:
function stopGameLoop() {
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
        isGameRunning = false;
    }
}


// ====== LOGICA GESTIONE INPUT (Mouse Click & Touchscreen Tap interscambiabili) ======
function handleActionInput(e) {

    if (e && e.target) {
        // Evita che i click sui bottoni di gioco attivino il salto
        if (e.target.tagName === 'BUTTON' || e.target.classList.contains('icon-btn')) {
            return;
        }

        // 🔴 NUOVO CONTROLLO: Ignora l'input se si sta interagendo con Iubenda
        if (e.target.closest('#iubenda-cs-banner') ||
            e.target.closest('.iubenda-cs-container') ||
            e.target.classList.contains('iubenda-embed')) {
            return;
        }
    }

    if (showTutorialPanel) {
        closeTutorialAndResume();
        return;
    }

    if (gameState === 'NOT_STARTED') {
        return;
    }

    if (gameState === 'GAME_OVER') {
        if (currentRoomId && isMatchOver) {
            return;
        }
        resetGame();
        gameState = 'PLAYING';
        if (isMusicPlaying) {
            resumeMusic();
        } else {
            // Se siamo muti, assicurati che il tasto rimanga corretto
            soundOn.classList.add('hidden');
            soundOff.classList.remove('hidden');
        }
        return;
    }

    if (gameState === 'PLAYING') {
        if (playerState === 'ATTACHED' || playerState === 'STOPPED') {

            // Gestione corda scivolosa (Slippery) con distacco ritardato passivo
            if (attachedRope && attachedRope.isSlippery) {
                if (!isSlipping) {
                    isSlipping = true;
                    playSound(sounds.swing);
                    setTimeout(() => {
                        playerState = 'FLYING';
                        isSlipping = false;
                    }, 300);
                }
            } else {
                playerState = 'FLYING';
            }

            const now = Date.now();
            lastClickTime = now;

            isCatFalling = false;

            // Calcolo velocità tangenziale di rilascio vettoriale (conversione polare-cartesiana)
            const tangentialSpeed = angularVelocity * ropeLength;

            const releaseMultiplier = 0.01;

            // Proiezione vettoriale ortogonale all'angolo della corda al momento del rilascio
            velocityX = tangentialSpeed * Math.cos(angle);
            velocityY = -tangentialSpeed * Math.sin(angle) * releaseMultiplier;

            // Spinta minima propulsiva in avanti per fluidità e prevenzione stallo verticale
            if (velocityX < 7) velocityX = 8.5;
            if (velocityX > 15) velocityX = 15;
            if (velocityY < -10) velocityY = -10;
        }
    }
}

// Assicura compatibilità cross-platform istantanea sia desktop che mobile
window.addEventListener('mousedown', handleActionInput);
window.addEventListener('touchstart', (e) => {
    handleActionInput(e);
}, { passive: true });

// ====== STUB CLASSIFICHE GLOBALI ED UTILITY SIMULATE ======

let currentRoomId = null;

// 1. Creare o Entrare in una stanza
async function joinGame(roomId) {
    currentRoomId = roomId;
    const roomRef = doc(db, "rooms", roomId);

    // Aggiungi il giocatore alla stanza
    await updateDoc(roomRef, {
        [`players.${auth.currentUser.uid}`]: {
            name: auth.currentUser.displayName,
            score: 0
        }
    });

    // Avvia l'ascolto dei punteggi degli altri
    onSnapshot(roomRef, (doc) => {
        if (doc.exists()) {
            const data = doc.data();
            const players = data.players || {};

            // Aggiorna la tabella
            updateScoreboardUI(players);;
        }
    });
}

// Modifica la funzione in game.js
function updateScoreboardUI(players, matchEnded) {
    const scoreBody = document.getElementById('scoreBody');
    scoreBody.innerHTML = "";

    const sortedPlayers = Object.values(players).sort((a, b) => b.score - a.score);

    sortedPlayers.forEach((p, index) => {
        const position = index + 1;
        let medal = "";

        // 🟢 Usa il parametro passato per decidere se mostrare le medaglie
        if (matchEnded) {
            if (position === 1) medal = "🥇 ";
            else if (position === 2) medal = "🥈 ";
            else if (position === 3) medal = "🥉 ";
        }

        const row = `<tr><td>${position}°${medal}${p.name}</td><td>${p.score}</td></tr>`;
        scoreBody.innerHTML += row;
    });
}

// 3. Chiamata da inserire nel tuo ciclo di gioco
// Ogni volta che il giocatore segna un punto, chiama questa:
async function sendMyScore(newScore) {
    if (!currentRoomId) return;
    const roomRef = doc(db, "rooms", currentRoomId);
    await updateDoc(roomRef, {
        [`players.${auth.currentUser.uid}.score`]: newScore
    });
}

window.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
        // Impedisce lo scrolling della pagina quando premi spazio
        e.preventDefault();
        handleActionInput(e);
    }
});
