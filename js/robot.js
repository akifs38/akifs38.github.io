/* =================================================================
   ROBOT MODÜLÜ — LIN/PTP Teorisi + 2-DOF Planar Robot Simülasyonu
   ================================================================= */

/* ─── Simülasyon sabitleri ────────────────────────────────────── */
const SIM_BASE_X = 250, SIM_BASE_Y = 340;
const L1 = 145, L2 = 115;   // Kol uzunlukları (SVG birimi)

/* ─── Simülasyon durumu ───────────────────────────────────────── */
let RS = {
  t1: Math.PI / 3.5,   // Omuz açısı (rad)
  t2: -Math.PI / 2.8,  // Dirsek açısı (rad)
  mode: 'ptp',          // 'ptp' | 'lin'
  speed: 50,
  target: null,
  traj: [],
  tIdx: 0,
  running: false,
  animId: null,
};
let _linPtpAnim = null;

/* ─── İleri/Ters Kinematik ─────────────────────────────────────── */
function fk(t1, t2) {
  const j2x = SIM_BASE_X + L1 * Math.cos(t1);
  const j2y = SIM_BASE_Y - L1 * Math.sin(t1);
  return {
    j2x, j2y,
    tcpx: j2x + L2 * Math.cos(t1 + t2),
    tcpy: j2y - L2 * Math.sin(t1 + t2),
  };
}

function ik(px, py) {
  const dx = px - SIM_BASE_X;
  const dy = SIM_BASE_Y - py;
  const r2 = dx * dx + dy * dy;
  const c2 = (r2 - L1 * L1 - L2 * L2) / (2 * L1 * L2);
  if (c2 < -1 || c2 > 1) return null;
  const s2  = Math.sqrt(1 - c2 * c2);         // elbow-up
  const t2  = Math.atan2(s2, c2);
  const t1  = Math.atan2(dy, dx) - Math.atan2(L2 * s2, L1 + L2 * c2);
  return { t1, t2 };
}

function lerpAng(a, b, t) {
  let d = b - a;
  while (d >  Math.PI) d -= 2 * Math.PI;
  while (d < -Math.PI) d += 2 * Math.PI;
  return a + d * t;
}

function eio(t) { return t < .5 ? 2*t*t : 1 - Math.pow(-2*t+2,2)/2; }

/* ─── Modül giriş noktası ───────────────────────────────────────── */
window.openRobot = function() { switchTab('robot'); window.renderRobot(); };

window.renderRobot = function() {
  if (_linPtpAnim) { cancelAnimationFrame(_linPtpAnim); _linPtpAnim = null; }
  if (RS.animId)   { clearTimeout(RS.animId); RS.running = false; }
  if (window._r3dAnim) { cancelAnimationFrame(window._r3dAnim); window._r3dAnim = null; }
  const sec = document.getElementById('tab-robot');
  if (!sec) return;

  sec.innerHTML = `
<div class="robot-layout">

  <div class="robot-tabs">
    <button class="robot-tab-btn"        onclick="rTab('3d',this)">🎯 3D Robot</button>
    <button class="robot-tab-btn active" onclick="rTab('temel',this)">🤖 Temel Kavramlar</button>
    <button class="robot-tab-btn"        onclick="rTab('linptp',this)">📐 LIN vs PTP</button>
    <button class="robot-tab-btn"        onclick="rTab('sim',this)">⚙️ Simülasyon</button>
  </div>

  <div id="rt-3d"     class="robot-tab-pane">${_robot3d()}</div>
  <div id="rt-temel"  class="robot-tab-pane active">${_temel()}</div>
  <div id="rt-linptp" class="robot-tab-pane">${_linptp()}</div>
  <div id="rt-sim"    class="robot-tab-pane">${_sim()}</div>

</div>`;

  requestAnimationFrame(_initSim);
};

