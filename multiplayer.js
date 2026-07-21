import { getFirestore, doc, setDoc, updateDoc, onSnapshot, getDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";
import { getAuth, signInAnonymously } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";
import { db, auth } from "./firebase-init.js"; // Usa l'istanza centralizzata

let currentRoomId = null;
let isCreator = false;
export let unsubscribeRoom = null;
let ui = {};

export function initMultiplayer(uiElements) {
    ui = uiElements;
    
    ui.multiplayerBtn.addEventListener('click', () => {
    // CONSENTI L'ACCESSO A TUTTI GLI UTENTI (inclusi gli anonimi/UUID)
    if (!auth.currentUser) {
        // Se non è loggato affatto, forza un accesso anonimo veloce
        signInAnonymously(auth);
    }
        ui.mainMenu.classList.add('hidden');
        ui.multiplayerLobby.classList.remove('hidden');
    });

ui.backToLobbyBtn.addEventListener('click', async () => {
    // Se sono il creatore, elimino la stanza
    if (isCreator && currentRoomId) {
        await deleteRoom(currentRoomId);
    }

    ui.roomWaitingScreen.classList.add('hidden');
    ui.multiplayerLobby.classList.remove('hidden');
    currentRoomId = null;
    isCreator = false;
});

    ui.backToMenuBtn.addEventListener('click', () => {
        ui.multiplayerLobby.classList.add('hidden');
        ui.mainMenu.classList.remove('hidden');
    });

    ui.createRoomBtn.addEventListener('click', async () => {
        const user = auth.currentUser;
        const roomCode = generateRoomCode().toUpperCase();
        const roomRef = doc(db, "rooms", roomCode);

        await setDoc(roomRef, {
            creator: user.uid,
            status: 'WAITING',
            players: {
                [user.uid]: {
                    name: user.displayName || "Giocatore",
                    ready: true, // Il creatore è sempre pronto
                    score: 0
                }
            }
        });

        isCreator = true;
        currentRoomId = roomCode;
        enterWaitingRoom(roomCode);
    });

    ui.joinRoomBtn.addEventListener('click', async () => {
        const user = auth.currentUser;
        let roomCode = ui.roomCodeInput.value.trim().toUpperCase();
        if (!roomCode) return alert("Inserisci un codice valido.");
        
        const roomRef = doc(db, "rooms", roomCode);
        const roomSnap = await getDoc(roomRef);

        if (!roomSnap.exists()) return alert("Stanza non trovata!");
        if (roomSnap.data().status !== 'WAITING') return alert("Partita già in corso o chiusa!");

        await updateDoc(roomRef, {
            [`players.${user.uid}`]: {
        // Se displayName è null/undefined, usa una stringa sicura
        name: user.displayName || "Ospite-" + user.uid.substring(0, 4), 
        ready: false,
        score: 0
    }
        });

        isCreator = false;
        currentRoomId = roomCode;
        enterWaitingRoom(roomCode);
    });

    ui.readyBtn.addEventListener('click', async () => {
        const user = auth.currentUser;
        if (!user || !currentRoomId) return;

        const roomRef = doc(db, "rooms", currentRoomId);
        const roomSnap = await getDoc(roomRef);
        
        if(roomSnap.exists()){
            const isReady = roomSnap.data().players[user.uid].ready;
            await updateDoc(roomRef, { [`players.${user.uid}.ready`]: !isReady });
            ui.readyBtn.innerText = !isReady ? "Pronto!" : "Non Pronto";
            ui.readyBtn.style.backgroundColor = !isReady ? "#2ecc71" : "#e74c3c";
        }
    });

    ui.startGameBtn.addEventListener('click', async () => {
        if (!isCreator || !currentRoomId) return;
        const roomRef = doc(db, "rooms", currentRoomId);
        await updateDoc(roomRef, { status: 'PLAYING' });
    });
}

function enterWaitingRoom(roomCode) {
    ui.multiplayerLobby.classList.add('hidden');
    ui.roomWaitingScreen.classList.remove('hidden');
    ui.displayRoomCode.innerText = roomCode;

    if (isCreator) {
        ui.startGameBtn.classList.remove('hidden');
        ui.readyBtn.classList.remove('hidden');
    } else {
        ui.startGameBtn.classList.add('hidden');
        ui.readyBtn.classList.remove('hidden');
        ui.readyBtn.innerText = "Non Pronto";
        ui.readyBtn.style.backgroundColor = "#e74c3c";
    }

    const roomRef = doc(db, "rooms", roomCode);
    
    // Ascolto in tempo reale dello stato della stanza
unsubscribeRoom = onSnapshot(roomRef, (docSnap) => {
    if (!docSnap.exists()) {
        // La stanza è stata eliminata!
        alert("La stanza è stata chiusa dal creatore.");
        ui.roomWaitingScreen.classList.add('hidden');
        ui.multiplayerLobby.classList.remove('hidden');
        return;
    }
    
    const data = docSnap.data();
    
    const playersEntries = Object.entries(data.players);
    const playersCount = playersEntries.length;
    ui.playersList.innerHTML = '';
    let allReady = true;

    const playerCounterEl = document.getElementById('playerCounter'); // L'elemento <span id="playerCounter"> creato prima
    const maxSlots = 4;

    if (playersEntries < 2) {
        console.warn("Avvio bloccato: servono almeno 2 giocatori.");
        return; // Interrompe l'avvio se c'è solo un giocatore
    }

    playersEntries.forEach(([uid, p]) => {
        const li = document.createElement('li');
        li.innerText = `${p.name} - ${p.ready ? '🟢 Pronto' : '🔴 In Attesa'}`;
        ui.playersList.appendChild(li);
        if (!p.ready) allReady = false;
    });

    // 3. (Opzionale) Aggiunge degli slot "vuoti" per completare visivamente i 4 posti
    const emptySlots = maxSlots - playersCount;
    for (let i = 0; i < emptySlots; i++) {
        const li = document.createElement('li');
        li.style.color = '#94a3b8'; // Colore grigino/disattivato
        li.style.fontStyle = 'italic';
        li.innerHTML = `⏳ Posto libero (${playersCount + i + 1}/4)`;
       ui.playersList.appendChild(li);
    }

    // Il creatore può avviare solo se TUTTI hanno cliccato "Pronto"
    if (isCreator) {
        if (playersCount < 2) {
            ui.startGameBtn.disabled = true;
            ui.startGameBtn.innerText = "In attesa di altri...";
            ui.startGameBtn.style.opacity = "0.5";
        } else {
            ui.startGameBtn.disabled = !allReady;
            ui.startGameBtn.innerText = allReady ? "Avvia Partita" : "Attendo altri...";
            ui.startGameBtn.style.opacity = allReady ? "1" : "0.5";
        }
    }

    // Se lo stato torna su 'PLAYING' (di nuovo avviata)
    if (data.status === 'PLAYING') {
        ui.roomWaitingScreen.classList.add('hidden');
        if(window.startMultiplayerSession) {
            window.startMultiplayerSession(currentRoomId);
        }
    }
});
}

export async function deleteRoom(roomCode) {
    if (!roomCode) return;
    const roomRef = doc(db, "rooms", roomCode);
    try {
        await deleteDoc(roomRef); // Richiede l'import di deleteDoc da firestore
        console.log("Stanza eliminata con successo.");
    } catch (e) {
        console.error("Errore eliminazione stanza:", e);
    }
}

function generateRoomCode() {
    // Escludiamo caratteri simili come I, l, 1, O, 0 per evitare errori umani
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ0123456789'; 
    let code = '';
    for (let i = 0; i < 6; i++) { // Codice a 6 caratteri
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    // Aggiungiamo un prefisso per identificare la versione del gioco o la regione
    return code; 
}

export function leaveRoomCleanup() {
    if (unsubscribeRoom) {
        unsubscribeRoom();
        unsubscribeRoom = null;
    }
    currentRoomId = null;
    isCreator = false;
}