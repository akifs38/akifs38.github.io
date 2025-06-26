// === THREE.JS DÜNYA ===
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(45, innerWidth / innerHeight, 0.1, 1000);
camera.position.set(0, 0, 3.5);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(devicePixelRatio);
document.body.appendChild(renderer.domElement);

const hemi = new THREE.HemisphereLight(0xffffff, 0x444444, 1.0);
scene.add(hemi);
const dir = new THREE.DirectionalLight(0xffffff, 1.0);
dir.position.set(5, 3, 5);
scene.add(dir);

const geo = new THREE.SphereGeometry(1, 64, 64);
const loader = new THREE.TextureLoader();
const earthMat = new THREE.MeshPhongMaterial({
  map: loader.load("https://raw.githubusercontent.com/turban/webgl-earth/master/images/2_no_clouds_4k.jpg"),
  specular: new THREE.Color("white"),
  shininess: 30,
});
const earth = new THREE.Mesh(geo, earthMat);
scene.add(earth);

const cloudMat = new THREE.MeshPhongMaterial({
  map: loader.load("https://raw.githubusercontent.com/turban/webgl-earth/master/images/fair_clouds_4k.png"),
  transparent: true,
  opacity: 0.4,
  depthWrite: false,
});
const clouds = new THREE.Mesh(geo.clone(), cloudMat);
clouds.scale.set(1.01, 1.01, 1.01);
scene.add(clouds);

let speed = 0.08;
let animating = true;
const mapContainer = document.getElementById("map-container");
const resetButton = document.getElementById("reset");

function animate() {
  requestAnimationFrame(animate);
  if (animating) {
    speed *= 0.985;
    earth.rotation.y += speed;
    clouds.rotation.y += speed * 1.1;
    if (speed < 0.001) {
      earth.rotation.y = 4.72;
      animating = false;
      mapContainer.classList.add("open");
      initMap();
    }
  }
  renderer.render(scene, camera);
}
animate();

resetButton.onclick = () => {
  earth.rotation.y = 0;
  speed = 0.08;
  animating = true;
  mapContainer.classList.remove("open");
  document.getElementById("message").style.display = "none";
  document.getElementById("routeInfo").style.display = "none";
};

window.addEventListener("resize", () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

// === HARİTA VE ROTA ===
function initMap() {
  const cities = {
    "Ankara": [39.93, 32.85],
    "Istanbul": [41.0082, 28.9784],
    "Izmir": [38.4237, 27.1428],
    "Kayseri": [38.7312, 35.4787],
    "Antalya": [36.8841, 30.7056],
    "Trabzon": [41.0027, 39.7178],
    "Gaziantep": [37.0662, 37.3833],
    "Van": [38.4952, 43.3839],
    "Diyarbakir": [37.9144, 40.2306],
    "Bursa": [40.1958, 29.06]
  };

  const start = document.getElementById("start");
  const end = document.getElementById("end");
  const startMove = document.getElementById("startMove");
  const message = document.getElementById("message");
  const routeInfo = document.getElementById("routeInfo");
  const closePopup = document.getElementById("closePopup");
  const infoStart = document.getElementById("infoStart");
  const infoEnd = document.getElementById("infoEnd");
  const infoDuration = document.getElementById("infoDuration");
  const poiList = document.getElementById("poiList");

  Object.keys(cities).forEach(city => {
    start.add(new Option(city, city));
    end.add(new Option(city, city));
  });

  const map = L.map('map').setView([39.0, 35.0], 6);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

  let routeControl;

  startMove.onclick = () => {
    if (start.value === end.value) return;
    if (routeControl) map.removeControl(routeControl);

    const carIcon = L.icon({
      iconUrl: "https://cdn-icons-png.flaticon.com/512/1048/1048315.png",
      iconSize: [40, 40],
      iconAnchor: [20, 20]
    });

    routeControl = L.Routing.control({
      waypoints: [
        L.latLng(...cities[start.value]),
        L.latLng(...cities[end.value])
      ],
      createMarker: () => null,
      addWaypoints: false,
      show: false,
      fitSelectedRoutes: true
    }).addTo(map).on('routesfound', async e => {
      const latlngs = e.routes[0].coordinates.map(c => [c.lat, c.lng]);
      const marker = L.marker(latlngs[0], { icon: carIcon }).addTo(map);
      let i = 0;

      function move() {
        if (i >= latlngs.length) {
          message.style.display = 'block';
          setTimeout(() => message.style.display = 'none', 3000);
          return;
        }
        marker.setLatLng(latlngs[i]);
        i += 2;
        requestAnimationFrame(move);
      }
      move();

      // Rota bilgisi göster
      infoStart.textContent = start.value;
      infoEnd.textContent = end.value;
      const duration = (e.routes[0].summary.totalTime / 3600).toFixed(1);
      infoDuration.textContent = duration;
      routeInfo.style.display = "block";

      // OpenTripMap API'den gezilecek yerleri çek
      const apiKey = "5ae2e3f221c38a28845f05b62b9976b13cad50396fd954080675060c";
      const midPoint = latlngs[Math.floor(latlngs.length / 2)];
      const radius = 10000;

      const fetchPlaces = async () => {
        const url = `https://api.opentripmap.com/0.1/en/places/radius?radius=${radius}&lon=${midPoint[1]}&lat=${midPoint[0]}&rate=2&limit=30&apikey=${apiKey}`;
        const res = await fetch(url);
        const data = await res.json();
        return data.features;
      };

      const features = await fetchPlaces();
      const categories = {
        "cultural": "Kültürel",
        "natural": "Doğal",
        "historic": "Tarihi",
        "architecture": "Mimari",
        "industrial_facilities": "Endüstriyel"
      };

      const grouped = {};
      features.forEach(f => {
        const kinds = f.properties.kinds.split(",");
        for (let k of kinds) {
          if (categories[k]) {
            if (!grouped[categories[k]]) grouped[categories[k]] = [];
            grouped[categories[k]].push({
              name: f.properties.name,
              point: f.geometry,
              address: f.properties.address || {}
            });
            break;
          }
        }
      });

      poiList.innerHTML = "";
      for (let category in grouped) {
        const header = document.createElement("li");
        header.textContent = `📌 ${category}`;
        header.style.fontWeight = "bold";
        poiList.appendChild(header);

        grouped[category].slice(0, 5).forEach(place => {
          const name = place.name;
          const city = place.address?.city || "";
          const town = place.address?.suburb || place.address?.town || place.address?.village || "";
          const locationText = (city && town) ? `${city} - ${town}` : city || town || "";
          const li = document.createElement("li");
          li.textContent = `- ${name} ${locationText ? `(${locationText})` : ""}`;
          poiList.appendChild(li);
        });
      }
    });
  };

  closePopup.onclick = () => {
    routeInfo.style.display = "none";
  };
}