/* ─── Sekme geçişi ──────────────────────────────────────────────── */
window.rTab = function(id, btn) {
  document.querySelectorAll('#tab-robot .robot-tab-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('#tab-robot .robot-tab-pane').forEach(p => p.classList.remove('active'));
  btn.classList.add('active');
  document.getElementById('rt-' + id).classList.add('active');
  if (id === 'linptp') requestAnimationFrame(_startLinPtpAnim);
  if (id === 'sim')    requestAnimationFrame(_initSim);
  if (id === '3d')     _init3D();
};

/* ─── 3D ROBOT ─────────────────────────────────────────────────── */
function _robot3d() {
  return `
<div class="r3d-wrap">
  <canvas id="r3dCanvas"></canvas>
  <div class="r3d-overlay">
    <div class="r3d-badge">6-EKSEN ENDÜSTRİYEL ROBOT</div>
    <div class="r3d-hint">Sürükle: döndür · Scroll: yakınlaştır</div>
  </div>
  <div class="r3d-controls">
    <button class="r3d-btn" onclick="_r3dAction('home')">🏠 Home</button>
    <button class="r3d-btn" onclick="_r3dAction('wave')">🤖 Dalga</button>
    <button class="r3d-btn" onclick="_r3dAction('pick')">📦 Pick</button>
    <button class="r3d-btn" onclick="_r3dAction('dance')">💃 Dans</button>
  </div>
</div>`;
}

let _r3d = null; // Three.js nesneleri

function _init3D() {
  const canvas = document.getElementById('r3dCanvas');
  if (!canvas) return;

  // Zaten başlatıldıysa sadece yeniden boyutlandır
  if (_r3d && _r3d.renderer) { _r3dResize(); _r3dStartLoop(); return; }

  // Three.js yüklü değilse CDN'den çek
  if (typeof THREE === 'undefined') {
    const s = document.createElement('script');
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r134/three.min.js';
    s.onload = () => _buildScene(canvas);
    document.head.appendChild(s);
  } else {
    _buildScene(canvas);
  }
}

function _buildScene(canvas) {
  const W = canvas.parentElement.clientWidth || 400;
  const H = Math.max(W * 0.65, 340);
  canvas.width = W; canvas.height = H;

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(W, H);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.setClearColor(0x0e1116);

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x0e1116, 12, 30);

  const camera = new THREE.PerspectiveCamera(45, W / H, 0.1, 100);
  camera.position.set(5, 4, 7);
  camera.lookAt(0, 2, 0);

  // Işıklar
  scene.add(new THREE.AmbientLight(0x334455, 1.2));
  const sun = new THREE.DirectionalLight(0xffffff, 2.5);
  sun.position.set(5, 10, 7);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  sun.shadow.camera.near = 0.5;
  sun.shadow.camera.far = 30;
  scene.add(sun);
  const fill = new THREE.DirectionalLight(0x3aa0ff, 0.6);
  fill.position.set(-5, 3, -3);
  scene.add(fill);

  // Zemin
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(20, 20),
    new THREE.MeshStandardMaterial({ color: 0x12161c, roughness: 0.9, metalness: 0.1 })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);

  // Izgara
  const grid = new THREE.GridHelper(12, 24, 0x1e2a38, 0x1e2a38);
  grid.material.opacity = 0.5; grid.material.transparent = true;
  scene.add(grid);

  // Malzemeler
  const matGray   = new THREE.MeshStandardMaterial({ color: 0x4a5568, roughness: 0.4, metalness: 0.7 });
  const matDark   = new THREE.MeshStandardMaterial({ color: 0x2d3748, roughness: 0.5, metalness: 0.8 });
  const matBlue   = new THREE.MeshStandardMaterial({ color: 0x2563eb, roughness: 0.3, metalness: 0.9, emissive: 0x1e40af, emissiveIntensity: 0.3 });
  const matGreen  = new THREE.MeshStandardMaterial({ color: 0x27d07a, roughness: 0.3, metalness: 0.6, emissive: 0x27d07a, emissiveIntensity: 0.4 });
  const matAccent = new THREE.MeshStandardMaterial({ color: 0xf5b301, roughness: 0.3, metalness: 0.8, emissive: 0xf5b301, emissiveIntensity: 0.2 });

  function cylinder(rt, rb, h, mat, segments=24) {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, segments), mat);
    m.castShadow = true; m.receiveShadow = true;
    return m;
  }
  function sphere(r, mat, segments=20) {
    const m = new THREE.Mesh(new THREE.SphereGeometry(r, segments, segments), mat);
    m.castShadow = true; return m;
  }
  function ring(ro, ri, mat) {
    const m = new THREE.Mesh(new THREE.TorusGeometry((ro+ri)/2, (ro-ri)/2, 8, 32), mat);
    m.castShadow = true; return m;
  }

  // ── Robot kolunu pivot gruplarıyla kur ──
  const robotRoot = new THREE.Group();
  scene.add(robotRoot);

  // Taban platformu
  const base = cylinder(0.9, 1.1, 0.25, matDark); base.position.y = 0.125; robotRoot.add(base);
  const baseRing = ring(0.95, 0.75, matBlue); baseRing.rotation.x = Math.PI/2; baseRing.position.y = 0.28; robotRoot.add(baseRing);

  // A1 pivot (bel dönüşü - Y ekseni)
  const pivotA1 = new THREE.Group(); pivotA1.position.y = 0.25; robotRoot.add(pivotA1);

  // Gövde silindiri
  const bodyBot = cylinder(0.62, 0.72, 0.6, matDark); bodyBot.position.y = 0.3; pivotA1.add(bodyBot);
  const bodyRing1 = ring(0.68, 0.52, matBlue); bodyRing1.rotation.x=Math.PI/2; bodyRing1.position.y=0.55; pivotA1.add(bodyRing1);

  // A2 pivot (omuz - Z ekseni)
  const pivotA2 = new THREE.Group(); pivotA2.position.y = 0.65; pivotA1.add(pivotA2);
  const shoulderHub = sphere(0.38, matGray); pivotA2.add(shoulderHub);
  const shoulderRing = ring(0.42, 0.32, matBlue); shoulderRing.rotation.y=Math.PI/2; pivotA2.add(shoulderRing);

  // Üst kol
  const pivotA2arm = new THREE.Group(); pivotA2.add(pivotA2arm);
  const upperArm = cylinder(0.22, 0.28, 1.6, matGray); upperArm.position.y = 0.8; pivotA2arm.add(upperArm);
  const upperRib = cylinder(0.30, 0.30, 0.1, matDark); upperRib.position.y = 0.3; pivotA2arm.add(upperRib);
  const upperRib2 = cylinder(0.30, 0.30, 0.1, matDark); upperRib2.position.y = 1.3; pivotA2arm.add(upperRib2);

  // A3 pivot (dirsek)
  const pivotA3 = new THREE.Group(); pivotA3.position.y = 1.65; pivotA2arm.add(pivotA3);
  const elbowHub = sphere(0.30, matGray); pivotA3.add(elbowHub);
  const elbowRing = ring(0.34, 0.26, matBlue); elbowRing.rotation.y=Math.PI/2; pivotA3.add(elbowRing);

  // Ön kol
  const pivotA3arm = new THREE.Group(); pivotA3.add(pivotA3arm);
  const foreArm = cylinder(0.18, 0.22, 1.2, matGray); foreArm.position.y = 0.6; pivotA3arm.add(foreArm);

  // A5 pivot (bilek)
  const pivotA5 = new THREE.Group(); pivotA5.position.y = 1.25; pivotA3arm.add(pivotA5);
  const wristHub = sphere(0.22, matDark); pivotA5.add(wristHub);
  const wristRing = ring(0.24, 0.18, matBlue); wristRing.rotation.x=Math.PI/2; pivotA5.add(wristRing);

  // A6 pivot (takım)
  const pivotA6 = new THREE.Group(); pivotA5.add(pivotA6);
  const toolShaft = cylinder(0.14, 0.14, 0.35, matDark); toolShaft.position.y = 0.17; pivotA6.add(toolShaft);
  const toolTip = sphere(0.12, matGreen); toolTip.position.y = 0.38; pivotA6.add(toolTip);
  // Tutucu parmaklar
  const f1 = cylinder(0.04, 0.04, 0.22, matAccent); f1.position.set(0.08, 0.46, 0); pivotA6.add(f1);
  const f2 = cylinder(0.04, 0.04, 0.22, matAccent); f2.position.set(-0.08, 0.46, 0); pivotA6.add(f2);
  const f3 = cylinder(0.04, 0.04, 0.22, matAccent); f3.rotation.x=Math.PI/2; f3.position.set(0, 0.46, 0.08); pivotA6.add(f3);

  // Kablo simülasyonu (torus)
  const cable = new THREE.Mesh(
    new THREE.TorusGeometry(0.28, 0.025, 8, 32, Math.PI*1.5),
    new THREE.MeshStandardMaterial({ color: 0x1a1a2e, roughness: 0.8 })
  );
  cable.rotation.x = -Math.PI/2; cable.position.y = 0.5; pivotA2arm.add(cable);

  // Orbit kontrol (basit, bağımlılıksız)
  let _isDrag=false, _lastX=0, _lastY=0, _camTheta=0.8, _camPhi=0.55, _camR=9;
  const _target = new THREE.Vector3(0, 2, 0);
  function _updateCam() {
    camera.position.x = _target.x + _camR * Math.sin(_camPhi) * Math.sin(_camTheta);
    camera.position.y = _target.y + _camR * Math.cos(_camPhi);
    camera.position.z = _target.z + _camR * Math.sin(_camPhi) * Math.cos(_camTheta);
    camera.lookAt(_target);
  }
  _updateCam();

  canvas.addEventListener('pointerdown', e => { _isDrag=true; _lastX=e.clientX; _lastY=e.clientY; canvas.setPointerCapture(e.pointerId); });
  canvas.addEventListener('pointermove', e => {
    if (!_isDrag) return;
    _camTheta -= (e.clientX-_lastX)*0.01;
    _camPhi   = Math.max(0.1, Math.min(Math.PI*0.85, _camPhi+(e.clientY-_lastY)*0.01));
    _lastX=e.clientX; _lastY=e.clientY; _updateCam();
  });
  canvas.addEventListener('pointerup', () => _isDrag=false);
  canvas.addEventListener('wheel', e => { _camR=Math.max(3,Math.min(18,_camR+e.deltaY*0.01)); _updateCam(); }, {passive:true});

  // Animasyon durumu
  let _anim = 'idle', _animT = 0;
  const _joints = { a1:pivotA1, a2:pivotA2arm, a3:pivotA3arm, a5:pivotA5, a6:pivotA6 };
  const _home = { a1:0, a2:-0.3, a3:0.5, a5:-0.2, a6:0 };
  const _cur  = { a1:0, a2:-0.3, a3:0.5, a5:-0.2, a6:0 };
  const _targets = {
    home:  { a1:0,    a2:-0.3, a3:0.5,  a5:-0.2, a6:0 },
    wave:  { a1:0.4,  a2:-0.9, a3:0.8,  a5:-0.6, a6:0 },
    pick:  { a1:-0.6, a2:-0.1, a3:0.2,  a5:-0.5, a6:0 },
    dance: { a1:0,    a2:-0.5, a3:0.6,  a5:-0.3, a6:0 },
  };
  let _tgt = { ..._home };
  let _danceDir = 1;

  function _lerpJ(k, v, s) { _cur[k] += (v-_cur[k])*s; }

  function _applyJoints() {
    _joints.a1.rotation.y  = _cur.a1;
    _joints.a2.rotation.z  = _cur.a2;
    _joints.a3.rotation.z  = _cur.a3;
    _joints.a5.rotation.z  = _cur.a5;
    _joints.a6.rotation.y  = _cur.a6;
  }

  const clock = new THREE.Clock();

  function animate() {
    window._r3dAnim = requestAnimationFrame(animate);
    const dt = clock.getDelta();
    _animT += dt;

    // Sürekli idle salınımı
    if (_anim === 'idle') {
      _tgt.a1 = Math.sin(_animT * 0.4) * 0.15;
      _tgt.a5 = -0.2 + Math.sin(_animT * 0.7) * 0.1;
      _tgt.a6 = Math.sin(_animT * 1.2) * 0.3;
    }
    if (_anim === 'dance') {
      _tgt.a1 = Math.sin(_animT * 1.5) * 0.8;
      _tgt.a2 = -0.5 + Math.sin(_animT * 2.1) * 0.4;
      _tgt.a3 = 0.6 + Math.sin(_animT * 1.8) * 0.3;
      _tgt.a5 = Math.sin(_animT * 2.5) * 0.5;
      _tgt.a6 = _animT * 3;
    }
    if (_anim === 'wave') {
      _tgt.a5 = -0.6 + Math.sin(_animT * 4) * 0.4;
      _tgt.a6 = Math.sin(_animT * 4) * 0.5;
    }

    const s = _anim === 'dance' ? 0.08 : 0.06;
    Object.keys(_cur).forEach(k => _lerpJ(k, _tgt[k], s));
    _applyJoints();

    renderer.render(scene, camera);
  }

  _r3d = { renderer, scene, camera };
  window._r3dAction = function(act) {
    _anim = act;
    if (act !== 'dance' && act !== 'wave' && act !== 'idle') {
      _tgt = { ..._targets[act] || _home };
      setTimeout(() => { _anim = 'idle'; }, 2000);
    }
  };

  function _r3dResize() {
    const el = canvas.parentElement;
    if (!el) return;
    const w = el.clientWidth, h = Math.max(w * 0.65, 340);
    renderer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  window._r3dResize = _r3dResize;
  window.addEventListener('resize', _r3dResize);

  animate();
}

