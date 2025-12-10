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

// ==========================
// 汎用：value + timestamp を読む関数
// ==========================
function listenValue(path, valueId) {
    db.ref(path).on("value", (snapshot) => {
        const data = snapshot.val();
        if (!data) return;
        if (data.value !== undefined) {
            document.getElementById(valueId).textContent = data.value;
        }
    });
}


// ==========================
// 各センサー読み取り
// ==========================

// GPS
db.ref("GPS").on("value", (snap) => {
    const gps = snap.val();
    if (!gps) return;

    document.getElementById("gps-lat").textContent = gps.lat ?? "--";
    document.getElementById("gps-lng").textContent = gps.lng ?? "--";
    document.getElementById("gps-time").textContent = gps.timestamp ?? "--";
});

// INA219
listenValue("INA219_V", "ina219-v");
listenValue("INA219_I", "ina219-i");

// INA226 Load
listenValue("INA226_Load_V", "ina226-load-v");
listenValue("INA226_Load_I", "ina226-load-i");

// INA226 Li
listenValue("INA226_Li_V", "ina226-li-v");
listenValue("INA226_Li_I", "ina226-li-i");
