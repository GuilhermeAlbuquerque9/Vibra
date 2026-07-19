// perfil.js

// IMPORTS

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
  query,
  where,
  collection,
  getDocs,
  deleteDoc,
  addDoc,
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

const profileEmail =
  $("profileEmail");

const profileDate =
  $("profileDate");

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

function playClick() {

  if(!clickSound) return;

  clickSound.currentTime = 0;
  clickSound.play();

}

document.addEventListener(

  "click",

  (e) => {

    if(e.target.tagName === "BUTTON") {

      playClick();

    }

  }

);

// ========================================
// USUÁRIO
// ========================================

let currentUser = null;

// ========================================
// AUTH
// ========================================

onAuthStateChanged(

  auth,

  async (user) => {

    if(!user) {

      location.href =
        "index.html";

      return;

    }

    currentUser =
      user;

    const userRef =

      doc(
        db,
        "users",
        user.uid
      );

    await updateDoc(

      userRef,

      {

        profileVisits:
          increment(1)

      }

    );

    const snap =
      await getDoc(userRef);

    const data =
      snap.data();

    // PERFIL

    profileUsername.innerText =

      data.username ||
      "Usuário";

    profileEmail.innerText =

      data.email ||
      "";

    if(data.createdAt) {

      profileDate.innerText =

        "Entrou em: " +

        data.createdAt
        .toDate()
        .toLocaleDateString(
          "pt-BR"
        );

    }

    profileVisits.innerText =

      data.profileVisits || 0;

    // ========================================
    // AMIGOS
    // Agora usa SOMENTE a coleção "friends"
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
          user.uid
        )

      );

    const friendsSnap =

      await getDocs(
        friendsQuery
      );

    profileFriends.innerText =

      friendsSnap.size;

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
          user.uid
        )

      );

    const postsSnap =

      await getDocs(
        postsQuery
      );

    profilePosts.innerText =

      postsSnap.size;

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

          user.uid

        )

      );

    const communitiesSnap =

      await getDocs(
        communitiesQuery
      );

    profileCommunities.innerText =

      communitiesSnap.size;

    // ========================================
    // CARREGA LISTAS
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

  await signOut(auth);

  location.href =
    "index.html";

};

// ========================================
// DELETAR CONTA
// ========================================

deleteAccountButton.onclick =
async () => {

  const confirmDelete =

    confirm(
      "Deseja deletar sua conta?"
    );

  if(!confirmDelete)
    return;

  try {

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
      "Conta deletada."
    );

    location.href =
      "index.html";

  }

  catch(err) {

    alert(
      err.message
    );

  }

};

// ========================================
// PEDIDOS DE AMIZADE
// ========================================

async function loadFriendRequests() {

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
    await getDocs(requestsQuery);

  if(requestsSnap.empty) {

    friendRequests.innerHTML = `

      <div class="community">

        Nenhum pedido de amizade.

      </div>

    `;

    return;

  }

  for(const requestDoc of requestsSnap.docs) {

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

    // ACEITAR

    div.querySelector(
      ".acceptFriend"
    ).onclick = async () => {

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

    // RECUSAR

    div.querySelector(
      ".rejectFriend"
    ).onclick = async () => {

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

async function loadFriends() {

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
    await getDocs(friendsQuery);

  // Atualiza o contador usando
  // somente a coleção friends

  profileFriends.innerText =
    friendsSnap.size;

  if(friendsSnap.empty) {

    friendsList.innerHTML = `

      <div class="community">

        Você ainda não possui amigos.

      </div>

    `;

    return;

  }

  for(const friendDoc of friendsSnap.docs) {

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

      👤

      <a href="usuario.html?id=${friendId}">

        ${friendData.username}

      </a>

      <button
        class="messageFriend"
      >

        Conversar

      </button>

    `;

    div.querySelector(
      ".messageFriend"
    ).onclick = () => {

      location.href =
        `chat.html?user=${friendId}`;

    };

    friendsList.appendChild(
      div
    );

  }

}
