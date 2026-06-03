/**
 * Serviço de autenticação.
 *
 * Responsabilidade:
 * - Login com e-mail/senha
 * - Cadastro de usuário
 * - Logout
 * - Recuperação de senha
 * - Login com Google
 * - Observação do estado de sessão (onAuthStateChanged)
 *
 * Depende de `src/config/firebase.js` (Firebase Auth).
 * Não deve conter lógica de UI — apenas chamadas ao SDK e normalização de dados.
 *
 * @see docs/auth-foundation.md
 * @see docs/firebase-foundation.md
 * @see docs/architecture.md — Authentication
 */

import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
} from "firebase/auth";
import { auth } from "@/config/firebase";

const googleProvider = new GoogleAuthProvider();

/**
 * Normaliza o usuário Firebase para consumo pelo AuthContext.
 * @param {import("firebase/auth").User | null} firebaseUser
 */
export function mapFirebaseUser(firebaseUser) {
  if (!firebaseUser) {
    return null;
  }

  return {
    uid: firebaseUser.uid,
    email: firebaseUser.email,
    displayName: firebaseUser.displayName,
    photoURL: firebaseUser.photoURL,
    emailVerified: firebaseUser.emailVerified,
  };
}

/**
 * @param {string} email
 * @param {string} password
 */
export async function signInWithEmail(email, password) {
  const credential = await signInWithEmailAndPassword(auth, email, password);
  return mapFirebaseUser(credential.user);
}

/**
 * @param {string} email
 * @param {string} password
 */
export async function signUpWithEmail(email, password) {
  const credential = await createUserWithEmailAndPassword(auth, email, password);
  return mapFirebaseUser(credential.user);
}

export async function signInWithGoogle() {
  const credential = await signInWithPopup(auth, googleProvider);
  return mapFirebaseUser(credential.user);
}

export async function logout() {
  await signOut(auth);
}

/**
 * @param {string} email
 */
export async function resetPassword(email) {
  await sendPasswordResetEmail(auth, email);
}

/**
 * @param {(user: ReturnType<typeof mapFirebaseUser>) => void} callback
 * @returns {import("firebase/auth").Unsubscribe}
 */
export function subscribeToAuthChanges(callback) {
  return onAuthStateChanged(auth, (firebaseUser) => {
    callback(mapFirebaseUser(firebaseUser));
  });
}