function _r3dStartLoop() { if (_r3d && window._r3dAnim == null) { /* already running */ } }
function _r3dResize() { if (window._r3dResize) window._r3dResize(); }

/* ─── TEMEL KAVRAMLAR içerik ────────────────────────────────────── */
function _temel() { return `
<div class="robot-grid">

  <div class="robot-card">
    <h3>🤖 Endüstriyel Robot Nedir?</h3>
    <p>ISO 8373: En az 3 serbestlik dereceli (DOF), programlanabilir çok eksenli manipülatör. Otomatik kontrol altında çalışır.</p>
    <div class="robot-formula">DOF = Eksen Sayısı (tipik: 6)</div>
    <p>Uygulamalar: Ark kaynağı, boyama, montaj, pick&amp;place, paketleme, kalite kontrol (vizyon).</p>
  </div>

  <div class="robot-card info">
    <h3>📐 Koordinat Sistemleri</h3>
    <p>Robot hareketi birden fazla referans çerçevesinde tanımlanır:</p>
    <ul style="color:#8a96a3;font-size:12px;line-height:2.1;margin:8px 0 0 14px">
      <li><b style="color:#e8edf2">Dünya (World)</b> — Sabit küresel referans</li>
      <li><b style="color:#e8edf2">Taban (Base)</b>  — Robotun montaj noktası</li>
      <li><b style="color:#e8edf2">TCP (Tool Center Point)</b> — Alet merkezi</li>
      <li><b style="color:#e8edf2">Eksen (Joint)</b> — Her eksenin açı/mesafe değeri</li>
    </ul>
  </div>

  <div class="robot-card live">
    <h3>⚙️ 6-Eksen Anatomisi</h3>
    <div style="display:grid;gap:6px;margin-top:6px;font-size:12px">
      <div style="display:flex;gap:8px"><span style="color:#27d07a;font-family:monospace;min-width:26px">A1</span><span style="color:#8a96a3">Bel (Waist) — ±185°</span></div>
      <div style="display:flex;gap:8px"><span style="color:#27d07a;font-family:monospace;min-width:26px">A2</span><span style="color:#8a96a3">Omuz (Shoulder) — +35°/−155°</span></div>
      <div style="display:flex;gap:8px"><span style="color:#27d07a;font-family:monospace;min-width:26px">A3</span><span style="color:#8a96a3">Dirsek (Elbow) — +154°/−130°</span></div>
      <div style="display:flex;gap:8px"><span style="color:#27d07a;font-family:monospace;min-width:26px">A4</span><span style="color:#8a96a3">Bilek Dönüş (Roll) — ±350°</span></div>
      <div style="display:flex;gap:8px"><span style="color:#27d07a;font-family:monospace;min-width:26px">A5</span><span style="color:#8a96a3">Bilek Eğim (Pitch) — ±130°</span></div>
      <div style="display:flex;gap:8px"><span style="color:#27d07a;font-family:monospace;min-width:26px">A6</span><span style="color:#8a96a3">Takım Dönüşü (Yaw) — ±350°</span></div>
    </div>
  </div>

  <div class="robot-card">
    <h3>🔢 Kinematik</h3>
    <p><b style="color:#e8edf2">İleri Kinematik (FK):</b> Eksen açıları → TCP konumu</p>
    <div class="robot-formula">FK: θ₁…θₙ → (X, Y, Z, Rx, Ry, Rz)</div>
    <p style="margin-top:8px"><b style="color:#e8edf2">Ters Kinematik (IK):</b> TCP konumu → Eksen açıları. Birden fazla çözüm olabilir (elbow-up / elbow-down).</p>
    <div class="robot-formula">IK: (X, Y, Z, Rx, Ry, Rz) → θ₁…θₙ</div>
  </div>

  <div class="robot-card info">
    <h3>🏭 Robot Tipleri</h3>
    <div style="display:grid;gap:7px;margin-top:6px;font-size:12px">
      <div><b style="color:#3aa0ff">Dikey Eklemli</b> — KUKA KR, ABB IRB, Fanuc R. 6 DOF. Genel amaç.</div>
      <div><b style="color:#3aa0ff">SCARA</b> — 4 DOF. Yatay eklemli, montaj hatları. Hızlı.</div>
      <div><b style="color:#3aa0ff">Delta/Paralel</b> — Pick&amp;place, çok hızlı. Paralel kinematik.</div>
      <div><b style="color:#3aa0ff">Kartezyen (Gantry)</b> — XYZ doğrusal. CNC, lazer kesim.</div>
      <div><b style="color:#3aa0ff">Kolaboratif (Cobot)</b> — UR, ABB GoFa. İnsan yanında. Güç sınırlı (ISO/TS 15066).</div>
    </div>
  </div>

  <div class="robot-card warn">
    <h3>💻 Programlama Yöntemleri</h3>
    <div style="font-size:12px;color:#8a96a3;line-height:2;margin-top:4px">
      <div><b style="color:#ff7a18">Teachin (Öğretme):</b> El terminali ile robot elle yönlendirilir, noktalar kaydedilir.</div>
      <div><b style="color:#ff7a18">Offline:</b> Bilgisayar simülasyonunda program. KUKA WorkVisual, ABB RobotStudio.</div>
      <div><b style="color:#ff7a18">Diller:</b> KRL (KUKA) · RAPID (ABB) · Karel (Fanuc) · AS (Kawasaki)</div>
    </div>
    <div class="robot-formula">PTP P1 Vel=100% PDAT1 Tool[1] Base[0]</div>
  </div>

</div>`; }

