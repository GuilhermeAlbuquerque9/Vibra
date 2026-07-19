// chat.js

import {
  auth,
  db
} from "./firebase.js";

import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.13.0/firebase-auth.js";

import {

  doc,
  getDoc,

  collection,
  query,
  where,

  getDocs,

  addDoc,

  serverTimestamp,

  orderBy,

  onSnapshot

} from "https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js";

// ========================================
// ELEMENTOS
// ========================================

const $ = (id) =>
  document.getElementById(id);

const friendsList =
  $("friendsList");

const chatAvatar =
  $("chatAvatar");

const chatUsername =
  $("chatUsername");

const chatStatus =
  $("chatStatus");

const messages =
  $("messages");

const messageInput =
  $("messageInput");

const sendButton =
  $("sendButton");

const backButton =
  $("backButton");

const clickSound =
  $("clickSound");

// ========================================
// SOM
// ========================================

function playClick() {

  if(!clickSound)
    return;

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
// VARIÁVEIS
// ========================================

let currentUser = null;

let selectedFriend = null;

let selectedFriendData = null;

let currentChatId = null;

let unsubscribeMessages = null;

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

    currentUser = user;

    await loadFriends();

  }

);

// ========================================
// CARREGAR AMIGOS
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
    await getDocs(
      friendsQuery
    );

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

    const userSnap =

      await getDoc(

        doc(
          db,
          "users",
          friendId
        )

      );

    if(!userSnap.exists())
      continue;

    const data =
      userSnap.data();

    const div =
      document.createElement(
        "div"
      );

    div.className =
      "friend";

    div.innerHTML = `

      <img
        src="./assets/avatar.png">

      <div>

        <strong>

          ${data.username}

        </strong>

        <br>

        <span>

          ${data.status || "Offline"}

        </span>

      </div>

    `;

    div.onclick =
      () => {

        openChat(
          friendId,
          data
        );

      };

    friendsList.appendChild(
      div
    );

  }

}

// ========================================
// ABRIR CONVERSA
// ========================================

async function openChat(

  friendId,
  friendData

) {

  selectedFriend =
    friendId;

  selectedFriendData =
    friendData;

  chatAvatar.src =
    "./assets/avatar.png";

  chatUsername.innerText =
    friendData.username;

  chatStatus.innerText =
    friendData.status ||
    "Offline";

  messageInput.disabled =
    false;

  sendButton.disabled =
    false;

  currentChatId =

    [

      currentUser.uid,
      friendId

    ]

    .sort()

    .join("_");

  if(unsubscribeMessages) {

    unsubscribeMessages();

  }

  loadMessages();

}

// ========================================
// MENSAGENS
// ========================================

function loadMessages() {

  messages.innerHTML = "";

  const messagesQuery =

    query(

      collection(
        db,
        "private_messages"
      ),

      where(
        "chatId",
        "==",
        currentChatId
      ),

      orderBy(
        "createdAt",
        "asc"
      )

    );

  unsubscribeMessages =

    onSnapshot(

      messagesQuery,

      (snapshot) => {

        messages.innerHTML = "";

        if(snapshot.empty) {

          messages.innerHTML = `

            <div class="empty-chat">

              Ainda não há mensagens.

            </div>

          `;

          return;

        }

        snapshot.forEach(

          (messageDoc) => {

            const message =
              messageDoc.data();

            const mine =

              message.fromUserId ===
              currentUser.uid;

            const div =
              document.createElement(
                "div"
              );

            div.className =

              mine ?

              "message me"

              :

              "message friend-message";

            let hour = "";

            if(message.createdAt) {

              hour =

                message.createdAt

                .toDate()

                .toLocaleTimeString(

                  "pt-BR",

                  {

                    hour: "2-digit",

                    minute: "2-digit"

                  }

                );

            }

            div.innerHTML = `

              <div class="message-text">

                ${message.text}

              </div>

              <div class="message-time">

                ${hour}

              </div>

            `;

            messages.appendChild(
              div
            );

          }

        );

        messages.scrollTop =
          messages.scrollHeight;

      }

    );

}

// ========================================
// ENVIAR MENSAGEM
// ========================================

async function sendMessage() {

  const text =
    messageInput.value.trim();

  if(!text)
    return;

  if(!selectedFriend)
    return;

  await addDoc(

    collection(
      db,
      "private_messages"
    ),

    {

      chatId:
        currentChatId,

      fromUserId:
        currentUser.uid,

      toUserId:
        selectedFriend,

      text,

      createdAt:
        serverTimestamp()

    }

  );

  messageInput.value = "";

  messageInput.focus();

}

// ========================================
// BOTÃO ENVIAR
// ========================================

sendButton.onclick =
  sendMessage;

// ========================================
// ENTER
// ========================================

messageInput.addEventListener(

  "keydown",

  (event) => {

    if(event.key === "Enter") {

      event.preventDefault();

      sendMessage();

    }

  }

);

// ========================================
// BOTÃO VOLTAR
// ========================================

backButton.onclick = () => {

  playClick();

  location.href =
    "perfil.html";

};

// ========================================
// LIMPEZA
// ========================================

window.addEventListener(

  "beforeunload",

  () => {

    if(unsubscribeMessages) {

      unsubscribeMessages();

    }

  }

);
