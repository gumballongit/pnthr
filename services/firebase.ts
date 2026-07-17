import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// To use actual Google Cloud servers, replace this with your Firebase project config.
// Firebase Firestore is Google Cloud's NoSQL document database.
const firebaseConfig = {
  apiKey: "AIzaSyCuXKktGF0xe4nt1TfjW_GpTrfihbvN_1Y",
  authDomain: "pnthr-voice.firebaseapp.com",
  projectId: "pnthr-voice",
  storageBucket: "pnthr-voice.firebasestorage.app",
  messagingSenderId: "362784488676",
  appId: "1:362784488676:web:5249f4a6ca8f81f757c0f1"
};

// We check if the user has configured their Google Cloud project.
// If not, the API service will gracefully fallback to local storage so the app still runs.
const isConfigured = firebaseConfig.apiKey !== "YOUR_API_KEY";

export const app = isConfigured ? initializeApp(firebaseConfig) : null;
export const db = isConfigured ? getFirestore(app) : null;
