import { initializeApp } from "firebase/app";
import {
  browserLocalPersistence,
  getAuth,
  setPersistence,
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyApjKduIOTIymsqlhyLK_towxY2GeWua4s",
  authDomain: "land-linkers.firebaseapp.com",
  projectId: "land-linkers",
  storageBucket: "land-linkers.firebasestorage.app",
  messagingSenderId: "111360206242",
  appId: "1:111360206242:web:525c889dd3aa447ef73efb",
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

// Keep users logged in across browser sessions and page refreshes
setPersistence(auth, browserLocalPersistence).catch(() => {});
