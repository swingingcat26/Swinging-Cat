import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";
import { getAnalytics, initializeAnalytics, logEvent as firebaseLogEvent, isSupported } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-analytics.js";

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

// Eseguiamo l'inizializzazione dopo che il contesto Firebase è completamente pronto
isSupported().then((supported) => {
    if (supported) {
        try {
            // 🟢 2. USA initializeAnalytics PER REGISTRARE IL COMPONENTE IN MODO SICURO
            analytics = initializeAnalytics(app);
            console.log("🟢 Firebase Analytics inizializzato con successo!");
        } catch (e) {
            // Fallback: se l'app aveva già registrato analytics (es. ricaricamento pagina), lo recuperiamo
            try {
                analytics = getAnalytics(app);
                console.log("🟢 Firebase Analytics recuperato con successo dall'istanza esistente!");
            } catch (innerE) {
                console.warn("⚠️ Errore critico durante l'inizializzazione di Analytics:", innerE);
            }
        }
    } else {
        console.warn("⚠️ Firebase Analytics non è supportato in questo browser/ambiente.");
    }
}).catch((err) => {
    console.error("Errore controllo supporto Analytics:", err);
});

// 3. Wrapper per il logEvent
export const logEvent = (eventName, eventParams) => {
    if (analytics) {
        console.log(`📊 [Analytics]: ${eventName}`, eventParams || {});
        firebaseLogEvent(analytics, eventName, eventParams);
    } else {
        // Se Analytics non è ancora pronto o è bloccato (ad es. da AdBlock/GDPR)
        console.log(`📊 [Analytics non inviato]: ${eventName}`, eventParams || {});
    }
};

export { analytics };