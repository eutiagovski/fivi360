import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: window.env.firebase_apiKey,
  authDomain: window.env.firebase_authDomain,
  projectId: window.env.firebase_projectId,
  storageBucket: window.env.firebase_storageBucket,
  messagingSenderId: window.env.firebase_messagingSenderId,
  appId: window.env.firebase_appId,
  measurementId: window.env.firebase_measurementId,
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

export default app;
