import { getAuth, signInWithPopup, GoogleAuthProvider, signOut } from "firebase/auth";

import app from "./firebase.config";
import useSessionStorage from "./useSessionStorage";

const provider = new GoogleAuthProvider();
const auth = getAuth(app);

export const handleSignIn = async () => {
  const response = await signInWithPopup(auth, provider)
    .then((result) => {
      // This gives you a Google Access Token. You can use it to access the Google API.
      const credential = GoogleAuthProvider.credentialFromResult(result);
      const token = credential.accessToken;
      // The signed-in user info.
      const user = result.user;
      return user;
      // ...
    })
    .catch((error) => {
      // Handle Errors here.
      const errorCode = error.code;
      const errorMessage = error.message;
      // The email of the user's account used.
      const email = error.customData.email;
      // The AuthCredential type that was used.
      const credential = GoogleAuthProvider.credentialFromError(error);
      // ...
      return { error: { errorCode, errorMessage } };
    });

  return response;
};

export const handleSignOut = async () => {
  const response = await signOut(auth);
  return response
};