/* ─── LIN vs PTP içerik ─────────────────────────────────────────── */
function _linptp() { return `
<div style="margin-bottom:16px">
  <h3 style="font-size:15px;letter-spacing:1px;text-transform:uppercase;margin-bottom:6px">Hareket Tipleri</h3>
  <p style="font-size:13px;color:#8a96a3;line-height:1.7">
    Robot kontrolcüsünde iki temel hareket tipi: <b style="color:#3aa0ff">PTP (Point-to-Point)</b>
    ve <b style="color:#27d07a">LIN (Linear)</b>. Doğru tipi seçmek hem güvenlik hem verimlilik açısından kritiktir.
  </p>
</div>

<div class="linptp-grid">

  <div class="linptp-box ptp">
    <h4>PTP — Noktadan Noktaya</h4>
    <svg class="linptp-path-svg" viewBox="0 0 200 130" fill="none" id="ptpSvg">
      <g opacity=".1">
        <line x1="0" y1="32" x2="200" y2="32" stroke="white" stroke-width=".5"/>
        <line x1="0" y1="65" x2="200" y2="65" stroke="white" stroke-width=".5"/>
        <line x1="0" y1="98" x2="200" y2="98" stroke="white" stroke-width=".5"/>
        <line x1="50" y1="0" x2="50" y2="130" stroke="white" stroke-width=".5"/>
        <line x1="100" y1="0" x2="100" y2="130" stroke="white" stroke-width=".5"/>
        <line x1="150" y1="0" x2="150" y2="130" stroke="white" stroke-width=".5"/>
      </g>
      <path d="M 20 108 Q 70 35 180 22" stroke="rgba(58,160,255,.25)" stroke-width="1.5" stroke-dasharray="5 3" fill="none"/>
      <circle cx="20"  cy="108" r="5" fill="rgba(58,160,255,.2)" stroke="#3aa0ff" stroke-width="1.5"/>
      <circle cx="180" cy="22"  r="5" fill="rgba(58,160,255,.2)" stroke="#3aa0ff" stroke-width="1.5"/>
      <text x="6"   y="120" font-size="9" fill="#3aa0ff" font-family="monospace">P1</text>
      <text x="165" y="18"  font-size="9" fill="#3aa0ff" font-family="monospace">P2</text>
      <circle id="ptpDot" cx="20" cy="108" r="5" fill="#3aa0ff"/>
    </svg>
    <ul class="linptp-list">
      <li>TCP öngörülemez yay çizer</li>
      <li>Eksenler <b style="color:#e8edf2">eş zamanlı</b> hareket</li>
      <li>En hızlı mod ⚡</li>
      <li>Enerji tüketimi düşük</li>
      <li>Pick&amp;Place, konumlanma</li>
    </ul>
  </div>

  <div class="linptp-box lin">
    <h4>LIN — Doğrusal Hareket</h4>
    <svg class="linptp-path-svg" viewBox="0 0 200 130" fill="none" id="linSvg">
      <g opacity=".1">
        <line x1="0" y1="32" x2="200" y2="32" stroke="white" stroke-width=".5"/>
        <line x1="0" y1="65" x2="200" y2="65" stroke="white" stroke-width=".5"/>
        <line x1="0" y1="98" x2="200" y2="98" stroke="white" stroke-width=".5"/>
        <line x1="50" y1="0" x2="50" y2="130" stroke="white" stroke-width=".5"/>
        <line x1="100" y1="0" x2="100" y2="130" stroke="white" stroke-width=".5"/>
        <line x1="150" y1="0" x2="150" y2="130" stroke="white" stroke-width=".5"/>
      </g>
      <line x1="20" y1="108" x2="180" y2="22" stroke="rgba(39,208,122,.25)" stroke-width="1.5" stroke-dasharray="5 3"/>
      <line id="linTrace" x1="20" y1="108" x2="20" y2="108" stroke="#27d07a" stroke-width="2" opacity=".9"/>
      <circle cx="20"  cy="108" r="5" fill="rgba(39,208,122,.2)" stroke="#27d07a" stroke-width="1.5"/>
      <circle cx="180" cy="22"  r="5" fill="rgba(39,208,122,.2)" stroke="#27d07a" stroke-width="1.5"/>
      <text x="6"   y="120" font-size="9" fill="#27d07a" font-family="monospace">P1</text>
      <text x="165" y="18"  font-size="9" fill="#27d07a" font-family="monospace">P2</text>
      <circle id="linDot" cx="20" cy="108" r="5" fill="#27d07a"/>
    </svg>
    <ul class="linptp-list">
      <li>TCP tam <b style="color:#e8edf2">düz çizgi</b> izler</li>
      <li>Her adımda IK hesaplanır</li>
      <li>Yol öngörülebilir ✓</li>
      <li>Tekil nokta (singularity) riski</li>
      <li>Kaynak, kesim, yapıştırma</li>
    </ul>
  </div>

</div>

<div style="overflow-x:auto;margin:16px 0">
<table class="cmp-table">
  <thead><tr>
    <th>Özellik</th>
    <th class="ptp">PTP</th>
    <th class="lin">LIN</th>
  </tr></thead>
  <tbody>
    ${[
      ['TCP yolu',        'Öngörülemez yay',   'Düz doğru (Kartezyen)'],
      ['Hareket uzayı',   'Eksen uzayı (Joint space)', 'Kartezyen uzay'],
      ['Kinematik',       'Sadece FK',          'FK + IK (her noktada)'],
      ['Hız',             '⚡ Maksimum',         'Sınırlı'],
      ['Tekil risk',      'Düşük',              'Yüksek'],
      ['KUKA komutu',     'PTP P1 Vel=100%',    'LIN P1 Vel=0.5m/s'],
      ['ABB komutu',      'MoveJ p1, v1000',    'MoveL p1, v500'],
      ['Kullanım yeri',   'Pick&Place, depo',   'Kaynak, kesim, yapıştırma'],
    ].map(([f,p,l])=>`<tr><td>${f}</td><td>${p}</td><td>${l}</td></tr>`).join('')}
  </tbody>
</table>
</div>

<div class="robot-hint">
  <b>💡 Diğer hareket tipleri:</b><br>
  <b>CIRC</b> — Üç nokta ile tanımlanan yay (dairesel hareket).<br>
  <b>SPLINE</b> — Düzgün eğrisel yol; birden fazla noktayı akıcı geçişle birleştirir.<br>
  <b>SLIN / SCIRC</b> — Yönelimi (oryantasyonu) senkronize eden LIN/CIRC varyantları.
</div>`; }

