// app.js — Vibra™

import {
  auth,
  db
}
from "./firebase.js";

import {

  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged

}
from "https://www.gstatic.com/firebasejs/12.13.0/firebase-auth.js";

import {

  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
  increment,
  deleteDoc,
  getDoc,
  setDoc,
  serverTimestamp,
  arrayUnion,
  arrayRemove,
  limit

}
from "https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js";

// ========================================
// ELEMENTOS
// ========================================

const $ = (id) =>
  document.getElementById(id);

const email =
  $("email");

const password =
  $("password");

const username =
  $("username");

const loginButton =
  $("loginButton");

const registerButton =
  $("registerButton");

const logoutButton =
  $("logoutButton");

const postsContainer =
  $("postsContainer");

const communityContainer =
  $("communityContainer");

const onlineCounter =
  $("onlineCounter");

const visitCounter =
  $("visitCounter");

const searchInput =
  $("searchInput");

const searchButton =
  $("searchButton");

const feedButton =
  $("feedButton");

const clickSound =
  $("clickSound");

// ========================================
// VARIÁVEIS
// ========================================

let currentUser = null;

let currentUsername =
  "Usuário";

// ========================================
// SOM
// ========================================

function playClick(){

  if(!clickSound)
    return;

  clickSound.currentTime = 0;

  clickSound.play();

}

document.addEventListener(

  "click",

  (event)=>{

    if(event.target.tagName==="BUTTON"){

      playClick();

    }

  }

);

// ========================================
// VISITAS
// ========================================

async function registerVisit(){

  const ref =

    doc(
      db,
      "site",
      "visits"
    );

  const snap =
    await getDoc(ref);

  if(!snap.exists()){

    await setDoc(

      ref,

      {

        count:1

      }

    );

  }

  else{

    await updateDoc(

      ref,

      {

        count:
          increment(1)

      }

    );

  }

  const updated =

    await getDoc(ref);

  visitCounter.innerText =

    `👁️ ${updated.data().count} visitas`;

}

registerVisit();

// ========================================
// CADASTRO
// ========================================

registerButton.onclick =
async ()=>{

  if(

    !username.value ||

    !email.value ||

    !password.value

  ){

    alert(
      "Preencha todos os campos."
    );

    return;

  }

  try{

    const cred =

      await createUserWithEmailAndPassword(

        auth,

        email.value,

        password.value

      );

    const finalUsername =

      username.value.trim() ||

      email.value.split("@")[0];

    await setDoc(

      doc(
        db,
        "users",
        cred.user.uid
      ),

      {

        username:
          finalUsername,

        email:
          email.value,

        about:"",
        humor:"",
        interests:"",

        active:true,

        createdAt:
          serverTimestamp()

      }

    );

    currentUsername =
      finalUsername;

    alert(
      "Conta criada com sucesso!"
    );

  }

  catch(err){

    alert(
      err.message
    );

  }

};

// ========================================
// LOGIN
// ========================================

loginButton.onclick =
async ()=>{

  try{

    await signInWithEmailAndPassword(

      auth,

      email.value,

      password.value

    );

  }

  catch(err){

    alert(
      err.message
    );

  }

};

// ========================================
// LOGOUT
// ========================================

logoutButton.onclick =
async ()=>{

  if(currentUser){

    await updateDoc(

      doc(
        db,
        "users",
        currentUser.uid
      ),

      {

        active:false

      }

    );

  }

  await signOut(auth);

};

// ========================================
// BOTÃO FEED
// ========================================

if(feedButton){

  feedButton.onclick = ()=>{

    playClick();

    location.href =
      "feed.html";

  };

}

// ========================================
// AUTH
// ========================================

onAuthStateChanged(

  auth,

  async(user)=>{

    if(!user){

      currentUser = null;

      currentUsername =
        "Usuário";

      return;

    }

    currentUser = user;

    const userRef =

      doc(
        db,
        "users",
        user.uid
      );

    const userSnap =

      await getDoc(
        userRef
      );

    if(!userSnap.exists()){

      const finalUsername =

        username.value.trim() ||

        user.email.split("@")[0];

      await setDoc(

        userRef,

        {

          username:
            finalUsername,

          email:
            user.email,

          about:"",
          humor:"",
          interests:"",

          active:true,

          createdAt:
            serverTimestamp()

        }

      );

      currentUsername =
        finalUsername;

    }

    else{

      const data =
        userSnap.data();

      currentUsername =

        data.username ||

        user.email.split("@")[0] ||

        "Usuário";

      await updateDoc(

        userRef,

        {

          active:true

        }

      );

    }

  }

);

// ========================================
// USUÁRIOS ONLINE
// ========================================

onSnapshot(

  collection(
    db,
    "users"
  ),

  (snapshot)=>{

    let online = 0;

    snapshot.forEach(

      (userDoc)=>{

        if(userDoc.data().active){

          online++;

        }

      }

    );

    onlineCounter.innerText =

      `🟢 ${online} usuários ativos`;

  }

);

// ========================================
// AMOSTRA DO FEED
// Apenas 5 posts
// ========================================

onSnapshot(

  query(

    collection(
      db,
      "posts"
    ),

    orderBy(
      "createdAt",
      "desc"
    ),

    limit(5)

  ),

  (snapshot)=>{

    postsContainer.innerHTML = "";

    if(snapshot.empty){

      postsContainer.innerHTML = `

        <div class="community">

          Nenhuma postagem ainda.

        </div>

      `;

      return;

    }

    snapshot.forEach(

      (postDoc)=>{

        const post =
          postDoc.data();

        const div =
          document.createElement(
            "div"
          );

        div.className =
          "post";

        div.innerHTML = `

          <h3>

            ${post.username || "Usuário"}

          </h3>

          <p>

            ${post.text}

          </p>

        `;

        postsContainer.appendChild(
          div
        );

      }

    );

  }

);

// ========================================
// COMUNIDADES
// ========================================

onSnapshot(

  collection(
    db,
    "communities"
  ),

  (snapshot)=>{

    communityContainer.innerHTML = "";

    if(snapshot.empty){

      communityContainer.innerHTML = `

        <div class="community">

          Nenhuma comunidade criada.

        </div>

      `;

      return;

    }

    snapshot.forEach(

      (communityDoc)=>{

        const community =
          communityDoc.data();

        const div =
          document.createElement(
            "div"
          );

        div.className =
          "community";

        div.innerHTML = `

          🌎

          <strong>

            ${community.name}

          </strong>

        `;

        communityContainer.appendChild(
          div
        );

      }

    );

  }

);

// ========================================
// BUSCA
// ========================================

searchButton.onclick = ()=>{

  playClick();

  if(!searchInput.value.trim()){

    return;

  }

  location.href =

    `buscar.html?q=${encodeURIComponent(

      searchInput.value

    )}`;

};

// ========================================
// ENTER NA BUSCA
// ========================================

searchInput.addEventListener(

  "keydown",

  (event)=>{

    if(event.key==="Enter"){

      searchButton.click();

    }

  }

);

// ========================================
// AVISO AO SAIR DA PÁGINA
// ========================================

window.addEventListener(

  "beforeunload",

  (event)=>{

    if(auth.currentUser){

      event.preventDefault();

      event.returnValue = "";

    }

  }

);
