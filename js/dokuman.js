/* ================================================================
   DÖKÜMANLAR — Endüstriyel Otomasyon Referans Kaynağı
   Otomasyon Akademi · js/dokuman.js
   ================================================================ */

let DOK_ACTIVE_TAB = 'formul';

/* ----------------------------------------------------------------
   STUB — app.js lazy loader tarafından override edilmeden önce
   ---------------------------------------------------------------- */
function openDokuman() {
  switchTab('dokuman');
  renderDokuman();
}

/* ================================================================
   ANA RENDER
   ================================================================ */
function renderDokuman() {
  const el = document.getElementById('tab-dokuman');
  if (!el) return;
  el.innerHTML = buildDokumanHTML();
  _dokBindNav();
  _dokShowTab(DOK_ACTIVE_TAB);
}

function buildDokumanHTML() {
  return `
<div class="dok-layout">
  <div class="dok-nav" id="dokNav">
    <button class="dok-navbtn active" data-dok="formul">📐 Formüller</button>
    <button class="dok-navbtn" data-dok="tablo">📋 Tablolar</button>
    <button class="dok-navbtn" data-dok="standart">🏛 Standartlar</button>
    <button class="dok-navbtn" data-dok="sozluk">🔤 Sözlük</button>
    <button class="dok-navbtn" data-dok="hizliref">⚡ Hızlı Ref</button>
  </div>
  <div class="dok-content" id="dokContent">
    <!-- Aktif sekme render edilir -->
  </div>
</div>`;
}

