/* Firebase Init */
var firebaseConfig = {
  apiKey: "AIzaSyBq9omBu6A-Le7lEjQAlsvqtv8Mqa8tl-c",
  authDomain: "dronesgps-f3616.firebaseapp.com",
  databaseURL: "https://dronesgps-f3616-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "dronesgps-f3616",
  storageBucket: "dronesgps-f3616.appspot.com",
  messagingSenderId: "1068524436957",
  appId: "1:1068524436957:web:dbd9ec480ced3065314a34"
};

firebase.initializeApp(firebaseConfig);
var db = firebase.database();

/* Leaflet Map */
var map = L.map('map').setView([35.0, 135.0], 6);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap contributors'
}).addTo(map);

var marker = L.marker([35.0, 135.0]).addTo(map);

/* Chart.js Setup */
var ctx = document.getElementById('chart').getContext('2d');
var chart = new Chart(ctx, {
  type: 'line',
  data: {
    labels: [],
    datasets: [{
      label: "Power (W)",
      data: [],
      borderWidth: 1
    }]
  },
  options: { responsive: true }
});

// -------- 最新 GPS --------
db.ref("sensors/GPS").on("value", function(snap){
  var gps = snap.val();
  if (!gps || gps.lat === 0) return;

  marker.setLatLng([gps.lat, gps.lng]);
  map.setView([gps.lat, gps.lng], 16);

  document.getElementById("ts").innerText = Date().toString();
});

// -------- Battery (INA219) --------
function updateBattery(){
  Promise.all([
    db.ref("sensors/INA219_V").once("value"),
    db.ref("sensors/INA219_I").once("value")
  ]).then(values => {
    var V = values[0].val()?.value || 0;
    var I = values[1].val()?.value || 0;
    var P = V * I;

    document.getElementById("batt-v").innerText = V.toFixed(2);
    document.getElementById("batt-i").innerText = I.toFixed(3);
    document.getElementById("batt-p").innerText = P.toFixed(2);

    // グラフへ追加
    chart.data.labels.push("");
    chart.data.datasets[0].data.push(P);
    if(chart.data.datasets[0].data.length > 100){
      chart.data.labels.shift();
      chart.data.datasets[0].data.shift();
    }
    chart.update();
  });
}
setInterval(updateBattery, 1000);

// -------- Panel (Li Battery from INA226_Li) --------
db.ref("sensors/INA226_Li_V").on("value", function(){
  Promise.all([
    db.ref("sensors/INA226_Li_V").once("value"),
    db.ref("sensors/INA226_Li_I").once("value")
  ]).then(values => {
    var V = values[0].val()?.value || 0;
    var I = values[1].val()?.value || 0;
    var P = V * I;

    document.getElementById("panel-v").innerText = V.toFixed(2);
    document.getElementById("panel-i").innerText = (I*1000).toFixed(1);
    document.getElementById("panel-p").innerText = P.toFixed(2);
  });
});

// -------- Load (INA226_Load) --------
db.ref("sensors/INA226_Load_V").on("value", function(){
  Promise.all([
    db.ref("sensors/INA226_Load_V").once("value"),
    db.ref("sensors/INA226_Load_I").once("value")
  ]).then(values => {
    var V = values[0].val()?.value || 0;
    var I = values[1].val()?.value || 0;
    var P = V * I;

    document.getElementById("load-v").innerText = V.toFixed(2);
    document.getElementById("load-i").innerText = (I*1000).toFixed(1);
    document.getElementById("load-p").innerText = P.toFixed(2);
  });
});
