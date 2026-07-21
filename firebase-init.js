import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyDLDTUpXEfDufWTFZFVg1l2nco_TdmFzMc",
    authDomain: "swingingcat-87b69.firebaseapp.com",
    projectId: "swingingcat-87b69",
    storageBucket: "swingingcat-87b69.firebasestorage.app",
    messagingSenderId: "627037719328",
    appId: "1:627037719328:web:65850cf1d61c6785e12545"
};

// 🟢 EXPORT SU TUTTO PER RENDERLO VISIBILE AGLI ALTRI FILE
export const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];
export const auth = getAuth(app);
export const db = getFirestore(app);