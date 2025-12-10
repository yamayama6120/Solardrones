// Firebase 設定
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "dronesgps-f3616.firebaseapp.com",
  databaseURL: "https://dronesgps-f3616-default-rtdb.asia-southeast1.firebasedatabase.app/",
  projectId: "dronesgps-f3616",
  storageBucket: "dronesgps-f3616.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Firebase 初期化
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// HTML 要素
const loadV = document.getElementById("load-voltage");
const loadI = document.getElementById("load-current");
const liV = document.getElementById("li-voltage");
const liI = document.getElementById("li-current");
const panelV = document.getElementById("panel-voltage");
const panelI = document.getElementById("panel-current");

const gpsLat = document.getElementById("gps-lat");
const gpsLng = document.getElementById("gps-lng");

const loading = document.getElementById("loading");
const dataSection = document.getElementById("data-section");

// Firebase リアルタイム更新
db.ref("sensors").on("value", snapshot => {
  const data = snapshot.val();

  if (!data) {
    console.log("データなし");
    return;
  }

  // 読み込み中 → データ表示へ
  loading.style.display = "none";
  dataSection.style.display = "block";

  // 電圧・電流データ反映
  loadV.textContent = data.INA226_Load.voltage.toFixed(3);
  loadI.textContent = data.INA226_Load.current.toFixed(2);

  liV.textContent = data.INA226_Li.voltage.toFixed(3);
  liI.textContent = data.INA226_Li.current.toFixed(2);

  panelV.textContent = data.INA219.voltage.toFixed(3);
  panelI.textContent = data.INA219.current.toFixed(2);

  gpsLat.textContent = data.GPS.lat.toFixed(6);
  gpsLng.textContent = data.GPS.lng.toFixed(6);

  // 地図更新
  updateMap(data.GPS.lat, data.GPS.lng);
});
