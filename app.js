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
  getDocs,
  doc,
  updateDoc,
  increment,
  deleteDoc,
  getDoc,
  setDoc

}
from "https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js";

// ========================================
// ELEMENTOS
// ========================================

const email =
  document.getElementById("email");

const password =
  document.getElementById("password");

const username =
  document.getElementById("username");

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

const searchButton =
  document.getElementById("searchButton");

const searchInput =
  document.getElementById("searchInput");

const searchResults =
  document.getElementById("searchResults");

const onlineCounter =
  document.getElementById("onlineCounter");

const visitCounter =
  document.getElementById("visitCounter");

const communityContainer =
  document.getElementById("communityContainer");

// ========================================
// VARIÁVEIS
// ========================================

let currentUser = null;
let currentUsername = null;

// ========================================
// VISITAS
// ========================================

async function registerVisit() {

  const visitRef =
    doc(db, "site", "visits");

  const snap =
    await getDoc(visitRef);

  if(!snap.exists()) {

    await setDoc(visitRef, {

      count: 1

    });

  }

  else {

    await updateDoc(visitRef, {

      count:
        increment(1)

    });

  }

}

async function loadVisits() {

  const visitRef =
    doc(db, "site", "visits");

  const snap =
    await getDoc(visitRef);

  if(snap.exists()) {

    visitCounter.innerText =
      "👁️ " +
      snap.data().count +
      " visitas";

  }

}

registerVisit();
loadVisits();

// ========================================
// CADASTRO
// ========================================

