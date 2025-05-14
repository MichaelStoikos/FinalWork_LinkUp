import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Using the existing Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyCjgVlaJm2aJO00mwp4e1aK-F_Dirt6VLE",
    authDomain: "linkup-c14d5.firebaseapp.com",
    databaseURL: "https://linkup-c14d5-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "linkup-c14d5",
    storageBucket: "linkup-c14d5.firebasestorage.app",
    messagingSenderId: "823336360471",
    appId: "1:823336360471:web:a203b2532a666b72cc5a52",
    measurementId: "G-GP18EQ6J1G"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app; 