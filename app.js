// -----------------------------
// Firebase 初期化
// -----------------------------
const firebaseConfig = {
  apiKey: "AIzaSyBq9omBu6A-Le7lEjQAlsvqtv8Mqa8tl-c",
  authDomain: "dronesgps-f3616.firebaseapp.com",
  databaseURL: "https://dronesgps-f3616-default-rtdb.firebaseio.com",
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
const map = L.map('map').setView([35.0, 135.0], 5); // 初期位置適当に設定
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap contributors'
}).addTo(map);

let marker = null;
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
      { label: 'Pi Power', data: [], borderColor: 'blue', fill: false }
    ]
  },
  options: {
    responsive: true,
    plugins: { legend: { display: true } },
    scales: { x: { display: true, title: { display: true, text: 'Time' } },
              y: { display: true, title: { display: true, text: 'Power [W]' } } }
  }
});

// -----------------------------
// データ取得・描画
// -----------------------------

// Raspberry Pi 側の送信先に合わせて書き換え
// 今回は send_sensors_to_firebase.py で ref.set(data) している 'sensors'
db.ref('sensors').on('value', snapshot => {
  const data = snapshot.val();
  if (!data) return;

  const times = [];
  const panelPower = [];
  const liPower = [];
  const piPower = [];
  const latlngs = [];

  // timestampキーでソート
  const keys = Object.keys(data).sort();

  keys.forEach(ts => {
    const item = data[ts];
    const timeStr = new Date(Number(ts)*1000).toLocaleTimeString();
    times.push(timeStr);

    panelPower.push(item.INA219_Panel ? item.INA219_Panel.voltage * item.INA219_Panel.current : 0);
    liPower.push(item.INA226_Li ? item.INA226_Li.voltage * item.INA226_Li.current : 0);
    piPower.push(item.INA226_Load ? item.INA226_Load.voltage * item.INA226_Load.current : 0);

    if (item.lat && item.lng) {
      latlngs.push([item.lat, item.lng]);
    }
  });

  // Chart 更新
  chart.data.labels = times;
  chart.data.datasets[0].data = panelPower;
  chart.data.datasets[1].data = liPower;
  chart.data.datasets[2].data = piPower;
  chart.update();

  // 地図更新
  if (latlngs.length > 0) {
    if (!marker) {
      marker = L.marker(latlngs[latlngs.length-1]).addTo(map)
                .bindPopup(`Panel: ${panelPower[panelPower.length-1].toFixed(2)} W<br>
                            Li: ${liPower[liPower.length-1].toFixed(2)} W<br>
                            Pi: ${piPower[piPower.length-1].toFixed(2)} W`).openPopup();
    } else {
      marker.setLatLng(latlngs[latlngs.length-1])
            .setPopupContent(`Panel: ${panelPower[panelPower.length-1].toFixed(2)} W<br>
                              Li: ${liPower[liPower.length-1].toFixed(2)} W<br>
                              Pi: ${piPower[piPower.length-1].toFixed(2)} W`);
    }
    polyline.setLatLngs(latlngs);
    map.fitBounds(polyline.getBounds());
  }
});