/* ─── Simülasyon HTML ───────────────────────────────────────────── */
function _sim() { return `
<div class="robot-sim-layout">

  <!-- SVG canvas -->
  <div class="robot-canvas-wrap" id="rCanvasWrap">
    <!-- Mobil: hedef seçince canvas üstünde beliren floating buton -->
    <button class="robot-go-float" id="rGoFloat" onclick="rGo()">▶ Harekete Başla</button>
    <svg id="robotSimSvg" viewBox="0 0 500 420" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="rGrid" width="25" height="25" patternUnits="userSpaceOnUse">
          <path d="M25 0L0 0 0 25" fill="none" stroke="rgba(42,50,61,.6)" stroke-width=".5"/>
        </pattern>
        <marker id="mX" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
          <path d="M0 0L6 3L0 6z" fill="#ff4d4f"/>
        </marker>
        <marker id="mY" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
          <path d="M0 0L6 3L0 6z" fill="#27d07a"/>
        </marker>
        <filter id="tcpGlow">
          <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur"/>
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>

      <rect width="500" height="420" fill="url(#rGrid)"/>

      <!-- Erişim alanı (turuncu çemberler) -->
      <circle cx="250" cy="340" r="${L1+L2}" fill="none" stroke="rgba(245,179,1,.06)" stroke-width="1" stroke-dasharray="6 4"/>
      <circle cx="250" cy="340" r="${Math.abs(L1-L2)}" fill="none" stroke="rgba(245,179,1,.06)" stroke-width="1" stroke-dasharray="3 3"/>

      <!-- Koordinat eksenleri -->
      <line x1="250" y1="340" x2="340" y2="340" stroke="#ff4d4f" stroke-width="1.5" marker-end="url(#mX)" opacity=".45"/>
      <text x="345" y="344" font-size="10" fill="#ff4d4f" font-family="monospace" opacity=".6">X</text>
      <line x1="250" y1="340" x2="250" y2="250" stroke="#27d07a" stroke-width="1.5" marker-end="url(#mY)" opacity=".45"/>
      <text x="242" y="246" font-size="10" fill="#27d07a" font-family="monospace" opacity=".6">Y</text>

      <!-- LIN iz çizgisi -->
      <line id="rLinTrace" x1="0" y1="0" x2="0" y2="0"
            stroke="rgba(39,208,122,.28)" stroke-width="1.5" stroke-dasharray="5 3" display="none"/>

      <!-- Hedef işareti -->
      <g id="rTarget" display="none">
        <line id="rTcross1" stroke="#f5b301" stroke-width="1" opacity=".55"/>
        <line id="rTcross2" stroke="#f5b301" stroke-width="1" opacity=".55"/>
        <circle id="rTring" r="9" fill="none" stroke="#f5b301" stroke-width="1.5" stroke-dasharray="3 2"/>
        <circle id="rTdot"  r="3" fill="#f5b301" opacity=".8"/>
      </g>

      <!-- Robot kolu -->
      <g id="rArm">
        <line id="rL2" stroke="rgba(245,179,1,.55)" stroke-width="8" stroke-linecap="round"/>
        <line id="rL1" x1="250" y1="340" stroke="rgba(245,179,1,.9)" stroke-width="13" stroke-linecap="round"/>
        <circle id="rJ2" r="9" fill="#161b22" stroke="#f5b301" stroke-width="2.5"/>
        <!-- Taban -->
        <circle cx="250" cy="340" r="15" fill="#161b22" stroke="rgba(245,179,1,.65)" stroke-width="2.5"/>
        <circle cx="250" cy="340" r="6"  fill="rgba(245,179,1,.55)"/>
        <!-- TCP -->
        <g id="rTcp" filter="url(#tcpGlow)">
          <circle id="rTcpC" r="8" fill="none" stroke="#27d07a" stroke-width="2.5"/>
          <circle id="rTcpD" r="3" fill="#27d07a"/>
          <line id="rF1" stroke="#27d07a" stroke-width="3" stroke-linecap="round" opacity=".75"/>
          <line id="rF2" stroke="#27d07a" stroke-width="3" stroke-linecap="round" opacity=".75"/>
        </g>
      </g>

      <!-- Taban plaket -->
      <rect x="224" y="344" width="52" height="16" rx="4"
            fill="rgba(245,179,1,.12)" stroke="rgba(245,179,1,.28)" stroke-width="1.5"/>

      <!-- Tıklama ipucu -->
      <text id="rHint" x="250" y="48" text-anchor="middle"
            font-size="11" fill="rgba(138,150,163,.45)" font-family="monospace">
        Sarı çalışma alanı içinde bir noktaya tıkla
      </text>
    </svg>
  </div>

  <!-- Kontrol paneli -->
  <div class="robot-sim-controls">

    <div class="robot-ctrl-card">
      <h4>Hareket Tipi</h4>
      <div class="robot-mode-btns">
        <button class="robot-mode-btn active ptp" id="rBtnPtp" onclick="rSetMode('ptp',this)">PTP</button>
        <button class="robot-mode-btn lin"        id="rBtnLin" onclick="rSetMode('lin',this)">LIN</button>
      </div>
      <div id="rModeDesc" style="font-size:11px;color:#8a96a3;line-height:1.65">
        <b style="color:#3aa0ff">PTP:</b> Eksenler eş zamanlı. TCP öngörülemez yol. En hızlı mod.
      </div>
    </div>

    <div class="robot-ctrl-card">
      <h4>Hız</h4>
      <div class="robot-speed-row">
        <span>1%</span>
        <input type="range" id="rSpeedSlider" min="1" max="100" value="50"
               oninput="RS.speed=+this.value;document.getElementById('rSpeedVal').textContent=this.value+'%'">
        <span>100%</span>
      </div>
      <div style="text-align:center;font-family:monospace;font-size:12px;margin-top:4px;color:#f5b301"
           id="rSpeedVal">50%</div>
    </div>

    <div class="robot-ctrl-card">
      <h4>TCP Pozisyonu</h4>
      <div class="robot-coord-display">
        X: <span class="val" id="rCx">0.0</span> mm<br>
        Y: <span class="val" id="rCy">0.0</span> mm<br>
        J1: <span class="val" id="rA1">0.0</span>°<br>
        J2: <span class="val" id="rA2">0.0</span>°
      </div>
    </div>

    <div class="robot-ctrl-card">
      <h4>Kontrol</h4>
      <button class="btn sm block" style="margin-bottom:7px" onclick="rGo()">▶ Harekete Başla</button>
      <button class="btn ghost sm block" onclick="rReset()">↺ Sıfırla</button>
    </div>

    <div class="robot-status" id="rStatus">
      <div><span class="ok">●</span> Sistem Hazır</div>
      <div style="color:#8a96a3;margin-top:2px">
        Mod: <span id="rModLbl" style="color:#3aa0ff">PTP</span>
      </div>
    </div>

  </div>
</div>

<div class="robot-hint">
  <b>💡 Simülasyon Kullanımı:</b><br>
  1. <b>PTP</b> veya <b>LIN</b> modunu seç.<br>
  2. Sarı çalışma alanı içinde bir noktaya <b>tıkla</b> → hedef belirir.<br>
  3. <b>▶ Harekete Başla</b>'ya bas.<br>
  LIN modunda TCP düz çizgi; PTP modunda eksen açıları lineer interpolasyon ile hareket eder — TCP eğrisel yol çizer.
</div>`; }

