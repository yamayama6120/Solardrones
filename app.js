// Firebase モジュール（v9 CDN）
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getDatabase, ref, onValue } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js";

// Firebase 設定（修正完全版）
const firebaseConfig = {
  apiKey: "AIzaSyBq9omBu6A-Le7lEjQAlsvqtv8Mqa8tl-c",
  authDomain: "dronesgps-f3616.firebaseapp.com",
  databaseURL: "https://dronesgps-f3616-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "dronesgps-f3616",
  storageBucket: "dronesgps-f3616.appspot.com",
  messagingSenderId: "1068524436957",
  appId: "1:1068524436957:web:dbd9ec480ced3065314a34",
  measurementId: "G-STNDL06MJT"
};

// Firebase 初期化
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// 監視するパス（Raspberry Pi が書き込む場所）
const gpsRef = ref(db, "gps");

// データ更新時に実行
onValue(gpsRef, (snapshot) => {
  const data = snapshot.val() || {};

  console.log("Firebase data:", data);

  // HTML 要素へ反映
  document.getElementById("lat").textContent = data.lat ?? "N/A";
  document.getElementById("lng").textContent = data.lng ?? "N/A";
  document.getElementById("alt").textContent = data.alt ?? "N/A";
  document.getElementById("time").textContent = data.time ?? "N/A";
});
