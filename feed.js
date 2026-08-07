// feed.js

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

const postInput =
  $("postInput");

const postButton =
  $("postButton");

const postsContainer =
  $("postsContainer");

const searchInput =
  $("searchInput");

const searchButton =
  $("searchButton");

const clickSound =
  $("clickSound");

// ========================================
// VARIÁVEIS
// ========================================

let currentUser =
  null;

let currentUsername =
  "Usuário";

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
// AUTH
// ========================================

onAuthStateChanged(

  auth,

  async(user)=>{

    currentUser = user;

    if(!user)
      return;

    const snap =

      await getDoc(

        doc(
          db,
          "users",
          user.uid
        )

      );

    if(snap.exists()){

      currentUsername =

        snap.data().username ||

        "Usuário";

    }

  }

);

// ========================================
// PUBLICAR
// ========================================

postButton.onclick =
async()=>{

  if(!currentUser){

    alert(
      "Faça login."
    );

    return;

  }

  const text =

    postInput.value.trim();

  if(!text)
    return;

  await addDoc(

    collection(
      db,
      "posts"
    ),

    {

      username:
        currentUsername,

      userId:
        currentUser.uid,

      text,

      likes:0,

      dislikes:0,

      likedBy:[],

      dislikedBy:[],

      comments:[],

      createdAt:
        serverTimestamp()

    }

  );

  postInput.value = "";

};

// ========================================
// FEED
// ========================================

onSnapshot(

  query(

    collection(
      db,
      "posts"
    ),

    orderBy(
      "createdAt",
      "desc"
    )

  ),

  (snapshot)=>{

    postsContainer.innerHTML = "";

    if(snapshot.empty){

      postsContainer.innerHTML = `

        <div class="community">

          Ainda não existem postagens.

        </div>

      `;

      return;

    }

    snapshot.forEach(

      (postDoc)=>{

        const post =
          postDoc.data();

        const id =
          postDoc.id;

        const liked =

          post.likedBy?.includes(
            currentUser?.uid
          );

        const disliked =

          post.dislikedBy?.includes(
            currentUser?.uid
          );

        const div =
          document.createElement(
            "div"
          );

        div.className =
          "post";

        div.innerHTML = `

          <h3>

            ${post.username || "Usuário"}

          </h3>

          <p>

            ${post.text}

          </p>

          <div class="post-buttons">

            <button
              class="like"
            >

              👍 ${post.likes || 0}

            </button>

            <button
              class="dislike"
            >

              👎 ${post.dislikes || 0}

            </button>

            <button
              class="comment"
            >

              💬 Comentar

            </button>

            <button
              class="hide"
            >

              🚫 Ocultar

            </button>

            ${

              currentUser?.uid ===
              post.userId

              ?

              `

              <button
                class="delete"
              >

                🗑️ Excluir

              </button>

              `

              :

              ""

            }

          </div>

          <div
            class="comments"
          >

            ${

              (post.comments || [])

              .map(

                comment => `

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
        // LIKE
        // ========================================

        div.querySelector(
          ".like"
        ).onclick = async()=>{

          if(!currentUser)
            return;

          await updateDoc(

            doc(
              db,
              "posts",
              id
            ),

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

        div.querySelector(
          ".dislike"
        ).onclick = async()=>{

          if(!currentUser)
            return;

          await updateDoc(

            doc(
              db,
              "posts",
              id
            ),

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

        div.querySelector(
          ".comment"
        ).onclick = async()=>{

          if(!currentUser)
            return;

          const text = prompt(
            "Comentário:"
          );

          if(!text)
            return;

          await updateDoc(

            doc(
              db,
              "posts",
              id
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

        };        // ========================================
        // OCULTAR
        // ========================================

        div.querySelector(
          ".hide"
        ).onclick = ()=>{

          div.remove();

        };

        // ========================================
        // EXCLUIR
        // ========================================

        const deleteButton =

          div.querySelector(
            ".delete"
          );

        if(deleteButton){

          deleteButton.onclick =
          async()=>{

            if(

              !confirm(
                "Deseja excluir esta postagem?"
              )

            ){

              return;

            }

            await deleteDoc(

              doc(
                db,
                "posts",
                id
              )

            );

          };

        }

        postsContainer.appendChild(
          div
        );

      }

    );

  }

);

// ========================================
// BUSCA
// ========================================

searchButton.onclick = ()=>{

  playClick();

  const text =

    searchInput.value.trim();

  if(!text)
    return;

  location.href =

    `buscar.html?q=${encodeURIComponent(text)}`;

};

// ========================================
// ENTER NA BUSCA
// ========================================

searchInput.addEventListener(

  "keydown",

  (event)=>{

    if(event.key==="Enter"){

      searchButton.click();

    }

  }

);

// ========================================
// AVISO AO FECHAR A GUIA
// ========================================

window.addEventListener(

  "beforeunload",

  (event)=>{

    if(auth.currentUser){

      event.preventDefault();

      event.returnValue = "";

    }

  }

);
