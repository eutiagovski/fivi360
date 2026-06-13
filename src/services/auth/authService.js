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
  applyActionCode,
  confirmPasswordReset,
  createUserWithEmailAndPassword,
  getAdditionalUserInfo,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  verifyPasswordResetCode,
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
    usesPasswordAuth: firebaseUser.providerData.some(
      (provider) => provider.providerId === "password",
    ),
  };
}

/**
 * Usuários e-mail/senha com e-mail não verificado devem confirmar antes do app.
 *
 * @param {ReturnType<typeof mapFirebaseUser> | null} user
 * @returns {boolean}
 */
export function needsEmailVerification(user) {
  return Boolean(user?.usesPasswordAuth && !user.emailVerified);
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
  const isNewUser = getAdditionalUserInfo(credential)?.isNewUser ?? false;

  return {
    user: mapFirebaseUser(credential.user),
    isNewUser,
  };
}

export async function logout() {
  await signOut(auth);
}

/**
 * @param {string} oobCode
 */
export async function applyEmailVerificationCode(oobCode) {
  await applyActionCode(auth, oobCode);
}

/**
 * @param {string} oobCode
 * @returns {Promise<string>} E-mail associado ao código
 */
export async function verifyPasswordResetOobCode(oobCode) {
  return verifyPasswordResetCode(auth, oobCode);
}

/**
 * @param {string} oobCode
 * @param {string} newPassword
 */
export async function completePasswordReset(oobCode, newPassword) {
  await confirmPasswordReset(auth, oobCode, newPassword);
}

/**
 * Recarrega o usuário atual do Firebase Auth (ex.: após verificar e-mail).
 *
 * @returns {Promise<ReturnType<typeof mapFirebaseUser> | null>}
 */
export async function reloadCurrentUser() {
  const currentUser = auth.currentUser;

  if (!currentUser) {
    return null;
  }

  await currentUser.reload();
  return mapFirebaseUser(currentUser);
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
