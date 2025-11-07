// firebase-config.js
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js';
import { getAuth, GoogleAuthProvider } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js';

// Firebase yapılandırmanız
const firebaseConfig = {
  apiKey: "AIzaSyAB9zfwHjZI6EsylDAg6cWOlsjhBfrh7FA",
  authDomain: "engchat-99b12.firebaseapp.com",
  projectId: "engchat-99b12",
  storageBucket: "engchat-99b12.firebasestorage.app",
  messagingSenderId: "610365154075",
  appId: "1:610365154075:web:9fa66b4a89c0eb6be4a9be",
  measurementId: "G-CFNPNGF3KT"
};

// Firebase'i başlat
const app = initializeApp(firebaseConfig);

// Servisleri export et
export const db = getFirestore(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Firestore fonksiyonlarını doğrudan import et
export { 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  addDoc, 
  query, 
  orderBy, 
  limit, 
  onSnapshot, 
  serverTimestamp 
} from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js';

// Authentication fonksiyonlarını doğrudan import et
export { 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged 
} from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js';