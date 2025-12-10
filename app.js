// -----------------------------
// Firebase 初期化
// -----------------------------
const firebaseConfig = {
  apiKey: "AIzaSyBq9omBu6A-Le7lEjQAlsvqtv8Mqa8tl-c",
  authDomain: "dronesgps-f3616.firebaseapp.com",
  databaseURL: "https://dronesgps-f3616-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "dronesgps-f3616",
  storageBucket: "dronesgps-f3616.appspot.com",
  messagingSenderId: "1068524436957",
  appId: "1:1068524436957:web:dbd9ec480ced3065314a34"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// -----------------------------
// Leaflet 地図初期化
// -----------------------------
const initialLatLng = [35.0, 135.0];
const map = L.map('map').setView(initialLatLng, 5);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

let marker = L.marker(initialLatLng).addTo(map);

// -----------------------------
// Chart.js 初期化
// -----------------------------
const ctx = document.getElementById('chart').getContext('2d');
const chart = new Chart(ctx, {
  type: 'bar',
  data: {
    labels: ['Panel', 'Li', 'Pi'],
    datasets: [{
      label: 'Power [W]',
      data: [0, 0, 0],
      backgroundColor: ['red', 'green', 'blue']
    }]
  },
  options: {}
});

// -----------------------------
// Realtime 最新データ取得
// -----------------------------
db.ref('sensors').on('value', snapshot => {
  const sensors = snapshot.val();
  if (!sensors) {
    console.log("データなし");
    return;
  }

  // GPS
  const gps = sensors.GPS;
  if (gps && gps.lat && gps.lng) {
    marker.setLatLng([gps.lat, gps.lng]);
    map.setView([gps.lat, gps.lng], 16);
  }

  // 電力計算
  const panelPower = sensors.INA219
    ? sensors.INA219.voltage * sensors.INA219.current
    : 0;

  const liPower = sensors.INA226_Li
    ? sensors.INA226_Li.voltage * sensors.INA226_Li.current
    : 0;

  const piPower = sensors.INA226_Load
    ? sensors.INA226_Load.voltage * sensors.INA226_Load.current
    : 0;

  // グラフ更新
  chart.data.datasets[0].data = [
    panelPower,
    liPower,
    piPower
  ];

  chart.update();
});
