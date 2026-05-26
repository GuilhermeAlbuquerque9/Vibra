import {
  db
}
from "./firebase.js";

import {

  collection,
  getDocs

}
from "https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js";

const params =
  new URLSearchParams(
    window.location.search
  );

const search =
  params.get("q")
  ?.toLowerCase();

const results =
  document.getElementById(
    "results"
  );

async function searchUsers() {

  results.innerHTML = "";

  const snapshot =
    await getDocs(
      collection(db, "users")
    );

  let found = false;

  snapshot.forEach(

    (userDoc) => {

      const user =
        userDoc.data();

      if(

        user.username
        ?.toLowerCase()

        .includes(search)

      ) {

        found = true;

        const div =
          document.createElement("div");

        div.classList.add(
          "community"
        );

        div.innerHTML = `

          👤 ${user.username}

        `;

        results.appendChild(div);

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
