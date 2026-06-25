/* Paste the SAME Firebase config used by the app here.
   (Firebase Console → Project Settings → Your apps → SDK setup) */
export const firebaseConfig = {
  apiKey: "AIzaSyDgoBu7mKx2DNN2ppywpK86uQ-ARf3k_D4",
  authDomain: "council-of-mosque-prayer-times.firebaseapp.com",
  projectId: "council-of-mosque-prayer-times",
  storageBucket: "council-of-mosque-prayer-times.firebasestorage.app",
  messagingSenderId: "81625512077",
  appId: "1:81625512077:web:3743ac6c15a68415f60ac4"
};
export const isConfigured = () => !!firebaseConfig.apiKey && !firebaseConfig.apiKey.startsWith("PASTE_");
