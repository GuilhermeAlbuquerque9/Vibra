// app.js — Vibra™

import { auth, db }
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
  arrayRemove

}
from "https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js";

// ========================================
// ELEMENTOS
// ========================================

const $ = (id) =>
  document.getElementById(id);

const email = $("email");
const password = $("password");
const username = $("username");

const loginButton = $("loginButton");
const registerButton = $("registerButton");
const logoutButton = $("logoutButton");

const postInput = $("postInput");
const postButton = $("postButton");

const postsContainer = $("postsContainer");
const communityContainer = $("communityContainer");

const onlineCounter = $("onlineCounter");
const visitCounter = $("visitCounter");

const searchInput = $("searchInput");
const searchButton = $("searchButton");

const clickSound = $("clickSound");

// ========================================
// VARIÁVEIS
// ========================================

let currentUser = null;
let currentUsername = "Usuário";

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
// VISITAS
// ========================================

async function registerVisit() {

  const ref =
    doc(db, "site", "visits");

  const snap =
    await getDoc(ref);

  if(!snap.exists()) {

    await setDoc(ref, {

      count: 1

    });

  }

  else {

    await updateDoc(ref, {

      count:
        increment(1)

    });

  }

  const updated =
    await getDoc(ref);

  visitCounter.innerText =

    `👁️ ${
      updated.data().count
    } visitas`;

}

registerVisit();

// ========================================
// CADASTRO
// ========================================

registerButton.onclick = async () => {

  if(
    !username.value ||
    !email.value ||
    !password.value
  ) {

    return alert(
      "Preencha tudo!"
    );

  }

  try {

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

        active: true,

        createdAt:
          serverTimestamp()

      }

    );

    currentUsername =
      finalUsername;

    alert(
      "Conta criada!"
    );

  }

  catch(err) {

    alert(err.message);

  }

};

// ========================================
// LOGIN
// ========================================

loginButton.onclick = async () => {

  try {

    await signInWithEmailAndPassword(

      auth,
      email.value,
      password.value

    );

  }

  catch(err) {

    alert(err.message);

  }

};

// ========================================
// LOGOUT
// ========================================

logoutButton.onclick = async () => {

  if(currentUser) {

    await updateDoc(

      doc(
        db,
        "users",
        currentUser.uid
      ),

      {

        active: false

      }

    );

  }

  await signOut(auth);

};

// ========================================
// AUTH
// ========================================

onAuthStateChanged(

  auth,

  async (user) => {

    if(!user) {

      currentUser = null;
      currentUsername = "Usuário";

      return;

    }

    currentUser = user;

    const ref =
      doc(
        db,
        "users",
        user.uid
      );

    const snap =
      await getDoc(ref);

    // CASO O USUÁRIO NÃO EXISTA

    if(!snap.exists()) {

      const finalUsername =

        username.value.trim() ||

        user.email.split("@")[0];

      await setDoc(ref, {

        username:
          finalUsername,

        email:
          user.email,

        active: true,

        createdAt:
          serverTimestamp()

      });

      currentUsername =
        finalUsername;

    }

    else {

      const data =
        snap.data();

      currentUsername =

        data.username ||

        user.email.split("@")[0] ||

        "Usuário";

      await updateDoc(ref, {

        active: true

      });

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

      (u) => {

        if(u.data().active) {

          online++;

        }

      }

    );

    onlineCounter.innerText =

      `🟢 ${online} usuários ativos`;

  }

);

// ========================================
// PUBLICAR POST
// ========================================