function _dokBindNav() {
  const nav = document.getElementById('dokNav');
  if (!nav) return;
  nav.querySelectorAll('.dok-navbtn').forEach(btn => {
    btn.addEventListener('click', () => {
      nav.querySelectorAll('.dok-navbtn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      DOK_ACTIVE_TAB = btn.dataset.dok;
      _dokShowTab(DOK_ACTIVE_TAB);
    });
  });
}

function _dokShowTab(tab) {
  const content = document.getElementById('dokContent');
  if (!content) return;
  switch (tab) {
    case 'formul':   content.innerHTML = renderFormulBolumu();   break;
    case 'tablo':    content.innerHTML = renderTablosBolumu();   break;
    case 'standart': content.innerHTML = renderStandartlarBolumu(); break;
    case 'sozluk':   content.innerHTML = renderSozlukBolumu();   _dokBindSozlukSearch(); break;
    case 'hizliref': content.innerHTML = renderHizliRefBolumu(); break;
    default:         content.innerHTML = renderFormulBolumu();
  }
}

/* ================================================================
   BÖLÜM 1: FORMÜLLER
   ================================================================ */
function renderFormulBolumu() {
  const formüller = [
    {
      baslik: 'Ohm Yasası',
      formul: 'V = I × R   |   I = V / R   |   R = V / I',
      semboller: 'V = Gerilim (Volt)  ·  I = Akım (Amper)  ·  R = Direnç (Ohm, Ω)',
      aciklama: 'Bir devrede gerilim, akım ve direnç arasındaki temel ilişkiyi tanımlar. Her elektrik hesabının başlangıç noktasıdır.',
      ornek: '24 V beslemede 100 Ω dirençten geçen akım: I = 24 / 100 = 0.24 A',
      ipucu: 'Pratikte: PLC çıkışı 24V, röle bobini 1.2kΩ → I = 24/1200 = 20 mA (güvenli sınır içinde)'
    },
    {
      baslik: 'Elektrik Gücü',
      formul: 'P = V × I   |   P = I² × R   |   P = V² / R',
      semboller: 'P = Güç (Watt)  ·  V = Gerilim (Volt)  ·  I = Akım (Amper)  ·  R = Direnç (Ω)',
      aciklama: 'Bir elektrik devresinde harcanan ya da üretilen anlık gücü verir. Isınma ve enerji hesaplarında kullanılır.',
      ornek: '230 V, 10 A bir ısıtıcının gücü: P = 230 × 10 = 2300 W = 2.3 kW',
      ipucu: 'Termik hesap için P = I² × R formu kullanılır — kablo ısınması için kritik!'
    },
    {
      baslik: '3 Fazlı AC Güç',
      formul: 'P = √3 × U_L × I_L × cosφ   ≈   1.732 × U × I × cosφ',
      semboller: 'P = Aktif güç (kW)  ·  U_L = Hat gerilimi (V, genelde 400V)  ·  I_L = Hat akımı (A)  ·  cosφ = Güç faktörü',
      aciklama: 'Endüstride motorlar ve yükler 3 fazlı beslenir. cosφ değeri reaktif gücü gösterir. Motor için tipik cosφ = 0.80–0.87.',
      ornek: '400V, cosφ=0.85, 22A motorda P = 1.732 × 400 × 22 × 0.85 ≈ 12.9 kW',
      ipucu: 'Nameplate\'te P(kW) ve I(A) yazıyor, cosφ genelde 0.85 alınır. Kondansatör bankası ile cosφ yükseltilir.'
    },
    {
      baslik: 'Motor Senkron Devir Hızı',
      formul: 'n_s = 60 × f / p',
      semboller: 'n_s = Senkron hız (dev/dak)  ·  f = Şebeke frekansı (Hz)  ·  p = Kutup çifti sayısı',
      aciklama: 'AC asenkron motorun teorik maksimum devir hızı. Gerçek hız (n), kayma (slip) nedeniyle %3–5 daha düşüktür.',
      ornek: '50 Hz şebeke, 2 kutup çifti (4 kutuplu motor): n_s = 60 × 50 / 2 = 1500 dev/dak  |  2 kutuplu: 3000 dev/dak',
      ipucu: 'Türkiye şebekesi 50 Hz. 4 kutuplu motor nameplate\'inde "1450 rpm" yazıyorsa 50 rpm slip var demektir.'
    },
    {
      baslik: 'Motor Torku',
      formul: 'M = 9550 × P / n',
      semboller: 'M = Tork (Nm)  ·  P = Güç (kW)  ·  n = Motor devri (dev/dak)  ·  9550 = sabit (1 kW = 9550 Nm/rpm)',
      aciklama: 'Döner makinelerde mekanik gücü tork ve hıza bağlar. Bant konveyör, pompa, karıştırıcı boyutlamada temel formül.',
      ornek: '11 kW, 1450 dev/dak motor: M = 9550 × 11 / 1450 = 72.4 Nm',
      ipucu: 'Yüksek tork gereken uygulamalarda (vidalı konveyör, karıştırıcı) düşük devir + yüksek güç motorla gidilir.'
    },
    {
      baslik: 'Redüktör Çıkış Torku',
      formul: 'M_çıkış = M_giriş × i × η',
      semboller: 'M_çıkış = Çıkış torku (Nm)  ·  M_giriş = Motor torku (Nm)  ·  i = Çevrim oranı  ·  η = Verim (genelde 0.94–0.97)',
      aciklama: 'Redüktör, motordaki yüksek devri düşürüp torku arttırır. Verim kaybını η ile hesaba katmak zorunludur.',
      ornek: '72.4 Nm motorla, i=20, η=0.95 redüktör: M_çıkış = 72.4 × 20 × 0.95 = 1375.6 Nm',
      ipucu: 'Helical dişli redüktör verimi ~0.96–0.98, sonsuz vida (worm) redüktör verimi ~0.50–0.85 (çevrim oranına göre değişir).'
    },
    {
      baslik: 'VFD ile Hız Kontrolü',
      formul: 'n = 60 × f_çıkış / p',
      semboller: 'n = Motor devri (dev/dak)  ·  f_çıkış = VFD çıkış frekansı (Hz)  ·  p = Kutup çifti sayısı',
      aciklama: 'Frekans invertörü (VFD) çıkış frekansını değiştirerek motor hızını ayarlar. V/f oranı sabit tutulur.',
      ornek: '4 kutuplu motor (p=2), VFD 30 Hz çıkışta: n = 60 × 30 / 2 = 900 dev/dak (nominal hızın %60\'ı)',
      ipucu: 'VFD ile torku düşük hızda yüksek tutmak için vektör kontrol modu kullanılır. Pompalar için enerji tasarrufu f³ ile orantılıdır.'
    },
    {
      baslik: 'Pnömatik Silindir Kuvveti',
      formul: 'F = P × A   (İtme)   |   F_geri = P × (A - A_piston_kolu)',
      semboller: 'F = Kuvvet (Newton)  ·  P = Basınç (Pa = N/m²)  ·  A = Piston alanı (m²)  ·  Not: 1 bar = 100 000 Pa',
      aciklama: 'Pnömatik silindirin ürettiği teorik kuvvet. Sürtünme kayıpları için gerçek değer ×0.85–0.90 alınır.',
      ornek: '6 bar basınç, Ø50 mm silindir: A = π × (0.025)² = 0.001963 m²  →  F = 600 000 × 0.001963 = 1178 N ≈ 120 kgf',
      ipucu: 'Geri vuruşta piston kolu nedeniyle alan küçülür, kuvvet azalır. Çift etkili silindirde her iki yönde hesap ayrı yapılır.'
    },
    {
      baslik: 'Pnömatik Hava Tüketimi',
      formul: 'Q = V_silindir × n × 60   (litre/dak)',
      semboller: 'Q = Debi (litre/dak, ANR)  ·  V_silindir = Bir çevrimdeki hacim (litre)  ·  n = Darbe sayısı (darbe/dak)',
      aciklama: 'Kompresör ve boru hattı boyutlaması için silindir hava tüketimini hesaplar. ANR: Atmosferik basınçta ölçüm.',
      ornek: 'Ø50 mm, 100 mm strok silindir, 20 darbe/dak: V ≈ 0.196 L  →  Q = 0.196 × 20 × 60 = 235 L/dak',
      ipucu: 'Pratikte hesaplanan değeri 1.5–2× büyüterek güvenlik payı bırakın. Boru kayıpları ve valf gecikmelerini hesaba katın.'
    },
    {
      baslik: 'Kapasitör Reaktansı',
      formul: 'X_C = 1 / (2 × π × f × C)',
      semboller: 'X_C = Kapasitif reaktans (Ω)  ·  f = Frekans (Hz)  ·  C = Kapasitans (Farad)  ·  π ≈ 3.14159',
      aciklama: 'AC devrelerde kondansatörün akıma karşı gösterdiği direnç. Frekans arttıkça reaktans azalır.',
      ornek: '50 Hz, 100 µF kondansatör: X_C = 1 / (2 × 3.14 × 50 × 0.0001) = 31.8 Ω',
      ipucu: 'Güç faktörü düzeltme kondansatöründe reaktif gücü hesaplamak için kullanılır: Q_C = V² / X_C'
    },
    {
      baslik: 'Transformatör Güç & Verim',
      formul: 'S = V₁ × I₁ = V₂ × I₂   (VA)   |   η = P_çıkış / P_giriş × 100 (%)',
      semboller: 'S = Görünür güç (VA)  ·  V₁, V₂ = Primer/sekonder gerilim  ·  I₁, I₂ = Primer/sekonder akım  ·  η = Verim',
      aciklama: 'İdeal transformatörde güç değişmez, sadece gerilim-akım oranı değişir. Gerçek transformatörde demir ve bakır kayıpları verimi düşürür.',
      ornek: '230V / 24V transformatör, 2A sekonder akım: S = 24 × 2 = 48 VA  →  Primer akım ≈ 48/230 = 0.21 A',
      ipucu: 'Kontrol trafosu seçerken PLC, röle bobinleri ve lambalar dahil tüm 24V AC yükleri toplayın, %20 pay bırakın.'
    },
    {
      baslik: 'Endüktif Reaktans',
      formul: 'X_L = 2 × π × f × L',
      semboller: 'X_L = Endüktif reaktans (Ω)  ·  f = Frekans (Hz)  ·  L = Endüktans (Henry)',
      aciklama: 'Motor ve transformatör sargıları endüktif yük oluşturur. Reaktans, akımı kısıtlar ve güç faktörünü düşürür.',
      ornek: '50 Hz, L=0.1 H: X_L = 2 × 3.14 × 50 × 0.1 = 31.4 Ω',
      ipucu: 'Motor bobininde X_L >> R olduğundan motor büyük oranda reaktif yük gibi davranır. cosφ düzeltme için kondansatör bağlanır.'
    }
  ];

  return `
<div class="dok-section">
  <h2 class="dok-section-title">Temel Formüller</h2>
  <p class="dok-section-desc">Endüstriyel otomasyon uygulamalarında sıklıkla kullanılan hesap formülleri. Her formül için sembol açıklaması ve gerçek saha örneği verilmiştir.</p>
  <div class="dok-formul-grid">
    ${formüller.map((f, i) => `
    <div class="dok-formul-kart">
      <div class="dok-formul-header">
        <span class="dok-formul-no">${String(i + 1).padStart(2, '0')}</span>
        <h3 class="dok-formul-baslik">${f.baslik}</h3>
      </div>
      <div class="dok-formul-denklem">${f.formul}</div>
      <div class="dok-formul-semboller"><span class="dok-label">Semboller:</span> ${f.semboller}</div>
      <p class="dok-formul-aciklama">${f.aciklama}</p>
      <div class="dok-formul-ornek"><span class="dok-label">Örnek:</span> ${f.ornek}</div>
      <div class="dok-formul-ipucu"><span class="dok-label">💡 Pratik:</span> ${f.ipucu}</div>
    </div>`).join('')}
  </div>
</div>`;
}

/* ================================================================
   BÖLÜM 2: TABLOLAR
   ================================================================ */
function renderTablosBolumu() {
  return `
<div class="dok-section">
  <h2 class="dok-section-title">Endüstri Referans Tabloları</h2>
  <p class="dok-section-desc">Saha uygulamalarında kullanılan standart değer tabloları. IEC/EN normlarına ve üretici katalog verilerine dayanmaktadır.</p>

  <!-- TABLO A: MOTOR AKIMLARI -->
  <div class="dok-tablo-blok">
    <h3 class="dok-tablo-baslik">Tablo A — Motor Nominal Akım ve Koruma Seçimi (400V, 3 Fazlı, cosφ=0.85)</h3>
    <div class="dok-tablo-scroll">
      <table class="dok-tablo">
        <thead>
          <tr>
            <th>Güç (kW)</th>
            <th>Nominal Akım (A)</th>
            <th>Termik Röle Ayarı (A)</th>
            <th>Sigorta (A)</th>
            <th>Kontaktör Sınıfı</th>
          </tr>
        </thead>
        <tbody>
          <tr><td>0.37</td><td>1.1</td><td>1.0 – 1.6</td><td>6</td><td>9A tip</td></tr>
          <tr><td>0.55</td><td>1.5</td><td>1.3 – 2.1</td><td>6</td><td>9A tip</td></tr>
          <tr><td>0.75</td><td>2.0</td><td>1.7 – 2.8</td><td>6</td><td>9A tip</td></tr>
          <tr><td>1.1</td><td>2.8</td><td>2.4 – 4.0</td><td>10</td><td>9A tip</td></tr>
          <tr><td>1.5</td><td>3.6</td><td>3.0 – 5.0</td><td>10</td><td>9A tip</td></tr>
          <tr><td>2.2</td><td>5.0</td><td>4.3 – 7.0</td><td>16</td><td>12A tip</td></tr>
          <tr><td>3.0</td><td>6.8</td><td>5.5 – 9.0</td><td>16</td><td>12A tip</td></tr>
          <tr><td>4.0</td><td>8.8</td><td>7.0 – 11</td><td>20</td><td>18A tip</td></tr>
          <tr><td>5.5</td><td>11.5</td><td>9.0 – 14</td><td>25</td><td>18A tip</td></tr>
          <tr><td>7.5</td><td>15.2</td><td>11 – 17</td><td>35</td><td>25A tip</td></tr>
          <tr><td>11</td><td>22</td><td>17 – 25</td><td>50</td><td>40A tip</td></tr>
          <tr><td>15</td><td>29</td><td>23 – 34</td><td>63</td><td>40A tip</td></tr>
          <tr><td>18.5</td><td>36</td><td>28 – 42</td><td>80</td><td>50A tip</td></tr>
          <tr><td>22</td><td>42</td><td>34 – 50</td><td>100</td><td>65A tip</td></tr>
          <tr><td>30</td><td>56</td><td>45 – 67</td><td>125</td><td>80A tip</td></tr>
          <tr><td>37</td><td>68</td><td>54 – 82</td><td>160</td><td>95A tip</td></tr>
          <tr><td>45</td><td>82</td><td>66 – 100</td><td>200</td><td>115A tip</td></tr>
          <tr><td>55</td><td>100</td><td>80 – 120</td><td>250</td><td>140A tip</td></tr>
          <tr><td>75</td><td>136</td><td>105 – 160</td><td>315</td><td>185A tip</td></tr>
          <tr><td>90</td><td>162</td><td>130 – 195</td><td>400</td><td>225A tip</td></tr>
        </tbody>
      </table>
    </div>
    <p class="dok-tablo-not">Not: Kalkış sırasında motor 5–7× nominal akım çeker. Motor sigortası (gM tipi) bu darbeye dayanıklı seçilmelidir.</p>
  </div>

  <!-- TABLO B: KABLO KESİT -->
  <div class="dok-tablo-blok">
    <h3 class="dok-tablo-baslik">Tablo B — Kablo Kesit Akım Kapasitesi (PVC İzoleli, Bakır, 30°C Ortam)</h3>
    <div class="dok-tablo-scroll">
      <table class="dok-tablo">
        <thead>
          <tr>
            <th>Kesit (mm²)</th>
            <th>Tek Damarlı — Havada (A)</th>
            <th>Çok Damarlı — Havada (A)</th>
            <th>Çok Damarlı — Kanalda (A)</th>
            <th>Kanal Katsayısı</th>
          </tr>
        </thead>
        <tbody>
          <tr><td>0.75</td><td>10</td><td>8</td><td>6</td><td>0.75</td></tr>
          <tr><td>1.0</td><td>14</td><td>11</td><td>9</td><td>0.82</td></tr>
          <tr><td>1.5</td><td>17</td><td>14</td><td>11</td><td>0.79</td></tr>
          <tr><td>2.5</td><td>24</td><td>18</td><td>15</td><td>0.83</td></tr>
          <tr><td>4.0</td><td>32</td><td>24</td><td>20</td><td>0.83</td></tr>
          <tr><td>6.0</td><td>40</td><td>30</td><td>25</td><td>0.83</td></tr>
          <tr><td>10</td><td>57</td><td>42</td><td>35</td><td>0.83</td></tr>
          <tr><td>16</td><td>76</td><td>56</td><td>47</td><td>0.84</td></tr>
          <tr><td>25</td><td>101</td><td>73</td><td>61</td><td>0.84</td></tr>
          <tr><td>35</td><td>125</td><td>90</td><td>75</td><td>0.83</td></tr>
          <tr><td>50</td><td>151</td><td>110</td><td>92</td><td>0.84</td></tr>
          <tr><td>70</td><td>192</td><td>139</td><td>116</td><td>0.83</td></tr>
          <tr><td>95</td><td>232</td><td>167</td><td>139</td><td>0.83</td></tr>
        </tbody>
      </table>
    </div>
    <p class="dok-tablo-not">Not: Değerler IEC 60364-5-52 bazlıdır. Kablo kanalında birden fazla kablo varsa gruplandırma katsayısı da uygulanır (0.70–0.85).</p>
  </div>

  <!-- TABLO C: KABLO RENK KODLARI -->
  <div class="dok-tablo-blok">
    <h3 class="dok-tablo-baslik">Tablo C — Kablo Renk Kodları (EN 60204-1 & HD 60364-5-51)</h3>
    <div class="dok-tablo-scroll">
      <table class="dok-tablo">
        <thead>
          <tr>
            <th>Renk</th>
            <th>Kullanım Alanı</th>
            <th>Ek Bilgi</th>
          </tr>
        </thead>
        <tbody>
          <tr><td><span class="dok-renk-kare" style="background:#e53935;"></span> Kırmızı</td><td>AC faz iletkenler (L1, L2, L3) — DC artı kutup (+)</td><td>Eski Alman normunda kahverengi yerine kırmızı kullanılırdı</td></tr>
          <tr><td><span class="dok-renk-kare" style="background:#1565c0;"></span> Mavi (Açık)</td><td>Nötr iletkeni (N) — DC eksi kutup (−)</td><td>Sadece nötr için, topraklama değil!</td></tr>
          <tr><td><span class="dok-renk-kare" style="background:linear-gradient(90deg,#f9a825 50%,#2e7d32 50%);"></span> Sarı-Yeşil</td><td>Koruma iletkeni (PE — Protective Earth)</td><td>Topraklama. Başka amaçla kesinlikle kullanılamaz</td></tr>
          <tr><td><span class="dok-renk-kare" style="background:#e65100;"></span> Turuncu</td><td>PLC / kontrol devre iletkenler (bazı yapımlarda)</td><td>Standart değil, üretici veya fabrika tercihi</td></tr>
          <tr><td><span class="dok-renk-kare" style="background:#757575;"></span> Gri</td><td>AC kumanda devreleri (230V veya 24V AC kontrol)</td><td>EN 60204-1 önerisi</td></tr>
          <tr><td><span class="dok-renk-kare" style="background:#f5f5f5;border:1px solid #555;"></span> Beyaz</td><td>DC kumanda devreleri pozitif iletkeni (+24V DC)</td><td>Bazı yapımlarda mavi DC− için, beyaz DC+ için</td></tr>
          <tr><td><span class="dok-renk-kare" style="background:#000;"></span> Siyah</td><td>AC güç faz iletkenler (bazı ülke normlarında)</td><td>UK ve Kuzey Amerika normu; Türkiye'de kahverengi/siyah karışık kullanılıyor</td></tr>
          <tr><td><span class="dok-renk-kare" style="background:#795548;"></span> Kahverengi</td><td>AC faz L1 (yeni Avrupa normunda)</td><td>IEC 60446 sonrası: Kahverengi=L1, Siyah=L2, Gri=L3</td></tr>
        </tbody>
      </table>
    </div>
  </div>

  <!-- TABLO D: IP KORUMA SINIFLARI -->
  <div class="dok-tablo-blok">
    <h3 class="dok-tablo-baslik">Tablo D — IP Koruma Sınıfları (EN 60529)</h3>
    <p class="dok-tablo-not" style="margin-bottom:10px">IP XX formatı: 1. rakam = Katı madde / toz koruması · 2. rakam = Su koruması</p>
    <div class="dok-tablo-scroll">
      <table class="dok-tablo">
        <thead>
          <tr>
            <th>IP Sınıfı</th>
            <th>1. Rakam — Katı Koruma</th>
            <th>2. Rakam — Su Koruma</th>
            <th>Tipik Uygulama</th>
          </tr>
        </thead>
        <tbody>
          <tr><td class="dok-highlight">IP 20</td><td>Parmak (>12mm)</td><td>Koruma yok</td><td>İç mekan elektrik panosu, MCC</td></tr>
          <tr><td class="dok-highlight">IP 44</td><td>Tel (>1mm)</td><td>Her yönden su sıçraması</td><td>Makine etrafı, bazı motor terminalleri</td></tr>
          <tr><td class="dok-highlight">IP 54</td><td>Toz korumalı</td><td>Her yönden su sıçraması</td><td>Saha panosu, açık havada montaj</td></tr>
          <tr><td class="dok-highlight">IP 55</td><td>Toz korumalı</td><td>Her yönden hortumla yıkama</td><td>Gıda sektörü, yıkama alanları</td></tr>
          <tr><td class="dok-highlight">IP 65</td><td>Tam toz geçirmez</td><td>Her yönden hortumla yıkama</td><td>Açık saha, sokak panoları, outdoor motor</td></tr>
          <tr><td class="dok-highlight">IP 66</td><td>Tam toz geçirmez</td><td>Kuvvetli hortum / dalgalar</td><td>Deniz kenarı, ağır hava şartları</td></tr>
          <tr><td class="dok-highlight">IP 67</td><td>Tam toz geçirmez</td><td>1 m derinlikte 30 dk batırma</td><td>Tarım makineleri, yer altı kurulumlar</td></tr>
          <tr><td class="dok-highlight">IP 68</td><td>Tam toz geçirmez</td><td>Sürekli su altı (belirtilen derinlik)</td><td>Denizaltı pompaları, su içi sensörler</td></tr>
          <tr><td class="dok-highlight">IP 69K</td><td>Tam toz geçirmez</td><td>Yüksek basınç sıcak su</td><td>Gıda & içecek sektörü yıkama hatları</td></tr>
        </tbody>
      </table>
    </div>
  </div>

  <!-- TABLO E: SİGORTA KARAKTERİSTİKLERİ -->
  <div class="dok-tablo-blok">
    <h3 class="dok-tablo-baslik">Tablo E — Sigorta ve Otomatik Sigorta Karakteristikleri</h3>
    <div class="dok-tablo-scroll">
      <table class="dok-tablo">
        <thead>
          <tr>
            <th>Tip / Karakteristik</th>
            <th>Anlık Devreye Girme (× In)</th>
            <th>Standart</th>
            <th>Tipik Uygulama</th>
          </tr>
        </thead>
        <tbody>
          <tr><td><strong>B</strong></td><td>3 – 5 × In</td><td>IEC 60898</td><td>Aydınlatma, rezistif yükler, ev tipi</td></tr>
          <tr><td><strong>C</strong></td><td>5 – 10 × In</td><td>IEC 60898</td><td>Genel endüstri, küçük motorlar, kumanda devreleri</td></tr>
          <tr><td><strong>D</strong></td><td>10 – 20 × In</td><td>IEC 60898</td><td>Büyük motorlar, transformatörler, yüksek kalkış akımlı yükler</td></tr>
          <tr><td><strong>gG</strong> (sarı)</td><td>Hızlı + yavaş kombinasyon</td><td>IEC 60269</td><td>Genel kablo koruma — en yaygın endüstriyel sigorta</td></tr>
          <tr><td><strong>gM</strong> (yeşil)</td><td>Motor kalkışına dayanıklı</td><td>IEC 60269</td><td>Motor koruma, döngüsel yükler</td></tr>
          <tr><td><strong>aM</strong></td><td>Yalnızca kısa devre (yavaş açılma yok)</td><td>IEC 60269</td><td>Motor + termik röle kombinasyonu ile</td></tr>
          <tr><td><strong>gR</strong> (ultra hızlı)</td><td>Çok hızlı, dar bant</td><td>IEC 60269</td><td>Yarı iletken koruma (VFD IGBT, diyot)</td></tr>
        </tbody>
      </table>
    </div>
  </div>

  <!-- TABLO F: KONTAKTÖR TERMİNAL NUMARALANDIRMA -->
  <div class="dok-tablo-blok">
    <h3 class="dok-tablo-baslik">Tablo F — Kontaktör Terminal Numaralandırması (EN 50005 / EN 50006)</h3>
    <div class="dok-tablo-scroll">
      <table class="dok-tablo">
        <thead>
          <tr>
            <th>Terminal No</th>
            <th>Devre Tipi</th>
            <th>Kontak Türü</th>
            <th>Tipik Kullanım</th>
          </tr>
        </thead>
        <tbody>
          <tr><td><strong>A1 – A2</strong></td><td>Bobin beslemesi</td><td>—</td><td>A1 = (+) veya faz, A2 = (−) veya nötr</td></tr>
          <tr><td><strong>1 – 2</strong></td><td>Ana kontak 1. faz</td><td>NO (Normalde Açık)</td><td>L1 → T1 yük bağlantısı</td></tr>
          <tr><td><strong>3 – 4</strong></td><td>Ana kontak 2. faz</td><td>NO</td><td>L2 → T2 yük bağlantısı</td></tr>
          <tr><td><strong>5 – 6</strong></td><td>Ana kontak 3. faz</td><td>NO</td><td>L3 → T3 yük bağlantısı</td></tr>
          <tr><td><strong>13 – 14</strong></td><td>Yardımcı kontak 1</td><td>NO</td><td>Mühürleme, çalışma lambası, sinyal</td></tr>
          <tr><td><strong>21 – 22</strong></td><td>Yardımcı kontak 2</td><td>NC (Normalde Kapalı)</td><td>Karşılıklı kilitleme (interlock)</td></tr>
          <tr><td><strong>23 – 24</strong></td><td>Yardımcı kontak 3</td><td>NO</td><td>Çalışma lambası, ikinci mühürleme</td></tr>
          <tr><td><strong>31 – 32</strong></td><td>Yardımcı kontak 4</td><td>NC</td><td>Ekstra kilit, alarm devresi</td></tr>
          <tr><td><strong>43 – 44</strong></td><td>Yardımcı kontak 5</td><td>NO</td><td>Ekstra sinyal, sayaç girişi</td></tr>
        </tbody>
      </table>
    </div>
    <p class="dok-tablo-not">Kural: Tek sayılar giriş (besleme), çift sayılar çıkış. 1–6 ana devre, 13+ yardımcı devre. NO kontak: çift onlarca (13-14, 23-24…), NC: 21-22, 31-32…</p>
  </div>

  <!-- TABLO G: TERMİK RÖLE TERMİNAL -->
  <div class="dok-tablo-blok">
    <h3 class="dok-tablo-baslik">Tablo G — Termik Röle Terminal Numaralandırması (EN 50005)</h3>
    <div class="dok-tablo-scroll">
      <table class="dok-tablo">
        <thead>
          <tr>
            <th>Terminal</th>
            <th>Devre</th>
            <th>Açıklama</th>
          </tr>
        </thead>
        <tbody>
          <tr><td><strong>1 – 2</strong></td><td>Ana devre A fazı (L1)</td><td>Kontaktörden gelen L1 bağlantısı</td></tr>
          <tr><td><strong>3 – 4</strong></td><td>Ana devre B fazı (L2)</td><td>Kontaktörden gelen L2 bağlantısı</td></tr>
          <tr><td><strong>5 – 6</strong></td><td>Ana devre C fazı (L3)</td><td>Kontaktörden gelen L3 bağlantısı</td></tr>
          <tr><td><strong>95 – 96</strong></td><td>Yardımcı NC kontağı</td><td>Stop devresi — aşırı akımda açılır → motor durur</td></tr>
          <tr><td><strong>97 – 98</strong></td><td>Yardımcı NO kontağı</td><td>Alarm/sinyal — aşırı akımda kapanır → lamba/alarm</td></tr>
          <tr><td><strong>RESET</strong></td><td>Manuel sıfırlama</td><td>Tetikleme sonrası manuel reset (veya AUTO pozisyonu)</td></tr>
        </tbody>
      </table>
    </div>
    <p class="dok-tablo-not">Stop devresinde: 95-96 (NC) kontağı start butonuyla seri bağlanır. Aşırı akımda kontaktör bobinini beslemesi kesilir.</p>
  </div>

  <!-- TABLO H: SİEMENS S7 PLC ADRES FORMATLARI -->
  <div class="dok-tablo-blok">
    <h3 class="dok-tablo-baslik">Tablo H — Siemens S7-300/400/1200/1500 PLC Adres Formatları</h3>
    <div class="dok-tablo-scroll">
      <table class="dok-tablo">
        <thead>
          <tr>
            <th>Adres Tipi</th>
            <th>Format</th>
            <th>Aralık</th>
            <th>Açıklama ve Örnek</th>
          </tr>
        </thead>
        <tbody>
          <tr><td>Dijital Giriş Biti</td><td><code>I X.Y</code></td><td>I0.0 – I127.7</td><td>Byte X, bit Y. I0.0 = 1. giriş kartı ilk bit</td></tr>
          <tr><td>Dijital Çıkış Biti</td><td><code>Q X.Y</code></td><td>Q0.0 – Q127.7</td><td>Q0.1 = 1. çıkış kartı 2. bit</td></tr>
          <tr><td>Bellek (Merker) Biti</td><td><code>M X.Y</code></td><td>M0.0 – M255.7</td><td>İç bellek biti. M1.0 = dahili bayrak</td></tr>
          <tr><td>Giriş Baytı</td><td><code>IB X</code></td><td>IB0 – IB127</td><td>8 bitlik giriş bloğu</td></tr>
          <tr><td>Çıkış Baytı</td><td><code>QB X</code></td><td>QB0 – QB127</td><td>8 bitlik çıkış bloğu</td></tr>
          <tr><td>Analog Giriş</td><td><code>IW XX</code></td><td>IW64, IW66…</td><td>16-bit word. IW64 = 1. analog kart 1. kanal</td></tr>
          <tr><td>Analog Çıkış</td><td><code>QW XX</code></td><td>QW64, QW66…</td><td>16-bit word. QW64 = 1. analog çıkış</td></tr>
          <tr><td>Veri Bloğu Biti</td><td><code>DB X.DBX Y.Z</code></td><td>—</td><td>DB1.DBX0.0 = Blok 1, byte 0, bit 0</td></tr>
          <tr><td>Veri Bloğu Word</td><td><code>DB X.DBW Y</code></td><td>—</td><td>DB2.DBW4 = Blok 2, 4. byte'tan word</td></tr>
          <tr><td>Veri Bloğu DWord</td><td><code>DB X.DBD Y</code></td><td>—</td><td>DB2.DBD4 = 32-bit çift word</td></tr>
          <tr><td>Timer</td><td><code>T X</code></td><td>T1 – T256</td><td>T1 = TON/TOF/TP zamanlayıcısı</td></tr>
          <tr><td>Sayaç</td><td><code>C X</code></td><td>C1 – C256</td><td>C1 = CTU/CTD/CTUD sayacı</td></tr>
        </tbody>
      </table>
    </div>
    <p class="dok-tablo-not">S7-1200/1500'de veri tipleri farklı: Bool, Int, DInt, Real, String, Array… TIA Portal'da "Add New Block" ile DB oluşturulur.</p>
  </div>

</div>`;
}

/* ================================================================
   BÖLÜM 3: STANDARTLAR
   ================================================================ */
function renderStandartlarBolumu() {
  const standartlar = [
    {
      kod: 'IEC 60617',
      baslik: 'Elektrik-Elektronik Devre Sembolleri',
      kapsam: 'Kontaktör, sigorta, motor, lamba, buton, röle, sensör ve tüm elektrik devre elemanlarının grafik sembollerini tanımlar.',
      onem: "Farklı ülkelerde çizilen şemaların evrensel olarak okunabilmesini sağlar. Türkiye'deki okullarda ve fabrikalarda kullanılan standart budur.",
      pratik: 'Devre şeması çizerken bu sembolleri kullan. Yanlış sembol → yanlış bakım → ciddi iş kazası riski.'
    },
    {
      kod: 'EN 50005 / EN 50006',
      baslik: 'Terminal Numaralandırma Standardı',
      kapsam: 'Kontaktör, termik röle, buton ve komuta elemanlarının terminal numaralandırma kurallarını belirler.',
      onem: 'Bakımda A1-A2 bobin, 1-2/3-4/5-6 ana kontak, 13-14 yardımcı NO bilinmezse devre çözülemez.',
      pratik: "Tablolar F ve G'ye bakın. Bu numaraları ezberleyin — sahada multimetre ile takip ederken hayat kurtarır."
    },
    {
      kod: 'EN 60204-1',
      baslik: 'Makinelerin Elektriksel Donanımı — Genel Kurallar',
      kapsam: 'Endüstriyel makinelerin elektrik donanımı için güvenlik gereksinimleri: topraklama, acil stop, kablo seçimi, kumanda devresi, etiketleme.',
      onem: 'Makine imalatçılarının CE işareti almak için zorunlu uygulaması gereken ana standarttır. Muayene ve kabul testleri bu standarda göre yapılır.',
      pratik: 'E-Stop kategorisi (CAT 0/1/2), güç kesme noktası konumu, lamba renkleri bu standartta tanımlanmıştır. Her elektrik teknisyeninin bilmesi zorunlu.'
    },
    {
      kod: 'EN 60947',
      baslik: 'Düşük Gerilim Şalterleri',
      kapsam: 'Kontaktörler (60947-4), termik röle ve motorkoruyucular (60947-4-1), sigorta pabuçları (60947-3), MCB otomatik sigortalar (60947-2) için performans gereksinimleri.',
      onem: 'Kontaktörün kaç çevrim ömrü olduğu (AC-3 kategorisi = 1 milyon), kısa devre dayanım kapasitesi (Icw), açma kapasitesi (Ics) bu standartla belirlenir.',
      pratik: 'Katalogda "AC-3: 1.000.000 op." yazıyorsa standart yüklü motor açma/kapama için 1 milyon çevrim ömrüdür. AC-4 jogging uygulamaları için çok daha az.'
    },
    {
      kod: 'IEC 61131-3',
      baslik: 'PLC Programlama Dilleri',
      kapsam: '5 programlama dili tanımlar: LAD (Ladder/Merdiven), FBD (Fonksiyon Blok), STL/IL (Deyim Listesi), SFC (Sıralı Fonksiyon Şeması), ST (Yapısal Metin).',
      onem: 'Siemens TIA Portal, Rockwell Studio 5000, Schneider EcoStruxure — hepsi bu standarda uyar. Bir üreticide öğrenilen mantık diğerine transfer edilebilir.',
      pratik: 'LAD grafik/görsel için iyidir, ST karmaşık algoritmalar için. Siemens\'te SCL = ST dilidir. LAD → STL dönüşümü TIA Portal\'da otomatik yapılabilir.'
    },
    {
      kod: 'ISO 1219',
      baslik: 'Akışkan Gücü Sistemleri — Semboller ve Devre Şemaları',
      kapsam: 'Pnömatik ve hidrolik sistem şemalarında kullanılan tüm elemanların (valf, silindir, kompresör, filtre, yağlayıcı) sembollerini tanımlar.',
      onem: 'Pnömatik devreyi bu sembollere göre okuyabilirseniz herhangi bir fabrikada sistemi anlayabilirsiniz.',
      pratik: '5/2 valf: 5 bağlantı, 2 pozisyon. 3/2 NC valf: normalde kapalı. Çift etkili silindir sembolünü tanıyın.'
    },
    {
      kod: 'EN ISO 13849-1',
      baslik: 'Makine Güvenliği — Güvenlikle İlgili Kontrol Sistemlerinin Tasarımı',
      kapsam: 'Makine güvenlik fonksiyonlarını tasarlamak için PLr (Gerekli Performans Seviyesi) ve Kategori (B, 1, 2, 3, 4) belirleme metodolojisi.',
      onem: 'E-Stop, güvenlik kapısı, iki elle kontrol gibi güvenlik fonksiyonlarının PLr hesabı bu standarda göre yapılır. CE belgesi için zorunlu.',
      pratik: 'PLr e (en yüksek): Pres, robot gibi ağır makineler. PLr c: Normal makine. Kategori 3-4: Tek arıza güvenlik fonksiyonunu yitirmemeli.'
    },
    {
      kod: 'IEC 61508',
      baslik: 'Fonksiyonel Güvenlik — Elektrik/Elektronik/Programlanabilir Elektronik Güvenlik Sistemleri',
      kapsam: 'SIL (Güvenlik Bütünlük Seviyesi) konseptini tanımlar. SIL 1 (en düşük) ile SIL 4 (en yüksek) arası 4 seviye.',
      onem: 'Petrokimya, enerji tesisleri ve kritik altyapılarda kullanılan güvenlik enstrümantasyon sistemlerinin (SIS) temel standardı.',
      pratik: 'SIL seviyesi = tehlike analizi (HAZOP, LOPA) sonucu belirlenir. SIL 2 için PFD < 10⁻³ (1000 talep başına 1 başarısızlık).'
    },
    {
      kod: 'EN 60529',
      baslik: 'IP Koruma Sınıfları — Kılıf Koruma Derecelendirmesi',
      kapsam: 'Katı madde (toz, parmak, tel) ve su (sıçrama, hortum, batırma) karşı koruma derecelerini iki rakamlı IP koduyla sınıflandırır.',
      onem: 'Yanlış IP seçimi = motor arızası, PLC hasarı, yangın riski. Gıda sektöründe IP 65-69K zorunlu.',
      pratik: 'Tablo D\'ye bakın. Dış mekan panolar minimum IP 54, yıkama alanları IP 65+, sulama sistemleri IP 67+ seçilmeli.'
    },
    {
      kod: 'IEC 60364',
      baslik: 'Düşük Gerilim Tesisatı Kurulumu',
      kapsam: 'Binalarda ve endüstriyel tesislerde 1000V altı elektrik tesisatı: topraklama sistemleri (TN-C, TN-S, TT, IT), kablo seçimi, devre koruması, kaçak akım.',
      onem: 'Topraklama sistemi yanlışsa kaçak akım rölesi çalışmayabilir. İnsan hayatı doğrudan etkilenir.',
      pratik: 'Endüstride TN-S topraklama sistemi tercih edilir. PE ve N ayrı yürütülür. Kaçak akım rölesi (RCD) 30 mA — insan hayatı koruması için zorunlu.'
    },
    {
      kod: 'MEGEP Modülleri',
      baslik: 'Türkiye MEB Mesleki Eğitim Modülleri — Elektrik-Elektronik',
      kapsam: 'Türkiye Milli Eğitim Bakanlığı\'nın hazırladığı mesleki eğitim içerikleri: Elektrik Kumanda Devreleri, PLC, Pnömatik ve Hidrolik, Ölçü Aletleri.',
      onem: 'Teknik liseler ve meslek yüksekokullarında öğretilen müfredat bu modüllere dayanır. MEGEP bilmek sınav ve stajda avantaj sağlar.',
      pratik: 'MEGEP modülleri MEB\'in web sitesinde ücretsiz PDF olarak mevcuttur. "Kumanda Devreleri" ve "PLC Programlama" modülleri en önemli olanlarıdır.'
    },
    {
      kod: 'TSE (Türk Standartları)',
      baslik: 'Türk Standartları Enstitüsü — Yerli Uygulamalar',
      kapsam: 'Uluslararası IEC/EN standartlarının Türkiye\'ye uyarlanmış halleri. Çoğu IEC standardı birebir TS numarasıyla kabul edilir (ör: TS EN 60204-1).',
      onem: 'Türkiye\'de satılan ve üretilen ekipmanların TSE belgesi veya CE işareti taşıması zorunludur. Devlet ihaleleri TSE şartı içerebilir.',
      pratik: 'TSE belgeli ürün = Türkiye için uygunluk belgesi. CE işareti = AB piyasası için. İkisi birden varsa her iki pazara uygun demektir.'
    }
  ];

  return `
<div class="dok-section">
  <h2 class="dok-section-title">Endüstriyel Otomasyon Standartları</h2>
  <p class="dok-section-desc">Saha çalışanının bilmesi gereken temel IEC, EN ve ulusal standartlar. Her standart için pratik uygulama ipuçları verilmiştir.</p>
  <div class="dok-standart-grid">
    ${standartlar.map(s => `
    <div class="dok-standart-kart">
      <div class="dok-standart-header">
        <span class="dok-standart-kod">${s.kod}</span>
        <h3 class="dok-standart-baslik">${s.baslik}</h3>
      </div>
      <div class="dok-standart-row"><span class="dok-label">Kapsam:</span> <span>${s.kapsam}</span></div>
      <div class="dok-standart-row"><span class="dok-label">Neden önemli:</span> <span>${s.onem}</span></div>
      <div class="dok-standart-row pratik"><span class="dok-label">🔧 Pratik:</span> <span>${s.pratik}</span></div>
    </div>`).join('')}
  </div>
</div>`;
}

/* ================================================================
   BÖLÜM 4: SÖZLÜK
   ================================================================ */
const DOK_SOZLUK_DATA = [
  { tr: 'Kontaktör', en: 'Contactor', de: 'Schütz', aciklama: 'Bobinle çalışan elektromanyetik güç anahtarı. Motor, ısıtıcı gibi büyük yükleri küçük kontrol sinyaliyle açıp kapar.' },
  { tr: 'Termik Röle', en: 'Thermal Overload Relay', de: 'Thermisches Relais', aciklama: 'Motor aşırı akım koruma elemanı. Bimetal şerit ısınarak açılır, motoru durduran kontağı tetikler. Ayarlı aralık: 0.85–1.25× nominal akım.' },
  { tr: 'Frekans İnvertörü', en: 'Frequency Inverter / VFD', de: 'Frequenzumrichter', aciklama: 'AC motor hız kontrol cihazı. Giriş 50Hz şebekeyi alır, çıkışta ayarlanan frekansta 0–400Hz çıkış üretir. Enerji tasarrufu, yumuşak kalkış sağlar.' },
  { tr: 'Servo Sürücü', en: 'Servo Drive', de: 'Servoantrieb', aciklama: 'Hassas konum, hız ve tork kontrolü için kullanılan sürücü sistemi. Servo motor + enkoder + sürücü kombinasyonu ile kapalı çevrim (closed-loop) kontrol yapılır.' },
  { tr: 'Sigorta', en: 'Fuse', de: 'Sicherung', aciklama: 'Kısa devre ve aşırı akıma karşı tek kullanımlık koruma elemanı. Açıldıktan sonra değiştirilmesi gerekir, reset edilemez.' },
  { tr: 'Otomatik Sigorta', en: 'MCB — Miniature Circuit Breaker', de: 'Leitungsschutzschalter', aciklama: 'Resetlenebilir otomatik sigorta. Aşırı akımda veya kısa devrde açılır, elle kapatılarak sıfırlanabilir. B, C, D karakteristik seçenekleri.' },
  { tr: 'Kaçak Akım Rölesi', en: 'RCD / RCCB / GFCI', de: 'FI-Schutzschalter / Fehlerstromschutzschalter', aciklama: '30 mA eşiğinde faz-nötr akım farkını tespit ederek devresi açar. İnsan hayatını elektrik çarpmalarına karşı korur.' },
  { tr: 'PLC', en: 'Programmable Logic Controller', de: 'SPS (Speicherprogrammierbare Steuerung)', aciklama: 'Programlanabilir mantıksal kontrolör. Dijital/analog giriş-çıkışları okuyarak kullanıcı programını çalıştırır, endüstriyel otomasyon kontrol sistemidir.' },
  { tr: 'HMI', en: 'Human Machine Interface', de: 'Mensch-Maschine-Interface (MMI)', aciklama: 'Operatör ile makine arasındaki görsel arayüz. Dokunmatik ekran, animasyonlu süreç gösterimi, alarm yönetimi, trend grafikleri içerir.' },
  { tr: 'SCADA', en: 'Supervisory Control and Data Acquisition', de: 'SCADA', aciklama: 'Merkezi izleme ve kontrol sistemi. Birden fazla PLC/RTU\'dan veri toplar, geniş alanlı prosesleri (fabrika, boru hattı, enerji şebekesi) yönetir.' },
  { tr: 'Endüktif Sensör', en: 'Inductive Proximity Sensor', de: 'Induktiver Sensor', aciklama: 'Metal cisimleri temasız algılar. Elektromanyetik alan oluşturur, metalin bu alana girmesiyle çıkış tetiklenir. Plastik, ahşap ve sıvıları algılamaz.' },
  { tr: 'Kapasitif Sensör', en: 'Capacitive Proximity Sensor', de: 'Kapazitiver Sensor', aciklama: 'Metal dahil tüm malzemeleri algılar. Elektrik alanındaki kapasite değişimine duyarlıdır. Plastik kap içindeki sıvı seviyesi tespitinde kullanılır.' },
  { tr: 'Optik Sensör', en: 'Photoelectric Sensor', de: 'Lichtschranke / Optischer Sensor', aciklama: 'Işık huzmesi ile nesne algılama. Üç tip: Karşılıklı (through-beam), yansımalı (retroreflective), difüz (diffuse). Uzun mesafe için karşılıklı tip.' },
  { tr: 'Enkoder', en: 'Encoder / Rotary Encoder', de: 'Drehgeber / Encoder', aciklama: 'Döner mil pozisyonu veya hızını elektrik sinyaline dönüştürür. Artımsal (incremental): A/B/Z puls. Mutlak (absolute): Her pozisyon benzersiz kod.' },
  { tr: 'Aktüatör', en: 'Actuator', de: 'Aktuator', aciklama: 'Kontrol sinyalini fiziksel harekete çeviren eleman. Elektrik motorları, pnömatik silindirler, solenoid valfler, piezoelektrik elemanlar aktüatör örnekleridir.' },
  { tr: 'Pnömatik Valf', en: 'Pneumatic Directional Control Valve', de: 'Pneumatisches Ventil / Wegeventil', aciklama: 'Basınçlı havayı yönlendiren valf. 5/2 = 5 bağlantı noktası, 2 konum. Solenoid (elektrik), pnömatik pilot veya manuel kumandalı olabilir.' },
  { tr: 'Pnömatik Silindir', en: 'Pneumatic Cylinder / Actuator', de: 'Pneumatikzylinder', aciklama: 'Basınçlı havayı doğrusal harekete çeviren eleman. Tek etkili (yay geri dönüşlü) veya çift etkili (her iki yönde basınçlı) tipleri vardır.' },
  { tr: 'FRL Ünitesi', en: 'FRL Unit — Filter, Regulator, Lubricator', de: 'Wartungseinheit (Filter-Druckregler-Öler)', aciklama: 'Pnömatik sistem başında hava bakım grubu: Filtre (su/kir), basınç regülatörü ve yağlayıcı. Sistemi uzun ömürlü tutar.' },
  { tr: 'Redüktör', en: 'Gearbox / Speed Reducer', de: 'Getriebe / Untersetzungsgetriebe', aciklama: 'Motor çıkış devrini düşürüp torku artıran güç aktarım mekanizması. Çevrim oranı (i) = giriş devri / çıkış devri. Yaygın tipler: Helical, sonsuz vida, konik.' },
  { tr: 'Mühürleme', en: 'Latching / Self-holding Circuit', de: 'Selbsthaltung', aciklama: 'Kontaktörün kendi NO kontağını kullanarak start butonunu bypass etmesi. Buton bırakıldıktan sonra kontaktör kendi kendini besler ve çalışır kalır.' },
  { tr: 'Karşılıklı Kilitleme', en: 'Electrical Interlock / Mutual Interlock', de: 'Verriegelung', aciklama: 'İleri-geri veya yıldız-üçgen gibi birbirini dışlayan devreler aynı anda çalışmasın diye kullanılan NC kontak bağlantısı.' },
  { tr: 'Acil Stop', en: 'Emergency Stop / E-Stop', de: 'Not-Aus', aciklama: 'Kırmızı mantar başlıklı güvenlik butonu. EN 60204-1\'e göre kilitlenebilir (kilit açılmadan reset edilemez). Kategori 0: anlık güç kesme. Kategori 1: kontrollü durdurma.' },
  { tr: 'Güvenlik Rölesi', en: 'Safety Relay Module', de: 'Sicherheitsrelais', aciklama: 'Acil stop, güvenlik kapısı, iki elle kontrol gibi güvenlik fonksiyonlarını işleyen özel röle. İç çift kanal + çapraz izleme ile tek arıza güvenliği bozmamalı.' },
  { tr: 'LOTO', en: 'Lockout / Tagout', de: 'Energieisolierung / Freischalten', aciklama: 'Bakım sırasında enerji kaynaklarını (elektrik, pnömatik, hidrolik) kilitleme ve etiketleme prosedürü. Yanlış müdahaleden kaynaklanan kazaları önler.' },
  { tr: 'Yıldız-Üçgen Kalkış', en: 'Star-Delta Starter (Y/Δ)', de: 'Stern-Dreieck-Anlauf', aciklama: 'Motor kalkışını yumuşatmak için önce yıldız (Y) bağlantıda düşük gerilimle, ardından belirli süre sonra üçgen (Δ) bağlantıya geçerek tam güçte çalıştırma yöntemi.' },
  { tr: 'Softstarter', en: 'Soft Starter / Solid-State Reduced Voltage Starter', de: 'Sanftanlasser', aciklama: 'Elektronik (tristör tabanlı) yumuşak kalkış cihazı. Rampa süresiyle gerilimi yavaş artırır, mekanik ve elektriksel darbeleri azaltır. VFD\'den ucuz ama hız kontrolü yok.' },
  { tr: 'VFD', en: 'Variable Frequency Drive / Inverter Drive', de: 'Frequenzumrichter', aciklama: 'AC motor hız değiştirici. 0–400 Hz aralığında çıkış frekansı ayarlanabilir. Pompa, fan, konveyör uygulamalarında enerji tasarrufu sağlar. Tipik tasarruf: %30–50.' },
  { tr: 'Modbus', en: 'Modbus RTU / TCP', de: 'Modbus', aciklama: 'Açık kaynak seri haberleşme protokolü. RTU: RS-485 üzerinde, TCP: Ethernet üzerinde çalışır. Master/Slave mimarisi. Çok geniş ekipman desteği.' },
  { tr: 'Profibus DP', en: 'Profibus DP (Decentralized Peripherals)', de: 'Profibus DP', aciklama: 'Siemens\'in geliştirdiği, endüstriyel saha veri yolu. RS-485 tabanlı, 12 Mbps hıza kadar. Eski SIMATIC sistemlerinde yaygın; yeni sistemlerde Profinet tercih ediliyor.' },
  { tr: 'Profinet', en: 'Profinet (Process Field Net)', de: 'Profinet', aciklama: 'Siemens\'in Ethernet tabanlı endüstriyel ağ standardı. 100 Mbps, deterministik (IRT moduyla). TIA Portal ile S7-1200/1500 ve ET200 için standart protokol.' },
  { tr: 'EtherNet/IP', en: 'EtherNet/IP', de: 'EtherNet/IP', aciklama: 'Rockwell Automation (Allen-Bradley) ve ODVA destekli Ethernet tabanlı endüstriyel protokol. CIP (Common Industrial Protocol) katmanı üzerinde çalışır.' },
  { tr: 'IO-Link', en: 'IO-Link', de: 'IO-Link', aciklama: 'Akıllı sensör ve aktüatörler için noktadan noktaya (point-to-point) standart iletişim arayüzü. Parametre yazma, teşhis, cihaz kimliği özellikleri sunar.' },
  { tr: 'AS-Interface', en: 'AS-Interface (Actuator-Sensor-Interface)', de: 'AS-Interface', aciklama: 'Sensör ve aktüatörleri düz kablo üzerinden ağa bağlayan basit alan veri yolu. 31 slave, 4 bit giriş + 4 bit çıkış. Yüksük kesitli sarı kablo ile kolayca kurulur.' },
  { tr: 'DIN Rayı', en: 'DIN Rail (35mm Top Hat Rail)', de: 'Hutschiene', aciklama: '35mm genişliğindeki standart metal ray. Kontaktör, termik röle, MCB, PLC, güç kaynağı gibi tüm modüler ekipmanlar bu raya klips ile monte edilir.' },
  { tr: 'Kablo Kanalı', en: 'Cable Duct / Cable Trunking / Wireway', de: 'Kabelkanal', aciklama: 'Pano içindeki kabloları toplu ve düzenli taşıyan plastik veya metal kanal. Slot\'lu tasarım kablo çıkışına olanak tanır. 25×25 mm\'den 100×100 mm\'ye kadar.' },
  { tr: 'Topraklama', en: 'Grounding / Protective Earthing', de: 'Erdung / Schutzleiter', aciklama: 'Metal gövdelerin PE (koruma) iletkeniyle toprak potansiyeline bağlanması. İnsan güvenliği için kritik. Yeşil-sarı renk kodu ile tanımlanır.' },
  { tr: 'Kısa Devre', en: 'Short Circuit', de: 'Kurzschluss', aciklama: 'Faz ve nötr iletkenlerinin dirençsiz şekilde temas etmesi. Aşırı akım (kA düzeyi) ve ısı üretimi oluşur. Sigorta veya MCB devreyi korumak için açılır.' },
  { tr: 'Aşırı Yük', en: 'Overload', de: 'Überlast', aciklama: 'Ekipmanın nominal akımını aşan sürekli yük durumu. Kısa devre değil, ama yeterince uzun sürede ciddi ısınma ve hasar oluşturur. Termik röle tarafından korunur.' },
  { tr: 'Kalkış Akımı', en: 'Inrush Current / Starting Current', de: 'Anlaufstrom / Einschaltstrom', aciklama: 'Motor ilk çalıştırıldığında çekilen kısa süreli aşırı akım. Tipik olarak nominal akımın 5–7 katıdır. 1–3 saniye sürer. Motor sigortası ve termik röle bu darbeye dayanıklı seçilmeli.' },
  { tr: 'Güç Faktörü', en: 'Power Factor (cosφ)', de: 'Leistungsfaktor (cosφ)', aciklama: 'Aktif güç ile görünür güç oranı (P/S). cosφ = 1 saf rezistif yük, cosφ < 1 reaktif yük (motor, bobin). Düşük cosφ şebeke verimsizliği ve para cezası getirebilir.' },
  { tr: 'Reaktif Güç', en: 'Reactive Power (VAR)', de: 'Blindleistung', aciklama: 'Motor ve transformatör sargılarında depolanan ve şebekeye iade edilen güç. Watt olarak ölçülmez, VAR (Volt-Amper Reaktif) olarak ölçülür. Kondansatör bankasıyla kompanse edilir.' },
  { tr: 'IE Verimlilik Sınıfı', en: 'IE Efficiency Class (International Efficiency)', de: 'IE-Wirkungsgradklasse', aciklama: 'AC indüksiyon motorları için IEC 60034-30-1 verimlilik sınıflandırması. IE1 (standart) < IE2 (yüksek) < IE3 (premium) < IE4 (süper premium) < IE5. Türkiye\'de 0.75 kW üstü yeni motorlarda IE3 zorunludur.' },
  { tr: 'Konveyör', en: 'Conveyor Belt / Conveyor System', de: 'Förderband / Förderanlage', aciklama: 'Malzeme taşıma bandı sistemi. Motorlu tahrik, gergi sistemi, bant veya zincir mekanizması içerir. Hız ve moment hesabı kritiktir.' },
  { tr: 'PLr', en: 'Performance Level required (PLr)', de: 'Erforderlicher Performance Level', aciklama: 'EN ISO 13849-1\'de tehlike analizine göre belirlenen gerekli güvenlik performans seviyesi. PLr a (en düşük) – PLr e (en yüksek) şeklinde beş seviye.' },
  { tr: 'SIL', en: 'Safety Integrity Level', de: 'Sicherheits-Integritätslevel', aciklama: 'IEC 61508\'de tanımlanan fonksiyonel güvenlik seviyesi. SIL 1 (talep başına 0.1–1% başarısızlık) ile SIL 4 (0.00001–0.0001%) arasında dört seviye.' },
  { tr: 'RTD / PT100', en: 'RTD — Resistance Temperature Detector', de: 'Widerstandsthermometer / PT100', aciklama: 'Platinyum tel direncinin sıcaklıkla değişimini kullanan sıcaklık sensörü. 0°C\'de 100 Ω direnç = PT100. Hassas, geniş aralık (-200°C ile +850°C). Termokupleden daha doğru.' },
  { tr: 'Termokupl', en: 'Thermocouple', de: 'Thermoelement', aciklama: 'İki farklı metal birleşiminde ısı farkından elektrik gerilimi üreten sıcaklık sensörü. J tipi (0–750°C) ve K tipi (-200°C ile +1260°C) yaygındır. Ucuz, sağlam ama PT100\'den az hassas.' },
  { tr: 'Basınç Transmitteri', en: 'Pressure Transmitter', de: 'Drucktransmitter / Druckumformer', aciklama: 'Basıncı 4-20 mA veya 0-10V sinyal olarak PLC/SCADA\'ya iletir. 4 mA = alt ölçüm sınırı, 20 mA = üst sınır. Kablo kopması 4 mA altına düşer, tespit edilebilir.' },
  { tr: 'Akış Ölçer', en: 'Flow Meter', de: 'Durchflussmesser', aciklama: 'Sıvı veya gaz akış hızını/debisini ölçer. Tipler: manyetik (iletken sıvı), vortex, ultrasonik (temasız), coriolis (yoğunluk + debi). Çıkış genellikle 4-20 mA veya Modbus.' },
  { tr: 'Solenoid Valf', en: 'Solenoid Valve', de: 'Magnetventil', aciklama: 'Elektromanyetik bobinle açılan/kapanan valf. Normalde kapalı (NC) veya normalde açık (NO) tipleri. Pnömatik ve hidrolik sistemlerde yaygın, otomasyon için ideal.' },
  { tr: 'Sinyal İzolasyon Modülü', en: 'Signal Isolator / Barrier', de: 'Signaltrennverstärker / Trennbarriere', aciklama: 'Farklı potansiyeldeki devreler arasında galvanik izolasyon sağlar. ATEX bölgelerinde güvenlik bariyeri olarak kullanılır. 4-20 mA sinyalleri izole ederek iletir.' }
];

function renderSozlukBolumu() {
  const satirlar = DOK_SOZLUK_DATA
    .slice()
    .sort((a, b) => a.tr.localeCompare(b.tr, 'tr'))
    .map(t => `
    <div class="dok-sozluk-kart" data-search="${(t.tr + ' ' + t.en + ' ' + t.de + ' ' + t.aciklama).toLowerCase()}">
      <div class="dok-sozluk-baslik">
        <span class="dok-sozluk-tr">${t.tr}</span>
        <span class="dok-sozluk-ayrac">·</span>
        <span class="dok-sozluk-en">${t.en}</span>
        <span class="dok-sozluk-ayrac">·</span>
        <span class="dok-sozluk-de">${t.de}</span>
      </div>
      <p class="dok-sozluk-aciklama">${t.aciklama}</p>
    </div>`).join('');

  return `
<div class="dok-section">
  <h2 class="dok-section-title">Teknik Terimler Sözlüğü</h2>
  <p class="dok-section-desc">Endüstriyel otomasyon alanında kullanılan terimlerin Türkçe, İngilizce ve Almanca karşılıkları. ${DOK_SOZLUK_DATA.length} terim, alfabetik sıralı.</p>
  <div class="dok-sozluk-arama">
    <input
      type="text"
      id="sozlukArama"
      class="dok-arama-input"
      placeholder="Türkçe, İngilizce veya Almanca ara…"
      autocomplete="off"
      spellcheck="false"
    >
    <span class="dok-arama-sonuc" id="sozlukSonuc">${DOK_SOZLUK_DATA.length} terim</span>
  </div>
  <div class="dok-sozluk-liste" id="sozlukListe">
    ${satirlar}
  </div>
</div>`;
}

function _dokBindSozlukSearch() {
  const input = document.getElementById('sozlukArama');
  const liste = document.getElementById('sozlukListe');
  const sonuc = document.getElementById('sozlukSonuc');
  if (!input || !liste) return;

  input.addEventListener('input', () => {
    const q = input.value.trim().toLowerCase();
    const kartlar = liste.querySelectorAll('.dok-sozluk-kart');
    let gorununen = 0;
    kartlar.forEach(kart => {
      const eslesti = !q || kart.dataset.search.includes(q);
      kart.style.display = eslesti ? '' : 'none';
      if (eslesti) gorununen++;
    });
    if (sonuc) sonuc.textContent = q ? `${gorununen} sonuç` : `${DOK_SOZLUK_DATA.length} terim`;
  });

  input.focus();
}

/* ================================================================
   BÖLÜM 5: HIZLI REFERANS
   ================================================================ */
function renderHizliRefBolumu() {
  return `
<div class="dok-section">
  <h2 class="dok-section-title">Hızlı Referans Kartları</h2>
  <p class="dok-section-desc">Sahada hızlıca bakılan renk kodları, ayar formülleri ve parametre referansları.</p>

  <div class="dok-hizli-grid">

    <!-- LAMBA RENK KODLARI -->
    <div class="dok-hizli-kart">
      <h3 class="dok-hizli-baslik">Pilot Lamba Renk Kodları <span class="dok-std">EN 60204-1 Tablo 2</span></h3>
      <table class="dok-tablo">
        <thead>
          <tr><th>Renk</th><th>Anlam</th><th>Örnek Kullanım</th></tr>
        </thead>
        <tbody>
          <tr><td><span class="dok-renk-kare" style="background:#e53935;"></span> Kırmızı</td><td>Tehlike / Acil durum</td><td>Motor arızası, aşırı ısı, acil stop devrede</td></tr>
          <tr><td><span class="dok-renk-kare" style="background:#f5b301;"></span> Sarı/Amber</td><td>Uyarı / Dikkat gerektiren durum</td><td>Sınır değer aşımı, bakım gerekiyor, uyarı</td></tr>
          <tr><td><span class="dok-renk-kare" style="background:#27d07a;"></span> Yeşil</td><td>Normal / Güvenli / Çalışıyor</td><td>Motor çalışıyor, makine hazır, proses normal</td></tr>
          <tr><td><span class="dok-renk-kare" style="background:#3aa0ff;"></span> Mavi</td><td>Zorunlu eylem / Bilgi</td><td>Operatör müdahalesi gerekiyor</td></tr>
          <tr><td><span class="dok-renk-kare" style="background:#f5f5f5;border:1px solid #555;"></span> Beyaz</td><td>Nötr / Genel güç</td><td>Güç var, kumanda gerilimi hazır</td></tr>
        </tbody>
      </table>
    </div>

    <!-- BUTON RENK KODLARI -->
    <div class="dok-hizli-kart">
      <h3 class="dok-hizli-baslik">Buton Renk Kodları <span class="dok-std">EN 60204-1 Tablo 3</span></h3>
      <table class="dok-tablo">
        <thead>
          <tr><th>Renk</th><th>Fonksiyon</th><th>Kullanım</th></tr>
        </thead>
        <tbody>
          <tr><td><span class="dok-renk-kare" style="background:#e53935;"></span> Kırmızı</td><td>Durdur / Kapat / Enerji kes</td><td>Stop butonu, acil durdurma, alarm sıfırla</td></tr>
          <tr><td><span class="dok-renk-kare" style="background:#27d07a;"></span> Yeşil</td><td>Başlat / Çalıştır / Aç</td><td>Start butonu, motor çalıştır, valf aç</td></tr>
          <tr><td><span class="dok-renk-kare" style="background:#f5b301;"></span> Sarı</td><td>İptal / Geri dön</td><td>Çevrim iptal, adım geri al</td></tr>
          <tr><td><span class="dok-renk-kare" style="background:#3aa0ff;"></span> Mavi</td><td>Zorunlu eylem</td><td>Onay, parametre kaydet, reset (zorunlu)</td></tr>
          <tr><td><span class="dok-renk-kare" style="background:#f5f5f5;border:1px solid #555;"></span> Siyah/Beyaz/Gri</td><td>Genel amaç</td><td>Belirli renk ataması olmayan fonksiyonlar</td></tr>
        </tbody>
      </table>
      <p class="dok-tablo-not">Uyarı: Kırmızı buton = DURDUR, Kırmızı lamba = TEHLİKE. Karıştırmayın. Acil stop butonu her zaman kırmızı, mantar başlı ve kilitleme özellikli olmalıdır.</p>
    </div>

    <!-- TERMİK RÖLE AYAR -->
    <div class="dok-hizli-kart">
      <h3 class="dok-hizli-baslik">Termik Röle Ayar Formülü</h3>
      <div class="dok-formul-denklem" style="margin:12px 0">I_ayar = I_nominal × (1.00 – 1.15)</div>
      <p>Motor nameplate\'inde yazan nominal akımın %100–115\'i arasında ayarlanır. Sıcak ortamda, sık start-stop durumunda düşük (%100) ayarlanır.</p>
      <table class="dok-tablo" style="margin-top:12px">
        <thead><tr><th>Motor (kW)</th><th>I_nom (A)</th><th>Termik Ayar Önerisi (A)</th></tr></thead>
        <tbody>
          <tr><td>1.5</td><td>3.6</td><td>3.6 – 4.0</td></tr>
          <tr><td>4.0</td><td>8.8</td><td>8.8 – 9.5</td></tr>
          <tr><td>7.5</td><td>15.2</td><td>15.2 – 16.5</td></tr>
          <tr><td>11</td><td>22</td><td>22.0 – 24.0</td></tr>
          <tr><td>22</td><td>42</td><td>42.0 – 46.0</td></tr>
        </tbody>
      </table>
      <p class="dok-tablo-not">Termik röle üçgen bağlı yıldız-üçgen starter sonrasındaysa akım: I_termik = I_hat / √3 ≈ 0.577 × I_hat ile ayarlanır.</p>
    </div>

    <!-- VFD TEMEL PARAMETRELERİ -->
    <div class="dok-hizli-kart">
      <h3 class="dok-hizli-baslik">VFD Temel Parametre Referansı <span class="dok-std">Siemens MICROMASTER / G120</span></h3>
      <table class="dok-tablo">
        <thead>
          <tr><th>Parametre</th><th>Açıklama</th><th>Tipik Değer</th></tr>
        </thead>
        <tbody>
          <tr><td><code>P0010</code></td><td>Hızlı devreye alma modu</td><td>1 (aktif), 0 (deaktif)</td></tr>
          <tr><td><code>P0100</code></td><td>Frekans/Güç standardı</td><td>0 = 50Hz/kW (Avrupa), 1 = 60Hz/hp</td></tr>
          <tr><td><code>P0304</code></td><td>Motor nominal gerilimi (V)</td><td>Nameplate'ten: 230 veya 400</td></tr>
          <tr><td><code>P0305</code></td><td>Motor nominal akımı (A)</td><td>Nameplate'ten: ör. 22.0</td></tr>
          <tr><td><code>P0307</code></td><td>Motor nominal gücü (kW)</td><td>Nameplate'ten: ör. 11.0</td></tr>
          <tr><td><code>P0310</code></td><td>Motor nominal frekansı (Hz)</td><td>50 (Türkiye/Avrupa)</td></tr>
          <tr><td><code>P0311</code></td><td>Motor nominal devri (dev/dak)</td><td>Nameplate'ten: ör. 1450</td></tr>
          <tr><td><code>P1080</code></td><td>Minimum frekans (Hz)</td><td>0 – 10 Hz (uygulama)</td></tr>
          <tr><td><code>P1082</code></td><td>Maksimum frekans (Hz)</td><td>50 – 60 Hz (standart), 80+ (özel)</td></tr>
          <tr><td><code>P1120</code></td><td>Rampa hızlanma süresi (s)</td><td>5 – 30 s (uygulama)</td></tr>
          <tr><td><code>P1121</code></td><td>Rampa yavaşlama süresi (s)</td><td>5 – 30 s (uygulama)</td></tr>
          <tr><td><code>P1300</code></td><td>Kontrol modu</td><td>0 = V/f lineer, 20 = Vektör (sensörsüz)</td></tr>
        </tbody>
      </table>
      <p class="dok-tablo-not">Parametre numaraları Siemens G120/MICROMASTER 440 için verilmiştir. ABB ACS580, Schneider Altivar, Yaskawa için benzer parametreler farklı numarada olabilir.</p>
    </div>

    <!-- GÜVENLİK DEVRE KOŞULLARI -->
    <div class="dok-hizli-kart">
      <h3 class="dok-hizli-baslik">E-Stop Durdurma Kategorileri <span class="dok-std">EN 60204-1 Madde 9.2.2</span></h3>
      <table class="dok-tablo">
        <thead>
          <tr><th>Kategori</th><th>Durdurma Yöntemi</th><th>Güç Kesme</th><th>Uygulama</th></tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>CAT 0</strong></td>
            <td>Anlık kontrol kesme</td>
            <td>Hemen (kontaktör açılır)</td>
            <td>Konveyör, fan, pompa — mekanik durma önemli değil</td>
          </tr>
          <tr>
            <td><strong>CAT 1</strong></td>
            <td>Kontrollü durdur, sonra kes</td>
            <td>Makine durunca kesilir</td>
            <td>Robot, CNC — pozisyonlu durdurma gerekli</td>
          </tr>
          <tr>
            <td><strong>CAT 2</strong></td>
            <td>Kontrollü durdur, güç kalır</td>
            <td>Kesilmez (servo tutar)</td>
            <td>Tutma momenti gereken uygulamalar</td>
          </tr>
        </tbody>
      </table>
      <p class="dok-tablo-not">CAT 0 en yaygın. Güvenlik rölesi (PILZ, Siemens 3TK, Schmersal) kullanılıyorsa PLr d veya e için çift kanal + çapraz izleme zorunlu.</p>
    </div>

    <!-- KABLO KESİT HIZLI SEÇİM -->
    <div class="dok-hizli-kart">
      <h3 class="dok-hizli-baslik">Kablo Kesit Hızlı Seçim Kuralı</h3>
      <div class="dok-formul-denklem" style="margin:12px 0">A ≥ I_nominal / k_derating</div>
      <p>Pratik kablo seçim adımları:</p>
      <ol class="dok-liste">
        <li>Motor nominal akımını belirle (nameplate veya Tablo A)</li>
        <li>Kablo döşeme tipine göre tablo değerini bul (Tablo B)</li>
        <li>Ortam sıcaklığı 30°C üzerindeyse katsayı uygula (40°C için 0.87, 50°C için 0.71)</li>
        <li>Aynı kanalda 4+ kablo varsa gruplandırma katsayısı uygula (~0.75)</li>
        <li>Gerilim düşümü kontrol et: ΔV = (√3 × ρ × L × I) / A ≤ %3–5</li>
      </ol>
      <p class="dok-tablo-not">Kumanda kabloları: 0.75–1.5 mm² yeterli. Motor güç kablosu: minimum 1.5 mm², pratikte Tablo A'ya göre seçilir.</p>
    </div>

    <!-- KALKIŞ YÖNTEMLERİ KARŞILAŞTIRMA -->
    <div class="dok-hizli-kart">
      <h3 class="dok-hizli-baslik">Motor Kalkış Yöntemleri Karşılaştırması</h3>
      <table class="dok-tablo">
        <thead>
          <tr><th>Yöntem</th><th>Kalkış Akımı</th><th>Kalkış Torku</th><th>Maliyet</th><th>Uygulama</th></tr>
        </thead>
        <tbody>
          <tr><td>Direkt (DOL)</td><td>5–7 × In</td><td>%100</td><td>En düşük</td><td>Küçük motorlar (&lt;4 kW)</td></tr>
          <tr><td>Yıldız-Üçgen</td><td>1.5–2.5 × In</td><td>%33 (Y)</td><td>Düşük</td><td>4–90 kW, hafif kalkış</td></tr>
          <tr><td>Softstarter</td><td>2–4 × In (ayarlı)</td><td>%30–80 (ayarlı)</td><td>Orta</td><td>Pompa, konveyör, kompresör</td></tr>
          <tr><td>VFD (Inverter)</td><td>1–1.5 × In</td><td>%100+ (vektör)</td><td>Yüksek</td><td>Hız kontrol gereken her uygulama</td></tr>
        </tbody>
      </table>
    </div>

    <!-- HABERLEŞME PROTOKOLLERİ ÖZET -->
    <div class="dok-hizli-kart">
      <h3 class="dok-hizli-baslik">Endüstriyel Haberleşme Protokolleri — Hızlı Özet</h3>
      <table class="dok-tablo">
        <thead>
          <tr><th>Protokol</th><th>Fiziksel Katman</th><th>Hız</th><th>Topoloji</th><th>Yaygın Kullanım</th></tr>
        </thead>
        <tbody>
          <tr><td>Modbus RTU</td><td>RS-485</td><td>9.6k–115k baud</td><td>Bus/Daisy chain</td><td>Evrensel, her marka</td></tr>
          <tr><td>Modbus TCP</td><td>Ethernet</td><td>100 Mbps</td><td>Star (switch)</td><td>SCADA bağlantısı</td></tr>
          <tr><td>Profibus DP</td><td>RS-485</td><td>9.6k–12M baud</td><td>Bus (terminatör)</td><td>Siemens S5/S7 eski sistemler</td></tr>
          <tr><td>Profinet</td><td>Ethernet</td><td>100 Mbps / 1 Gbps</td><td>Star / Ring (MRP)</td><td>Siemens TIA Portal, ET200</td></tr>
          <tr><td>EtherNet/IP</td><td>Ethernet</td><td>100 Mbps</td><td>Star / Ring (DLR)</td><td>Rockwell Allen-Bradley</td></tr>
          <tr><td>IO-Link</td><td>3-wire unshielded</td><td>4.8k–230k baud</td><td>P2P (master-slave)</td><td>Akıllı sensör/aktüatör</td></tr>
          <tr><td>CANopen</td><td>CAN bus</td><td>1 Mbps</td><td>Bus</td><td>Makine içi eksenler</td></tr>
        </tbody>
      </table>
    </div>

  </div>
</div>`;
}
