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

// ========================================
// ELEMENTOS
// ========================================

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

const communitySearch =
  $("communitySearch");

const communityCount =
  $("communityCount");

const clickSound =
  $("clickSound");

// ========================================
// VARIÁVEIS
// ========================================

let currentUser = null;

let communities = [];

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
// LOGIN
// ========================================

onAuthStateChanged(

  auth,

  (user) => {

    currentUser = user;

  }

);

// ========================================
// CRIAR COMUNIDADE
// ========================================

createCommunityButton.onclick =
async () => {

  if(!currentUser) {

    alert(
      "Faça login primeiro."
    );

    return;

  }

  const name =

    communityName.value
    .trim();

  const description =

    communityDescription.value
    .trim();

  if(

    name === "" ||

    description === ""

  ) {

    alert(
      "Preencha todos os campos."
    );

    return;

  }

  await addDoc(

    collection(
      db,
      "communities"
    ),

    {

      name,

      description,

      ownerId:
        currentUser.uid,

      members: [

        currentUser.uid

      ],

      memberCount: 1,

      createdAt:
        serverTimestamp()

    }

  );

  communityName.value = "";

  communityDescription.value = "";

};

// ========================================
// PESQUISA
// ========================================

communitySearch.addEventListener(

  "input",

  () => {

    renderCommunities(
      communitySearch.value
    );

  }

);

// ========================================
// RENDERIZAR
// ========================================

function renderCommunities(search = "") {

  communitiesContainer.innerHTML = "";

  const filter =

    search
    .trim()
    .toLowerCase();

  const filtered = communities.filter(

  (community) =>

    (community.data.name || "")
      .toLowerCase()
      .includes(filter)

);

  communityCount.innerText =

    `${filtered.length} comunidade(s) encontrada(s)`;

  if(

    filtered.length === 0

  ) {

    communitiesContainer.innerHTML = `

      <div class="community">

        Nenhuma comunidade encontrada.

      </div>

    `;

    return;

  }

  filtered.forEach(

    ({ id, data }) => {

      const joined =

        data.members?.includes(

          currentUser?.uid

        );

      const card =

        document.createElement(
          "div"
        );

      card.className =
        "community";

      card.innerHTML = `

        <div
          class="community-header"
          style="cursor:pointer"
        >

          <h3>

            🌎 ${data.name}

          </h3>

        </div>

        <p>

          ${data.description}

        </p>

        <p>

          👥 ${data.memberCount || 0} membro(s)

        </p>

        <button
          class="joinButton"
        >

          ${

            joined

            ?

            "Sair"

            :

            "Entrar"

          }

        </button>

      `;

      // ABRIR COMUNIDADE

      card

      .querySelector(

        ".community-header"

      )

      .onclick = () => {

        playClick();

        location.href =

          `comunidade.html?id=${id}`;

      };

      // O botão Entrar/Sair
      // continua na Parte 2.

      communitiesContainer
      .appendChild(card);

    }

  );

}

// ========================================
// CARREGAR COMUNIDADES
// ========================================

onSnapshot(

  collection(db, "communities"),

  (snapshot) => {

    communities = [];

    snapshot.forEach(

      (communityDoc) => {

        communities.push({

          id:
            communityDoc.id,

          data:
            communityDoc.data()

        });

      }

    );

    renderCommunities(

      communitySearch.value

    );

  }

);

// ========================================
// ENTRAR / SAIR
// ========================================

communitiesContainer.addEventListener(

  "click",

  async (event) => {

    const button =

      event.target.closest(
        ".joinButton"
      );

    if(!button) return;

    if(!currentUser) {

      alert(
        "Faça login primeiro."
      );

      return;

    }

    playClick();

    const card =

      button.closest(
        ".community"
      );

    const title =

      card.querySelector("h3")
      .textContent
      .replace("🌎","")
      .trim();

    const community =

      communities.find(

        (c) =>

          c.data.name === title

      );

    if(!community) return;

    const joined =

      community.data.members
      ?.includes(
        currentUser.uid
      );

    const ref =

      doc(

        db,

        "communities",

        community.id

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

  }

);

// ========================================
// MENSAGEM INICIAL
// ========================================

if(

  communityCount

) {

  communityCount.innerText =

    "Carregando comunidades...";

}
