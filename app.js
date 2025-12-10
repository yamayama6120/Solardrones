// script.js

// ---------- Firebase init ----------
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

// ---------- Leaflet map ----------
const initialLatLng = [35.0, 135.0];
const map = L.map('map').setView(initialLatLng, 5);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap contributors'
}).addTo(map);

let marker = L.marker(initialLatLng).addTo(map);
let polyline = L.polyline([], { color: 'blue' }).addTo(map);
let track = [];

// ---------- Chart.js ----------
const ctx = document.getElementById('chart').getContext('2d');
const chart = new Chart(ctx, {
  type: 'line',
  data: {
    labels: [],
    datasets: [
      { label: 'Panel Power', data: [], borderColor: 'red', fill: false },
      { label: 'Battery Power', data: [], borderColor: 'green', fill: false },
      { label: 'Load Power', data: [], borderColor: 'blue', fill: false }
    ]
  },
  options: {
    responsive: true,
    scales: {
      x: { display: true, title: { display: true, text: 'Time' } },
      y: { display: true, title: { display: true, text: 'Power [W]' } }
    }
  }
});

// helpers
function safeNum(v) { return (v === null || v === undefined) ? null : Number(v); }

// ---------- Realtime latest listener ----------
db.ref('latest').on('value', snap => {
  const data = snap.val();
  if (!data) return;

  const ts = data.timestamp || new Date().toISOString();
  document.getElementById('ts').textContent = ts;

  // read voltages and currents (currents are mA); compute power W = V * (mA/1000)
  const panel_v = safeNum(data.panel?.voltage);
  const panel_i = safeNum(data.panel?.current_mA);
  const batt_v = safeNum(data.battery?.voltage);
  const batt_i = safeNum(data.battery?.current_mA);
  const load_v = safeNum(data.load?.voltage);
  const load_i = safeNum(data.load?.current_mA);

  const panel_p = (panel_v !== null && panel_i !== null) ? panel_v * (panel_i / 1000) : null;
  const batt_p = (batt_v !== null && batt_i !== null) ? batt_v * (batt_i / 1000) : null;
  const load_p = (load_v !== null && load_i !== null) ? load_v * (load_i / 1000) : null;

  document.getElementById('panel-v').textContent = panel_v !== null ? panel_v.toFixed(3) : '--';
  document.getElementById('panel-i').textContent = panel_i !== null ? panel_i.toFixed(1) : '--';
  document.getElementById('panel-p').textContent = panel_p !== null ? panel_p.toFixed(2) : '--';

  document.getElementById('batt-v').textContent = batt_v !== null ? batt_v.toFixed(3) : '--';
  document.getElementById('batt-i').textContent = batt_i !== null ? batt_i.toFixed(1) : '--';
  document.getElementById('batt-p').textContent = batt_p !== null ? batt_p.toFixed(2) : '--';

  document.getElementById('load-v').textContent = load_v !== null ? load_v.toFixed(3) : '--';
  document.getElementById('load-i').textContent = load_i !== null ? load_i.toFixed(1) : '--';
  document.getElementById('load-p').textContent = load_p !== null ? load_p.toFixed(2) : '--';

  // Map update if GPS present
  const lat = data.GPS?.lat;
  const lng = data.GPS?.lng;
  if (lat !== null && lat !== undefined && lng !== null && lng !== undefined) {
    const pos = [lat, lng];
    track.push(pos);
    marker.setLatLng(pos);
    marker.bindPopup(
      `Panel: ${panel_p !== null ? panel_p.toFixed(2) : '--'} W<br>` +
      `Battery: ${batt_p !== null ? batt_p.toFixed(2) : '--'} W<br>` +
      `Load: ${load_p !== null ? load_p.toFixed(2) : '--'} W`
    );
    polyline.setLatLngs(track);
    map.setView(pos, 16);
  }
});

// ---------- History -> Chart (last 100) ----------
db.ref('sensors').orderByKey().limitToLast(100).on('value', snap => {
  const data = snap.val();
  if (!data) return;

  const keys = Object.keys(data).sort(); // ascending (oldest->newest)
  const times = [];
  const p_panel = [];
  const p_batt = [];
  const p_load = [];

  keys.forEach(k => {
    const item = data[k];
    const ts = item.timestamp ? item.timestamp.slice(11,19) : k;
    times.push(ts);

    const pv = safeNum(item.panel?.voltage);
    const pi = safeNum(item.panel?.current_mA);
    const bv = safeNum(item.battery?.voltage);
    const bi = safeNum(item.battery?.current_mA);
    const lv = safeNum(item.load?.voltage);
    const li = safeNum(item.load?.current_mA);

    p_panel.push((pv !== null && pi !== null) ? pv * (pi/1000) : null);
    p_batt.push((bv !== null && bi !== null) ? bv * (bi/1000) : null);
    p_load.push((lv !== null && li !== null) ? lv * (li/1000) : null);
  });

  chart.data.labels = times;
  chart.data.datasets[0].data = p_panel;
  chart.data.datasets[1].data = p_batt;
  chart.data.datasets[2].data = p_load;
  chart.update();
});