postButton.onclick = async () => {

  if(!currentUser) {

    return alert(
      "Faça login!"
    );

  }

  if(!postInput.value) return;

  await addDoc(

    collection(db, "posts"),

    {

      username:

        currentUsername ||

        username.value ||

        currentUser.email.split("@")[0] ||

        "Usuário",

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

};

// ========================================
// POSTS
// ========================================

onSnapshot(

  query(

    collection(db, "posts"),

    orderBy(
      "createdAt",
      "desc"
    )

  ),

  (snapshot) => {

    postsContainer.innerHTML = "";

    snapshot.forEach(

      (postDoc) => {

        const post =
          postDoc.data();

        const id =
          postDoc.id;

        const liked =

          post.likedBy
          ?.includes(
            currentUser?.uid
          );

        const disliked =

          post.dislikedBy
          ?.includes(
            currentUser?.uid
          );

        const div =
          document.createElement("div");

        div.className = "post";

        div.innerHTML = `

          <h3>

            ${
              post.username ||

              "Usuário"
            }

          </h3>

          <p>

            ${post.text}

          </p>

          <div class="post-buttons">

            <button class="like">

              👍 ${post.likes || 0}

            </button>

            <button class="dislike">

              👎 ${post.dislikes || 0}

            </button>

            <button class="comment">

              💬 Comentar

            </button>

            <button class="hide">

              🚫 Ocultar

            </button>

            ${
              currentUser?.uid ===
              post.userId

              ?

              `
              <button class="delete">

                🗑️ Excluir

              </button>
              `

              :

              ""

            }

          </div>

          <div class="comments">

            ${
              (post.comments || [])

              .map(

                c => `

                <div class="community">

                  <strong>

                    ${
                      c.username ||
                      "Usuário"
                    }

                  </strong>

                  <br>

                  ${c.text}

                </div>

              `

              )

              .join("")

            }

          </div>

        `;

        // ========================================
        // LIKE
        // ========================================

        div.querySelector(".like")

        .onclick = async () => {

          if(!currentUser) return;

          await updateDoc(

            doc(db, "posts", id),

            liked

            ?

            {

              likes:
                increment(-1),

              likedBy:
                arrayRemove(
                  currentUser.uid
                )

            }

            :

            {

              likes:
                increment(1),

              likedBy:
                arrayUnion(
                  currentUser.uid
                )

            }

          );

        };

        // ========================================
        // DISLIKE
        // ========================================

        div.querySelector(".dislike")

        .onclick = async () => {

          if(!currentUser) return;

          await updateDoc(

            doc(db, "posts", id),

            disliked

            ?

            {

              dislikes:
                increment(-1),

              dislikedBy:
                arrayRemove(
                  currentUser.uid
                )

            }

            :

            {

              dislikes:
                increment(1),

              dislikedBy:
                arrayUnion(
                  currentUser.uid
                )

            }

          );

        };

        // ========================================
        // COMENTAR
        // ========================================

        div.querySelector(".comment")

        .onclick = async () => {

          if(!currentUser) return;

          const text =
            prompt(
              "Comentário:"
            );

          if(!text) return;

          await updateDoc(

            doc(db, "posts", id),

            {

              comments:
                arrayUnion({

                  username:

                    currentUsername ||

                    username.value ||

                    currentUser.email.split("@")[0] ||

                    "Usuário",

                  text

                })

            }

          );

        };

        // ========================================
        // OCULTAR
        // ========================================

        div.querySelector(".hide")

        .onclick = () => {

          div.remove();

        };

        // ========================================
        // EXCLUIR
        // ========================================

        const del =
          div.querySelector(".delete");

        if(del) {

          del.onclick = async () => {

            if(

              confirm(
                "Excluir post?"
              )

            ) {

              await deleteDoc(

                doc(
                  db,
                  "posts",
                  id
                )

              );

            }

          };

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

    communityContainer.innerHTML =

      snapshot.empty

      ?

      `
      <div class="community">
        Nenhuma comunidade ainda.
      </div>
      `

      :

      "";

    snapshot.forEach(

      (c) => {

        communityContainer.innerHTML += `

          <div class="community">

            🌎 ${c.data().name}

          </div>

        `;

      }

    );

  }

);

// ========================================
// BUSCA
// ========================================

searchButton.onclick = () => {

  if(!searchInput.value)
    return;

  location.href =

    `buscar.html?q=${
      encodeURIComponent(
        searchInput.value
      )
    }`;

};
