// -----------------------------
// Firebase 初期化
// -----------------------------
const firebaseConfig = {
  apiKey: "AIzaSyBq9omBu6A-Le7lEjQAlsvqtv8Mqa8tl-c",
  authDomain: "dronesgps-f3616.firebaseapp.com",
  databaseURL: "https://dronesgps-f3616-default-rtdb.asia-southeast1.firebasedatabase.app/",
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
const initialLatLng = [35.0, 135.0]; // 初期表示位置
const map = L.map('map').setView(initialLatLng, 5);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap contributors'
}).addTo(map);

let marker = L.marker(initialLatLng)
              .bindPopup("Raspberry Pi がまだデータを送信していません")
              .addTo(map);
let polyline = L.polyline([], { color: 'blue' }).addTo(map);

// -----------------------------
// Chart.js 初期化
// -----------------------------
const ctx = document.getElementById('chart').getContext('2d');
const chart = new Chart(ctx, {
  type: 'line',
  data: {
    labels: [],
    datasets: [
      { label: 'Panel Power', data: [], borderColor: 'red', fill: false },
      { label: 'Li Power', data: [], borderColor: 'green', fill: false },
      { label: 'Load Power', data: [], borderColor: 'blue', fill: false }
    ]
  },
  options: {
    responsive: true,
    plugins: { legend: { display: true } },
    scales: {
      x: { display: true, title: { display: true, text: 'Time' } },
      y: { display: true, title: { display: true, text: 'Power [W]' } }
    }
  }
});

// -----------------------------
// データ取得・描画（最新値のみ）
 // -----------------------------
db.ref('sensors').on('value', snapshot => {
  const data = snapshot.val();
  const messageDiv = document.getElementById('message');

  if (!data) {
    messageDiv.style.display = 'block';
    messageDiv.innerText = 'データがまだありません';
    return;
  } else {
    messageDiv.style.display = 'none';
  }

  // 電力計算
  const panelPower = data.INA219 ? (data.INA219.voltage * data.INA219.current) : 0;
  const liPower    = data.INA226_Li ? (data.INA226_Li.voltage * data.INA226_Li.current) : 0;
  const loadPower  = data.INA226_Load ? (data.INA226_Load.voltage * data.INA226_Load.current) : 0;

  // 時刻
  const timeStr = data.GPS && data.GPS.timestamp ? new Date(data.GPS.timestamp * 1000).toLocaleTimeString() : new Date().toLocaleTimeString();

  // Chart 更新
  chart.data.labels.push(timeStr);
  chart.data.datasets[0].data.push(panelPower);
  chart.data.datasets[1].data.push(liPower);
  chart.data.datasets[2].data.push(loadPower);

  // データ量制御（最新50件だけ表示）
  if (chart.data.labels.length > 50) {
    chart.data.labels.shift();
    chart.data.datasets.forEach(ds => ds.data.shift());
  }
  chart.update();

  // GPS 描画
  const lat = data.GPS ? data.GPS.lat : null;
  const lng = data.GPS ? data.GPS.lng : null;

  if (lat !== null && lng !== null) {
    const latlng = [lat, lng];
    marker.setLatLng(latlng)
          .setPopupContent(`Panel: ${panelPower.toFixed(2)} W<br>
                            Li: ${liPower.toFixed(2)} W<br>
                            Load: ${loadPower.toFixed(2)} W`);
    polyline.addLatLng(latlng);
    map.fitBounds(polyline.getBounds());
  }
});
