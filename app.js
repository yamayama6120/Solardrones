// -----------------------------------------------------
// Firebase 初期化
// -----------------------------------------------------
const firebaseConfig = {
  apiKey: "AIzaSyBq9omBu6A-Le7lEjQAlsvqtv8Mqa8tl-c",
  authDomain: "dronesgps-f3616.firebaseapp.com",
  databaseURL: "https://dronesgps-f3616-default-rtdb.asia-southeast1.firebaseio.com",
  projectId: "dronesgps-f3616",
  storageBucket: "dronesgps-f3616.appspot.com",
  messagingSenderId: "1068524436957",
  appId: "1:1068524436957:web:dbd9ec480ced3065314a34"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// -----------------------------------------------------
// Leaflet 地図初期化
// -----------------------------------------------------
const initialLatLng = [35.0, 135.0];
const map = L.map('map').setView(initialLatLng, 5);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

let marker = L.marker(initialLatLng).addTo(map);
let polyline = L.polyline([], { color: 'blue' }).addTo(map);

let trackHistory = [];


// -----------------------------------------------------
// Chart.js 初期化
// -----------------------------------------------------
const ctx = document.getElementById('chart').getContext('2d');

const chart = new Chart(ctx, {
  type: 'line',
  data: {
    labels: [],
    datasets: [
      { label: "Load Power", data: [], borderColor: "red", fill: false },
      { label: "Battery Power", data: [], borderColor: "green", fill: false },
      { label: "System Power", data: [], borderColor: "blue", fill: false },
    ]
  },
  options: {
    responsive: true,
    scales: {
      x: { title: { display: true, text: "Time" }},
      y: { title: { display: true, text: "Power [W]" }}
    }
  }
});


// -----------------------------------------------------
// 最新値を監視（/latest）
// -----------------------------------------------------
db.ref("latest").on("value", snapshot => {
  const item = snapshot.val();
  const liveDiv = document.getElementById("liveData");

  if (!item) {
    liveDiv.innerHTML = "No data";
    return;
  }

  // 電力計算
  const loadP = item.INA226_Load.voltage * item.INA226_Load.current / 1000;
  const liP   = item.INA226_Battery.voltage * item.INA226_Battery.current / 1000;
  const sysP  = item.INA219_System.voltage * item.INA219_System.current / 1000;

  // 右パネルの表示
  liveDiv.innerHTML = `
      <b>Timestamp:</b> ${item.timestamp}<br><br>

      <b>Load:</b><br>
      V=${item.INA226_Load.voltage.toFixed(3)} V<br>
      I=${item.INA226_Load.current.toFixed(1)} mA<br>
      P=${loadP.toFixed(2)} W<br><br>

      <b>Battery:</b><br>
      V=${item.INA226_Battery.voltage.toFixed(3)} V<br>
      I=${item.INA226_Battery.current.toFixed(1)} mA<br>
      P=${liP.toFixed(2)} W<br><br>

      <b>System:</b><br>
      V=${item.INA219_System.voltage.toFixed(3)} V<br>
      I=${item.INA219_System.current.toFixed(1)} mA<br>
      P=${sysP.toFixed(2)} W<br>
  `;

  // 地図更新
  const lat = item.GPS.lat;
  const lng = item.GPS.lng;

  if (lat !== 0 && lng !== 0) {
    const latlng = [lat, lng];
    trackHistory.push(latlng);

    marker.setLatLng(latlng);
    marker.bindPopup(
      `Load: ${loadP.toFixed(2)} W<br>
       Battery: ${liP.toFixed(2)} W<br>
       System: ${sysP.toFixed(2)} W`
    );

    polyline.setLatLngs(trackHistory);
    map.setView(latlng, 16);
  }
});


// -----------------------------------------------------
// 履歴 /history からチャートを生成
// -----------------------------------------------------
db.ref("history").limitToLast(50).on("value", snapshot => {
  const data = snapshot.val();
  if (!data) return;

  const times = [];
  const loadPower = [];
  const batteryPower = [];
  const systemPower = [];

  Object.keys(data).forEach(key => {
    const item = data[key];

    times.push(item.timestamp.slice(11,19)); // HH:MM:SS

    loadPower.push(item.INA226_Load.voltage * item.INA226_Load.current / 1000);
    batteryPower.push(item.INA226_Battery.voltage * item.INA226_Battery.current / 1000);
    systemPower.push(item.INA219_System.voltage * item.INA219_System.current / 1000);
  });

  chart.data.labels = times;
  chart.data.datasets[0].data = loadPower;
  chart.data.datasets[1].data = batteryPower;
  chart.data.datasets[2].data = systemPower;
  chart.update();
});
