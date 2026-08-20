/* ============================================================
   ROTA YAHYALI — İnteraktif Leaflet Haritası
   Not: koordinatlar yaklaşık/tanıtım amaçlıdır.
   ============================================================ */
(function () {
  "use strict";
  if (typeof L === "undefined") return;

  var PLACES = [
    { n: "Yahyalı Merkez", d: "İlçe merkezi · başlangıç noktası", lat: 38.0989, lng: 35.3567, z: 13, key: true },
    { n: "Kapuzbaşı Şelaleleri", d: "Aladağlar içinde 7 kollu dev çağlayan", lat: 37.7667, lng: 35.5333, z: 13 },
    { n: "Aladağlar Milli Parkı", d: "Karlı zirveler & tırmanış rotaları", lat: 37.8300, lng: 35.2000, z: 11 },
    { n: "Derebağ Şelalesi", d: "Süleymanfakılı yakını · piknik", lat: 38.0550, lng: 35.2450, z: 13 },
    { n: "Kovalı Şelalesi", d: "Zamantı vadisi · kanyon & havuz", lat: 37.9200, lng: 35.4300, z: 13 },
    { n: "Barsama Antik Yerleşimi", d: "Roma-Bizans kaya mezarları", lat: 38.0700, lng: 35.4000, z: 13 },
    { n: "Zamantı Irmağı", d: "İlçeyi besleyen ana su yolu", lat: 37.9500, lng: 35.4500, z: 12 }
  ];

  var map = L.map("map", { scrollWheelZoom: false, zoomControl: true })
    .setView([37.95, 35.35], 10);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 18,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> katkıda bulunanlar'
  }).addTo(map);

  // scroll zoom sadece haritaya tıklayınca aktif olsun
  map.on("focus", function () { map.scrollWheelZoom.enable(); });
  map.on("blur", function () { map.scrollWheelZoom.disable(); });

  function makeIcon(label, isKey) {
    return L.divIcon({
      className: "",
      html:
        '<div style="width:34px;height:34px;transform:translate(-50%,-100%);' +
        'background:' + (isKey ? "#d9a441" : "#1c6b41") + ';border:3px solid #fff;' +
        'border-radius:50% 50% 50% 0;rotate:45deg;box-shadow:0 6px 14px rgba(0,0,0,.3);' +
        'display:grid;place-items:center;">' +
        '<span style="rotate:-45deg;color:#fff;font-weight:700;font-family:Fraunces,serif;font-size:14px">' + label + "</span></div>",
      iconSize: [34, 34],
      iconAnchor: [0, 0]
    });
  }

  var side = document.getElementById("mapSide");
  var markers = [];

  PLACES.forEach(function (p, i) {
    var label = p.key ? "★" : String(i);
    var m = L.marker([p.lat, p.lng], { icon: makeIcon(label, p.key) }).addTo(map);
    m.bindPopup("<b>" + p.n + "</b><br>" + p.d);
    markers.push(m);

    if (side) {
      var btn = document.createElement("button");
      btn.className = "map-item" + (p.key ? " active" : "");
      btn.innerHTML =
        '<span class="num">' + label + "</span>" +
        "<span><b>" + p.n + "</b><span>" + p.d + "</span></span>";
      btn.addEventListener("click", function () {
        document.querySelectorAll(".map-item").forEach(function (x) { x.classList.remove("active"); });
        btn.classList.add("active");
        map.flyTo([p.lat, p.lng], p.z, { duration: 1.4 });
        setTimeout(function () { m.openPopup(); }, 800);
      });
      side.appendChild(btn);
    }
  });

  // tüm noktalar görünecek şekilde başlangıç
  var group = L.featureGroup(markers);
  map.fitBounds(group.getBounds().pad(0.15));
})();
