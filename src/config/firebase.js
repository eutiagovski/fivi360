/**
 * Configuração central do Firebase SDK.
 *
 * Responsabilidade:
 * - Inicializar o app Firebase (Auth, Firestore, Storage)
 * - Ler variáveis de ambiente (REACT_APP_FIREBASE_*)
 * - Conectar emuladores locais quando REACT_APP_USE_FIREBASE_EMULATORS=true (apenas development)
 * - Exportar instâncias singleton usadas pelos services
 *
 * Sprint 1: fundação — SDK configurado, sem consumo pelas páginas.
 *
 * @see docs/firebase-foundation.md
 * @see docs/architecture.md
 */

import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, connectAuthEmulator } from "firebase/auth";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";
import { getStorage, connectStorageEmulator } from "firebase/storage";

const isDevelopment = process.env.NODE_ENV === "development";
const isProduction = process.env.NODE_ENV === "production";

const REQUIRED_FIREBASE_ENV_VARS = [
  "REACT_APP_FIREBASE_API_KEY",
  "REACT_APP_FIREBASE_AUTH_DOMAIN",
  "REACT_APP_FIREBASE_PROJECT_ID",
  "REACT_APP_FIREBASE_STORAGE_BUCKET",
  "REACT_APP_FIREBASE_MESSAGING_SENDER_ID",
  "REACT_APP_FIREBASE_APP_ID",
];

const missingFirebaseVars = REQUIRED_FIREBASE_ENV_VARS.filter(
  (key) => !process.env[key]?.trim()
);

if (missingFirebaseVars.length > 0) {
  const message = `[FIVI360] Configuração Firebase incompleta. Variáveis ausentes: ${missingFirebaseVars.join(", ")}. Copie .env.example para .env e preencha os valores.`;
  if (isDevelopment) {
    console.error(message);
  }
  throw new Error(message);
}

let useEmulator = process.env.REACT_APP_USE_FIREBASE_EMULATORS === "true";

if (isProduction && useEmulator) {
  throw new Error(
    "[FIVI360] REACT_APP_USE_FIREBASE_EMULATORS não pode ser true em produção. Defina false em .env.production ou no ambiente de CI/CD."
  );
}

const measurementId = process.env.REACT_APP_FIREBASE_MEASUREMENT_ID?.trim();

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
  ...(measurementId ? { measurementId } : {}),
};

export { measurementId, useEmulator };

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

if (isDevelopment && useEmulator) {
  console.log(
    "[FIVI360] Firebase emulators enabled (development only)"
  );
}

if (useEmulator && !globalThis.__FIVI360_FIREBASE_EMULATORS_CONNECTED__) {
  const authEmulatorUrl =
    process.env.REACT_APP_FIREBASE_AUTH_EMULATOR_URL || "http://127.0.0.1:9099";
  const firestoreHost =
    process.env.REACT_APP_FIREBASE_FIRESTORE_EMULATOR_HOST || "127.0.0.1";
  const firestorePort = Number(
    process.env.REACT_APP_FIREBASE_FIRESTORE_EMULATOR_PORT || 8080
  );
  const storageHost =
    process.env.REACT_APP_FIREBASE_STORAGE_EMULATOR_HOST || "127.0.0.1";
  const storagePort = Number(
    process.env.REACT_APP_FIREBASE_STORAGE_EMULATOR_PORT || 9199
  );

  connectAuthEmulator(auth, authEmulatorUrl, { disableWarnings: true });
  connectFirestoreEmulator(db, firestoreHost, firestorePort);
  connectStorageEmulator(storage, storageHost, storagePort);

  globalThis.__FIVI360_FIREBASE_EMULATORS_CONNECTED__ = true;

  if (isDevelopment) {
    console.log("[FIVI360] Connected to Firebase emulators:", {
      auth: authEmulatorUrl,
      firestore: `${firestoreHost}:${firestorePort}`,
      storage: `${storageHost}:${storagePort}`,
    });
  }
}

export default app;
