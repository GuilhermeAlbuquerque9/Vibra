// app.js

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
  serverTimestamp,
  query,
  orderBy,
  onSnapshot,
  getDocs

}
from "https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js";

// ELEMENTOS

const email =
  document.getElementById("email");

const password =
  document.getElementById("password");

const loginButton =
  document.getElementById("loginButton");

const registerButton =
  document.getElementById("registerButton");

const logoutButton =
  document.getElementById("logoutButton");

const postInput =
  document.getElementById("postInput");

const postButton =
  document.getElementById("postButton");

const postsContainer =
  document.getElementById("postsContainer");

const onlineCounter =
  document.getElementById("onlineCounter");

const searchButton =
  document.getElementById("searchButton");

const searchInput =
  document.getElementById("searchInput");

const searchResults =
  document.getElementById("searchResults");

// USUÁRIO

let currentUser = null;

// CADASTRO

registerButton.addEventListener(
  "click",

  async () => {

    if(
      email.value === "" ||
      password.value === ""
    ) {

      alert(
        "Preencha os campos!"
      );

      return;

    }

    try {

      await createUserWithEmailAndPassword(

        auth,
        email.value,
        password.value

      );

      alert(
        "Conta criada!"
      );

    }

    catch(error) {

      alert(
        error.message
      );

    }

  }

);

// LOGIN

loginButton.addEventListener(

  "click",

  async () => {

    try {

      await signInWithEmailAndPassword(

        auth,
        email.value,
        password.value

      );

      alert(
        "Login realizado!"
      );

    }

    catch(error) {

      alert(
        error.message
      );

    }

  }

);

// LOGOUT

logoutButton.addEventListener(

  "click",

  async () => {

    await signOut(auth);

    alert(
      "Você saiu."
    );

  }

);

// DETECTAR LOGIN

onAuthStateChanged(

  auth,

  (user) => {

    if(user) {

      currentUser = user;

      onlineCounter.innerText =
        "🟢 Usuário conectado: " +
        user.email;

    }

    else {

      currentUser = null;

      onlineCounter.innerText =
        "🔴 Nenhum usuário conectado.";

    }

  }

);

// PUBLICAR POST

postButton.addEventListener(

  "click",

  async () => {

    if(!currentUser) {

      alert(
        "Faça login primeiro!"
      );

      return;

    }

    if(postInput.value === "") {

      alert(
        "Digite algo!"
      );

      return;

    }

    await addDoc(

      collection(db, "posts"),

      {

        user:
          currentUser.email,

        text:
          postInput.value,

        createdAt:
          serverTimestamp()

      }

    );

    postInput.value = "";

  }

);

// POSTS EM TEMPO REAL

const postsQuery =
  query(

    collection(db, "posts"),

    orderBy(
      "createdAt",
      "desc"
    )

  );

onSnapshot(

  postsQuery,

  (snapshot) => {

    postsContainer.innerHTML = "";

    snapshot.forEach(

      (doc) => {

        const post =
          doc.data();

        const div =
          document.createElement("div");

        div.classList.add("post");

        div.innerHTML = `

          <h3>
            ${post.user}
          </h3>

          <p>
            ${post.text}
          </p>

          <div class="post-buttons">

            <button>
              👍 Like
            </button>

            <button>
              👎 Dislike
            </button>

            <button>
              💬 Comentar
            </button>

            <button>
              🚫 Ocultar
            </button>

          </div>

        `;

        postsContainer.appendChild(div);

      }

    );

  }

);

// BUSCA

searchButton.addEventListener(

  "click",

  async () => {

    const snapshot =
      await getDocs(
        collection(db, "posts")
      );

    searchResults.innerHTML = "";

    snapshot.forEach(

      (doc) => {

        const post =
          doc.data();

        if(

          post.user
          .toLowerCase()

          .includes(

            searchInput.value
            .toLowerCase()

          )

        ) {

          const div =
            document.createElement("div");

          div.classList.add(
            "community"
          );

          div.innerText =
            post.user;

          searchResults.appendChild(
            div
          );

        }

      }

    );

  }

);