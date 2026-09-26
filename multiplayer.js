import { doc, setDoc, updateDoc, onSnapshot, getDoc, deleteDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";
import { db, auth, logEvent } from "./firebase-init.js"; 

let currentRoomId = null;
let isCreator = false;
export let unsubscribeRoom = null;
let ui = {};

export function initMultiplayer(uiElements) {
    ui = uiElements;
    
    ui.multiplayerBtn.addEventListener('click', async () => {
            
        const savedRoomCode = localStorage.getItem('lastCreatedRoom');
        logEvent('VSBtn', { status: 'clicked' });
    
        if (savedRoomCode) {
            const roomRef = doc(db, "rooms", savedRoomCode);
            const roomSnap = await getDoc(roomRef);
    
            if (roomSnap.exists()) {
                const roomData = roomSnap.data();
                if (roomData.createdAt) {
                    const creationTime = roomData.createdAt.toMillis();
                    const now = Date.now();
                    const oneHour = 60 * 60 * 1000;
    
                    if (now - creationTime > oneHour) {
                        await deleteDoc(roomRef); 
                        localStorage.removeItem('lastCreatedRoom');
                        alert("Your previous room has been deleted because 1 hour has passed.");
                        currentRoomId = null;
                    }
                    else {
                        currentRoomId = savedRoomCode;
                        isCreator = true;
                    }
                }
            } else {
                localStorage.removeItem('lastCreatedRoom');
            }
        }
    
        ui.mainMenu.classList.add('hidden');
        ui.multiplayerLobby.classList.remove('hidden');
    });

ui.backToLobbyBtn.addEventListener('click', async () => {

    if (isCreator && currentRoomId) {
        await deleteRoom(currentRoomId);
        localStorage.removeItem('lastCreatedRoom');
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
         const chooseAuth = document.getElementById('chooseAuth');

        if (!auth.currentUser) {
                 chooseAuth.style.zIndex = 99999; 
                return;
            }

        await setDoc(roomRef, {
            creator: user.uid,
            status: 'WAITING',
            createdAt: serverTimestamp(),
            players: {
                [user.uid]: {
                    name: user.displayName || "Player",
                    ready: true, 
                    score: 0
                }
            }
        });

        isCreator = true;
        currentRoomId = roomCode;
        localStorage.setItem('lastCreatedRoom', roomCode);
        enterWaitingRoom(roomCode);
        logEvent('create_group', { group_id: roomCode });
    });

    ui.joinRoomBtn.addEventListener('click', async () => {
        const user = auth.currentUser;
        let roomCode = ui.roomCodeInput.value.trim().toUpperCase();
         const chooseAuth = document.getElementById('chooseAuth');

        if (!auth.currentUser) {
            chooseAuth.style.zIndex = 99999; 
            return;
        }
        
        if (!roomCode) return alert("Please enter a valid room code.");
        
        const roomRef = doc(db, "rooms", roomCode);
        const roomSnap = await getDoc(roomRef);

        if (!roomSnap.exists()) return alert("Room not found!");
        if (roomSnap.data().status !== 'WAITING') return alert("Game already in progress or closed!");

        await updateDoc(roomRef, {
            [`players.${user.uid}`]: {
        name: user.displayName || "Player-" + user.uid.substring(0, 4), 
        ready: false,
        score: 0
    }
        });

        isCreator = false;
        currentRoomId = roomCode;
        enterWaitingRoom(roomCode);
        logEvent('join_group', { group_id: roomCode });
    });

    ui.readyBtn.addEventListener('click', async () => {
        const user = auth.currentUser;
        if (!user || !currentRoomId) return;

        const roomRef = doc(db, "rooms", currentRoomId);
        const roomSnap = await getDoc(roomRef);
        
        if(roomSnap.exists()){
            const isReady = roomSnap.data().players[user.uid].ready;
            await updateDoc(roomRef, { [`players.${user.uid}.ready`]: !isReady });
            ui.readyBtn.innerText = !isReady ? "Ready!" : "Not Ready";
            ui.readyBtn.style.backgroundColor = !isReady ? "#2ecc71" : "#e74c3c";
        }
    });

    ui.startGameBtn.addEventListener('click', async () => {
        if (!isCreator || !currentRoomId) return;
        const roomRef = doc(db, "rooms", currentRoomId);
        await updateDoc(roomRef, { status: 'PLAYING' });
    });

    window.addEventListener('beforeunload', (event) => {
            if (!currentRoomId || !auth.currentUser) return;
    
            const roomRef = doc(db, "rooms", currentRoomId);
    
            if (isCreator) {
                deleteDoc(roomRef).catch(err => console.error("Errore pulizia stanza alla chiusura:", err));
                localStorage.removeItem('lastCreatedRoom');
            } else {
                updateDoc(roomRef, {
                    [`players.${auth.currentUser.uid}`]: deleteField()
                }).catch(err => console.error("Errore rimozione giocatore alla chiusura:", err));
            }
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
        ui.readyBtn.innerText = "Not Ready";
        ui.readyBtn.style.backgroundColor = "#e74c3c";
    }

    const roomRef = doc(db, "rooms", roomCode);
    
unsubscribeRoom = onSnapshot(roomRef, (docSnap) => {
    if (!docSnap.exists()) {
        alert("The room has been closed by the creator.");
        ui.roomWaitingScreen.classList.add('hidden');
        ui.multiplayerLobby.classList.remove('hidden');
        return;
    }
    
    const data = docSnap.data();
    
    const playersEntries = Object.entries(data.players);
    const playersCount = playersEntries.length;
    ui.playersList.innerHTML = '';
    let allReady = true;
 
    const maxSlots = 4;

    if (playersEntries < 2) {
        console.warn("Avvio bloccato: servono almeno 2 giocatori.");
        return; 
    }

    playersEntries.forEach(([uid, p]) => {
        const li = document.createElement('li');
        li.innerText = `${p.name} - ${p.ready ? '🟢 Ready' : '🔴 Waiting'}`;
        ui.playersList.appendChild(li);
        if (!p.ready) allReady = false;
    });

    const emptySlots = maxSlots - playersCount;
    for (let i = 0; i < emptySlots; i++) {
        const li = document.createElement('li');
        li.style.color = '#94a3b8'; 
        li.style.fontStyle = 'italic';
        li.innerHTML = `⏳ Free Slot (${playersCount + i + 1}/4)`;
       ui.playersList.appendChild(li);
    }

    if (isCreator) {
        if (playersCount < 2) {
            ui.startGameBtn.disabled = true;
            ui.startGameBtn.innerText = "Waiting...";
            ui.startGameBtn.style.opacity = "0.5";
        } else {
            ui.startGameBtn.disabled = !allReady;
            ui.startGameBtn.innerText = allReady ? "Start Game" : "Waiting...";
            ui.startGameBtn.style.opacity = allReady ? "1" : "0.5";
        }
    }

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
        await deleteDoc(roomRef); 
        console.log("Stanza eliminata con successo.");
    } catch (e) {
        console.error("Errore eliminazione stanza:", e);
    }
}

function generateRoomCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ0123456789'; 
    let code = '';
    for (let i = 0; i < 6; i++) { 
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
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