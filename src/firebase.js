import firebase from "firebase/app";
import "firebase/database";
import "firebase/storage";
import "firebase/auth";

const config = {
  apiKey: "ADD_KEY",
  authDomain: "ADD_AUTH_DOMAIN",
  databaseURL: "ADD_DATABASE_URL",
  projectId: "ADD_PROJECT_ID",
  storageBucket: "ADD_STORAGE_BUCKET",
  messagingSenderId: "ADD_MESSAGING_SENDER_ID",
  appId: "ADD_APP_ID",
};
firebase.initializeApp(config);
export default firebase;
