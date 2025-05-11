// Import the functions you need from the SDKs you need
import { initializeApp } from 'firebase/app';
import { getStorage } from 'firebase/storage';
import { getFirestore } from 'firebase/firestore';

// TODO: Replace with your own Firebase config
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
const storage = getStorage(app);
const db = getFirestore(app);

export { app, storage, db }; 