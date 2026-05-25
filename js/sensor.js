/* =================================================================
   SENSÖRLER MODÜLÜ — Endüstriyel Sensörler Bilgi Kartları
   ================================================================= */

/* ─── SENSOR SVG İKONLARI ─────────────────────────────────────────── */
const SENSOR_SVG = {
  induktif: `<svg viewBox="0 0 200 160">
    <rect x="60" y="50" width="80" height="60" rx="8" fill="none" stroke="#8a96a3" stroke-width="2.5"/>
    <circle cx="100" cy="80" r="20" fill="none" stroke="#f5b301" stroke-width="2"/>
    <circle cx="100" cy="80" r="12" fill="none" stroke="#f5b301" stroke-width="1.5" opacity=".6"/>
    <circle cx="100" cy="80" r="5" fill="#f5b301"/>
    <path d="M 60 80 Q 30 55 10 80 Q 30 105 60 80" fill="none" stroke="#3aa0ff" stroke-width="1.5" stroke-dasharray="4 2" opacity=".7"/>
    <path d="M 60 80 Q 42 60 25 80 Q 42 100 60 80" fill="none" stroke="#3aa0ff" stroke-width="1.5" opacity=".5"/>
    <rect x="145" y="60" width="30" height="40" rx="3" fill="none" stroke="#8a96a3" stroke-width="2"/>
    <text x="160" y="84" text-anchor="middle" fill="#8a96a3" font-size="9">Fe</text>
    <line x1="140" y1="80" x2="145" y2="80" stroke="#8a96a3" stroke-width="1.5" stroke-dasharray="3 2"/>
    <line x1="100" y1="25" x2="100" y2="50" stroke="#8a96a3" stroke-width="1.5"/>
    <circle cx="100" cy="22" r="4" fill="#8a96a3"/>
    <text x="100" y="145" text-anchor="middle" fill="#8a96a3" font-size="9">Endüktif Sensör</text>
  </svg>`,

  kapasitif: `<svg viewBox="0 0 200 160">
    <rect x="60" y="50" width="80" height="60" rx="8" fill="none" stroke="#8a96a3" stroke-width="2.5"/>
    <rect x="63" y="75" width="6" height="10" fill="#f5b301"/>
    <rect x="63" y="90" width="6" height="10" fill="#f5b301"/>
    <path d="M 60 80 Q 40 65 20 80 Q 40 95 60 80" fill="none" stroke="#27d07a" stroke-width="1.5" opacity=".7"/>
    <path d="M 60 80 Q 30 50 5 80 Q 30 110 60 80" fill="none" stroke="#27d07a" stroke-width="1.2" opacity=".4"/>
    <rect x="145" y="55" width="40" height="50" rx="4" fill="#1c232d" stroke="#8a96a3" stroke-width="1.5"/>
    <text x="165" y="72" text-anchor="middle" fill="#8a96a3" font-size="8">Plastik</text>
    <text x="165" y="84" text-anchor="middle" fill="#8a96a3" font-size="8">Sıvı</text>
    <text x="165" y="96" text-anchor="middle" fill="#8a96a3" font-size="8">Toz</text>
    <line x1="140" y1="80" x2="145" y2="80" stroke="#8a96a3" stroke-width="1.5" stroke-dasharray="3 2"/>
    <text x="100" y="145" text-anchor="middle" fill="#8a96a3" font-size="9">Kapasitif Sensör</text>
  </svg>`,

  optik: `<svg viewBox="0 0 200 160">
    <rect x="10" y="60" width="45" height="40" rx="5" fill="none" stroke="#8a96a3" stroke-width="2"/>
    <circle cx="32" cy="80" r="8" fill="none" stroke="#f5b301" stroke-width="2"/>
    <circle cx="32" cy="80" r="3" fill="#f5b301"/>
    <rect x="145" y="60" width="45" height="40" rx="5" fill="none" stroke="#8a96a3" stroke-width="2"/>
    <circle cx="168" cy="80" r="8" fill="none" stroke="#3aa0ff" stroke-width="2"/>
    <circle cx="168" cy="80" r="3" fill="#3aa0ff"/>
    <line x1="55" y1="75" x2="145" y2="75" stroke="#f5b301" stroke-width="2" stroke-dasharray="6 3"/>
    <line x1="55" y1="80" x2="145" y2="80" stroke="#f5b301" stroke-width="2.5"/>
    <line x1="55" y1="85" x2="145" y2="85" stroke="#f5b301" stroke-width="2" stroke-dasharray="6 3"/>
    <text x="8" y="115" fill="#8a96a3" font-size="8">Verici</text>
    <text x="143" y="115" fill="#8a96a3" font-size="8">Alıcı</text>
    <text x="100" y="145" text-anchor="middle" fill="#8a96a3" font-size="9">Optik Sensör (Işın Kesen)</text>
  </svg>`,

  manyetik: `<svg viewBox="0 0 200 160">
    <rect x="20" y="90" width="160" height="25" rx="12" fill="none" stroke="#8a96a3" stroke-width="2.5"/>
    <circle cx="100" cy="102" r="8" fill="#f5b301" opacity=".7"/>
    <rect x="55" y="78" width="20" height="14" rx="3" fill="#f5b301" stroke="#8a96a3" stroke-width="1.5"/>
    <line x1="65" y1="78" x2="65" y2="55" stroke="#8a96a3" stroke-width="1.5"/>
    <rect x="50" y="42" width="30" height="16" rx="3" fill="#1c232d" stroke="#f5b301" stroke-width="2"/>
    <text x="65" y="54" text-anchor="middle" fill="#f5b301" font-size="8">N S</text>
    <rect x="30" y="60" width="140" height="30" rx="5" fill="none" stroke="#8a96a3" stroke-width="1.5" stroke-dasharray="4 2"/>
    <text x="155" y="77" fill="#8a96a3" font-size="7">Piston</text>
    <text x="100" y="145" text-anchor="middle" fill="#8a96a3" font-size="9">Manyetik Sensör (Pnömatik Silindir)</text>
  </svg>`,

  basinc: `<svg viewBox="0 0 200 160">
    <circle cx="100" cy="80" r="55" fill="none" stroke="#8a96a3" stroke-width="2.5"/>
    <circle cx="100" cy="80" r="48" fill="#161b22" stroke="#8a96a3" stroke-width="1"/>
    <path d="M 55 80 A 45 45 0 0 1 145 80" fill="none" stroke="#2a323d" stroke-width="4"/>
    <path d="M 55 80 A 45 45 0 0 1 120 42" fill="none" stroke="#27d07a" stroke-width="4"/>
    <line x1="100" y1="80" x2="78" y2="46" stroke="#ff4d4f" stroke-width="2.5" stroke-linecap="round"/>
    <circle cx="100" cy="80" r="5" fill="#8a96a3"/>
    ${Array.from({length:9},(_,i)=>{const a=(210+i*15)*Math.PI/180;return `<line x1="${100+42*Math.cos(a)}" y1="${80+42*Math.sin(a)}" x2="${100+48*Math.cos(a)}" y2="${80+48*Math.sin(a)}" stroke="#8a96a3" stroke-width="1.5"/>`;}).join('')}
    <text x="100" y="108" text-anchor="middle" fill="#8a96a3" font-size="8">bar</text>
    <rect x="80" y="130" width="40" height="15" rx="3" fill="#1c232d" stroke="#8a96a3" stroke-width="1.5"/>
    <line x1="100" y1="130" x2="100" y2="135" stroke="#8a96a3" stroke-width="1.5"/>
    <text x="100" y="145" text-anchor="middle" fill="#8a96a3" font-size="9">Basınç Transmitter</text>
  </svg>`,

  pt100: `<svg viewBox="0 0 200 160">
    <rect x="85" y="10" width="30" height="90" rx="5" fill="none" stroke="#8a96a3" stroke-width="2.5"/>
    <rect x="90" y="15" width="20" height="80" rx="3" fill="#ff7a18" opacity=".25"/>
    <rect x="90" y="15" width="20" height="50" rx="3" fill="#ff7a18" opacity=".5"/>
    <line x1="100" y1="100" x2="100" y2="115" stroke="#8a96a3" stroke-width="2"/>
    <rect x="70" y="115" width="60" height="20" rx="4" fill="#1c232d" stroke="#8a96a3" stroke-width="2"/>
    <text x="100" y="129" text-anchor="middle" fill="#8a96a3" font-size="8">PT100</text>
    <line x1="70" y1="125" x2="40" y2="125" stroke="#8a96a3" stroke-width="1.5"/>
    <line x1="75" y1="128" x2="45" y2="140" stroke="#8a96a3" stroke-width="1.5"/>
    <line x1="130" y1="125" x2="160" y2="125" stroke="#8a96a3" stroke-width="1.5"/>
    <line x1="125" y1="128" x2="155" y2="140" stroke="#8a96a3" stroke-width="1.5"/>
    <text x="42" y="150" fill="#3aa0ff" font-size="8">A</text>
    <text x="148" y="150" fill="#3aa0ff" font-size="8">B</text>
    <text x="100" y="155" text-anchor="middle" fill="#8a96a3" font-size="9">PT100 / PT1000</text>
  </svg>`,

  enkoder: `<svg viewBox="0 0 200 160">
    <circle cx="90" cy="75" r="50" fill="none" stroke="#8a96a3" stroke-width="2.5"/>
    <circle cx="90" cy="75" r="15" fill="none" stroke="#8a96a3" stroke-width="2"/>
    <circle cx="90" cy="75" r="5" fill="#8a96a3"/>
    ${Array.from({length:16},(_,i)=>{const a=i*22.5*Math.PI/180; const x1=90+38*Math.cos(a),y1=75+38*Math.sin(a),x2=90+50*Math.cos(a),y2=75+50*Math.sin(a); return i%2===0?`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#f5b301" stroke-width="3"/>`:`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#161b22" stroke-width="3"/>`;}).join('')}
    <line x1="138" y1="75" x2="160" y2="75" stroke="#8a96a3" stroke-width="1.5"/>
    <rect x="158" y="50" width="35" height="50" rx="3" fill="#1c232d" stroke="#8a96a3" stroke-width="1.5"/>
    <path d="M 163 60 h5 v6 h6 v-6 h5 v14 h-5 v-6 h-6 v6 h-5 z" fill="none" stroke="#f5b301" stroke-width="1.2"/>
    <path d="M 163 78 h4 v6 h8 v-6 h4 v14 h-4 v-6 h-8 v6 h-4 z" fill="none" stroke="#27d07a" stroke-width="1.2"/>
    <text x="165" y="58" fill="#f5b301" font-size="7">A</text>
    <text x="165" y="76" fill="#27d07a" font-size="7">B</text>
    <text x="100" y="145" text-anchor="middle" fill="#8a96a3" font-size="9">İnkremental Enkoder</text>
  </svg>`,

  ultrasonik: `<svg viewBox="0 0 200 160">
    <rect x="80" y="10" width="40" height="50" rx="6" fill="none" stroke="#8a96a3" stroke-width="2.5"/>
    <circle cx="100" cy="35" r="10" fill="none" stroke="#f5b301" stroke-width="2"/>
    <circle cx="100" cy="35" r="5" fill="#f5b301" opacity=".6"/>
    <path d="M 60 75 Q 100 55 140 75" fill="none" stroke="#3aa0ff" stroke-width="2" stroke-dasharray="4 2"/>
    <path d="M 50 90 Q 100 65 150 90" fill="none" stroke="#3aa0ff" stroke-width="1.5" stroke-dasharray="4 2" opacity=".7"/>
    <path d="M 40 108 Q 100 78 160 108" fill="none" stroke="#3aa0ff" stroke-width="1" stroke-dasharray="4 2" opacity=".4"/>
    <rect x="30" y="115" width="140" height="20" rx="4" fill="#1c232d" stroke="#8a96a3" stroke-width="1.5"/>
    <text x="100" y="129" text-anchor="middle" fill="#8a96a3" font-size="8">Hedef Yüzey</text>
    <line x1="100" y1="60" x2="100" y2="80" stroke="#ff7a18" stroke-width="2" marker-end="url(#arr)"/>
    <text x="100" y="155" text-anchor="middle" fill="#8a96a3" font-size="9">Ultrasonik Sensör</text>
  </svg>`
};

/* ─── SENSOR VERİ ──────────────────────────────────────────────────── */
const SENSOR_DATA = [
  {
    id: 'induktif',
    title: 'Endüktif Sensör',
    subtitle: 'Inductive Proximity Sensor',
    kod: 'IEC 60947-5-2',
    icon: 'induktif',
    prensip: 'Bobinde oluşturulan yüksek frekanslı elektromanyetik alan, yaklaşan metal malzemelerin etki alanına girmesiyle zayıflar. Bu zayıflamayı algılama devresi tespit eder ve çıkış verir. Algılama yalnızca iletken (metalik) malzemelerde gerçekleşir.',
    mesafe: '2 – 30 mm (standart). Paslanmaz çelik için yaklaşık ×0,5 düzeltme katsayısı uygulanır. Alüminyum için ×0,4.',
    cikis: 'NPN (sinking) veya PNP (sourcing), NO veya NC kontak seçeneği. DC besleme: 10–30 V.',
    uygulama: 'Metal parça sayma, konveyör üstünde parça var/yok, silindir son konum algılama, kapı kilidi.',
    not: 'Metal olmayan malzemeleri ALGILAMAZ. Yüksek sıcaklık (>70°C) ve şiddetli titreşim performansı düşürür.'
  },
  {
    id: 'kapasitif',
    title: 'Kapasitif Sensör',
    subtitle: 'Capacitive Proximity Sensor',
    kod: 'IEC 60947-5-2',
    icon: 'kapasitif',
    prensip: 'Sensör ile hedef arasında oluşan kapasitans değişimi algılanır. Elektrik alan içine giren her malzeme (metal, plastik, sıvı, toz) dielektrik özelliğine göre algılanabilir.',
    mesafe: '1 – 20 mm. Hassasiyet potansiyometresi ile ayarlanır. Yüksek dielektrik sabiti → daha uzak mesafe.',
    cikis: 'NPN veya PNP, NO/NC. DC 10–30 V.',
    uygulama: 'Tank seviye tespiti (plastik gövdeden), granül toz seviyesi, cam şişe sayma, yiyecek/sıvı içeren ambalaj tespiti.',
    not: 'Nem ve kir yüzeylerde hatalı tetikleme yapabilir. Hassasiyet ayarı ile ince ayar zorunludur.'
  },
  {
    id: 'optik',
    title: 'Optik Sensör',
    subtitle: 'Photoelectric Sensor',
    kod: 'IEC 60947-5-2',
    icon: 'optik',
    prensip: 'Verici LED/lazer ışını, alıcı (fototransistör/fotodiod) tarafından izlenir. Işın kesilmesi veya yansıması algılama sinyali oluşturur. Üç farklı çalışma prensibi: karşılıklı (ışın kesen), retroreflektif (reflektor) ve difüz (kendi yansıması).',
    mesafe: 'Difüz: 10 mm – 1 m | Retroreflektif: 0,1 – 5 m | Karşılıklı: 0,5 – 30 m',
    cikis: 'NPN veya PNP, NO/NC. Bazı modeller analog veya IO-Link çıkış verir.',
    uygulama: 'Ürün sayma, konveyör doluluk tespiti, barkod/etiket algılama, şeffaf ambalaj tespiti (lazer).',
    not: 'Yüzey rengi ve yansıma özelliği difüz modda mesafeyi etkiler. Şeffaf cam veya plastik: özel polarize model gerekir.'
  },
  {
    id: 'manyetik',
    title: 'Manyetik Sensör',
    subtitle: 'Reed Switch / Hall Effect Sensor',
    kod: 'ISO 15552',
    icon: 'manyetik',
    prensip: 'Reed switch: Manyetik alan içinde cam tüp içindeki iki metal lamelin birbirine yapışmasıyla kontak kapanır. Hall Effect: Manyetik alan yarı iletken içinde gerilim farkı yaratır, bu analog veya dijital çıkış verir.',
    mesafe: 'Reed switch: mıknatıs doğrudan sensör üstünden geçer (piston mıknatısı). Hall effect: 1–15 mm.',
    cikis: 'Reed switch: kuru kontak (NO/NC). Hall effect: NPN/PNP dijital veya analog.',
    uygulama: 'Pnömatik silindir piston konumu (en yaygın kullanım), kapı açık/kapalı algılama, valf konumu.',
    not: 'Silindir üzerine geçirilen bant tipi sensörler piston içindeki halka mıknatıs ile tetiklenir. Şiddetli manyetik ortamda hatalı tetikleme olabilir.'
  },
  {
    id: 'basinc',
    title: 'Basınç Transmitter',
    subtitle: 'Pressure Sensor / Transmitter',
    kod: 'IEC 60770',
    icon: 'basinc',
    prensip: 'Piezoelektrik kristal veya kapasitif membran, basınç kuvvetini elektriksel sinyale dönüştürür. Membranın deformasyonu ölçülerek basınç belirlenir. Diferansiyel basınç modellerinde iki giriş noktası arası fark ölçülür.',
    mesafe: 'Ölçüm aralığı: 0 – 0,4 bar (hassas) / 0 – 400 bar (hidrolik). Sıcaklık kompanzasyonu dahil.',
    cikis: '4–20 mA (2 telli) veya 0–10 V (3 telli). Bazı modeller IO-Link veya HART destekler.',
    uygulama: 'Hidrolik/pnömatik basınç izleme, proses kontrol (boru hattı basıncı), kompresör çıkış basıncı, filtre fark basıncı.',
    not: 'Ani basınç darbelerine karşı darbe sönümleyici kullanın. Membranı temizlerken sert alet kullanmayın.'
  },
  {
    id: 'pt100',
    title: 'Sıcaklık Sensörü — PT100/PT1000',
    subtitle: 'RTD Temperature Sensor',
    kod: 'IEC 60751',
    icon: 'pt100',
    prensip: 'Platin direncin sıcaklığa göre değişimi kullanılır. Temel formül: R = R₀ × (1 + α×ΔT). PT100 için 0°C\'de 100 Ω, PT1000 için 0°C\'de 1000 Ω. α ≈ 0,00385 Ω/Ω/°C.',
    mesafe: 'Ölçüm aralığı: −200°C ile +850°C arası (malzemeye göre). Tipik proses uygulamaları: −50°C ile +400°C.',
    cikis: 'Düşük seviye voltaj/direnç sinyali. PLC\'ye bağlanmak için sıcaklık transmitteri (4–20 mA) veya doğrudan RTD modülü gerekir.',
    uygulama: 'Motor sargı sıcaklığı, fırın/oven sıcaklık kontrolü, soğutma suyu sıcaklığı, plastik enjeksiyon makinesi.',
    not: '3 kablo bağlantısı önerilir: kablo direncini dengeler. 4 kablo bağlantısı maksimum doğruluk sağlar. 2 kablo yalnızca kısa mesafede kabul edilebilir.'
  },
  {
    id: 'enkoder',
    title: 'Enkoder',
    subtitle: 'Rotary Encoder',
    kod: 'DIN EN 61010',
    icon: 'enkoder',
    prensip: 'Dönen mille birlikte dönen disk üzerindeki şeffaf/opak dilimleri optik veya manyetik olarak okur. İnkremental enkoder: A ve B kanalı darbe sinyali + Z referans darbesi. Absolüt enkoder: her konumda benzersiz ikili kod (Gray code).',
    mesafe: 'Çözünürlük: 100 – 65536 darbe/devir (PPR). Absolüt enkoder: 10 – 25 bit (tek tur veya çok tur).',
    cikis: 'İnkremental: A/B dijital sinyal (push-pull, TTL veya HTL). Absolüt: SSI, BiSS, EtherCAT veya analog.',
    uygulama: 'Servo motor geri besleme (konum kontrolü), konveyör uzunluk ölçme, CNC eksen konum geribildirim, asansör kat tespiti.',
    not: 'Elektromanyetik gürültüye karşı ekranlı kablo kullanın. Max kablo uzunluğu HTL\'de ~100 m, TTL\'de ~20 m. Mekanik darbe enkoderı öldürür.'
  },
  {
    id: 'ultrasonik',
    title: 'Ultrasonik Sensör',
    subtitle: 'Ultrasonic Distance Sensor',
    kod: 'IEC 60947-5-2',
    icon: 'ultrasonik',
    prensip: 'Piezo-seramik dönüştürücü ultrasonik ses dalgası (40 kHz) yayar. Yüzeyden geri yansıyan dalganın dönüş süresini ölçerek mesafe hesaplar: d = (t × v_ses) / 2. Ses hızı sıcaklıktan etkilenir (20°C\'de ≈ 343 m/s).',
    mesafe: '20 mm – 10 m. Kör nokta (near zone): 20 – 80 mm (tetikleyici ve alıcı aynı kapsülde).',
    cikis: 'Analog: 4–20 mA veya 0–10 V (mesafeyle orantılı). Dijital: switching çıkış (eşik değer ayarı). IO-Link destekli modeller mevcut.',
    uygulama: 'Tank sıvı seviyesi ölçümü, bant üstü ürün yüksekliği, araç algılama (otopark), granül silo seviyesi.',
    not: 'Köpüklü sıvı, yumuşak/ses emen yüzeyler (köpük, pamuk) ve dar açılı yüzeyler ölçüm hatası yaratır. Sıcaklık değişimi sesi etkiler.'
  }
];

/* ─── RENDER ───────────────────────────────────────────────────────── */
function openSensor() {
  switchTab('sensor');
  renderSensor();
}

function renderSensor() {
  const el = document.getElementById('tab-sensor');
  if (!el) return;

  el.innerHTML = `
<div class="mod-wrap">
  <div class="mod-header">
    <h2 class="mod-title">Endüstriyel Sensörler</h2>
    <p class="mod-sub">IEC 60947-5-2 · ISO 15552 · IEC 60751</p>
  </div>

  <div class="sensor-tabs">
    <button class="stab active" onclick="sensorSection('types')">Sensör Türleri</button>
    <button class="stab" onclick="sensorSection('wiring')">NPN / PNP Bağlantı</button>
    <button class="stab" onclick="sensorSection('analog')">Analog Sinyaller</button>
  </div>

  <div id="sensor-types" class="sensor-section">
    ${renderSensorTypes()}
  </div>
  <div id="sensor-wiring" class="sensor-section hidden">
    ${renderSensorWiring()}
  </div>
  <div id="sensor-analog" class="sensor-section hidden">
    ${renderSensorAnalog()}
  </div>
</div>

<style>
.mod-wrap{max-width:1100px;margin:0 auto;padding:16px 12px 40px;}
.mod-header{margin-bottom:18px;}
.mod-title{font-family:'Oswald',sans-serif;font-size:1.7rem;color:var(--ink);margin:0 0 4px;}
.mod-sub{color:var(--muted);font-size:.8rem;margin:0;letter-spacing:.04em;}
.sensor-tabs{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:20px;}
.stab{background:var(--panel-2);border:1px solid var(--line);color:var(--muted);padding:7px 16px;border-radius:6px;cursor:pointer;font-size:.82rem;letter-spacing:.03em;transition:all .15s;}
.stab:hover{color:var(--ink);border-color:var(--muted);}
.stab.active{background:var(--accent);color:#000;border-color:var(--accent);font-weight:600;}
.sensor-section.hidden{display:none;}

/* KART GRID */
.sensor-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:16px;}
.sensor-card{background:var(--panel);border:1px solid var(--line);border-radius:10px;overflow:hidden;transition:border-color .2s;}
.sensor-card:hover{border-color:var(--accent);}
.sc-head{display:flex;align-items:center;gap:12px;padding:14px 14px 10px;}
.sc-icon{width:64px;height:52px;flex-shrink:0;}
.sc-icon svg{width:100%;height:100%;}
.sc-title{flex:1;}
.sc-title h3{font-family:'Oswald',sans-serif;font-size:1rem;color:var(--ink);margin:0 0 2px;}
.sc-title small{color:var(--muted);font-size:.72rem;}
.sc-body{padding:0 14px 14px;}
.sc-row{display:flex;flex-direction:column;gap:6px;}
.sc-item{background:var(--panel-2);border-radius:6px;padding:8px 10px;}
.sc-item label{display:block;font-size:.68rem;color:var(--accent);letter-spacing:.05em;text-transform:uppercase;margin-bottom:2px;font-family:'Oswald',sans-serif;}
.sc-item p{margin:0;font-size:.78rem;color:var(--ink);line-height:1.45;}
.sc-item p.code{font-family:'JetBrains Mono',monospace;font-size:.75rem;color:#27d07a;}
.sc-note{background:#ff4d4f18;border-left:3px solid #ff4d4f;padding:6px 10px;border-radius:0 6px 6px 0;margin-top:6px;}
.sc-note p{margin:0;font-size:.74rem;color:#ff7a7a;}

/* NPN/PNP SECTION */
.wiring-wrap{display:grid;grid-template-columns:1fr 1fr;gap:20px;}
@media(max-width:680px){.wiring-wrap{grid-template-columns:1fr;}}
.w-card{background:var(--panel);border:1px solid var(--line);border-radius:10px;padding:18px;}
.w-card h3{font-family:'Oswald',sans-serif;font-size:1.1rem;margin:0 0 14px;}
.w-card h3.npn{color:#3aa0ff;}
.w-card h3.pnp{color:#f5b301;}
.wdiag{background:var(--panel-2);border-radius:8px;padding:12px 14px;margin-bottom:14px;overflow-x:auto;}
.wdiag pre{margin:0;font-family:'JetBrains Mono',monospace;font-size:.72rem;color:var(--ink);line-height:1.7;white-space:pre;}
.w-info p{font-size:.78rem;color:var(--ink);line-height:1.55;margin:0 0 8px;}
.cable-table{width:100%;border-collapse:collapse;margin-top:10px;}
.cable-table th,.cable-table td{padding:6px 10px;font-size:.76rem;border:1px solid var(--line);text-align:left;}
.cable-table th{background:var(--panel-2);color:var(--muted);font-weight:600;font-family:'Oswald',sans-serif;letter-spacing:.04em;}
.cable-dot{display:inline-block;width:10px;height:10px;border-radius:50%;margin-right:6px;vertical-align:middle;}

/* ANALOG SECTION */
.analog-wrap{display:flex;flex-direction:column;gap:20px;}
.a-card{background:var(--panel);border:1px solid var(--line);border-radius:10px;padding:18px;}
.a-card h3{font-family:'Oswald',sans-serif;font-size:1.1rem;color:var(--accent);margin:0 0 12px;}
.a-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;}
@media(max-width:600px){.a-grid{grid-template-columns:1fr;}}
.a-block{background:var(--panel-2);border-radius:8px;padding:12px 14px;}
.a-block h4{font-size:.8rem;color:var(--accent-2);font-family:'Oswald',sans-serif;letter-spacing:.04em;margin:0 0 8px;}
.a-block p{margin:0 0 6px;font-size:.77rem;color:var(--ink);line-height:1.5;}
.formula-box{background:#f5b30115;border:1px solid #f5b30144;border-radius:8px;padding:10px 14px;margin-top:8px;}
.formula-box code{font-family:'JetBrains Mono',monospace;font-size:.78rem;color:#f5b301;display:block;line-height:1.7;}
.formula-box .ex{color:var(--muted);font-size:.72rem;margin-top:4px;}
.plc-table{width:100%;border-collapse:collapse;margin-top:12px;}
.plc-table th,.plc-table td{padding:7px 10px;font-size:.75rem;border:1px solid var(--line);text-align:left;}
.plc-table th{background:var(--panel-2);color:var(--muted);font-family:'Oswald',sans-serif;letter-spacing:.04em;}
.plc-table code{font-family:'JetBrains Mono',monospace;font-size:.73rem;color:#27d07a;}
.bar-visual{display:flex;align-items:center;gap:8px;margin-top:10px;}
.bar-track{flex:1;height:14px;background:var(--panel-2);border-radius:7px;overflow:hidden;border:1px solid var(--line);}
.bar-fill{height:100%;border-radius:7px;background:linear-gradient(90deg,#3aa0ff,#27d07a);}
.bar-labels{display:flex;justify-content:space-between;font-size:.68rem;color:var(--muted);margin-top:3px;font-family:'JetBrains Mono',monospace;}
</style>
`;
}

function renderSensorTypes() {
  return `<div class="sensor-grid">
${SENSOR_DATA.map(s=>`
<div class="sensor-card">
  <div class="sc-head">
    <div class="sc-icon">${SENSOR_SVG[s.icon]||''}</div>
    <div class="sc-title">
      <h3>${s.title}</h3>
      <small>${s.subtitle}</small>
    </div>
  </div>
  <div class="sc-body">
    <div class="sc-row">
      <div class="sc-item"><label>Standart</label><p class="code">${s.kod}</p></div>
      <div class="sc-item"><label>Çalışma Prensibi</label><p>${s.prensip}</p></div>
      <div class="sc-item"><label>Mesafe / Aralık</label><p>${s.mesafe}</p></div>
      <div class="sc-item"><label>Çıkış Tipi</label><p>${s.cikis}</p></div>
      <div class="sc-item"><label>Tipik Uygulama</label><p>${s.uygulama}</p></div>
      <div class="sc-note"><p>⚠ ${s.not}</p></div>
    </div>
  </div>
</div>`).join('')}
</div>`;
}

function renderSensorWiring() {
  return `<div class="wiring-wrap">
  <div class="w-card">
    <h3 class="npn">NPN — Sinking (Current Sinking)</h3>
    <div class="wdiag"><pre>     Sensör (NPN)
  ┌──────────────┐
  │ Kahverengi   │───── +24V
  │ Mavi         │───── 0V (GND)
  │ Siyah (OUT)  │───── PLC Giriş I0.0
  └──────────────┘
                         PLC kartı içinde
                         PULL-UP direnci var
                         → sinyal 0V'a çekilince
                           PLC "1" okur</pre></div>
    <div class="w-info">
      <p>NPN sensör, çıkış transistörü tetiklendiğinde siyah kablo GND'e (0V) bağlanır. PLC giriş kartı kendi içindeki pull-up direnciyle gerilimi yüksekte tutar; sensör aktifken bu gerilimi 0V'a çeker → PLC "1" okur.</p>
      <p><strong>Avantaj:</strong> Asya üretimi PLC'lerde (Mitsubishi, Omron) yaygın. Kısa devre koruması daha kolay.</p>
    </div>
    <svg viewBox="0 0 240 90" style="width:100%;max-height:90px;background:var(--panel-2);border-radius:8px;padding:6px;box-sizing:border-box;">
      <text x="5" y="18" fill="#8a96a3" font-size="8">+24V</text>
      <line x1="45" y1="15" x2="100" y2="15" stroke="#f5b301" stroke-width="2"/>
      <rect x="100" y="5" width="40" height="60" rx="5" fill="none" stroke="#8a96a3" stroke-width="1.5"/>
      <text x="120" y="32" text-anchor="middle" fill="#8a96a3" font-size="7">NPN</text>
      <text x="120" y="44" text-anchor="middle" fill="#f5b301" font-size="7">Sensör</text>
      <line x1="45" y1="55" x2="100" y2="55" stroke="#3aa0ff" stroke-width="2"/>
      <text x="5" y="58" fill="#8a96a3" font-size="8">0V</text>
      <line x1="140" y1="38" x2="190" y2="38" stroke="#8a96a3" stroke-width="2"/>
      <rect x="190" y="25" width="45" height="26" rx="4" fill="#1c232d" stroke="#f5b301" stroke-width="1.5"/>
      <text x="212" y="41" text-anchor="middle" fill="#f5b301" font-size="7">PLC I0.0</text>
      <line x1="212" y1="51" x2="212" y2="65" stroke="#3aa0ff" stroke-width="1.5"/>
      <line x1="190" y1="65" x2="235" y2="65" stroke="#3aa0ff" stroke-width="1.5"/>
    </svg>
  </div>

  <div class="w-card">
    <h3 class="pnp">PNP — Sourcing (Current Sourcing)</h3>
    <div class="wdiag"><pre>     Sensör (PNP)
  ┌──────────────┐
  │ Kahverengi   │───── +24V
  │ Mavi         │───── 0V (GND)
  │ Siyah (OUT)  │───── PLC Giriş I0.0
  └──────────────┘
                         PLC kartı içinde
                         PULL-DOWN direnci var
                         → sinyal +24V'a yükselince
                           PLC "1" okur</pre></div>
    <div class="w-info">
      <p>PNP sensör aktifken çıkış transistörü +24V'u siyah kabloya bağlar. PLC giriş kartının pull-down direnci normalde sinyali 0V'da tutar; sensör aktifken +24V görür → PLC "1" okur.</p>
      <p><strong>Avantaj:</strong> Siemens, Schneider, ABB PLC'lerde standart. Kablo kopması güvenli duruma alınabilir (fail-safe).</p>
    </div>
    <svg viewBox="0 0 240 90" style="width:100%;max-height:90px;background:var(--panel-2);border-radius:8px;padding:6px;box-sizing:border-box;">
      <text x="5" y="18" fill="#8a96a3" font-size="8">+24V</text>
      <line x1="45" y1="15" x2="100" y2="15" stroke="#f5b301" stroke-width="2"/>
      <rect x="100" y="5" width="40" height="60" rx="5" fill="none" stroke="#8a96a3" stroke-width="1.5"/>
      <text x="120" y="32" text-anchor="middle" fill="#8a96a3" font-size="7">PNP</text>
      <text x="120" y="44" text-anchor="middle" fill="#f5b301" font-size="7">Sensör</text>
      <line x1="45" y1="55" x2="100" y2="55" stroke="#3aa0ff" stroke-width="2"/>
      <text x="5" y="58" fill="#8a96a3" font-size="8">0V</text>
      <line x1="140" y1="28" x2="190" y2="28" stroke="#f5b301" stroke-width="2"/>
      <rect x="190" y="15" width="45" height="26" rx="4" fill="#1c232d" stroke="#f5b301" stroke-width="1.5"/>
      <text x="212" y="31" text-anchor="middle" fill="#f5b301" font-size="7">PLC I0.0</text>
    </svg>
  </div>

  <div class="w-card" style="grid-column:1/-1;">
    <h3 style="color:var(--ink);">3/4 Telli Kablo Renk Standardı — IEC 60947-5-2</h3>
    <table class="cable-table">
      <thead><tr><th>Renk</th><th>Fonksiyon</th><th>Açıklama</th></tr></thead>
      <tbody>
        <tr><td><span class="cable-dot" style="background:#8B4513;border:1px solid #ccc;"></span>Kahverengi (Brown)</td><td>+V (Besleme)</td><td>+24 VDC sensör besleme hattı</td></tr>
        <tr><td><span class="cable-dot" style="background:#3aa0ff;border:1px solid #3aa0ff;"></span>Mavi (Blue)</td><td>0V / GND</td><td>Negatif besleme ve sinyal referansı</td></tr>
        <tr><td><span class="cable-dot" style="background:#222;border:1px solid #666;"></span>Siyah (Black)</td><td>OUT (Çıkış)</td><td>Anahtarlama çıkışı (NPN veya PNP)</td></tr>
        <tr><td><span class="cable-dot" style="background:#eee;border:1px solid #999;"></span>Beyaz (White)</td><td>OUT2 (2. Çıkış)</td><td>NC çıkışı (4 telli modellerde)</td></tr>
      </tbody>
    </table>
    <p style="font-size:.75rem;color:var(--muted);margin:10px 0 0;">NOT: Bazı üreticiler farklı renk kullanabilir. Sensör veri sayfasını (datasheet) her zaman kontrol edin. Yanlış bağlantı sensörü kalıcı hasar verebilir.</p>
  </div>
</div>`;
}

function renderSensorAnalog() {
  return `<div class="analog-wrap">
  <div class="a-card">
    <h3>4–20 mA Akım Döngüsü (Current Loop)</h3>
    <div class="a-grid">
      <div class="a-block">
        <h4>Neden 4–20 mA?</h4>
        <p>4 mA minimum akım, besleme kesintisiz iken sensörün çalışır durumda olduğunu gösterir. 0 mA → kablo kopmuş demektir. Bu özellik "canlı sıfır" (live zero) adıyla bilinir ve güvenlik açısından kritik öneme sahiptir.</p>
        <p>Kablo direncinden etkilenmez: 4–20 mA akım sinyali uzun mesafelerde (1000 m+) gerilim düşümü olmadan iletilir.</p>
        <div class="bar-visual">
          <div style="font-size:.7rem;color:var(--muted);white-space:nowrap;font-family:'JetBrains Mono',monospace;">4 mA</div>
          <div class="bar-track"><div class="bar-fill" style="width:0%"></div></div>
          <div style="font-size:.7rem;color:var(--muted);white-space:nowrap;font-family:'JetBrains Mono',monospace;">20 mA</div>
        </div>
        <div class="bar-labels"><span>0% (min)</span><span>50%</span><span>100% (max)</span></div>
      </div>
      <div class="a-block">
        <h4>Hesap Formülü</h4>
        <div class="formula-box">
          <code>Değer = (I_mA − 4) / 16 × Alan_maks</code>
          <div class="ex">I = akım (mA) | Alan = ölçüm aralığı</div>
        </div>
        <p style="margin-top:10px;font-size:.76rem;color:var(--ink);">Örnek: 500 bar kapasiteli sensörden 12 mA geliyor:</p>
        <div class="formula-box">
          <code>(12 − 4) / 16 × 500 = 250 bar</code>
        </div>
        <p style="margin-top:8px;font-size:.76rem;color:var(--ink);">Örnek: 150°C RTD transmitter, 14.4 mA:</p>
        <div class="formula-box">
          <code>(14.4 − 4) / 16 × 150 = 97.5 °C</code>
        </div>
      </div>
    </div>
  </div>

  <div class="a-card">
    <h3>0–10 V Gerilim Çıkışı</h3>
    <div class="a-grid">
      <div class="a-block">
        <h4>Temel Özellikler</h4>
        <p>0 V = 0% (minimum), 10 V = 100% (maksimum). Hesap formülü basittir, ancak kablo direnci ölçümü bozar. Uzun mesafe için uygun değildir.</p>
        <div class="formula-box">
          <code>Değer = V / 10 × Alan_maks</code>
        </div>
        <p style="margin-top:8px;font-size:.76rem;color:var(--ink);">Örnek: 0–100 mm mesafe sensörü, 6.5 V → 65 mm</p>
        <p style="font-size:.73rem;color:var(--muted);">Dezavantaj: 0 V hem "minimum değer" hem "kablo koptu" anlamına gelir — ayırt edilemez.</p>
      </div>
      <div class="a-block">
        <h4>4–20 mA vs 0–10 V Karşılaştırma</h4>
        <table class="cable-table" style="margin-top:0;">
          <thead><tr><th>Özellik</th><th>4–20 mA</th><th>0–10 V</th></tr></thead>
          <tbody>
            <tr><td>Uzun mesafe</td><td style="color:#27d07a;">✔ Uygun</td><td style="color:#ff4d4f;">✘ Sorunlu</td></tr>
            <tr><td>Kablo kopma tespiti</td><td style="color:#27d07a;">✔ 0 mA</td><td style="color:#ff4d4f;">✘ Tespit edilemez</td></tr>
            <tr><td>Gürültü bağışıklığı</td><td style="color:#27d07a;">✔ Yüksek</td><td style="color:#f5b301;">Orta</td></tr>
            <tr><td>Kablo sayısı</td><td>2 telli</td><td>3 telli</td></tr>
            <tr><td>Kısa mesafe kullanım</td><td>Uygun</td><td style="color:#27d07a;">✔ Daha basit</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>

  <div class="a-card">
    <h3>PLC Analog Giriş — Sayısal Değer Dönüşümü</h3>
    <div class="a-grid">
      <div class="a-block">
        <h4>Siemens S7-1200 ADC Değerleri</h4>
        <table class="cable-table" style="margin-top:0;">
          <thead><tr><th>Giriş Türü</th><th>Min ADC</th><th>Max ADC</th><th>Notlar</th></tr></thead>
          <tbody>
            <tr><td>0–20 mA</td><td><code>0</code></td><td><code>27648</code></td><td>4 mA = 5530</td></tr>
            <tr><td>4–20 mA</td><td><code>0</code></td><td><code>27648</code></td><td>Doğrusal</td></tr>
            <tr><td>0–10 V</td><td><code>0</code></td><td><code>27648</code></td><td>—</td></tr>
            <tr><td>±10 V</td><td><code>-27648</code></td><td><code>27648</code></td><td>Bipolar</td></tr>
          </tbody>
        </table>
      </div>
      <div class="a-block">
        <h4>PLC'de Gerçek Değer Hesabı</h4>
        <div class="formula-box">
          <code>// Genel formül (4-20 mA)
Gerçek = ((ADC - ADC_min) /
    (ADC_max - ADC_min))
    × Alan_maks</code>
        </div>
        <div class="formula-box" style="margin-top:8px;">
          <code>// S7-1200 örneği (0-500 bar)
// ADC = 16512 geldi
Gerçek = (16512 / 27648) × 500
Gerçek ≈ 298.6 bar</code>
        </div>
        <p style="font-size:.72rem;color:var(--muted);margin-top:8px;">SCL dilinde NORM_X ve SCALE_X blokları bu hesabı otomatik yapar.</p>
      </div>
    </div>
  </div>
</div>`;
}

function sensorSection(name) {
  ['types','wiring','analog'].forEach(n=>{
    const el=document.getElementById('sensor-'+n);
    if(el) el.classList.toggle('hidden', n!==name);
  });
  document.querySelectorAll('.stab').forEach((b,i)=>{
    b.classList.toggle('active', ['types','wiring','analog'][i]===name);
  });
}