/* ─── Simülasyon init ───────────────────────────────────────────── */
function _initSim() {
  const svg = document.getElementById('robotSimSvg');
  if (!svg) return;
  svg.onclick = _rClick;
  _rDraw();
}

/* ─── SVG tıklama ───────────────────────────────────────────────── */
function _rClick(e) {
  const svg = document.getElementById('robotSimSvg');
  const rect = svg.getBoundingClientRect();
  const vb = svg.viewBox.baseVal;
  const mx = (e.clientX - rect.left) * (vb.width  / rect.width);
  const my = (e.clientY - rect.top)  * (vb.height / rect.height);

  const dx = mx - SIM_BASE_X, dy = SIM_BASE_Y - my;
  const d  = Math.sqrt(dx*dx + dy*dy);
  if (d > L1 + L2 - 6 || d < Math.abs(L1 - L2) + 6) {
    toast('Çalışma alanı dışı — sarı çember içine tıkla', 'bad'); return;
  }

  RS.target = { x: mx, y: my };
  _showTarget(mx, my);

  // LIN iz çizgisini güncelle
  const { tcpx, tcpy } = fk(RS.t1, RS.t2);
  const tr = document.getElementById('rLinTrace');
  if (RS.mode === 'lin' && tr) {
    tr.setAttribute('display', 'block');
    _setLine(tr, tcpx, tcpy, mx, my);
  } else if (tr) { tr.setAttribute('display', 'none'); }

  const hint = document.getElementById('rHint');
  if (hint) hint.setAttribute('display', 'none');
  _rStatus(`Hedef: (${(mx - SIM_BASE_X).toFixed(0)}, ${(SIM_BASE_Y - my).toFixed(0)}) mm`);

  // Mobil: canvas üzerindeki floating "Harekete Başla" butonunu göster
  const gf = document.getElementById('rGoFloat');
  if (gf) gf.classList.add('visible');
}

