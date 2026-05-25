/* =================================================================
   MAKİNE GÜVENLİĞİ MODÜLÜ — E-Stop, LOTO, VFD, Güvenlik Standartları
   ================================================================= */

function openGuvenlik() {
  switchTab('guvenlik');
  renderGuvenlik();
}

function renderGuvenlik() {
  const el = document.getElementById('tab-guvenlik');
  if (!el) return;

  el.innerHTML = `
<div class="gv-wrap">
  <div class="mod-header">
    <h2 class="mod-title">Makine Güvenliği</h2>
    <p class="mod-sub">IEC/EN 60204-1 · EN ISO 13849-1 · IEC 62061 · OSHA 1910.147</p>
  </div>

  <div class="gv-tabs">
    <button class="gtab active" onclick="guvenlikSection('temel')">Temel Kavramlar</button>
    <button class="gtab" onclick="guvenlikSection('estop')">E-Stop Devresi</button>
    <button class="gtab" onclick="guvenlikSection('loto')">LOTO Prosedürü</button>
    <button class="gtab" onclick="guvenlikSection('vfd')">VFD Temelleri</button>
  </div>

  <div id="gv-temel" class="gv-section">
    ${renderGvTemel()}
  </div>
  <div id="gv-estop" class="gv-section hidden">
    ${renderGvEstop()}
  </div>
  <div id="gv-loto" class="gv-section hidden">
    ${renderGvLoto()}
  </div>
  <div id="gv-vfd" class="gv-section hidden">
    ${renderGvVfd()}
  </div>
</div>

<style>
.gv-wrap{max-width:1100px;margin:0 auto;padding:16px 12px 40px;}
.gv-tabs{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:20px;}
.gtab{background:var(--panel-2);border:1px solid var(--line);color:var(--muted);padding:7px 16px;border-radius:6px;cursor:pointer;font-size:.82rem;letter-spacing:.03em;transition:all .15s;}
.gtab:hover{color:var(--ink);border-color:var(--muted);}
.gtab.active{background:#ff4d4f;color:#fff;border-color:#ff4d4f;font-weight:600;}
.gv-section.hidden{display:none;}

/* TEMEL KAVRAMLAR */
.gv-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:16px;margin-bottom:20px;}
.gv-card{background:var(--panel);border:1px solid var(--line);border-radius:10px;padding:16px 18px;}
.gv-card h3{font-family:'Oswald',sans-serif;font-size:1rem;color:var(--ink);margin:0 0 12px;padding-bottom:8px;border-bottom:1px solid var(--line);}
.gv-card h3 span{font-size:.75rem;color:var(--muted);font-weight:400;font-family:inherit;}
.cat-table{width:100%;border-collapse:collapse;}
.cat-table th,.cat-table td{padding:7px 10px;font-size:.75rem;border:1px solid var(--line);text-align:left;vertical-align:top;}
.cat-table th{background:var(--panel-2);color:var(--muted);font-family:'Oswald',sans-serif;letter-spacing:.04em;}
.pl-badge{display:inline-block;width:28px;height:28px;border-radius:50%;text-align:center;line-height:28px;font-family:'Oswald',sans-serif;font-size:.75rem;font-weight:700;margin-right:4px;}
.pla{background:#27d07a22;color:#27d07a;border:2px solid #27d07a;}
.plb{background:#3aa0ff22;color:#3aa0ff;border:2px solid #3aa0ff;}
.plc{background:#f5b30122;color:#f5b301;border:2px solid #f5b301;}
.pld{background:#ff7a1822;color:#ff7a18;border:2px solid #ff7a18;}
.ple{background:#ff4d4f22;color:#ff4d4f;border:2px solid #ff4d4f;}
.risk-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:8px;}
.risk-item{background:var(--panel-2);border-radius:6px;padding:8px 10px;}
.risk-item label{display:block;font-size:.68rem;color:var(--accent);letter-spacing:.05em;text-transform:uppercase;font-family:'Oswald',sans-serif;margin-bottom:3px;}
.risk-item p{margin:0;font-size:.75rem;color:var(--ink);line-height:1.45;}
.pl-selector{display:flex;gap:6px;flex-wrap:wrap;margin-top:12px;padding:12px;background:var(--panel-2);border-radius:8px;}
.pl-scenario{font-size:.76rem;color:var(--ink);line-height:1.5;}

/* E-STOP */
.estop-wrap{display:flex;flex-direction:column;gap:16px;}
.es-card{background:var(--panel);border:1px solid var(--line);border-radius:10px;padding:16px 18px;}
.es-card h3{font-family:'Oswald',sans-serif;font-size:1rem;color:var(--ink);margin:0 0 10px;}
.es-card h3.danger{color:#ff4d4f;}
.es-card h3.safe{color:#27d07a;}
.circuit-box{background:var(--panel-2);border-radius:8px;padding:12px 14px;overflow-x:auto;margin:10px 0;}
.circuit-box pre{margin:0;font-family:'JetBrains Mono',monospace;font-size:.73rem;color:var(--ink);line-height:1.8;white-space:pre;}
.es-info p{font-size:.78rem;color:var(--ink);line-height:1.55;margin:0 0 6px;}
.estop-svg-wrap{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-top:12px;}
@media(max-width:640px){.estop-svg-wrap{grid-template-columns:1fr;}}
.relay-table{width:100%;border-collapse:collapse;margin-top:10px;}
.relay-table th,.relay-table td{padding:7px 10px;font-size:.75rem;border:1px solid var(--line);text-align:left;}
.relay-table th{background:var(--panel-2);color:var(--muted);font-family:'Oswald',sans-serif;letter-spacing:.04em;}
.prop-list{list-style:none;padding:0;margin:8px 0 0;}
.prop-list li{font-size:.77rem;color:var(--ink);padding:4px 0;display:flex;align-items:flex-start;gap:8px;}
.prop-list li::before{content:'▸';color:var(--accent);flex-shrink:0;}

/* LOTO */
.loto-steps{display:flex;flex-direction:column;gap:10px;margin-bottom:18px;}
.loto-step{display:flex;gap:14px;align-items:flex-start;background:var(--panel);border:1px solid var(--line);border-radius:10px;padding:14px 16px;}
.loto-num{width:36px;height:36px;border-radius:50%;background:var(--accent);color:#000;font-family:'Oswald',sans-serif;font-size:1.1rem;font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
.loto-content h4{font-family:'Oswald',sans-serif;font-size:.95rem;color:var(--ink);margin:0 0 4px;}
.loto-content p{font-size:.77rem;color:var(--muted);margin:0;line-height:1.5;}
.loto-content .energy-tags{display:flex;gap:6px;flex-wrap:wrap;margin-top:6px;}
.energy-tag{font-size:.68rem;padding:2px 8px;border-radius:12px;font-weight:600;}
.et-elec{background:#3aa0ff22;color:#3aa0ff;border:1px solid #3aa0ff44;}
.et-pneu{background:#27d07a22;color:#27d07a;border:1px solid #27d07a44;}
.et-hyd{background:#f5b30122;color:#f5b301;border:1px solid #f5b30144;}
.et-mech{background:#ff7a1822;color:#ff7a18;border:1px solid #ff7a1844;}
.loto-note{background:#ff4d4f12;border:1px solid #ff4d4f33;border-radius:8px;padding:12px 14px;margin-top:4px;}
.loto-note p{margin:0;font-size:.77rem;color:#ff7a7a;line-height:1.5;}
.lock-colors{display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:10px;margin-top:12px;}
.lock-item{background:var(--panel-2);border-radius:8px;padding:10px 12px;display:flex;align-items:center;gap:10px;}
.lock-dot{width:20px;height:20px;border-radius:4px;flex-shrink:0;}
.lock-item span{font-size:.76rem;color:var(--ink);}

/* VFD */
.vfd-wrap{display:flex;flex-direction:column;gap:16px;}
.vfd-card{background:var(--panel);border:1px solid var(--line);border-radius:10px;padding:16px 18px;}
.vfd-card h3{font-family:'Oswald',sans-serif;font-size:1rem;color:var(--accent);margin:0 0 12px;padding-bottom:8px;border-bottom:1px solid var(--line);}
.vfd-diagram{margin:12px 0;}
.vfd-blocks{display:flex;align-items:center;justify-content:center;gap:0;flex-wrap:wrap;padding:12px;background:var(--panel-2);border-radius:8px;}
.vfd-block{background:var(--panel);border:1px solid var(--line);border-radius:6px;padding:8px 10px;text-align:center;min-width:70px;}
.vfd-block .vb-title{font-family:'Oswald',sans-serif;font-size:.75rem;color:var(--muted);display:block;margin-bottom:2px;}
.vfd-block .vb-val{font-family:'JetBrains Mono',monospace;font-size:.68rem;color:var(--ink);}
.vfd-arrow{color:var(--accent);font-size:1.2rem;padding:0 4px;}
.speed-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:8px;margin:10px 0;}
.speed-item{background:var(--panel-2);border-radius:6px;padding:8px 10px;}
.speed-item code{font-family:'JetBrains Mono',monospace;font-size:.85rem;color:#27d07a;display:block;margin-bottom:2px;}
.speed-item small{font-size:.72rem;color:var(--muted);}
.term-table{width:100%;border-collapse:collapse;}
.term-table th,.term-table td{padding:7px 10px;font-size:.75rem;border:1px solid var(--line);text-align:left;}
.term-table th{background:var(--panel-2);color:var(--muted);font-family:'Oswald',sans-serif;letter-spacing:.04em;}
.term-table td code{font-family:'JetBrains Mono',monospace;font-size:.73rem;color:#f5b301;}
.param-table{width:100%;border-collapse:collapse;}
.param-table th,.param-table td{padding:7px 10px;font-size:.74rem;border:1px solid var(--line);text-align:left;}
.param-table th{background:var(--panel-2);color:var(--muted);font-family:'Oswald',sans-serif;letter-spacing:.04em;}
.param-table td code{font-family:'JetBrains Mono',monospace;font-size:.72rem;color:#3aa0ff;}
.param-table td.pval{font-family:'JetBrains Mono',monospace;color:#27d07a;}
.fault-table{width:100%;border-collapse:collapse;}
.fault-table th,.fault-table td{padding:7px 10px;font-size:.74rem;border:1px solid var(--line);text-align:left;vertical-align:top;}
.fault-table th{background:var(--panel-2);color:var(--muted);font-family:'Oswald',sans-serif;letter-spacing:.04em;}
.fault-table td code{font-family:'JetBrains Mono',monospace;font-size:.73rem;color:#ff4d4f;}
.fault-table td.cause{color:var(--muted);font-size:.72rem;}
</style>
`;
}

