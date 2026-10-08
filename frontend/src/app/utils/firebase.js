// utils/firebase.js

import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, FacebookAuthProvider } from "firebase/auth";
import { getMessaging } from "firebase/messaging";
const firebaseConfig = {
  apiKey: "AIzaSyCJTfDjjwU_QTD4SzLavnklQ359qvFUHkg",
  authDomain: "star-agro-45476.firebaseapp.com",
  projectId: "star-agro-45476",
  storageBucket: "star-agro-45476.firebasestorage.app",
  messagingSenderId: "291557752026",
  appId: "1:291557752026:web:aac3d2d5ca376eb7f9f9e3",
  measurementId: "G-M87EQQW6EL"
};

const app = !getApps().length
  ? initializeApp(firebaseConfig)
  : getApp();

export const messaging = (typeof window !== "undefined" && typeof navigator !== "undefined" && 'serviceWorker' in navigator)
  ? getMessaging(app)
  : null;

export const auth = getAuth(app);

export const googleProvider = new GoogleAuthProvider();
export const facebookProvider = new FacebookAuthProvider();

facebookProvider.setCustomParameters({
  display: "popup",
});

