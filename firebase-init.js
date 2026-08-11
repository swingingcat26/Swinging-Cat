import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";
import { getAnalytics, logEvent as firebaseLogEvent, isSupported } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-analytics.js";

const firebaseConfig = {
    apiKey: "AIzaSyDLDTUpXEfDufWTFZFVg1l2nco_TdmFzMc",
    authDomain: "swingingcat-87b69.firebaseapp.com",
    projectId: "swingingcat-87b69",
    storageBucket: "swingingcat-87b69.firebasestorage.app",
    messagingSenderId: "627037719328",
    appId: "1:627037719328:web:65850cf1d61c6785e12545",
    measurementId: "G-GKMTQ6MHTL"
};

// 🟢 EXPORT SU TUTTO PER RENDERLO VISIBILE AGLI ALTRI FILE
export const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];
export const auth = getAuth(app);
export const db = getFirestore(app);
let analytics = null;

// isSupported() verifica se l'ambiente corrente (browser/cookies/IndexedDB) supporta Analytics
isSupported().then((supported) => {
    if (supported) {
        analytics = getAnalytics(app);
        console.log("🟢 Firebase Analytics inizializzato con successo!");
    } else {
        console.warn("⚠️ Firebase Analytics non è supportato in questo ambiente.");
    }
}).catch((err) => {
    console.error("Errore durante il controllo del supporto ad Analytics:", err);
});

// 🟢 Wrapper sicuro per inviare gli eventi senza far crashare il gioco
export const logEvent = (eventName, eventParams) => {
    if (analytics) {
        // Stampa il log in F12 per facilitare il debug
        console.log(`📊 [Analytics]: ${eventName}`, eventParams || {});
        firebaseLogEvent(analytics, eventName, eventParams);
    } else {
        // Se analytics non è ancora pronto o non è supportato, stampa solo il log senza crash
        console.log(`📊 [Analytics (non inviato)]: ${eventName}`, eventParams || {});
    }
};

export { analytics };