/* ─── BÖLÜM 1: TEMEL KAVRAMLAR ─────────────────────────────────────── */
function renderGvTemel() {
  return `<div class="gv-grid">
  <div class="gv-card" style="grid-column:1/-1;">
    <h3>Güvenlik Kategorileri — EN ISO 13849-1 / IEC/EN 60204-1</h3>
    <table class="cat-table">
      <thead><tr><th>Kategori</th><th>Açıklama</th><th>Tek Arıza</th><th>Tipik Uygulama</th></tr></thead>
      <tbody>
        <tr><td><strong>B</strong></td><td>Temel tasarım prensiplerine uyum. Standart bileşenler kullanılır.</td><td style="color:#ff4d4f;">Korunma yok</td><td>Basit, düşük riskli makineler</td></tr>
        <tr><td><strong>1</strong></td><td>Kanıtlanmış güvenlik bileşenleri ve ilkeleri kullanılır.</td><td style="color:#ff7a18;">Kısmen</td><td>Mekanik yaylı frenleme, güvenli stop</td></tr>
        <tr><td><strong>2</strong></td><td>Güvenlik fonksiyonu periyodik olarak test edilir (otomatik test).</td><td style="color:#f5b301;">Test ile</td><td>Kontrollü ortam, düzenli bakım imkânı</td></tr>
        <tr><td><strong>3</strong></td><td>Tek arızada güvenli durum korunur. Çift kanal zorunludur.</td><td style="color:#27d07a;">✔ Güvenli</td><td>Işık perdesi, çift kanallı E-stop</td></tr>
        <tr><td><strong>4</strong></td><td>Çoklu arızada bile güvenli durum. Sürekli arıza tespiti.</td><td style="color:#27d07a;">✔ En güvenli</td><td>Robot hücresi, pres, vinç, nükleer</td></tr>
      </tbody>
    </table>
  </div>

  <div class="gv-card">
    <h3>Performance Level (PLr) <span>— EN ISO 13849-1</span></h3>
    <p style="font-size:.77rem;color:var(--ink);margin:0 0 10px;line-height:1.5;">Risk değerlendirme parametreleri ile gerekli güvenlik seviyesi (PLr) belirlenir:</p>
    <div class="risk-grid">
      <div class="risk-item">
        <label>S — Şiddet (Severity)</label>
        <p><strong style="color:#f5b301;">S1</strong> = Geri dönüşümlü yaralanma<br><strong style="color:#ff4d4f;">S2</strong> = Geri dönüşümsüz / ölüm</p>
      </div>
      <div class="risk-item">
        <label>F — Sıklık (Frequency)</label>
        <p><strong style="color:#27d07a;">F1</strong> = Seyrek maruz kalma<br><strong style="color:#ff4d4f;">F2</strong> = Sık / sürekli maruz kalma</p>
      </div>
      <div class="risk-item">
        <label>P — Önlenebilirlik (Probability)</label>
        <p><strong style="color:#27d07a;">P1</strong> = Önlenebilir<br><strong style="color:#ff4d4f;">P2</strong> = Neredeyse önlenemez</p>
      </div>
      <div class="risk-item">
        <label>PLr Seviyeleri</label>
        <p>
          <span class="pl-badge pla">a</span>
          <span class="pl-badge plb">b</span>
          <span class="pl-badge plc">c</span>
          <span class="pl-badge pld">d</span>
          <span class="pl-badge ple">e</span>
        </p>
        <p style="font-size:.7rem;color:var(--muted);">a = en düşük risk, e = en yüksek risk</p>
      </div>
    </div>
    <div class="pl-selector">
      <div class="pl-scenario">
        <strong style="color:#ff4d4f;">S2 + F2 + P2</strong> = <span class="pl-badge ple" style="width:22px;height:22px;line-height:22px;font-size:.7rem;">e</span> gerektirir → Güvenlik PLC + Çift kanal
      </div>
      <div class="pl-scenario" style="margin-top:6px;">
        <strong style="color:#f5b301;">S1 + F1 + P1</strong> = <span class="pl-badge pla" style="width:22px;height:22px;line-height:22px;font-size:.7rem;">a</span> yeterli → Standart bileşen
      </div>
      <div class="pl-scenario" style="margin-top:6px;">
        <strong style="color:#ff7a18;">S2 + F1 + P1</strong> = <span class="pl-badge plc" style="width:22px;height:22px;line-height:22px;font-size:.7rem;">c</span> → Güvenlik rölesi
      </div>
    </div>
  </div>

  <div class="gv-card">
    <h3>SIL Seviyeleri — IEC 62061</h3>
    <p style="font-size:.77rem;color:var(--ink);margin:0 0 10px;line-height:1.5;">Safety Integrity Level (SIL), özellikle karmaşık elektronik sistemlerde kullanılan güvenlik seviyesi standardıdır. EN ISO 13849 PLr ile yakın ilişkilidir:</p>
    <table class="cat-table">
      <thead><tr><th>SIL</th><th>PLr Karşılığı</th><th>PFH (saat⁻¹)</th><th>Örnek</th></tr></thead>
      <tbody>
        <tr><td>SIL 1</td><td><span class="pl-badge plc" style="width:20px;height:20px;line-height:20px;">c</span></td><td><code style="font-family:'JetBrains Mono',monospace;font-size:.7rem;">10⁻⁶ – 10⁻⁵</code></td><td>Işık perdesi tek kanal</td></tr>
        <tr><td>SIL 2</td><td><span class="pl-badge pld" style="width:20px;height:20px;line-height:20px;">d</span></td><td><code style="font-family:'JetBrains Mono',monospace;font-size:.7rem;">10⁻⁷ – 10⁻⁶</code></td><td>Robot hücresi, pres</td></tr>
        <tr><td>SIL 3</td><td><span class="pl-badge ple" style="width:20px;height:20px;line-height:20px;">e</span></td><td><code style="font-family:'JetBrains Mono',monospace;font-size:.7rem;">10⁻⁸ – 10⁻⁷</code></td><td>Nükleer, kimya prosesi</td></tr>
      </tbody>
    </table>
    <p style="font-size:.73rem;color:var(--muted);margin:10px 0 0;">PFH = Probability of dangerous Failure per Hour (saatlik tehlikeli arıza olasılığı)</p>
  </div>
</div>`;
}

