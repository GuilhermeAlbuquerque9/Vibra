// perfil.js

import {
  auth,
  db
}
from "./firebase.js";

import {

  onAuthStateChanged,
  signOut,
  deleteUser

}
from "https://www.gstatic.com/firebasejs/12.13.0/firebase-auth.js";

import {

  doc,
  getDoc,
  updateDoc,
  increment,
  query,
  where,
  collection,
  getDocs,
  deleteDoc

}
from "https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js";

// ELEMENTOS

const $ = (id) =>
  document.getElementById(id);

const profileUsername =
  $("profileUsername");

const profileEmail =
  $("profileEmail");

const profileDate =
  $("profileDate");

const profileVisits =
  $("profileVisits");

const profilePosts =
  $("profilePosts");

const logoutButton =
  $("logoutButton");

const deleteAccountButton =
  $("deleteAccountButton");

const clickSound =
  $("clickSound");

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

// USUÁRIO

onAuthStateChanged(

  auth,

  async (user) => {

    if(!user) {

      location.href =
        "index.html";

      return;

    }

    const userRef =
      doc(
        db,
        "users",
        user.uid
      );

    // VISITA AO PERFIL

    await updateDoc(

      userRef,

      {

        profileVisits:
          increment(1)

      }

    );

    const snap =
      await getDoc(userRef);

    const data =
      snap.data();

    // INFO

    profileUsername.innerText =

      data.username ||
      "Usuário";

    profileEmail.innerText =

      data.email;

    // DATA

    if(data.createdAt) {

      const date =

        data.createdAt
        .toDate();

      profileDate.innerText =

        "Entrou em: " +

        date.toLocaleDateString(
          "pt-BR"
        );

    }

    // VISITAS

    profileVisits.innerText =

      data.profileVisits || 0;

    // POSTS

    const postsQuery =

      query(

        collection(db, "posts"),

        where(
          "userId",
          "==",
          user.uid
        )

      );

    const postsSnap =
      await getDocs(postsQuery);

    profilePosts.innerText =

      postsSnap.size;

  }

);

// LOGOUT

logoutButton.onclick =
async () => {

  await signOut(auth);

  location.href =
    "index.html";

};

// DELETAR CONTA

deleteAccountButton.onclick =
async () => {

  const confirmDelete =

    confirm(
      "Deseja deletar sua conta?"
    );

  if(!confirmDelete)
    return;

  const user =
    auth.currentUser;

  try {

    // REMOVE DOCUMENTO

    await deleteDoc(

      doc(
        db,
        "users",
        user.uid
      )

    );

    // REMOVE CONTA

    await deleteUser(user);

    alert(
      "Conta deletada."
    );

    location.href =
      "index.html";

  }

  catch(err) {

    alert(err.message);

  }

};
