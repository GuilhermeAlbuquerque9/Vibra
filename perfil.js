// perfil.js

// ========================================
// IMPORTS
// ========================================

import {
  auth,
  db
}
from "./firebase.js";

import {

  onAuthStateChanged,
  signOut,
  deleteUser

}
from "https://www.gstatic.com/firebasejs/12.13.0/firebase-auth.js";

import {

  doc,
  getDoc,
  updateDoc,
  increment,
  collection,
  query,
  where,
  getDocs,
  addDoc,
  deleteDoc,
  serverTimestamp

}
from "https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js";

// ========================================
// ELEMENTOS
// ========================================

const $ = (id) =>
  document.getElementById(id);

const profileUsername =
  $("profileUsername");

const profileDate =
  $("profileDate");

const profileAbout =
  $("profileAbout");

const profileVisits =
  $("profileVisits");

const profilePosts =
  $("profilePosts");

const profileFriends =
  $("profileFriends");

const profileCommunities =
  $("profileCommunities");

const friendRequests =
  $("friendRequests");

const friendsList =
  $("friendsList");

const logoutButton =
  $("logoutButton");

const deleteAccountButton =
  $("deleteAccountButton");

const clickSound =
  $("clickSound");

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
// USUÁRIO
// ========================================

let currentUser = null;

let currentData = null;

// ========================================
// AUTH
// ========================================

onAuthStateChanged(

  auth,

  async(user)=>{

    if(!user){

      location.href =
        "index.html";

      return;

    }

    currentUser = user;

    const userRef =

      doc(
        db,
        "users",
        user.uid
      );

    try{

      await updateDoc(

        userRef,

        {

          profileVisits:
            increment(1)

        }

      );

    }

    catch(err){

      console.error(err);

    }

    const userSnap =

      await getDoc(
        userRef
      );

    if(!userSnap.exists()){

      alert(
        "Usuário não encontrado."
      );

      return;

    }

    currentData =
      userSnap.data();

    // ========================================
    // PERFIL
    // ========================================

    profileUsername.innerText =

      currentData.username ||
      "Usuário";

    if(currentData.createdAt){

      profileDate.innerText =

        "Entrou em: " +

        currentData.createdAt
        .toDate()
        .toLocaleDateString(
          "pt-BR"
        );

    }

    else{

      profileDate.innerText =

        "Entrou em: desconhecido";

    }

    profileAbout.innerText =

      currentData.about ||

      "Este usuário ainda não escreveu nada.";

    profileVisits.innerText =

      currentData.profileVisits || 0;

    // ========================================
    // POSTS
    // ========================================

    const postsQuery =

      query(

        collection(
          db,
          "posts"
        ),

        where(
          "userId",
          "==",
          currentUser.uid
        )

      );

    const postsSnap =

      await getDocs(
        postsQuery
      );

    profilePosts.innerText =
      postsSnap.size;

      // ========================================
    // AMIGOS
    // ========================================

    const friendsQuery =

      query(

        collection(
          db,
          "friends"
        ),

        where(
          "users",
          "array-contains",
          currentUser.uid
        )

      );

    const friendsSnap =

      await getDocs(
        friendsQuery
      );

    profileFriends.innerText =
      friendsSnap.size;

    // ========================================
    // COMUNIDADES
    // ========================================

    const communitiesQuery =

      query(

        collection(
          db,
          "communities"
        ),

        where(
          "members",
          "array-contains",
          currentUser.uid
        )

      );

    const communitiesSnap =

      await getDocs(
        communitiesQuery
      );

    profileCommunities.innerText =
      communitiesSnap.size;

    // ========================================
    // LISTAS
    // ========================================

    await loadFriendRequests();

    await loadFriends();

  }

);

// ========================================
// LOGOUT
// ========================================

logoutButton.onclick =
async () => {

  playClick();

  await signOut(
    auth
  );

  location.href =
    "index.html";

};

// ========================================
// EXCLUIR CONTA
// ========================================

