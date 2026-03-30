// IMPORTANT: Replace these placeholder values with your own Firebase project config.
// Go to Firebase Console (https://console.firebase.google.com)
//   → Your Project → Project Settings → Your apps → Firebase SDK snippet (Config)
// Then paste the config object below.

import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID",
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
