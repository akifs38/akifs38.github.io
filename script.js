// Sahne ve kamera
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  45,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.z = 3;

// Renderer
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Işıklandırma
const ambientLight = new THREE.AmbientLight(0xffffff, 1);
scene.add(ambientLight);

// Dünya küresi
const geometry = new THREE.SphereGeometry(1, 64, 64);
const texture = new THREE.TextureLoader().load(
  "https://upload.wikimedia.org/wikipedia/commons/6/6f/Earth_Eastern_Hemisphere.jpg"
);
const material = new THREE.MeshBasicMaterial({ map: texture });
const globe = new THREE.Mesh(geometry, material);
scene.add(globe);

// Dönüş animasyonu değişkenleri
let rotationSpeed = 0.03;
let stopRotation = false;

function animate() {
  requestAnimationFrame(animate);

  if (!stopRotation) {
    globe.rotation.y += rotationSpeed;
    rotationSpeed *= 0.99; // yavaşlatma

    const targetRotation = 4.13; // Türkiye konumu (radyan)
    let current = globe.rotation.y % (Math.PI * 2);

    if (rotationSpeed < 0.001 && Math.abs(current - targetRotation) < 0.05) {
      stopRotation = true;
      globe.rotation.y = targetRotation;

      // Türkiye haritasını göster
      document.getElementById("turkey-map").style.display = "flex";
    }
  }

  renderer.render(scene, camera);
}

animate();

// Pencere yeniden boyutlandırma
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
