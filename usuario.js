// usuario.js

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
  getDocs

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

const userEmail =
  $("userEmail");

const userJoined =
  $("userJoined");

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
// USUÁRIO
// ========================================

let viewedUser = null;
let viewedData = null;

// ========================================
// AUTH
// ========================================

onAuthStateChanged(

  auth,

  async () => {

    if(!userId) {

      location.href =
        "index.html";

      return;

    }

    const userRef =
      doc(
        db,
        "users",
        userId
      );

    const snap =
      await getDoc(userRef);

    if(!snap.exists()) {

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
      snap.data();

    // AVATAR

    userAvatar.src =
      "./assets/avatar.png";

    // NOME

    userName.innerText =

      viewedData.username ||

      "Usuário";

    // EMAIL

    userEmail.innerText =

      viewedData.email ||

      "";

    // DATA DE ENTRADA

    if(viewedData.createdAt) {

      const date =

        viewedData.createdAt
        .toDate();

      userJoined.innerText =

        "Entrou em: " +

        date.toLocaleDateString(
          "pt-BR"
        );

    }

    else {

      userJoined.innerText =

        "Entrou em: desconhecido";

    }

    // AMIGOS

    userFriends.innerText =

      viewedData.friends
      ?.length || 0;

    // COMUNIDADES

    const communityQuery =

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

    const communitySnap =

      await getDocs(
        communityQuery
      );

    userCommunities.innerText =

      communitySnap.size;

    // Os posts serão carregados
    // na Parte 2.

  }

);
// ========================================
// POSTS DO USUÁRIO
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

if(postsSnap.empty) {

  postsContainer.innerHTML = `

    <div class="community">

      Este usuário ainda não publicou nada.

    </div>

  `;

}

else {

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

      postsContainer
      .appendChild(div);

    }

  );

}

// ========================================
// BOTÃO DE AMIZADE
// ========================================

friendButton.onclick = () => {

  playClick();

  alert(

    "O sistema de amizade será implementado na próxima atualização."

  );

};

// ========================================
// BOTÃO DE MENSAGEM
// ========================================

messageButton.onclick = () => {

  playClick();

  alert(

    "O chat será implementado em breve."

  );

};
