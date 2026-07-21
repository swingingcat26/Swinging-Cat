import { auth, db } from "./firebase-init.js";
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    updateProfile,
    signInAnonymously,
    sendPasswordResetEmail,
    signOut,
    EmailAuthProvider,       // 👈 AGGIUNGI QUESTO
    linkWithCredential
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";
import {
    collection,
    getDocs,
    query,
    orderBy,
    limit,
    doc,
    setDoc,
    getDoc,
    where, getCountFromServer
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";

export { signInAnonymously, signOut };

export const registerWithEmail = async (email, password, displayName) => {
    const user = auth.currentUser;
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const newUser = userCredential.user;
        await updateProfile(newUser, { displayName: displayName });
        await setDoc(doc(db, "users", newUser.uid), {
            displayName: displayName, // Il nickname salvato qui è quello letto dalla classifica
        });
        return newUser;
};

export const loginWithEmail = async (email, password) => {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        return userCredential.user;
    } catch (error) {
        console.error("Errore login:", error.message);
        throw error;
    }
};

export const getGlobalLeaderboard = async () => {
    // 🟢 Protezione aggiuntiva lato logica
    const user = auth.currentUser;
    if (!user || user.isAnonymous) {
        console.warn("Accesso alla classifica negato: utente non autorizzato.");
        return []; // Restituisce un array vuoto
    }
    if (!user || user.isAnonymous) return { top10: [], myPos: null, totalUsers: 0 };
    try {
        const usersRef = collection(db, "users");

        // 1. Prendi la Top 10
        const qTop = query(
            usersRef,
            orderBy("score", "desc"),
            limit(10)
        );
        const snapTop = await getDocs(qTop);
        const top10 = snapTop.docs.map(doc => doc.data());

        // 2. Conta utenti totali
        const snapCount = await getCountFromServer(usersRef);
        const totalUsers = snapCount.data().count;

        // 3. Trova posizione utente (se fuori dalla top 10)
        const myDoc = await getDoc(doc(db, "users", user.uid));
        const myScore = myDoc.data().score;

        // Conta quanti hanno un punteggio superiore
        const qPos = query(usersRef, where("score", ">", myScore));
        const snapPos = await getCountFromServer(qPos);
        const position = snapPos.data().count + 1;

        return { top10, myPos: position > 10 ? position : null, totalUsers, myScore };
    } catch (error) {
        console.error(error);
        return { top10: [], myPos: null, totalUsers: 0 };
    }
};

export const getPersonalRecord = async (userId) => {
    try {
        const userRef = doc(db, "users", userId);
        const docSnap = await getDoc(userRef);
        return docSnap.exists() ? (docSnap.data().score || 0) : 0;
    } catch (error) {
        console.error("Errore nel caricamento del record personale:", error);
        return 0;
    }
};


export const recoverPassword = async (email) => {
    if (!email) throw new Error("Inserisci prima la tua email nel campo apposito.");
    await sendPasswordResetEmail(auth, email);
};

export const upgradeAnonymousAccount = async (email, password, displayName) => {
    const user = auth.currentUser;
    if (!user || !user.isAnonymous) throw new Error("Utente non anonimo");

    // 1. Crea credenziale
    const credential = EmailAuthProvider.credential(email, password);
    
    // 2. Collega l'account (preserva l'UID e il punteggio)
    const userCredential = await linkWithCredential(user, credential);
    
    // 3. Salva nickname e punteggio su Firestore
    await updateProfile(userCredential.user, { displayName: displayName });
    await setDoc(doc(db, "users", userCredential.user.uid), {
        score: parseInt(localStorage.getItem(`highScore2_${user.uid}`)) || 0,
        displayName: displayName,
    });
    
    return userCredential.user;
};