/* ─── Hedef göster ─────────────────────────────────────────────── */
function _showTarget(x, y) {
  const tg = document.getElementById('rTarget');
  if (!tg) return;
  tg.setAttribute('display', 'block');
  _setAttr('rTring', {cx:x, cy:y});
  _setAttr('rTdot',  {cx:x, cy:y});
  _setLine(document.getElementById('rTcross1'), x, y-15, x, y+15);
  _setLine(document.getElementById('rTcross2'), x-15, y, x+15, y);
}

/* ─── Mod seç ──────────────────────────────────────────────────── */
window.rSetMode = function(mode, btn) {
  RS.mode = mode;
  document.querySelectorAll('.robot-mode-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  const desc = {
    ptp: '<b style="color:#3aa0ff">PTP:</b> Eksenler eş zamanlı. TCP öngörülemez yol. En hızlı mod.',
    lin: '<b style="color:#27d07a">LIN:</b> TCP düz çizgi izler. Her adımda IK hesaplanır. Kaynak/kesim için ideal.',
  };
  const d = document.getElementById('rModeDesc');
  if (d) d.innerHTML = desc[mode];
  const lbl = document.getElementById('rModLbl');
  if (lbl) { lbl.textContent = mode.toUpperCase(); lbl.style.color = mode==='ptp'?'#3aa0ff':'#27d07a'; }

  // İz çizgisi
  const tr = document.getElementById('rLinTrace');
  if (tr) {
    if (mode === 'lin' && RS.target) {
      const { tcpx, tcpy } = fk(RS.t1, RS.t2);
      _setLine(tr, tcpx, tcpy, RS.target.x, RS.target.y);
      tr.setAttribute('display', 'block');
    } else { tr.setAttribute('display', 'none'); }
  }
};

/* ─── Harekete başla ───────────────────────────────────────────── */
window.rGo = function() {
  if (!RS.target)  { toast('Önce bir hedef seç!', 'bad'); return; }
  if (RS.running)  { return; }
  if (RS.animId)   { clearTimeout(RS.animId); RS.animId = null; }
  // Mobil floating buton gizle — animasyon başladı
  const gf = document.getElementById('rGoFloat');
  if (gf) gf.classList.remove('visible');

  const tgt = RS.target;
  const endIK = ik(tgt.x, tgt.y);
  if (!endIK) { toast('Bu nokta erişilemez!', 'bad'); _rStatus('⚠ IK çözümü yok', 'err'); return; }

  const N = 80;
  const traj = [];

  if (RS.mode === 'ptp') {
    for (let i = 0; i <= N; i++) {
      const t = eio(i / N);
      traj.push({ t1: lerpAng(RS.t1, endIK.t1, t), t2: lerpAng(RS.t2, endIK.t2, t) });
    }
  } else {
    const { tcpx: sx, tcpy: sy } = fk(RS.t1, RS.t2);
    for (let i = 0; i <= N; i++) {
      const t = eio(i / N);
      const px = sx + (tgt.x - sx) * t;
      const py = sy + (tgt.y - sy) * t;
      const r = ik(px, py);
      if (!r) { toast('LIN yolu tekil bölgeden geçiyor!', 'bad'); _rStatus('⚠ Singularity!', 'err'); return; }
      traj.push(r);
    }
    // LIN modunda iz soluklaştır
    const tr = document.getElementById('rLinTrace');
    if (tr) tr.setAttribute('opacity', '.15');
  }

  RS.traj = traj; RS.tIdx = 0; RS.running = true;
  _rStatus(`▶ ${RS.mode.toUpperCase()} hareketi…`, 'ok');
  _rAnimFrame();
};