/* ─── BÖLÜM 2: E-STOP ──────────────────────────────────────────────── */
function renderGvEstop() {
  return `<div class="estop-wrap">
  <div class="es-card">
    <h3 class="danger">Acil Durdurma (Emergency Stop) Standardı — IEC 60947-5-5</h3>
    <ul class="prop-list">
      <li>Kırmızı mantar başlıklı buton — sarı arka zemin üzerinde (IEC 60417-5638)</li>
      <li>NC (normalde kapalı) kontak — basınca açılır, enerji kesmek = güvenli durum</li>
      <li>Geçiş kilitleme (latch) — otomatik sıfırlama YASAK; elle serbest bırakma zorunludur</li>
      <li>Serbest bırakma tipleri: Döndürerek (twist release), Çekerek (pull release), Anahtar ile (key release)</li>
      <li>Minimum buton çapı: 40 mm (elle çalıştırma için)</li>
      <li>Minimum güvenlik seviyesi: PLc / Kategori 3 (IEC 13849-1)</li>
      <li>Stop kategorisi: Kategori 0 (enerjisiz bırakma) veya Kategori 1 (kontrollü dur, sonra enerjisiz bırak)</li>
    </ul>
  </div>

  <div class="es-card">
    <h3 class="danger">Kategori B/1 — Tek Kanal Devre (DÜŞÜK GÜVENLİK)</h3>
    <div class="circuit-box"><pre>  L+ (24V)
   │
  [E-Stop 1 NC]── [E-Stop 2 NC]──┬── KM1 Bobini ── 0V
                                  │
                                 [KM1 NO] ─── (mühürleme)

⚠ Tek kanal: tel kopması veya kontak kaynaması güvenli durumu SAĞLAMAZ
⚠ Sadece PLb/Kategori 1 — düşük riskli uygulamalar için</pre></div>
    <div class="es-info">
      <p>Birden fazla e-stop butonu seri bağlanır. Herhangi biri açıldığında kontaktör bobini enerji keser. Ancak bu devre arıza güvenliliği (fail-safe) özelliği taşımaz: kablo kopması, kontak kaynaması veya kısa devre güvenli durumu engelleyebilir.</p>
    </div>
  </div>

  <div class="es-card">
    <h3 class="safe">Kategori 3 — Çift Kanal + Güvenlik Rölesi (ÖNERİLEN)</h3>
    <div class="circuit-box"><pre>  Kanal A:  L+ ─[E-Stop A NC]─ Güvenlik Rölesi IN1 ─ L-
  Kanal B:  L+ ─[E-Stop B NC]─ Güvenlik Rölesi IN2 ─ L-
              │                         │
              └──── çapraz izleme ──────┘
                    (güvenlik rölesi içi)

  Güvenlik Rölesi Çıkışı (13-14, 23-24):
    → KM1 Kontaktör bobini
    → KM2 Kontaktör bobini (opsiyonel, güvenli kapama)

  Reset butonu:
    L+ ─[Reset NO]─ Güvenlik Rölesi S33 ─ L-

  ✔ Her iki kanal "1" → çıkış verir (makine çalışabilir)
  ✔ Tek kanal arızalandı → çıkış kesilir (güvenli durum)
  ✔ Tek arızada güvenlik korunur (Kategori 3, PLd)</pre></div>
    <div class="es-info">
      <p>Güvenlik rölesi, her iki kanalı bağımsız olarak izler. Bir kontak kaydığında veya tel koptuğunda diğer kanal bunu tespit eder ve çıkışı kapatır. Reset sinyali olmadan yeniden devreye girmez — güvenli durumun doğrulanması zorunludur.</p>
      <p>Çıkış kontakları (13-14, 23-24) zorunlu yönlendirmeli (positive guided) olup kaynamaz — güvenlik standartlarının temel gerekliliği.</p>
    </div>

    <div class="estop-svg-wrap">
      <div>
        <p style="font-size:.77rem;color:var(--muted);margin:0 0 8px;font-family:'Oswald',sans-serif;letter-spacing:.04em;">ÇİFT KANAL DEVRE DİYAGRAMI</p>
        <svg viewBox="0 0 260 180" style="width:100%;background:var(--panel-2);border-radius:8px;padding:8px;box-sizing:border-box;">
          <!-- Güç -->
          <text x="5" y="18" fill="#f5b301" font-size="8">+24V</text>
          <line x1="35" y1="15" x2="50" y2="15" stroke="#f5b301" stroke-width="2"/>
          <!-- Kanal A -->
          <rect x="50" y="5" width="40" height="20" rx="3" fill="#161b22" stroke="#ff4d4f" stroke-width="1.5"/>
          <text x="70" y="18" text-anchor="middle" fill="#ff4d4f" font-size="7">E-Stop A</text>
          <line x1="90" y1="15" x2="120" y2="15" stroke="#ff4d4f" stroke-width="1.5"/>
          <!-- Kanal B -->
          <line x1="35" y1="55" x2="50" y2="55" stroke="#f5b301" stroke-width="2"/>
          <rect x="50" y="45" width="40" height="20" rx="3" fill="#161b22" stroke="#ff4d4f" stroke-width="1.5"/>
          <text x="70" y="58" text-anchor="middle" fill="#ff4d4f" font-size="7">E-Stop B</text>
          <line x1="90" y1="55" x2="120" y2="55" stroke="#ff4d4f" stroke-width="1.5"/>
          <!-- Güvenlik Rölesi -->
          <rect x="120" y="10" width="60" height="60" rx="5" fill="#1c232d" stroke="#27d07a" stroke-width="2"/>
          <text x="150" y="30" text-anchor="middle" fill="#27d07a" font-size="7">Güvenlik</text>
          <text x="150" y="42" text-anchor="middle" fill="#27d07a" font-size="7">Rölesi</text>
          <text x="150" y="54" text-anchor="middle" fill="#8a96a3" font-size="6">Pilz PNOZ</text>
          <!-- Çıkış -->
          <line x1="180" y1="35" x2="210" y2="35" stroke="#27d07a" stroke-width="1.5"/>
          <rect x="210" y="20" width="45" height="30" rx="4" fill="#161b22" stroke="#f5b301" stroke-width="1.5"/>
          <text x="232" y="37" text-anchor="middle" fill="#f5b301" font-size="7">KM1</text>
          <!-- Reset -->
          <line x1="35" y1="95" x2="50" y2="95" stroke="#f5b301" stroke-width="1.5"/>
          <rect x="50" y="85" width="40" height="20" rx="3" fill="#161b22" stroke="#27d07a" stroke-width="1.5"/>
          <text x="70" y="98" text-anchor="middle" fill="#27d07a" font-size="7">Reset</text>
          <line x1="90" y1="95" x2="120" y2="95" stroke="#27d07a" stroke-width="1.5"/>
          <line x1="120" y1="95" x2="150" y2="70" stroke="#27d07a" stroke-width="1.5" stroke-dasharray="3 2"/>
          <!-- 0V -->
          <line x1="35" y1="15" x2="35" y2="130" stroke="#3aa0ff" stroke-width="1.5"/>
          <line x1="35" y1="130" x2="255" y2="130" stroke="#3aa0ff" stroke-width="1.5"/>
          <text x="5" y="133" fill="#3aa0ff" font-size="8">0V</text>
          <line x1="150" y1="70" x2="150" y2="130" stroke="#3aa0ff" stroke-width="1" stroke-dasharray="3 2"/>
        </svg>
      </div>
      <div>
        <p style="font-size:.77rem;color:var(--muted);margin:0 0 8px;font-family:'Oswald',sans-serif;letter-spacing:.04em;">POPÜLER GÜVENLİK RÖLELERİ</p>
        <table class="relay-table">
          <thead><tr><th>Model</th><th>Kat.</th><th>PLr</th><th>Özellik</th></tr></thead>
          <tbody>
            <tr><td>Pilz PNOZ X3</td><td>4</td><td><span class="pl-badge ple" style="width:20px;height:20px;line-height:20px;">e</span></td><td>Klasik, 24V DC/AC</td></tr>
            <tr><td>Pilz PNOZ m B0</td><td>4</td><td><span class="pl-badge ple" style="width:20px;height:20px;line-height:20px;">e</span></td><td>Modüler, programlanabilir</td></tr>
            <tr><td>Schneider XPS AK</td><td>4</td><td><span class="pl-badge ple" style="width:20px;height:20px;line-height:20px;">e</span></td><td>Preventa serisi</td></tr>
            <tr><td>Phoenix PSR-SCP</td><td>3</td><td><span class="pl-badge pld" style="width:20px;height:20px;line-height:20px;">d</span></td><td>Kompakt, yaygın</td></tr>
            <tr><td>Siemens 3SK1</td><td>4</td><td><span class="pl-badge ple" style="width:20px;height:20px;line-height:20px;">e</span></td><td>SIRIUS güvenlik serisi</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</div>`;
}

