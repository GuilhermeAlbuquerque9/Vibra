// comunidade.js

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
  updateDoc,
  deleteDoc,
  collection,
  addDoc,
  serverTimestamp,
  increment,
  arrayUnion,
  arrayRemove,
  query,
  where,
  orderBy,
  onSnapshot

}
from "https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js";

// ========================================
// ELEMENTOS
// ========================================

const $ = (id) =>
  document.getElementById(id);

const communityName =
  $("communityName");

const communityDescription =
  $("communityDescription");

const communityOwner =
  $("communityOwner");

const communityMembers =
  $("communityMembers");

const communityCreated =
  $("communityCreated");

const joinButton =
  $("joinButton");

const deleteCommunityButton =
  $("deleteCommunityButton");

const messageInput =
  $("messageInput");

const sendMessageButton =
  $("sendMessageButton");

const messagesContainer =
  $("messagesContainer");

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

    if(

      event.target.tagName ===
      "BUTTON"

    ) {

      playClick();

    }

  }

);

// ========================================
// URL
// ========================================

const params =
  new URLSearchParams(
    location.search
  );

const communityId =
  params.get("id");

// ========================================
// VARIÁVEIS
// ========================================

let currentUser = null;

let currentUsername = "";

let communityData = null;

// ========================================
// AUTH
// ========================================

onAuthStateChanged(

  auth,

  async (user) => {

    if(!user) {

      alert(
        "Faça login para acessar comunidades."
      );

      location.href =
        "index.html";

      return;

    }

    currentUser = user;

    const userSnap =
      await getDoc(

        doc(
          db,
          "users",
          user.uid
        )

      );

    if(userSnap.exists()) {

      currentUsername =

        userSnap.data().username ||

        "Usuário";

    }

    loadCommunity();

  }

);

// ========================================
// CARREGAR COMUNIDADE
// ========================================

async function loadCommunity() {

  if(!communityId) {

    alert(
      "Comunidade inválida."
    );

    location.href =
      "comunidades.html";

    return;

  }

  const ref =
    doc(
      db,
      "communities",
      communityId
    );

  const snap =
    await getDoc(ref);

  if(!snap.exists()) {

    alert(
      "Comunidade não encontrada."
    );

    location.href =
      "comunidades.html";

    return;

  }

  communityData =
    snap.data();

  communityName.innerText =

    communityData.name;

  communityDescription.innerText =

    communityData.description;

  communityMembers.innerText =

    communityData.memberCount || 0;

  // DATA

  if(

    communityData.createdAt

  ) {

    communityCreated.innerText =

      communityData.createdAt

      .toDate()

      .toLocaleDateString(

        "pt-BR"

      );

  }

  else {

    communityCreated.innerText =
      "--";

  }

  // CRIADOR

  const ownerSnap =

    await getDoc(

      doc(

        db,

        "users",

        communityData.ownerId

      )

    );

  if(ownerSnap.exists()) {

    communityOwner.innerText =

      ownerSnap.data().username ||

      "Usuário";

  }

  else {

    communityOwner.innerText =
      "Desconhecido";

  }

  // BOTÃO ENTRAR/SAIR

  const joined =

    communityData.members
    ?.includes(
      currentUser.uid
    );

  joinButton.innerText =

    joined

    ?

    "Sair da Comunidade"

    :

    "Entrar na Comunidade";

  // BOTÃO EXCLUIR

  if(

    communityData.ownerId ===

    currentUser.uid

  ) {

    deleteCommunityButton.style.display =

      "inline-block";

  }

}

// ========================================
// ENTRAR / SAIR DA COMUNIDADE
// ========================================

joinButton.onclick = async () => {

  playClick();

  const ref =
    doc(
      db,
      "communities",
      communityId
    );

  const joined =

    communityData.members
    ?.includes(
      currentUser.uid
    );

  if(joined) {

    await updateDoc(

      ref,

      {

        members:

          arrayRemove(
            currentUser.uid
          ),

        memberCount:

          increment(-1)

      }

    );

  }

  else {

    await updateDoc(

      ref,

      {

        members:

          arrayUnion(
            currentUser.uid
          ),

        memberCount:

          increment(1)

      }

    );

  }

  loadCommunity();

};

// ========================================
// CHAT DA COMUNIDADE
// ========================================

const messagesQuery =

  query(

    collection(
      db,
      "community_messages"
    ),

    where(
      "communityId",
      "==",
      communityId
    ),

    orderBy(
      "createdAt",
      "asc"
    )

  );

onSnapshot(

  messagesQuery,

  (snapshot) => {

    messagesContainer.innerHTML = "";

    if(snapshot.empty) {

      messagesContainer.innerHTML = `

        <div class="community">

          Nenhuma mensagem ainda.

        </div>

      `;

      return;

    }

    snapshot.forEach(

      (messageDoc) => {

        const message =
          messageDoc.data();

        const div =
          document.createElement(
            "div"
          );

        div.className =
          "community";

        div.innerHTML = `

          <strong>

            ${message.username}

          </strong>

          <br>

          ${message.text}

          <br><br>

          <small>

            ${
              message.createdAt

              ?

              message.createdAt
              .toDate()
              .toLocaleString("pt-BR")

              :

              ""

            }

          </small>

          ${
            message.userId === currentUser.uid

            ?

            `

            <br><br>

            <button
              class="deleteMessageButton"
            >

              Excluir

            </button>

            `

            :

            ""

          }

        `;

        const deleteButton =

          div.querySelector(
            ".deleteMessageButton"
          );

        if(deleteButton) {

          deleteButton.onclick =
          async () => {

            playClick();

            if(

              confirm(
                "Excluir mensagem?"
              )

            ) {

              await deleteDoc(

                doc(

                  db,

                  "community_messages",

                  messageDoc.id

                )

              );

            }

          };

        }

        messagesContainer
        .appendChild(div);

      }

    );

    messagesContainer.scrollTop =

      messagesContainer.scrollHeight;

  }

);

// ========================================
// ENVIAR MENSAGEM
// ========================================

sendMessageButton.onclick =
async () => {

  playClick();

  const text =

    messageInput.value
    .trim();

  if(text === "")
    return;

  const joined =

    communityData.members
    ?.includes(
      currentUser.uid
    );

  if(!joined) {

    alert(

      "Entre na comunidade para conversar."

    );

    return;

  }

  await addDoc(

    collection(
      db,
      "community_messages"
    ),

    {

      communityId,

      userId:
        currentUser.uid,

      username:
        currentUsername,

      text,

      createdAt:
        serverTimestamp()

    }

  );

  messageInput.value = "";

};

// ========================================
// EXCLUIR COMUNIDADE
// ========================================

deleteCommunityButton.onclick =
async () => {

  playClick();

  if(

    !confirm(

      "Deseja realmente excluir esta comunidade?"

    )

  ) {

    return;

  }

  await deleteDoc(

    doc(

      db,

      "communities",

      communityId

    )

  );

  alert(

    "Comunidade excluída."

  );

  location.href =
    "comunidades.html";

};