registerButton.addEventListener(

  "click",

  async () => {

    if(

      username.value === "" ||
      email.value === "" ||
      password.value === ""

    ) {

      alert(
        "Preencha tudo!"
      );

      return;

    }

    try {

      const userCredential =

        await createUserWithEmailAndPassword(

          auth,
          email.value,
          password.value

        );

      const user =
        userCredential.user;

      await setDoc(

        doc(db, "users", user.uid),

        {

          username:
            username.value,

          email:
            email.value,

          active:
            true,

          createdAt:
            serverTimestamp()

        }

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

// ========================================
// LOGIN
// ========================================

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

// ========================================
// LOGOUT
// ========================================

logoutButton.addEventListener(

  "click",

  async () => {

    if(currentUser) {

      await updateDoc(

        doc(db, "users", currentUser.uid),

        {

          active: false

        }

      );

    }

    await signOut(auth);

  }

);

// ========================================
// LOGIN DETECTION
// ========================================

onAuthStateChanged(

  auth,

  async (user) => {

    if(user) {

      currentUser = user;

      const userRef =
        doc(db, "users", user.uid);

      const snap =
        await getDoc(userRef);

      if(snap.exists()) {

        currentUsername =
          snap.data().username;

      }

      else {

        currentUsername =
          "Usuário";

      }

      await updateDoc(

        userRef,

        {

          active: true

        }

      );

    }

    else {

      currentUser = null;
      currentUsername = null;

    }

  }

);

// ========================================
// USUÁRIOS ONLINE
// ========================================

onSnapshot(

  collection(db, "users"),

  (snapshot) => {

    let online = 0;

    snapshot.forEach(

      (doc) => {

        if(doc.data().active) {

          online++;

        }

      }

    );

    onlineCounter.innerText =
      "🟢 " +
      online +
      " usuários ativos";

  }

);

// ========================================
// PUBLICAR POST
// ========================================

postButton.addEventListener(

  "click",

  async () => {

    if(!currentUser) {

      alert(
        "Faça login!"
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

        username:
          currentUsername,

        userId:
          currentUser.uid,

        text:
          postInput.value,

        likes: 0,
        dislikes: 0,

        likedBy: [],
        dislikedBy: [],

        createdAt:
          serverTimestamp()

      }

    );

    postInput.value = "";

  }

);

// ========================================
// POSTS
// ========================================

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

      (postDoc) => {

        const post =
          postDoc.data();

        const postId =
          postDoc.id;

        const div =
          document.createElement("div");

        div.classList.add("post");

        div.innerHTML = `

          <h3>
            ${post.username || "Usuário"}
          </h3>

          <p>
            ${post.text}
          </p>

          <div class="post-buttons">

            <button class="likeButton">
              👍 ${post.likes || 0}
            </button>

            <button class="dislikeButton">
              👎 ${post.dislikes || 0}
            </button>

            <button class="commentButton">
              💬 Comentar
            </button>

            <button class="hideButton">
              🚫 Ocultar
            </button>

            ${
              currentUser &&
              currentUser.uid === post.userId

              ?

              `
              <button class="deleteButton">
                🗑️ Excluir
              </button>
              `

              :

              ""

            }

          </div>

        `;

        // LIKE

        div
        .querySelector(".likeButton")

        .addEventListener(

          "click",

          async () => {

            if(!currentUser) return;

            const alreadyLiked =
              post.likedBy?.includes(
                currentUser.uid
              );

            if(alreadyLiked) {

              return;

            }

            await updateDoc(

              doc(
                db,
                "posts",
                postId
              ),

              {

                likes:
                  increment(1),

                likedBy: [

                  ...(post.likedBy || []),

                  currentUser.uid

                ]

              }

            );

          }

        );

        // DISLIKE

        div
        .querySelector(".dislikeButton")

        .addEventListener(

          "click",

          async () => {

            if(!currentUser) return;

            const alreadyDisliked =
              post.dislikedBy?.includes(
                currentUser.uid
              );

            if(alreadyDisliked) {

              return;

            }

            await updateDoc(

              doc(
                db,
                "posts",
                postId
              ),

              {

                dislikes:
                  increment(1),

                dislikedBy: [

                  ...(post.dislikedBy || []),

                  currentUser.uid

                ]

              }

            );

          }

        );

        // OCULTAR

        div
        .querySelector(".hideButton")

        .addEventListener(

          "click",

          () => {

            div.style.display =
              "none";

          }

        );

        // COMENTAR

        div
        .querySelector(".commentButton")

        .addEventListener(

          "click",

          async () => {

            const comment =
              prompt(
                "Comentário:"
              );

            if(!comment) return;

            await addDoc(

              collection(
                db,
                "comments"
              ),

              {

                postId,

                username:
                  currentUsername,

                text:
                  comment,

                createdAt:
                  serverTimestamp()

              }

            );

            alert(
              "Comentário enviado!"
            );

          }

        );

        // EXCLUIR

        const deleteButton =
          div.querySelector(
            ".deleteButton"
          );

        if(deleteButton) {

          deleteButton.addEventListener(

            "click",

            async () => {

              const confirmDelete =

                confirm(
                  "Excluir post?"
                );

              if(confirmDelete) {

                await deleteDoc(

                  doc(
                    db,
                    "posts",
                    postId
                  )

                );

              }

            }

          );

        }

        postsContainer
        .appendChild(div);

      }

    );

  }

);

// ========================================
// COMUNIDADES
// ========================================

onSnapshot(

  collection(db, "communities"),

  (snapshot) => {

    communityContainer.innerHTML = "";

    if(snapshot.empty) {

      communityContainer.innerHTML = `

        <div class="community">
          Nenhuma comunidade ainda.
        </div>

      `;

      return;

    }

    snapshot.forEach(

      (communityDoc) => {

        const community =
          communityDoc.data();

        const div =
          document.createElement("div");

        div.classList.add(
          "community"
        );

        div.innerHTML = `

          🌎 ${community.name}

        `;

        communityContainer
        .appendChild(div);

      }

    );

  }

);

// ========================================
// BUSCA REAL
// ========================================

searchButton.addEventListener(

  "click",

  async () => {

    const search =
      searchInput.value
      .toLowerCase();

    searchResults.innerHTML = "";

    const snapshot =
      await getDocs(
        collection(db, "users")
      );

    snapshot.forEach(

      (userDoc) => {

        const user =
          userDoc.data();

        if(

          user.username
          ?.toLowerCase()

          .includes(search)

        ) {

          const div =
            document.createElement("div");

          div.classList.add(
            "community"
          );

          div.innerText =
            user.username;

          searchResults
          .appendChild(div);

        }

      }

    );

    if(searchResults.innerHTML === "") {

      searchResults.innerHTML =

        "Nenhum usuário encontrado.";

    }

  }

);

