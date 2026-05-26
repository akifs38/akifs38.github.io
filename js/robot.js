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
  // Önceki RAF döngüsünü durdur
  if (_linPtpAnim) { cancelAnimationFrame(_linPtpAnim); _linPtpAnim = null; }
  if (RS.animId)   { clearTimeout(RS.animId); RS.running = false; }
  const sec = document.getElementById('tab-robot');
  if (!sec) return;

  sec.innerHTML = `
<div class="robot-layout">

  <div class="robot-tabs">
    <button class="robot-tab-btn active" onclick="rTab('temel',this)">🤖 Temel Kavramlar</button>
    <button class="robot-tab-btn"        onclick="rTab('linptp',this)">📐 LIN vs PTP</button>
    <button class="robot-tab-btn"        onclick="rTab('sim',this)">⚙️ Simülasyon</button>
  </div>

  <div id="rt-temel" class="robot-tab-pane active">${_temel()}</div>
  <div id="rt-linptp" class="robot-tab-pane">${_linptp()}</div>
  <div id="rt-sim"   class="robot-tab-pane">${_sim()}</div>

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
};

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
