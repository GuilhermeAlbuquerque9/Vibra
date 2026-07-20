// editar_perfil.js

// ========================================
// IMPORTS
// ========================================

import {
  auth,
  db
}
from "./firebase.js";

import {

  onAuthStateChanged,
  EmailAuthProvider,
  reauthenticateWithCredential,
  updateEmail,
  updatePassword

}
from "https://www.gstatic.com/firebasejs/12.13.0/firebase-auth.js";

import {

  doc,
  getDoc,
  updateDoc

}
from "https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js";

// ========================================
// ELEMENTOS
// ========================================

const $ = (id) =>
  document.getElementById(id);

const usernameInput =
  $("usernameInput");

const emailInput =
  $("emailInput");

const currentPasswordInput =
  $("currentPasswordInput");

const passwordInput =
  $("passwordInput");

const aboutInput =
  $("aboutInput");

const saveProfileButton =
  $("saveProfileButton");

const cancelButton =
  $("cancelButton");

const clickSound =
  $("clickSound");

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

  e => {

    if(
      e.target.tagName ===
      "BUTTON"
    ){

      playClick();

    }

  }

);

// ========================================
// USUÁRIO
// ========================================

let currentUser = null;

// ========================================
// AUTH
// ========================================

onAuthStateChanged(

  auth,

  async user => {

    if(!user){

      location.href =
        "index.html";

      return;

    }

    currentUser = user;

    const snap =

      await getDoc(

        doc(
          db,
          "users",
          user.uid
        )

      );

    if(!snap.exists()){

      alert(
        "Usuário não encontrado."
      );

      location.href =
        "perfil.html";

      return;

    }

    const data =
      snap.data();

    usernameInput.value =

      data.username || "";

    emailInput.value =

      data.email || "";

    aboutInput.value =

      data.about || "";

  }

);

// ========================================
// CANCELAR
// ========================================

cancelButton.onclick = () => {

  location.href =
    "perfil.html";

};

// ========================================
// SALVAR ALTERAÇÕES
// ========================================

saveProfileButton.onclick =
async () => {

  const username =

    usernameInput.value.trim();

  const email =

    emailInput.value.trim();

  const currentPassword =

    currentPasswordInput.value;

  const newPassword =

    passwordInput.value;

  const about =

    aboutInput.value.trim();

  if(username === ""){

    alert(
      "Digite um nome de usuário."
    );

    return;

  }

  if(email === ""){

    alert(
      "Digite um e-mail."
    );

    return;

  }

  try{

    // ====================================
    // REAUTENTICAÇÃO
    // Necessária para alterar
    // e-mail e/ou senha
    // ====================================

    if(

      email !== currentUser.email ||

      newPassword !== ""

    ){

      if(currentPassword === ""){

        alert(
          "Digite sua senha atual."
        );

        return;

      }

      const credential =

        EmailAuthProvider.credential(

          currentUser.email,

          currentPassword

        );

      await reauthenticateWithCredential(

        currentUser,

        credential

      );

    }

    // ====================================
    // ALTERAR E-MAIL
    // ====================================

    if(email !== currentUser.email){

      await updateEmail(

        currentUser,

        email

      );

    }

    // ====================================
    // ALTERAR SENHA
    // ====================================

    if(newPassword !== ""){

      if(newPassword.length < 6){

        alert(
          "A nova senha deve possuir pelo menos 6 caracteres."
        );

        return;

      }

      await updatePassword(

        currentUser,

        newPassword

      );

    }

    // ====================================
    // FIRESTORE
    // ====================================

    await updateDoc(

      doc(

        db,

        "users",

        currentUser.uid

      ),

      {

        username,

        email,

        about

      }

    );

    alert(

      "Perfil atualizado com sucesso!"

    );

    location.href =

      "perfil.html";

  }

  catch(err){

    console.error(err);

    switch(err.code){

      case "auth/wrong-password":

        alert(
          "Senha atual incorreta."
        );
        break;

      case "auth/invalid-credential":

        alert(
          "Senha atual incorreta."
        );
        break;

      case "auth/email-already-in-use":

        alert(
          "Este e-mail já está sendo utilizado."
        );
        break;

      case "auth/invalid-email":

        alert(
          "E-mail inválido."
        );
        break;

      case "auth/weak-password":

        alert(
          "A nova senha é muito fraca."
        );
        break;

      case "auth/requires-recent-login":

        alert(
          "Faça login novamente e tente outra vez."
        );
        break;

      default:

        alert(
          err.message
        );

    }

  }

};
