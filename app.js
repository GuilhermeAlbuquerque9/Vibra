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
  setDoc,
  arrayUnion,
  arrayRemove

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

const onlineCounter =
  document.getElementById("onlineCounter");

const visitCounter =
  document.getElementById("visitCounter");

const searchButton =
  document.getElementById("searchButton");

const searchInput =
  document.getElementById("searchInput");

const searchResults =
  document.getElementById("searchResults");

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

    await updateDoc(

      visitRef,

      {

        count:
          increment(1)

      }

    );

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

          active: true,

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

      const userRef =
        doc(
          db,
          "users",
          currentUser.uid
        );

      const snap =
        await getDoc(userRef);

      if(snap.exists()) {

        await updateDoc(

          userRef,

          {

            active: false

          }

        );

      }

    }

    await signOut(auth);

  }

);

// ========================================
// AUTH
// ========================================

onAuthStateChanged(

  auth,

  async (user) => {

    if(user) {

      currentUser = user;

      const userRef =
        doc(
          db,
          "users",
          user.uid
        );

      const snap =
        await getDoc(userRef);

      // CASO O USER NÃO EXISTA

      if(!snap.exists()) {

        await setDoc(

          userRef,

          {

            username:
              "Usuário",

            email:
              user.email,

            active: true,

            createdAt:
              serverTimestamp()

          }

        );

        currentUsername =
          "Usuário";

      }

      else {

        currentUsername =
          snap.data().username;

        await updateDoc(

          userRef,

          {

            active: true

          }

        );

      }

    }

    else {

      currentUser = null;
      currentUsername = null;

    }

  }

);

// ========================================
// ONLINE
// ========================================

onSnapshot(

  collection(db, "users"),

  (snapshot) => {

    let online = 0;

    snapshot.forEach(

      (userDoc) => {

        const user =
          userDoc.data();

        if(user.active) {

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

        comments: [],

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

        const liked =
          currentUser &&
          post.likedBy?.includes(
            currentUser.uid
          );

        const disliked =
          currentUser &&
          post.dislikedBy?.includes(
            currentUser.uid
          );

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

          <div class="commentsArea">

            ${
              (post.comments || [])

              .map(

                (comment) => `

                  <div class="community">

                    <strong>

                      ${comment.username}

                    </strong>

                    <br>

                    ${comment.text}

                  </div>

                `

              )

              .join("")

            }

          </div>

        `;

        // ========================================
        // LIKE TOGGLE
        // ========================================

        div
        .querySelector(".likeButton")

        .addEventListener(

          "click",

          async () => {

            if(!currentUser) return;

            const postRef =
              doc(
                db,
                "posts",
                postId
              );

            if(liked) {

              await updateDoc(

                postRef,

                {

                  likes:
                    increment(-1),

                  likedBy:
                    arrayRemove(
                      currentUser.uid
                    )

                }

              );

            }

            else {

              await updateDoc(

                postRef,

                {

                  likes:
                    increment(1),

                  likedBy:
                    arrayUnion(
                      currentUser.uid
                    )

                }

              );

            }

          }

        );

        // ========================================
        // DISLIKE TOGGLE
        // ========================================

        div
        .querySelector(".dislikeButton")

        .addEventListener(

          "click",

          async () => {

            if(!currentUser) return;

            const postRef =
              doc(
                db,
                "posts",
                postId
              );

            if(disliked) {

              await updateDoc(

                postRef,

                {

                  dislikes:
                    increment(-1),

                  dislikedBy:
                    arrayRemove(
                      currentUser.uid
                    )

                }

              );

            }

            else {

              await updateDoc(

                postRef,

                {

                  dislikes:
                    increment(1),

                  dislikedBy:
                    arrayUnion(
                      currentUser.uid
                    )

                }

              );

            }

          }

        );

        // ========================================
        // OCULTAR
        // ========================================

        div
        .querySelector(".hideButton")

        .addEventListener(

          "click",

          () => {

            div.style.display =
              "none";

          }

        );

        // ========================================
        // COMENTAR
        // ========================================

        div
        .querySelector(".commentButton")

        .addEventListener(

          "click",

          async () => {

            if(!currentUser) return;

            const text =
              prompt(
                "Comentário:"
              );

            if(!text) return;

            await updateDoc(

              doc(
                db,
                "posts",
                postId
              ),

              {

                comments:
                  arrayUnion({

                    username:
                      currentUsername,

                    text

                  })

              }

            );

          }

        );

        // ========================================
        // EXCLUIR
        // ========================================

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
// BUSCA
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
