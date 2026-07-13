import {
  db
}
from "./firebase.js";

import {

  collection,
  getDocs

}
from "https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js";

// ========================================
// ELEMENTOS
// ========================================

const params =
  new URLSearchParams(
    window.location.search
  );

const search =

  (
    params.get("q") || ""
  )
  .toLowerCase();

const results =

  document.getElementById(
    "results"
  );

// ========================================
// BUSCA
// ========================================

async function searchUsers() {

  results.innerHTML = "";

  const snapshot =

    await getDocs(

      collection(
        db,
        "users"
      )

    );

  let found = false;

  snapshot.forEach(

    (userDoc) => {

      const user =
        userDoc.data();

      if(

        (user.username || "")

        .toLowerCase()

        .includes(search)

      ) {

        found = true;

        const card =
          document.createElement(
            "div"
          );

        card.className =
          "community";

        card.style.cursor =
          "pointer";

        card.innerHTML = `

          <strong>

            👤 ${user.username}

          </strong>

          <br>

          Clique para abrir o perfil.

        `;

        card.onclick = () => {

          location.href =

            `usuario.html?id=${userDoc.id}`;

        };

        results.appendChild(card);

      }

    }

  );

  if(!found) {

    results.innerHTML = `

      <div class="community">

        Nenhum usuário encontrado.

      </div>

    `;

  }

}

searchUsers();
