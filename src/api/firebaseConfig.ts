// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";

// Your web app's Firebase configuration
export const firebaseConfig = {
  apiKey: "AIzaSyCwniLOF8jZR1a-_ArdXtIgKEjry1-woQw",
  authDomain: "aavl-board.firebaseapp.com",
  databaseURL: "https://aavl-board-default-rtdb.firebaseio.com",
  projectId: "aavl-board",
  storageBucket: "aavl-board.firebasestorage.app",
  messagingSenderId: "606207994550",
  appId: "1:606207994550:web:96b02c16f64db01e95d417"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const database = getDatabase(app);
