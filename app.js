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
const initialLatLng = [35.0, 135.0];
const map = L.map('map').setView(initialLatLng, 5);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap contributors'
}).addTo(map);

let marker = L.marker(initialLatLng).addTo(map)
               .bindPopup("Raspberry Pi がまだデータを送信していません")
               .openPopup();
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
// データ取得・描画（Python JSON 構造対応）
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

  const times = [];
  const panelPower = [];
  const liPower = [];
  const loadPower = [];
  const latlngs = [];

  // Python は単一 JSON なので配列ではなく1件だけ扱う
  const timeStamp = data.GPS && data.GPS.timestamp ? data.GPS.timestamp : Date.now()/1000;
  times.push(new Date(timeStamp*1000).toLocaleTimeString());

  panelPower.push(data.INA219 ? data.INA219.voltage * data.INA219.current : 0);
  liPower.push(data.INA226_Li ? data.INA226_Li.voltage * data.INA226_Li.current : 0);
  loadPower.push(data.INA226_Load ? data.INA226_Load.voltage * data.INA226_Load.current : 0);

  if (data.GPS && data.GPS.fix && data.GPS.lat !== null && data.GPS.lng !== null) {
    latlngs.push([data.GPS.lat, data.GPS.lng]);
  }

  // Chart 更新
  chart.data.labels = times;
  chart.data.datasets[0].data = panelPower;
  chart.data.datasets[1].data = liPower;
  chart.data.datasets[2].data = loadPower;
  chart.update();

  // 地図更新
  if (latlngs.length > 0) {
    const lastLatLng = latlngs[latlngs.length-1];
    marker.setLatLng(lastLatLng)
          .setPopupContent(`Panel: ${panelPower[panelPower.length-1].toFixed(2)} W<br>
                            Li: ${liPower[liPower.length-1].toFixed(2)} W<br>
                            Load: ${loadPower[loadPower.length-1].toFixed(2)} W`);
    polyline.setLatLngs(latlngs);
    map.fitBounds(polyline.getBounds());
  }
});
