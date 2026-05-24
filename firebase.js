// firebase.js

import { initializeApp }
from "https://www.gstatic.com/firebasejs/12.13.0/firebase-app.js";

import {
  getAuth
}
from "https://www.gstatic.com/firebasejs/12.13.0/firebase-auth.js";

import {
  getFirestore
}
from "https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js";

// CONFIG

const firebaseConfig = {

  apiKey:
    "AIzaSyDei4dxAcxR1eYBwSgOI5eTOdHTqrSScU4",

  authDomain:
    "vibra-rp.firebaseapp.com",

  projectId:
    "vibra-rp",

  storageBucket:
    "vibra-rp.firebasestorage.app",

  messagingSenderId:
    "524322264612",

  appId:
    "1:524322264612:web:d360691a30e198fc696ab1"

};

// INICIAR

const app =
  initializeApp(firebaseConfig);

// EXPORTAR

const auth =
  getAuth(app);

const db =
  getFirestore(app);

export {
  auth,
  db
};