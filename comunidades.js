// comunidades.js

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
  onSnapshot,
  serverTimestamp,
  doc,
  updateDoc,
  increment,
  arrayUnion,
  arrayRemove

}
from "https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js";

// ELEMENTOS

const $ = (id) =>
  document.getElementById(id);

const communityName =
  $("communityName");

const communityDescription =
  $("communityDescription");

const createCommunityButton =
  $("createCommunityButton");

const communitiesContainer =
  $("communitiesContainer");

const clickSound =
  $("clickSound");

// USUÁRIO

let currentUser = null;

// SOM

function playClick() {

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

// AUTH

onAuthStateChanged(

  auth,

  (user) => {

    currentUser = user;

  }

);

// CRIAR COMUNIDADE

createCommunityButton.onclick =
async () => {

  if(!currentUser) {

    return alert(
      "Faça login!"
    );

  }

  if(
    !communityName.value ||
    !communityDescription.value
  ) {

    return alert(
      "Preencha tudo!"
    );

  }

  await addDoc(

    collection(db, "communities"),

    {

      name:
        communityName.value,

      description:
        communityDescription.value,

      ownerId:
        currentUser.uid,

      members: [],

      memberCount: 0,

      createdAt:
        serverTimestamp()

    }

  );

  communityName.value = "";
  communityDescription.value = "";

};

// COMUNIDADES

onSnapshot(

  collection(db, "communities"),

  (snapshot) => {

    communitiesContainer.innerHTML = "";

    if(snapshot.empty) {

      communitiesContainer.innerHTML = `

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

        const id =
          communityDoc.id;

        const joined =

          community.members
          ?.includes(
            currentUser?.uid
          );

        const div =
          document.createElement("div");

        div.className =
          "community";

        div.innerHTML = `

          <h3>

            🌎 ${community.name}

          </h3>

          <p>

            ${community.description}

          </p>

          <p>

            👥 ${community.memberCount || 0} membros

          </p>

          <button class="joinButton">

            ${
              joined

              ?

              "Sair"

              :

              "Entrar"
            }

          </button>

        `;

        // ENTRAR / SAIR

        div.querySelector(".joinButton")

        .onclick = async () => {

          if(!currentUser) {

            return alert(
              "Faça login!"
            );

          }

          const ref =
            doc(
              db,
              "communities",
              id
            );

          if(joined) {

            await updateDoc(ref, {

              members:
                arrayRemove(
                  currentUser.uid
                ),

              memberCount:
                increment(-1)

            });

          }

          else {

            await updateDoc(ref, {

              members:
                arrayUnion(
                  currentUser.uid
                ),

              memberCount:
                increment(1)

            });

          }

        };

        communitiesContainer
        .appendChild(div);

      }

    );

  }

);