deleteAccountButton.onclick =
async () => {

  playClick();

  const ok = confirm(

    "Deseja realmente excluir sua conta?\n\nEsta ação não poderá ser desfeita."

  );

  if(!ok)
    return;

  try{

    await deleteDoc(

      doc(
        db,
        "users",
        currentUser.uid
      )

    );

    await deleteUser(
      currentUser
    );

    alert(
      "Conta excluída com sucesso."
    );

    location.href =
      "index.html";

  }

  catch(err){

    alert(
      err.message
    );

  }

};

// ========================================
// PEDIDOS DE AMIZADE
// ========================================

async function loadFriendRequests(){

  friendRequests.innerHTML = "";

  const requestsQuery =

    query(

      collection(
        db,
        "friend_requests"
      ),

      where(
        "toUserId",
        "==",
        currentUser.uid
      ),

      where(
        "status",
        "==",
        "pending"
      )

    );

  const requestsSnap =

    await getDocs(
      requestsQuery
    );

  if(requestsSnap.empty){

    friendRequests.innerHTML = `

      <div class="community">

        Nenhum pedido.

      </div>

    `;

    return;

  }

  for(const requestDoc of requestsSnap.docs){

    const request =
      requestDoc.data();

    const senderSnap =

      await getDoc(

        doc(
          db,
          "users",
          request.fromUserId
        )

      );

    if(!senderSnap.exists())
      continue;

    const sender =
      senderSnap.data();

    const div =
      document.createElement(
        "div"
      );

    div.className =
      "community";

    div.innerHTML = `

      <strong>

        ${sender.username}

      </strong>

      <br><br>

      <button class="acceptFriend">

        Aceitar

      </button>

      <button class="rejectFriend">

        Recusar

      </button>

    `;

      // ========================================
    // ACEITAR
    // ========================================

    div.querySelector(
      ".acceptFriend"
    ).onclick = async () => {

      playClick();

      await addDoc(

        collection(
          db,
          "friends"
        ),

        {

          users: [

            currentUser.uid,

            request.fromUserId

          ],

          createdAt:
            serverTimestamp()

        }

      );

      await updateDoc(

        doc(
          db,
          "friend_requests",
          requestDoc.id
        ),

        {

          status:
            "accepted"

        }

      );

      await loadFriendRequests();

      await loadFriends();

      profileFriends.innerText =

        Number(
          profileFriends.innerText
        ) + 1;

    };

    // ========================================
    // RECUSAR
    // ========================================

    div.querySelector(
      ".rejectFriend"
    ).onclick = async () => {

      playClick();

      await deleteDoc(

        doc(
          db,
          "friend_requests",
          requestDoc.id
        )

      );

      await loadFriendRequests();

    };

    friendRequests.appendChild(
      div
    );

  }

}

// ========================================
// LISTA DE AMIGOS
// ========================================

async function loadFriends(){

  friendsList.innerHTML = "";

  const friendsQuery =

    query(

      collection(
        db,
        "friends"
      ),

      where(
        "users",
        "array-contains",
        currentUser.uid
      )

    );

  const friendsSnap =

    await getDocs(
      friendsQuery
    );

  profileFriends.innerText =
    friendsSnap.size;

  if(friendsSnap.empty){

    friendsList.innerHTML = `

      <div class="community">

        Você ainda não possui amigos.

      </div>

    `;

    return;

  }

  for(const friendDoc of friendsSnap.docs){

    const friend =
      friendDoc.data();

    const friendId =

      friend.users.find(

        uid =>

          uid !== currentUser.uid

      );

    if(!friendId)
      continue;

    const friendSnap =

      await getDoc(

        doc(
          db,
          "users",
          friendId
        )

      );

    if(!friendSnap.exists())
      continue;

    const friendData =
      friendSnap.data();

    const div =
      document.createElement(
        "div"
      );

    div.className =
      "community";

      div.innerHTML = `

      <div style="display:flex;justify-content:space-between;align-items:center;gap:10px;">

        <div>

          👤

          <a href="usuario.html?id=${friendId}">

            ${friendData.username}

          </a>

        </div>

        <button
          class="messageFriend"
        >

          Conversar

        </button>

      </div>

    `;

    div.querySelector(
      ".messageFriend"
    ).onclick = () => {

      playClick();

      location.href =

        `chat.html?user=${friendId}`;

    };

    friendsList.appendChild(
      div
    );

  }

}
