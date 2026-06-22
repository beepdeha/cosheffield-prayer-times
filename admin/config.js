/* Paste the SAME Firebase config used by the app here.
   (Firebase Console → Project Settings → Your apps → SDK setup) */
export const firebaseConfig = {
  apiKey: "PASTE_YOUR_API_KEY",
  authDomain: "PASTE.firebaseapp.com",
  projectId: "PASTE_PROJECT_ID",
  storageBucket: "PASTE.appspot.com",
  messagingSenderId: "PASTE_SENDER_ID",
  appId: "PASTE_APP_ID"
};
export const isConfigured = () => !!firebaseConfig.apiKey && !firebaseConfig.apiKey.startsWith("PASTE_");
