// usuario.js

// ========================================
// IMPORTS
// ========================================

import {
  auth,
  db
}
from "./firebase.js";

import {

  onAuthStateChanged

}
from "https://www.gstatic.com/firebasejs/12.13.0/firebase-auth.js";

import {

  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp

}
from "https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js";

// ========================================
// ELEMENTOS
// ========================================

const $ = (id) =>
  document.getElementById(id);

const userAvatar =
  $("userAvatar");

const userName =
  $("userName");

const userJoined =
  $("userJoined");

const userAbout =
  $("userAbout");

const userPosts =
  $("userPosts");

const userFriends =
  $("userFriends");

const userCommunities =
  $("userCommunities");

const postsContainer =
  $("postsContainer");

const friendButton =
  $("friendButton");

const messageButton =
  $("messageButton");

const clickSound =
  $("clickSound");

// ========================================
// SOM
// ========================================

function playClick() {

  if(!clickSound) return;

  clickSound.currentTime = 0;

  clickSound.play();

}

document.addEventListener(

  "click",

  (event) => {

    if(event.target.tagName === "BUTTON") {

      playClick();

    }

  }

);

// ========================================
// PARÂMETROS
// ========================================

const params =

  new URLSearchParams(
    location.search
  );

const userId =
  params.get("id");

// ========================================
// USUÁRIOS
// ========================================

let currentUser = null;

let currentData = null;

let viewedUser = null;

let viewedData = null;

let friendshipStatus = "none";

let requestId = null;

// ========================================
// AUTH
// ========================================

onAuthStateChanged(

  auth,

  async (user) => {

    if(!user){

      location.href =
        "index.html";

      return;

    }

    currentUser = user;

    const currentRef =

      doc(
        db,
        "users",
        user.uid
      );

    const currentSnap =

      await getDoc(
        currentRef
      );

    if(currentSnap.exists()){

      currentData =
        currentSnap.data();

    }

    if(!userId){

      location.href =
        "buscar.html";

      return;

    }

    const viewedRef =

      doc(
        db,
        "users",
        userId
      );

    const viewedSnap =

      await getDoc(
        viewedRef
      );

    if(!viewedSnap.exists()){

      alert(
        "Usuário não encontrado."
      );

      location.href =
        "buscar.html";

      return;

    }

    viewedUser =
      userId;

    viewedData =
      viewedSnap.data();

    userAvatar.src =
      "./assets/avatar.png";

    userName.innerText =

      viewedData.username ||
      "Usuário";

    if(viewedData.createdAt){

      userJoined.innerText =

        "Entrou em: " +

        viewedData.createdAt
        .toDate()
        .toLocaleDateString(
          "pt-BR"
        );

    }

    else{

      userJoined.innerText =

        "Entrou em: desconhecido";

    }

    userAbout.innerText =

      viewedData.about ||

      "Este usuário ainda não escreveu nada.";

    // ========================================
    // AMIGOS
    // Agora usa somente a coleção friends
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
          viewedUser
        )

      );

    const friendsSnap =

      await getDocs(
        friendsQuery
      );

    userFriends.innerText =

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
          viewedUser
        )

      );

    const communitiesSnap =

      await getDocs(
        communitiesQuery
      );

    userCommunities.innerText =

      communitiesSnap.size;

    // ========================================
    // POSTS
    // ========================================

    await loadPosts();

    // ========================================
    // AMIZADE
    // ========================================

    await updateFriendButton();

  }

);

// ========================================
// POSTS
// ========================================