/* ─── BÖLÜM 3: LOTO ────────────────────────────────────────────────── */
function renderGvLoto() {
  const steps = [
    {
      n: 1,
      title: 'HAZIRLIK — Ekipmanı Tanı',
      desc: 'Makineyi, tüm enerji kaynaklarını (elektrik, pnömatik, hidrolik, mekanik, termal) ve izolasyon noktalarını belirle. İlgili çalışanları bilgilendir.',
      tags: ['et-elec','et-pneu','et-hyd','et-mech'],
      tagLabels: ['Elektrik','Pnömatik','Hidrolik','Mekanik']
    },
    {
      n: 2,
      title: 'KAPATMA — Normal Prosedürle Durdur',
      desc: 'Makineyi normal durdurma prosedürü ile durdur (acil durdurma değil). Tüm hareketlerin durduğunu doğrula.',
      tags: [],
      tagLabels: []
    },
    {
      n: 3,
      title: 'İZOLE — Enerji Kaynaklarını Kes',
      desc: 'Her enerji kaynağını izolasyon noktasında kes: ana şalter aç, pnömatik valf kapat, hidrolik valf kapat, mekanik fren uygula.',
      tags: ['et-elec','et-pneu','et-hyd'],
      tagLabels: ['Ana Şalter','Pnömatik Valf','Hidrolik Valf']
    },
    {
      n: 4,
      title: 'KİLİTLE — Fiziksel Kilit Tak',
      desc: 'Her enerji izolasyon noktasına fiziksel kilit tak. Her teknisyen kendi kilidi ve etiketiyle kilitler. Anahtar technisyenin kendisinde kalır — başkası açamaz.',
      tags: [],
      tagLabels: []
    },
    {
      n: 5,
      title: 'ENERJİSİZLEŞTİR — Artık Enerjiyi Boşalt',
      desc: 'Kondansatörleri boşalt, yayları gevşet, tanklar ve boru hatlarındaki basıncı sıfırla, ağır aksamları sabitle veya indir.',
      tags: ['et-elec','et-pneu','et-hyd','et-mech'],
      tagLabels: ['Kondansatör','Basınçlı hava','Hidrolik basınç','Ağır aksam']
    },
    {
      n: 6,
      title: 'DOĞRULA — Test Et',
      desc: 'Start butonuna bas — makine çalışmamalı. Multimetre ile voltaj sıfır mı kontrol et. Basınç göstergesi sıfır mı kontrol et. Tüm kontrolleri tamamla, işe başla.',
      tags: [],
      tagLabels: []
    }
  ];

  return `<div>
  <div class="loto-steps">
    ${steps.map(s=>`
    <div class="loto-step">
      <div class="loto-num">${s.n}</div>
      <div class="loto-content">
        <h4>${s.title}</h4>
        <p>${s.desc}</p>
        ${s.tags.length ? `<div class="energy-tags">${s.tags.map((t,i)=>`<span class="energy-tag ${t}">${s.tagLabels[i]}</span>`).join('')}</div>` : ''}
      </div>
    </div>`).join('')}
  </div>

  <div class="loto-note">
    <p><strong>GERİ AÇMA SIRASI (Ters sırada):</strong> Önce ekipman ve çevrenin temiz olduğunu doğrula → Tüm personelin bölgeyi terk ettiğini kontrol et → Her kişi kendi kilidini açar → İzolasyon noktalarını aç → Makineye enerji ver → Normal operasyona geç.</p>
  </div>

  <div class="es-card" style="margin-top:16px;">
    <h3 style="color:var(--ink);font-family:'Oswald',sans-serif;font-size:1rem;margin:0 0 10px;">Renkli Kilit Sistemi</h3>
    <p style="font-size:.77rem;color:var(--muted);margin:0 0 10px;line-height:1.5;">Her departman veya meslek grubu farklı renk kilit kullanır. Birden fazla kişi aynı noktayı kilitlediğinde haspa (hasp/scissor clamp) kullanılır — tüm kilitler açılmadan makine açılamaz.</p>
    <div class="lock-colors">
      <div class="lock-item"><div class="lock-dot" style="background:#ff4d4f;"></div><span>Bakım</span></div>
      <div class="lock-item"><div class="lock-dot" style="background:#3aa0ff;"></div><span>Elektrik</span></div>
      <div class="lock-item"><div class="lock-dot" style="background:#f5b301;"></div><span>Mekanik</span></div>
      <div class="lock-item"><div class="lock-dot" style="background:#27d07a;"></div><span>Üretim</span></div>
      <div class="lock-item"><div class="lock-dot" style="background:#ff7a18;"></div><span>Enstrüman</span></div>
      <div class="lock-item"><div class="lock-dot" style="background:#888;"></div><span>Yüklenici</span></div>
    </div>
  </div>
</div>`;
}

