const firebaseConfig = {
  apiKey: "あなたのAPIキー",
  authDomain: "～～.firebaseapp.com",
  databaseURL: "https://～～.firebaseio.com",
  projectId: "～～",
  storageBucket: "～～.appspot.com",
  messagingSenderId: "～～",
  appId: "～～"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.database();
