import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyCDjXe2HMWM-K12e4MldfSFLHzI9Rh0XNE",
  authDomain: "aapnexa-17406.firebaseapp.com",
  projectId: "aapnexa-17406",
  storageBucket: "aapnexa-17406.firebasestorage.app",
  messagingSenderId: "676728866818",
  appId: "1:676728866818:web:89e8f26e9f655fe58a7f1b",
  measurementId: "G-EEC146VLG8"
};

// Initialize Firebase securely (Next.js server-side check)
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { app, auth, db, storage };
