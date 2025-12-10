/////////////////////////////////////
// Firebase 設定
/////////////////////////////////////
const firebaseConfig = {
  apiKey: "AIzaSyBq9omBu6A-Le7lEjQAlsvqtv8Mqa8tl-c",
  authDomain: "dronesgps-f3616.firebaseapp.com",
  databaseURL: "https://dronesgps-f3616-default-rtdb.firebaseio.com/",
  projectId: "dronesgps-f3616",
  storageBucket: "dronesgps-f3616.firebasestorage.app",
  messagingSenderId: "1068524436957",
  appId: "1:1068524436957:web:dbd9ec480ced3065314a34",
  measurementId: "G-STNDL06MJT"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

/////////////////////////////////////
// Leaflet Map 初期化
/////////////////////////////////////
let map = L.map('map').setView([35.0, 135.0], 5);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; OpenStreetMap'
}).addTo(map);

let marker = null;

/////////////////////////////////////
// Chart.js 初期化
/////////////////////////////////////
let ctx = document.getElementById('chart').getContext('2d');
let powerData = [];

let chart = new Chart(ctx, {
  type: 'line',
  data: {
    labels: [],
    datasets: [{
      label: "Battery Power (W)",
      data: powerData,
      borderWidth: 2
    }]
  },
  options: {
    animation: false,
    scales: { y: { beginAtZero: true } }
  }
});

/////////////////////////////////////
// Firebase リアルタイム監視
/////////////////////////////////////
db.ref("sensors").on("value", (snapshot) => {
  const data = snapshot.val();
  if (!data) return;

  const ts = data.GPS?.timestamp || "--";
  const lat = data.GPS?.lat || 0;
  const lng = data.GPS?.lng || 0;

  document.getElementById("ts").textContent = ts;

  // マップ更新
  if (lat !== 0 && lng !== 0) {
    if (!marker) {
      marker = L.marker([lat, lng]).addTo(map);
    } else {
      marker.setLatLng([lat, lng]);
    }
    map.setView([lat, lng], 17);
  }

  // Panel
  const pv = data.INA226_Panel_V?.value || 0;
  const pi = data.INA226_Panel_I?.value || 0;
  document.getElementById("panel-v").textContent = pv;
  document.getElementById("panel-i").textContent = pi;
  document.getElementById("panel-p").textContent = (pv * pi / 1000).toFixed(3);

  // Battery（INA219）
  const bv = data.INA219_V?.value || 0;
  const bi = data.INA219_I?.value || 0;
  document.getElementById("batt-v").textContent = bv;
  document.getElementById("batt-i").textContent = bi;
  const bp = (bv * bi / 1000).toFixed(3);
  document.getElementById("batt-p").textContent = bp;

  // Load
  const lv = data.INA226_Load_V?.value || 0;
  const li = data.INA226_Load_I?.value || 0;
  document.getElementById("load-v").textContent = lv;
  document.getElementById("load-i").textContent = li;
  document.getElementById("load-p").textContent = (lv * li / 1000).toFixed(3);

  // グラフ更新
  powerData.push(bp);
  if (powerData.length > 100) powerData.shift();

  chart.data.labels.push("");
  if (chart.data.labels.length > 100) chart.data.labels.shift();

  chart.update();
});