/* ─── Animasyon döngüsü ─────────────────────────────────────────── */
function _rAnimFrame() {
  if (!RS.running) return;
  if (RS.tIdx >= RS.traj.length) {
    RS.running = false; RS.target = null;
    document.getElementById('rTarget')?.setAttribute('display', 'none');
    document.getElementById('rLinTrace')?.setAttribute('display', 'none');
    document.getElementById('rLinTrace')?.setAttribute('opacity', '.28');
    document.getElementById('rHint')?.setAttribute('display', 'block');
    _rStatus('✓ Hareket tamamlandı', 'ok'); return;
  }
  const s = RS.traj[RS.tIdx++];
  RS.t1 = s.t1; RS.t2 = s.t2;
  _rDraw();
  const delay = Math.max(4, 30 - Math.round(RS.speed * 0.26));
  RS.animId = setTimeout(_rAnimFrame, delay);
}

/* ─── SVG çizim ─────────────────────────────────────────────────── */
function _rDraw() {
  const { j2x, j2y, tcpx, tcpy } = fk(RS.t1, RS.t2);

  _setLine(document.getElementById('rL1'), SIM_BASE_X, SIM_BASE_Y, j2x, j2y);
  _setLine(document.getElementById('rL2'), j2x, j2y, tcpx, tcpy);
  _setAttr('rJ2',  { cx: j2x, cy: j2y });
  _setAttr('rTcpC',{ cx: tcpx, cy: tcpy });
  _setAttr('rTcpD',{ cx: tcpx, cy: tcpy });

  // Parmaklar
  const ta = RS.t1 + RS.t2;
  const fLen = 14, fSpread = 5;
  const fx = Math.cos(ta) * fLen, fy = -Math.sin(ta) * fLen;
  const px = Math.cos(ta + Math.PI/2) * fSpread;
  const py = -Math.sin(ta + Math.PI/2) * fSpread;
  _setLine(document.getElementById('rF1'), tcpx+px, tcpy+py, tcpx+px+fx, tcpy+py+fy);
  _setLine(document.getElementById('rF2'), tcpx-px, tcpy-py, tcpx-px+fx, tcpy-py+fy);

  // Koordinat gösterimi
  _setText('rCx', (tcpx - SIM_BASE_X).toFixed(1));
  _setText('rCy', (SIM_BASE_Y - tcpy).toFixed(1));
  _setText('rA1', (RS.t1 * 180 / Math.PI).toFixed(1));
  _setText('rA2', (RS.t2 * 180 / Math.PI).toFixed(1));
}

/* ─── Sıfırla ──────────────────────────────────────────────────── */
window.rReset = function() {
  if (RS.animId) clearTimeout(RS.animId);
  RS.running = false; RS.t1 = Math.PI/3.5; RS.t2 = -Math.PI/2.8;
  RS.target = null; RS.traj = [];
  ['rTarget','rHint'].forEach(id => { const el = document.getElementById(id); if (el) el.setAttribute('display', el.id==='rHint'?'block':'none'); });
  const tr = document.getElementById('rLinTrace');
  if (tr) { tr.setAttribute('display','none'); tr.setAttribute('opacity','.28'); }
  // Mobil floating buton gizle
  const gf = document.getElementById('rGoFloat');
  if (gf) gf.classList.remove('visible');
  _rDraw(); _rStatus('Sistem Hazır');
};

/* ─── Durum çubuğu ─────────────────────────────────────────────── */
function _rStatus(msg, type) {
  const el = document.getElementById('rStatus');
  if (!el) return;
  const cls = type==='err'?'err':type==='warn'?'warn':'ok';
  const ic  = type==='err'?'◆':'●';
  const mc  = RS.mode==='ptp'?'#3aa0ff':'#27d07a';
  el.innerHTML = `<div><span class="${cls}">${ic}</span> ${msg}</div>
    <div style="color:#8a96a3;margin-top:2px">Mod: <span id="rModLbl" style="color:${mc}">${RS.mode.toUpperCase()}</span></div>`;
}

/* ─── LIN vs PTP karşılaştırma animasyonu ───────────────────────── */
function _startLinPtpAnim() {
  if (_linPtpAnim) return;
  let t = 0;
  function frame() {
    t = (t + 0.006) % 1;
    const et = eio(t);
    const ptpDot = document.getElementById('ptpDot');
    const linDot = document.getElementById('linDot');
    const linTr  = document.getElementById('linTrace');
    if (!ptpDot) { _linPtpAnim = null; return; }
    // PTP — bezier yay
    const bx = (1-et)*(1-et)*20 + 2*(1-et)*et*70 + et*et*180;
    const by = (1-et)*(1-et)*108+ 2*(1-et)*et*35 + et*et*22;
    ptpDot.setAttribute('cx', bx); ptpDot.setAttribute('cy', by);
    // LIN — düz çizgi
    const lx = 20 + et * 160, ly = 108 + et * (22 - 108);
    if (linDot) { linDot.setAttribute('cx', lx); linDot.setAttribute('cy', ly); }
    if (linTr)  { linTr.setAttribute('x2', lx);  linTr.setAttribute('y2', ly); }
    _linPtpAnim = requestAnimationFrame(frame);
  }
  _linPtpAnim = requestAnimationFrame(frame);
}

/* ─── Yardımcı fonksiyonlar ────────────────────────────────────── */
function _setLine(el, x1, y1, x2, y2) {
  if (!el) return;
  el.setAttribute('x1',x1); el.setAttribute('y1',y1);
  el.setAttribute('x2',x2); el.setAttribute('y2',y2);
}
function _setAttr(id, attrs) {
  const el = document.getElementById(id); if (!el) return;
  Object.entries(attrs).forEach(([k,v]) => el.setAttribute(k,v));
}
function _setText(id, val) {
  const el = document.getElementById(id); if (el) el.textContent = val;
}