/* ─── BÖLÜM 4: VFD ─────────────────────────────────────────────────── */
function renderGvVfd() {
  const params = [
    ['P0100','Motor standart','0 = IEC (Avrupa), 1 = NEMA (ABD)'],
    ['P0304','Motor nominal gerilimi','400 V (tipik)'],
    ['P0305','Motor nominal akımı','Motor etiketi (A)'],
    ['P0307','Motor nominal gücü','Motor etiketi (kW)'],
    ['P0310','Motor nominal frekansı','50 Hz'],
    ['P0311','Motor nominal devri','Motor etiketi (rpm)'],
    ['P0700','Kontrol kaynağı','1 = Terminal, 5 = BOP (panel)'],
    ['P1000','Hız referans kaynağı','1 = Analog giriş, 5 = Sabit hız'],
    ['P1080','Min. frekans','5 Hz (tipik)'],
    ['P1082','Max. frekans','50 Hz'],
    ['P1120','Rampa hızlanma süresi','5 s (tipik — yüke göre ayarla)'],
    ['P1121','Rampa yavaşlama süresi','5 s (tipik — yüke göre ayarla)'],
  ];

  const faults = [
    ['F001','Aşırı akım (Overcurrent)','Motor aşırı yüklü, rampa süresi çok kısa, motor sargısı kısa devresi'],
    ['F002','Aşırı gerilim (Overvoltage)','Yavaşlama süresi çok kısa, frenleme direnci yok/yetersiz'],
    ['F003','Düşük gerilim (Undervoltage)','Şebeke gerilimi düşük, besleme kablosu aşırı ince'],
    ['F004','Motor aşırı sıcaklık','Fan çalışmıyor, filtre tıkalı, aşırı yük, motor soğutması yetersiz'],
    ['F005','VFD aşırı sıcaklık','Ortam sıcaklığı yüksek, VFD filtresi tıkalı, yetersiz havalandırma'],
    ['F006','İletişim hatası','Fieldbus kablosu, yanlış parametre (iletişim protokolü)'],
    ['F021','Motor faz hatası','U/V/W bağlantısı eksik veya kopuk, motor kablosu kontrolü'],
  ];

  const terminals = [
    ['L1, L2, L3','Şebeke girişi — 3~ 400V AC'],
    ['U, V, W','Motor çıkışı — değişken frekans/gerilim'],
    ['PE','Koruma toprağı (Ground)'],
    ['R+, R-','Frenleme direnci bağlantısı (opsiyonel)'],
    ['24V / 0V','Kontrol devresi besleme çıkışı'],
    ['DI1 – DI6','Dijital girişler: Start/Stop/Yön/Hız seçimi'],
    ['AI1, AI2','Analog giriş: 0-10V veya 4-20 mA hız referansı'],
    ['DO1, DO2','Dijital çıkış: Arıza sinyali, Çalışıyor sinyali'],
    ['AO1','Analog çıkış: Frekans veya akım izleme (0-10V)'],
    ['COM','Dijital giriş/çıkış ortak terminal'],
  ];

  return `<div class="vfd-wrap">
  <div class="vfd-card">
    <h3>VFD (Frekans İnverteri) Nedir?</h3>
    <p style="font-size:.78rem;color:var(--ink);margin:0 0 10px;line-height:1.5;">AC motorun besleme frekansını değiştirerek devir sayısını kontrol eder. Sabit devirli motorlarda şalterle olmayan hız denetimini mümkün kılar; enerji tasarrufu ve mekanik yük azaltma sağlar.</p>
    <div class="vfd-diagram">
      <div class="vfd-blocks">
        <div class="vfd-block" style="border-color:#3aa0ff;">
          <span class="vb-title">Şebeke</span>
          <span class="vb-val">3~ 400V<br>50 Hz</span>
        </div>
        <div class="vfd-arrow">→</div>
        <div class="vfd-block" style="border-color:#f5b301;">
          <span class="vb-title">Doğrultucu</span>
          <span class="vb-val">AC → DC<br>560V DC</span>
        </div>
        <div class="vfd-arrow">→</div>
        <div class="vfd-block" style="border-color:#f5b301;">
          <span class="vb-title">DC Bus</span>
          <span class="vb-val">Kondansatör<br>+ Frenleme</span>
        </div>
        <div class="vfd-arrow">→</div>
        <div class="vfd-block" style="border-color:#27d07a;">
          <span class="vb-title">İnvertör (IGBT)</span>
          <span class="vb-val">DC → AC<br>PWM kontrol</span>
        </div>
        <div class="vfd-arrow">→</div>
        <div class="vfd-block" style="border-color:#27d07a;">
          <span class="vb-title">Motor</span>
          <span class="vb-val">AC Motor<br>Değişken Hz</span>
        </div>
      </div>
    </div>
    <p style="font-size:.77rem;color:var(--muted);margin:6px 0 10px;">Motor hızı: <code style="font-family:'JetBrains Mono',monospace;color:#f5b301;">n = 60 × f / p</code> — f = frekans (Hz), p = kutup çifti sayısı</p>
    <div class="speed-grid">
      <div class="speed-item"><code>50 Hz → ~3000 rpm</code><small>2 kutuplu, tam hız</small></div>
      <div class="speed-item"><code>25 Hz → ~1500 rpm</code><small>%50 hız</small></div>
      <div class="speed-item"><code>10 Hz → ~600 rpm</code><small>%20 hız</small></div>
      <div class="speed-item"><code>5 Hz → ~300 rpm</code><small>Min. hız (tipik)</small></div>
    </div>
    <p style="font-size:.73rem;color:var(--muted);margin:8px 0 0;">Not: Slip kayması nedeniyle gerçek devir nominal değerin %2-5 altındadır. Senkron motor veya enkoder geri beslemeli (closed loop) sürücüde bu fark minimize edilir.</p>
  </div>

  <div class="vfd-card">
    <h3>Bağlantı Terminalleri (Genel — Marka Bağımsız)</h3>
    <table class="term-table">
      <thead><tr><th>Terminal</th><th>Açıklama</th></tr></thead>
      <tbody>
        ${terminals.map(([t,d])=>`<tr><td><code>${t}</code></td><td>${d}</td></tr>`).join('')}
      </tbody>
    </table>
    <p style="font-size:.73rem;color:var(--muted);margin:10px 0 0;">⚠ Motor kablosu (U/V/W) ile kontrol kablosunu aynı kanalda çekme. Parazit (EMI) ölçüm hatalarına neden olur. Motor kablo ekranını VFD girişinde ve motor kutusunda toprakla.</p>
  </div>

  <div class="vfd-card">
    <h3>Siemens SINAMICS G120 — Temel Parametreler</h3>
    <table class="param-table">
      <thead><tr><th>Parametre</th><th>Adı</th><th>Tipik Değer</th></tr></thead>
      <tbody>
        ${params.map(([p,n,v])=>`<tr><td><code>${p}</code></td><td>${n}</td><td class="pval">${v}</td></tr>`).join('')}
      </tbody>
    </table>
    <p style="font-size:.73rem;color:var(--muted);margin:10px 0 0;">Hızlı devreye alma: P0010 = 1 (Quick Commissioning) → motor verilerini gir → P3900 = 1 (tamamla). Ayar bittikten sonra P0010 = 0'a dön.</p>
  </div>

  <div class="vfd-card">
    <h3>Yaygın VFD Arıza Kodları ve Çözüm</h3>
    <table class="fault-table">
      <thead><tr><th>Kod</th><th>Anlam</th><th>Olası Neden / Çözüm</th></tr></thead>
      <tbody>
        ${faults.map(([c,m,r])=>`<tr><td><code>${c}</code></td><td>${m}</td><td class="cause">${r}</td></tr>`).join('')}
      </tbody>
    </table>
    <p style="font-size:.73rem;color:var(--muted);margin:10px 0 0;">Arıza geçmişi: Siemens G120'de P2111 (hata kodu) ve P2114 (arıza anındaki akım) parametreleri ile incelenir. Arızayı silmek için P0972 = 1 veya DI üzerinde arıza reset sinyali.</p>
  </div>
</div>`;
}

/* ─── TAB GEÇIŞ ─────────────────────────────────────────────────────── */
function guvenlikSection(name) {
  ['temel','estop','loto','vfd'].forEach(n=>{
    const el=document.getElementById('gv-'+n);
    if(el) el.classList.toggle('hidden', n!==name);
  });
  document.querySelectorAll('.gtab').forEach((b,i)=>{
    b.classList.toggle('active', ['temel','estop','loto','vfd'][i]===name);
  });
}
