// ========================
// Firebase 初期化
// ========================
const firebaseConfig = {
  apiKey: "AIzaSyBq9omBu6A-Le7lEjQAlsvqtv8Mqa8tl-c",
  authDomain: "dronesgps-f3616.firebaseapp.com",
  databaseURL: "https://dronesgps-f3616-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "dronesgps-f3616",
  storageBucket: "dronesgps-f3616.firebasestorage.app",
  messagingSenderId: "1068524436957",
  appId: "1:1068524436957:web:dbd9ec480ced3065314a34",
};
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// ========================
// 地図の準備
// ========================
let map = L.map('map').setView([35, 135], 6);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

let marker = null;
let path = [];
let polyline = null;

// ========================
// グラフの準備
// ========================
const ctx = document.getElementById('chart').getContext('2d');
let labels=[], panelData=[], liData=[], piData=[];

let chart = new Chart(ctx, {
  type: 'line',
  data: {
    labels: labels,
    datasets: [
      { label:'Panel Power (W)', data: panelData, borderColor:'orange', fill:false },
      { label:'Li-ion Power (W)', data: liData, borderColor:'green', fill:false },
      { label:'Raspberry Pi Power (W)', data: piData, borderColor:'blue', fill:false }
    ]
  },
  options: {
    responsive: true,
    plugins: { legend: { position: 'top' } },
    scales: {
      x: { title: { display:true, text:'Time' } },
      y: { title: { display:true, text:'Power (W)' } }
    }
  }
});

// ========================
// データ取得（過去軌跡 + グラフ）
// ========================
const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
db.ref(`sensors_log/${today}`).on("value", snapshot => {
  const logs = snapshot.val();
  if(!logs) return;

  // 配列初期化
  labels.length = panelData.length = liData.length = piData.length = 0;
  path = [];

  Object.keys(logs).sort().forEach(ts => {
    const entry = logs[ts];
    const lat = entry.lat;
    const lng = entry.lng;

    // ---------------------
    // マーカー軌跡
    // ---------------------
    path.push([lat,lng]);
    if(marker===null){
      marker = L.marker([lat,lng]).addTo(map);
    } else {
      marker.setLatLng([lat,lng]);
    }

    marker.bindPopup(`
      <b>位置情報</b><br>
      緯度: ${lat}<br>
      経度: ${lng}<br>
      🔆 パネル: ${entry.panel_power} W<br>
      🔋 リチウム: ${entry.li_power} W<br>
      💻 RPi: ${entry.pi_power} W
    `);

    if(polyline===null) polyline = L.polyline(path, {color:'red'}).addTo(map);
    else polyline.setLatLngs(path);

    // ---------------------
    // グラフ用データ
    // ---------------------
    labels.push(new Date(ts*1000).toLocaleTimeString());
    panelData.push(entry.panel_power);
    liData.push(entry.li_power);
    piData.push(entry.pi_power);
  });

  chart.update();
});