async function loadPosts() {

  const postsQuery =

    query(

      collection(
        db,
        "posts"
      ),

      where(
        "userId",
        "==",
        viewedUser
      )

    );

  const postsSnap =

    await getDocs(
      postsQuery
    );

  userPosts.innerText =

    postsSnap.size;

  postsContainer.innerHTML = "";

  if(postsSnap.empty){

    postsContainer.innerHTML = `

      <div class="community">

        Este usuário ainda não publicou nada.

      </div>

    `;

    return;

  }

  postsSnap.forEach(

    (postDoc) => {

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

          ${viewedData.username}

        </h3>

        <p>

          ${post.text}

        </p>

        <div class="post-buttons">

          👍 ${post.likes || 0}

          &nbsp;&nbsp;

          👎 ${post.dislikes || 0}

        </div>

      `;

      postsContainer.appendChild(
        div
      );

    }

  );

}

// ========================================
// SISTEMA DE AMIZADE
// ========================================

async function updateFriendButton() {

  // PRÓPRIO PERFIL

  if(currentUser.uid === viewedUser){

    friendButton.style.display =
      "none";

    messageButton.style.display =
      "none";

    return;

  }

  // ========================================
  // JÁ SÃO AMIGOS?
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

  let isFriend = false;

  friendsSnap.forEach(

    (friendDoc) => {

      const friend =
        friendDoc.data();

      if(

        friend.users.includes(
          viewedUser
        )

      ){

        isFriend = true;

      }

    }

  );

  if(isFriend){

    friendshipStatus =
      "friends";

    friendButton.innerText =
      "✓ Amigos";

    messageButton.disabled =
      false;

    return;

  }

  // ========================================
  // PEDIDO ENVIADO
  // ========================================

  const sentQuery =

    query(

      collection(
        db,
        "friend_requests"
      ),

      where(
        "fromUserId",
        "==",
        currentUser.uid
      ),

      where(
        "toUserId",
        "==",
        viewedUser
      )

    );

  const sentSnap =

    await getDocs(
      sentQuery
    );

  if(!sentSnap.empty){

    requestId =
      sentSnap.docs[0].id;

    friendshipStatus =
      sentSnap.docs[0]
      .data()
      .status;

    if(friendshipStatus === "pending"){

      friendButton.innerText =
        "Cancelar pedido";

      messageButton.disabled =
        true;

      return;

    }

  }

  // ========================================
  // PEDIDO RECEBIDO
  // ========================================

  const receivedQuery =

    query(

      collection(
        db,
        "friend_requests"
      ),

      where(
        "fromUserId",
        "==",
        viewedUser
      ),

      where(
        "toUserId",
        "==",
        currentUser.uid
      )

    );

  const receivedSnap =

    await getDocs(
      receivedQuery
    );

  if(!receivedSnap.empty){

    requestId =
      receivedSnap.docs[0].id;

    friendshipStatus =
      "received";

    friendButton.innerText =
      "Aceitar pedido";

    messageButton.disabled =
      true;

    return;

  }

  // ========================================
  // SEM AMIZADE
  // ========================================

  friendshipStatus =
    "none";

  requestId = null;

  friendButton.innerText =
    "➕ Enviar pedido de amizade";

  messageButton.disabled =
    true;

}

// ========================================
// BOTÃO DE AMIZADE
// ========================================

friendButton.onclick =
async () => {

  playClick();

  switch(friendshipStatus){

    // ====================================
    // NOVO PEDIDO
    // ====================================

    case "none":

      await addDoc(

        collection(
          db,
          "friend_requests"
        ),

        {

          fromUserId:
            currentUser.uid,

          toUserId:
            viewedUser,

          status:
            "pending",

          createdAt:
            serverTimestamp()

        }

      );

      break;

    // ====================================
    // CANCELAR PEDIDO
    // ====================================

    case "pending":

      if(requestId){

        await deleteDoc(

          doc(
            db,
            "friend_requests",
            requestId
          )

        );

      }

      break;

    // ====================================
    // ACEITAR PEDIDO
    // ====================================

    case "received":

      await addDoc(

        collection(
          db,
          "friends"
        ),

        {

          users: [

            currentUser.uid,

            viewedUser

          ],

          createdAt:
            serverTimestamp()

        }

      );

      await updateDoc(

        doc(
          db,
          "friend_requests",
          requestId
        ),

        {

          status:
            "accepted"

        }

      );

      break;

    // ====================================
    // JÁ SÃO AMIGOS
    // ====================================

    case "friends":

      alert(
        "Vocês já são amigos."
      );

      break;

  }

  // Atualiza contador

  const newFriendsQuery =

    query(

      collection(
        db,
        "friends"
      ),

      where(
        "users",
        "array-contains",
        viewedUser
      )

    );

  const newFriendsSnap =

    await getDocs(
      newFriendsQuery
    );

  userFriends.innerText =
    newFriendsSnap.size;

  await updateFriendButton();

};

// ========================================
// BOTÃO DE MENSAGEM
// ========================================

messageButton.onclick = () => {

  playClick();

  if(friendshipStatus !== "friends"){

    alert(

      "Você precisa ser amigo deste usuário para conversar."

    );

    return;

  }

  location.href =

    `chat.html?user=${viewedUser}`;

};
