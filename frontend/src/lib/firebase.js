import { initializeApp } from "firebase/app";
import { getAuth, signInWithPopup, GoogleAuthProvider } from "firebase/auth";

const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;
const authDomain = import.meta.env.VITE_FIREBASE_AUTH_DOMAIN;
const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;

const firebaseConfig = { apiKey, authDomain, projectId };

const app = (apiKey && authDomain && projectId) ? initializeApp(firebaseConfig) : null;
export const auth = app ? getAuth(app) : null;

const provider = new GoogleAuthProvider();
provider.setCustomParameters({
  hd: "citchennai.net"
});

export const signInWithGoogle = async () => {
  if (!auth) {
    throw new Error("Firebase Authentication is not configured.");
  }
  try {
    const result = await signInWithPopup(auth, provider);
    const idToken = await result.user.getIdToken();
    return idToken;
  } catch (error) {
    console.error("Firebase Google Sign-In Error:", error);
    throw error;
  }
};
