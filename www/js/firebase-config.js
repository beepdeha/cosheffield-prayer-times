/* ============================================================
   FIREBASE CONFIG
   Paste the config from your Firebase project here (Project
   Settings → Your apps → SDK setup). Until then the app runs on
   bundled seed data + offline cache, so everything still works.

   The app treats the config as "not set up" while apiKey still
   starts with "PASTE_".
   ============================================================ */
export const firebaseConfig = {
  apiKey: "PASTE_YOUR_API_KEY",
  authDomain: "PASTE.firebaseapp.com",
  projectId: "PASTE_PROJECT_ID",
  storageBucket: "PASTE.appspot.com",
  messagingSenderId: "PASTE_SENDER_ID",
  appId: "PASTE_APP_ID"
};

export function isConfigured(){
  return !!firebaseConfig.apiKey && !firebaseConfig.apiKey.startsWith("PASTE_");
}
