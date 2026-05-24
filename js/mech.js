/* =================================================================
   MEKANİK BİLGİ KARTLARI — Makine elemanları (MEGEP/MEB)
   ================================================================= */

/* =================================================================
   MEKANİK BİLGİ KARTLARI — Makine elemanları (MEGEP/MEB müfredatı)
   ================================================================= */
const MECH_SVG = {
  bearing: `<svg viewBox="0 0 200 200">
    <circle cx="100" cy="100" r="90" fill="none" stroke="#8a96a3" stroke-width="3"/>
    <circle cx="100" cy="100" r="75" fill="none" stroke="#8a96a3" stroke-width="2"/>
    <circle cx="100" cy="100" r="40" fill="none" stroke="#8a96a3" stroke-width="2"/>
    <circle cx="100" cy="100" r="25" fill="none" stroke="#8a96a3" stroke-width="3"/>
    ${Array.from({length:10},(_,i)=>{
      const a=i*36*Math.PI/180;
      return `<circle cx="${100+57*Math.cos(a)}" cy="${100+57*Math.sin(a)}" r="9" fill="#f5b301" stroke="#8a96a3" stroke-width="1.5"/>`;
    }).join('')}
  </svg>`,
  rackpinion: `<svg viewBox="0 0 200 200">
    <circle cx="60" cy="60" r="35" fill="none" stroke="#8a96a3" stroke-width="2"/>
    ${Array.from({length:12},(_,i)=>{
      const a=i*30*Math.PI/180;
      const x1=60+35*Math.cos(a),y1=60+35*Math.sin(a);
      const x2=60+45*Math.cos(a),y2=60+45*Math.sin(a);
      return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#f5b301" stroke-width="3"/>`;
    }).join('')}
    <circle cx="60" cy="60" r="6" fill="#8a96a3"/>
    <rect x="20" y="120" width="160" height="20" fill="none" stroke="#8a96a3" stroke-width="2"/>
    ${Array.from({length:14},(_,i)=>`<line x1="${28+i*11}" y1="120" x2="${28+i*11}" y2="110" stroke="#f5b301" stroke-width="3"/>`).join('')}
  </svg>`,
  gearbox: `<svg viewBox="0 0 200 200">
    <rect x="30" y="40" width="140" height="100" fill="none" stroke="#8a96a3" stroke-width="3" rx="8"/>
    <circle cx="70" cy="80" r="22" fill="none" stroke="#f5b301" stroke-width="2"/>
    <circle cx="130" cy="100" r="32" fill="none" stroke="#f5b301" stroke-width="2"/>
    <circle cx="70" cy="80" r="6" fill="#8a96a3"/>
    <circle cx="130" cy="100" r="6" fill="#8a96a3"/>
    ${Array.from({length:8},(_,i)=>{
      const a=i*45*Math.PI/180;
      return `<line x1="${70+22*Math.cos(a)}" y1="${80+22*Math.sin(a)}" x2="${70+28*Math.cos(a)}" y2="${80+28*Math.sin(a)}" stroke="#f5b301" stroke-width="2"/>`;
    }).join('')}
    ${Array.from({length:12},(_,i)=>{
      const a=i*30*Math.PI/180;
      return `<line x1="${130+32*Math.cos(a)}" y1="${100+32*Math.sin(a)}" x2="${130+38*Math.cos(a)}" y2="${100+38*Math.sin(a)}" stroke="#f5b301" stroke-width="2"/>`;
    }).join('')}
    <line x1="20" y1="80" x2="48" y2="80" stroke="#8a96a3" stroke-width="3"/>
    <line x1="170" y1="100" x2="180" y2="100" stroke="#8a96a3" stroke-width="3"/>
  </svg>`,
  beltdrive: `<svg viewBox="0 0 200 200">
    <circle cx="50" cy="100" r="28" fill="none" stroke="#8a96a3" stroke-width="3"/>
    <circle cx="150" cy="100" r="42" fill="none" stroke="#8a96a3" stroke-width="3"/>
    <circle cx="50" cy="100" r="6" fill="#8a96a3"/>
    <circle cx="150" cy="100" r="6" fill="#8a96a3"/>
    <path d="M 50 72 L 150 58" stroke="#f5b301" stroke-width="3" fill="none"/>
    <path d="M 50 128 L 150 142" stroke="#f5b301" stroke-width="3" fill="none"/>
  </svg>`,
  chain: `<svg viewBox="0 0 200 200">
    <circle cx="55" cy="100" r="26" fill="none" stroke="#8a96a3" stroke-width="2"/>
    <circle cx="145" cy="100" r="36" fill="none" stroke="#8a96a3" stroke-width="2"/>
    ${Array.from({length:10},(_,i)=>{const a=i*36*Math.PI/180;return `<rect x="${55+26*Math.cos(a)-3}" y="${100+26*Math.sin(a)-3}" width="6" height="6" fill="#f5b301"/>`;}).join('')}
    ${Array.from({length:14},(_,i)=>{const a=i*25.7*Math.PI/180;return `<rect x="${145+36*Math.cos(a)-3}" y="${100+36*Math.sin(a)-3}" width="6" height="6" fill="#f5b301"/>`;}).join('')}
    ${Array.from({length:8},(_,i)=>{const x=60+i*12;return `<rect x="${x}" y="71" width="8" height="4" fill="#f5b301" stroke="#8a96a3"/><rect x="${x}" y="125" width="8" height="4" fill="#f5b301" stroke="#8a96a3"/>`;}).join('')}
  </svg>`,
  screw: `<svg viewBox="0 0 200 200">
    <rect x="10" y="85" width="180" height="30" fill="none" stroke="#8a96a3" stroke-width="2"/>
    ${Array.from({length:18},(_,i)=>{const x=15+i*10;return `<path d="M ${x} 85 L ${x+5} 115" stroke="#f5b301" stroke-width="2.5" fill="none"/>`;}).join('')}
    <rect x="80" y="65" width="40" height="70" fill="#161b22" stroke="#8a96a3" stroke-width="2"/>
    <line x1="80" y1="80" x2="120" y2="80" stroke="#8a96a3" stroke-width="1.5"/>
    <line x1="80" y1="120" x2="120" y2="120" stroke="#8a96a3" stroke-width="1.5"/>
  </svg>`,
  worm: `<svg viewBox="0 0 200 200">
    <rect x="20" y="90" width="160" height="20" fill="none" stroke="#8a96a3" stroke-width="2"/>
    ${Array.from({length:14},(_,i)=>{const x=28+i*11;return `<ellipse cx="${x}" cy="100" rx="3" ry="10" fill="#f5b301"/>`;}).join('')}
    <circle cx="100" cy="50" r="30" fill="none" stroke="#8a96a3" stroke-width="2"/>
    ${Array.from({length:10},(_,i)=>{const a=i*36*Math.PI/180;return `<line x1="${100+30*Math.cos(a)}" y1="${50+30*Math.sin(a)}" x2="${100+36*Math.cos(a)}" y2="${50+36*Math.sin(a)}" stroke="#f5b301" stroke-width="2"/>`;}).join('')}
    <circle cx="100" cy="50" r="5" fill="#8a96a3"/>
    <line x1="100" y1="80" x2="100" y2="90" stroke="#8a96a3" stroke-width="2" stroke-dasharray="3 2"/>
  </svg>`,
  coupling: `<svg viewBox="0 0 200 200">
    <rect x="10" y="85" width="60" height="30" fill="none" stroke="#8a96a3" stroke-width="2"/>
    <rect x="130" y="85" width="60" height="30" fill="none" stroke="#8a96a3" stroke-width="2"/>
    <rect x="65" y="70" width="20" height="60" fill="#f5b301" stroke="#8a96a3" stroke-width="2"/>
    <rect x="115" y="70" width="20" height="60" fill="#f5b301" stroke="#8a96a3" stroke-width="2"/>
    <path d="M 85 80 L 115 80 M 85 120 L 115 120" stroke="#8a96a3" stroke-width="2"/>
    <circle cx="100" cy="100" r="6" fill="none" stroke="#8a96a3" stroke-width="1.5"/>
  </svg>`,
  linrail: `<svg viewBox="0 0 200 200">
    <rect x="20" y="100" width="160" height="14" fill="none" stroke="#8a96a3" stroke-width="2"/>
    <path d="M 20 100 L 180 100 M 20 114 L 180 114" stroke="#8a96a3" stroke-width="1.5"/>
    <rect x="70" y="75" width="60" height="40" fill="#161b22" stroke="#f5b301" stroke-width="2" rx="3"/>
    <rect x="80" y="105" width="10" height="10" fill="#8a96a3"/>
    <rect x="110" y="105" width="10" height="10" fill="#8a96a3"/>
    <circle cx="100" cy="90" r="4" fill="#8a96a3"/>
  </svg>`,
  spring: `<svg viewBox="0 0 200 200">
    <line x1="40" y1="100" x2="55" y2="100" stroke="#8a96a3" stroke-width="3"/>
    <path d="M 55 100 L 65 80 L 75 120 L 85 80 L 95 120 L 105 80 L 115 120 L 125 80 L 135 120 L 145 100" stroke="#f5b301" stroke-width="3" fill="none"/>
    <line x1="145" y1="100" x2="160" y2="100" stroke="#8a96a3" stroke-width="3"/>
    <circle cx="40" cy="100" r="5" fill="#8a96a3"/>
    <circle cx="160" cy="100" r="5" fill="#8a96a3"/>
  </svg>`,
  cam: `<svg viewBox="0 0 200 200">
    <ellipse cx="100" cy="110" rx="60" ry="40" fill="none" stroke="#f5b301" stroke-width="2.5" transform="rotate(15 100 110)"/>
    <circle cx="100" cy="110" r="6" fill="#8a96a3"/>
    <line x1="100" y1="110" x2="100" y2="40" stroke="#8a96a3" stroke-width="3"/>
    <rect x="90" y="20" width="20" height="20" fill="#161b22" stroke="#8a96a3" stroke-width="2"/>
  </svg>`,
  crank: `<svg viewBox="0 0 200 200">
    <circle cx="60" cy="120" r="30" fill="none" stroke="#8a96a3" stroke-width="2"/>
    <circle cx="60" cy="120" r="5" fill="#8a96a3"/>
    <circle cx="75" cy="95" r="5" fill="#f5b301"/>
    <line x1="75" y1="95" x2="150" y2="80" stroke="#f5b301" stroke-width="4"/>
    <rect x="145" y="65" width="40" height="30" fill="#161b22" stroke="#8a96a3" stroke-width="2"/>
    <path d="M 30 145 L 90 145" stroke="#8a96a3" stroke-width="1.5" stroke-dasharray="3 2"/>
  </svg>`,
  pulley: `<svg viewBox="0 0 200 200">
    <circle cx="100" cy="60" r="22" fill="none" stroke="#8a96a3" stroke-width="2"/>
    <circle cx="100" cy="60" r="5" fill="#8a96a3"/>
    <line x1="78" y1="60" x2="78" y2="170" stroke="#f5b301" stroke-width="2.5"/>
    <line x1="122" y1="60" x2="122" y2="170" stroke="#f5b301" stroke-width="2.5"/>
    <rect x="68" y="160" width="64" height="20" fill="#161b22" stroke="#8a96a3" stroke-width="2"/>
    <line x1="100" y1="20" x2="100" y2="40" stroke="#8a96a3" stroke-width="2"/>
    <rect x="93" y="10" width="14" height="12" fill="#8a96a3"/>
  </svg>`,
  brake: `<svg viewBox="0 0 200 200">
    <circle cx="100" cy="100" r="55" fill="none" stroke="#8a96a3" stroke-width="3"/>
    <circle cx="100" cy="100" r="40" fill="#161b22" stroke="#8a96a3" stroke-width="2"/>
    <circle cx="100" cy="100" r="6" fill="#8a96a3"/>
    <path d="M 100 45 A 55 55 0 0 1 155 100" stroke="#f5b301" stroke-width="6" fill="none"/>
    <rect x="155" y="90" width="20" height="20" fill="#ff4d4f" stroke="#8a96a3" stroke-width="2"/>
  </svg>`,
  clutch: `<svg viewBox="0 0 200 200">
    <rect x="20" y="80" width="60" height="40" fill="none" stroke="#8a96a3" stroke-width="2"/>
    <rect x="120" y="80" width="60" height="40" fill="none" stroke="#8a96a3" stroke-width="2"/>
    <rect x="75" y="60" width="15" height="80" fill="#f5b301" stroke="#8a96a3" stroke-width="2"/>
    <rect x="110" y="60" width="15" height="80" fill="#f5b301" stroke="#8a96a3" stroke-width="2"/>
    <line x1="90" y1="100" x2="110" y2="100" stroke="#8a96a3" stroke-width="2" stroke-dasharray="4 3"/>
    <path d="M 100 50 L 95 40 L 105 40 Z" fill="#f5b301"/>
  </svg>`
};

const MECH_ITEMS = [
  {id:'bearing', cat:'Yataklama', title:'Rulman (Bearing)',
    short:'Dönen mil ile gövde arasında sürtünmeyi azaltan yataklama elemanı.',
    desc:'Rulman, iç bilezik (mil tarafı) ile dış bilezik (gövde tarafı) arasında bilyalar veya makaralar bulunan, dönme hareketinde sürtünmeyi minimum seviyeye indiren makine elemanıdır. Endüstriyel motor millerinden çamaşır makinesi tamburuna kadar dönen her yerde kullanılır.',
    types:[['Bilyalı Rulman','En yaygın tip. Radyal yüklere uygun. Örn: 6000, 6200 serisi.'],['Makaralı Rulman','Silindirik makaralı, daha ağır radyal yüke dayanır. Örn: NU, N serisi.'],['Konik Makaralı','Hem radyal hem eksenel yük taşır. Otomobil göbeklerinde yaygın.'],['Eksenel (Itme) Rulman','Sadece eksenel yük. Vinç redüktörleri, dik miller.'],['İğneli Rulman','İnce, küçük yerlere sığar. Eksantrik miller, ufak redüktörler.']],
    formulas:[['Ömür (L10)','L = (C/P)³ × 10⁶ devir', 'C=dinamik yük katsayısı, P=eşdeğer yük (N)'],['Saat cinsinden ömür','L_h = L / (60×n)', 'n=dakikada devir (rpm)']],
    use:'Motor mili, asansör mili, redüktör çıkış mili, rüzgâr türbini ana yatağı, otomobil tekerleği göbeği.',
    care:'Yağlama: 6 ayda bir gres. Aşırı ısı (>80°C) = arıza belirtisi. Titreşim artışı = aşınma. Söküm: bilezik sökme aparatı kullan, asla çekiçle vurma — iç bilezik çatlar.',
    std:'ISO 15, DIN 625, ISO 281 (ömür hesabı)'},

  {id:'rackpinion', cat:'Hareket Aktarımı', title:'Kremayer-Pinyon',
    short:'Döner hareketi doğrusal harekete çeviren dişli sistemi.',
    desc:'Pinyon (küçük dairesel dişli) ile kremayer (uzun düz dişli çubuk) arasında geçen dişler sayesinde, pinyonun dönmesi kremayeri ileri-geri hareket ettirir. CNC tezgâhların X-Y eksenlerinde, asansör güvenlik freninde ve direksiyon mekanizmalarında kullanılır.',
    types:[['Düz Dişli Kremayer','Düz kesim. Ucuz ama gürültülü. Genel amaçlı.'],['Helisel Kremayer','Eğik dişli kesim. Sessiz, daha sağlam. CNC tezgâhlarda standart.'],['Modül Sınıfı','m=1, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10 mm']],
    formulas:[['Doğrusal Yol','v = π × m × z × n', 'v=mm/dk, m=modül, z=pinyon diş sayısı, n=devir/dk'],['Bir Devirde Yol','L = π × m × z', 'mm cinsinden, pinyonun bir tam turunda kremayer yol alır']],
    use:'CNC freze X/Y ekseni, lazer kesim, asansör tahriği, otomatik kapı, vinç araba hareketi.',
    care:'Yağlama: dişli gresi (gres tipi 2). Aşınma: dişlerin yan yüzeyi kontrol. Bel verme/şişme = aşırı yük. Pinyon ve kremayer aynı modülde olmalı — yoksa düşey vuruntu olur.',
    std:'DIN 867 (dişli profili), ISO 53'},

  {id:'gearbox', cat:'Hareket Aktarımı', title:'Redüktör (Dişli Kutusu)',
    short:'Motor devrini azaltıp torku artıran dişli mekanizması.',
    desc:'Bir veya birden fazla dişli çiftinden oluşur. Giriş mili (motora bağlı) yüksek devirli düşük torklu döner; çıkış mili daha yavaş ama daha kuvvetli döner. Tork-devir dönüşümü yapar.',
    types:[['Düz Dişli Redüktör','Aynı eksende, en basit. i=2..10'],['Helisel Redüktör','Sessiz, yüksek devir. Konveyör, taşıma.'],['Konik Dişli','90° yön değiştirir. Sonsuz vida ile birlikte yaygın.'],['Sonsuz Vida Redüktör','Yüksek redüksiyon (1:20 ... 1:100). Asansör, vinç.'],['Planet (Planetary)','Kompakt, yüksek tork. Robot kolu, elektrikli araç.']],
    formulas:[['Redüksiyon Oranı','i = z₂ / z₁ = n₁ / n₂', 'z=diş sayısı, n=devir/dk'],['Çıkış Torku','M₂ = M₁ × i × η', 'M=tork (Nm), η=verim (~0.95)'],['Verim','η_toplam = η₁ × η₂ × ... × ηₙ', 'çok kademeli redüktörde her kademe çarpılır']],
    use:'Konveyör tahriği, vinç motoru, asansör, CNC tezgâh, robot eklemleri, rüzgâr türbini ana redüktör.',
    care:'Yağ seviyesi: gözetleme camından bak, ayda bir. Yağ değişimi: ilk 500 saatte, sonra 5000 saatte bir. Ses dinleme: tıkırtı = diş kırılması, uğultu = rulman bitiyor.',
    std:'AGMA, ISO 6336 (dayanım), ISO 1328 (kalite sınıfı)'},

  {id:'beltdrive', cat:'Hareket Aktarımı', title:'Kayış-Kasnak',
    short:'Esnek kayış ile uzaktaki iki mil arasında hareket aktarımı.',
    desc:'İki kasnak arasına gergin geçirilmiş kayış sayesinde hareket aktarılır. Kayış esnek olduğu için darbeleri yutar, montaj toleransı esnektir.',
    types:[['Düz Kayış','En basit, ucuz. Düşük güç. Su pompası, vantilatör.'],['V Kayışı','A, B, C, D profilleri. Çamaşır makinesi, klima, tarım makineleri.'],['Triger Kayışı','Dişli; kayma yok. CNC eksenleri, otomobil eksantrik mili.'],['Sandviç Kayış','Çoklu V profil. Yüksek güç aktarımı.']],
    formulas:[['Hız Oranı','i = D₂/D₁ = n₁/n₂', 'D=kasnak çapı, n=devir'],['Kayış Uzunluğu','L ≈ 2C + π(D₁+D₂)/2 + (D₂-D₁)²/(4C)', 'C=eksenler arası mesafe'],['Çekme Gücü','P = (F₁-F₂) × v / 1000', 'F=Newton, v=m/s, P=kW']],
    use:'Tezgâh motorları, taşıyıcı bant, vantilatör tahriği, evsel beyaz eşya, tarım makineleri.',
    care:'Kayış gerginliği: parmakla bastırınca 10-15mm çökmeli (1m açıklık için). Çatlak/lifler = değiştir. Yağlanmış kayış kayar, asla yağlama.',
    std:'ISO 1813 (V kayış), ISO 5295 (triger)'},

  {id:'chain', cat:'Hareket Aktarımı', title:'Zincir-Pinyon',
    short:'Sert zincir ile yüksek tork ve kayıpsız aktarım.',
    desc:'Çelik baklalardan oluşan zincir, iki dişli (pinyon) arasında dolaşır. Kayma olmadığı için pozisyon hassasiyeti yüksektir. Kayışa göre daha sert, ama daha gürültülüdür.',
    types:[['Rulolu Zincir','En yaygın. ANSI 40, 50, 60 numaraları.'],['Sessiz Zincir','Plakalı; daha az gürültü. Otomobil eksantrik.'],['Konveyör Zinciri','Geniş yapılı, taşıma için.'],['Bisiklet Zinciri','½ inç hatve, hafif yük.']],
    formulas:[['Devir Oranı','i = z₂ / z₁', 'z=diş sayısı'],['Hız','v = z × p × n / 60', 'p=hatve (mm), n=rpm, v=mm/s']],
    use:'Motosiklet/bisiklet tahriği, taşıma konveyörü, vinç kaldırma, asansör (özellikle yük asansörü), tarım makineleri.',
    care:'Yağlama: aylık zincir yağı. Sallanma toleransı: aşağı doğru 1-2cm. Aşırı uzama (>%3) = değiştir.',
    std:'ISO 606, ANSI B29.1'},

  {id:'screw', cat:'Hareket Aktarımı', title:'Vidalı Mil (Ball Screw)',
    short:'Yüksek hassasiyetli doğrusal hareket için bilyalı vidalı mil.',
    desc:'Vidalı mil ile somun arasında bilyalar dolaşır. Mil döndüğünde somun (ve ona bağlı yük) doğrusal hareket eder. CNC tezgâhların eksenlerinde standart elemandır — 0.005 mm hassasiyete kadar inilebilir.',
    types:[['Trapez Vida','Ucuz, basit, geri itme var. Pres, kriko, basit eksen.'],['Bilyalı Vidalı Mil','Yüksek verim (%90+), düşük sürtünme. CNC, robot, lazer.'],['Kademe (Class) Sınıfı','C0 (en hassas), C1, C3, C5, C7, C10 (en kaba)']],
    formulas:[['Doğrusal Yol','v = n × P', 'n=devir/dk, P=adım/hatve (mm), v=mm/dk'],['Tork','T = (F × P) / (2π × η)', 'F=eksenel kuvvet (N), η=verim (~0.9 bilyalı)']],
    use:'CNC freze/torna Z ekseni, lazer kesim, robot lineer eklem, 3D yazıcı, hassas konumlama makineleri.',
    care:'Yağlama: lityum gres. Toza karşı körük takılır. Geri tepme (backlash): aşınmışsa somun değiştir. Asla darbe vurma — bilyalar deforme olur.',
    std:'ISO 3408, DIN 69051'},

  {id:'worm', cat:'Hareket Aktarımı', title:'Sonsuz Vida + Dişli',
    short:'90° yön değişimi + yüksek redüksiyon (1:20–1:100).',
    desc:'Sonsuz vida ile bir dişli arasında geçen aktarım. Tek kademede çok yüksek redüksiyon elde edilir. Kendi-kilitleyici özelliği vardır — dişliden geri çevirme imkansızdır (asansör, vinç güvenliği).',
    types:[['Tek Ağız Sonsuz','Yüksek redüksiyon, düşük verim'],['Çift/Çok Ağız','Verim yüksek, daha düşük redüksiyon'],['Globoid Sonsuz','Yüksek hassasiyet, hassas optik mekanizmalar']],
    formulas:[['Redüksiyon','i = z₂ / z₁', 'z₁=vida ağız sayısı (1, 2, 3...), z₂=dişli diş sayısı']],
    use:'Asansör tahrik makinesi, elektrik vinçleri, müzik aletlerinin akort dilleri.',
    care:'Yağlama: dişli yağı (özel sonsuz yağı). Sürtünme yüksek → ısınma kontrolü. Diş yüzeyi parlaması = aşınma başlangıcı.',
    std:'DIN 3975, ISO 14521'},

  {id:'coupling', cat:'Mil Bağlantı', title:'Kavrama (Kaplin)',
    short:'İki mili eksenel ya da açısal kaçıklıkla birbirine bağlar.',
    desc:'Motor mili ile redüktör veya pompa mili arasındaki bağlantı elemanı. Eksenel kaçıklığı (0.1-0.3 mm) ve açısal sapmayı (1-3°) tolere eder, ayrıca darbe sönümleme yapar.',
    types:[['Sert Kaplin','Mükemmel hizalama gerektirir. Pres prensibi.'],['Esnek Kaplin (Lastik)','Lastik blok ile darbe yutar. En yaygın endüstride.'],['Bilyalı/Pim Kaplin','Tork kapasitesi yüksek, küçük açı sapma.'],['Manyetik Kaplin','Temassız, sızdırmaz alan (pompa-motor)']],
    formulas:[['Tork Kapasitesi','M ≥ M_motor × SF', 'SF=emniyet faktörü (1.5-3)']],
    use:'Motor-redüktör, motor-pompa, motor-jeneratör arası.',
    care:'Hizalama: dial gösterge ile <0.05mm. Lastik bloklar 2 yılda bir değiştir. Titreşim artışı = hizalama bozuk.',
    std:'ISO 14691'},

  {id:'linrail', cat:'Yataklama', title:'Lineer Kılavuz + Araba',
    short:'Yüksek hassasiyette doğrusal hareket için ray sistemi.',
    desc:'Sert çelik ray üzerinde bilyalı veya makaralı araba hareket eder. Vidalı mil ile birlikte CNC ve robot eksenlerinde standart. Geri tepme (backlash) sıfır, hassasiyet 0.01 mm.',
    types:[['Bilyalı Ray','Genel amaçlı, en yaygın'],['Makaralı Ray','Daha ağır yük taşır, daha sessiz'],['Çapraz Makaralı','Çoklu eksen kombinasyonu için']],
    formulas:[['Yük Ömrü','L = (C/P)³ × 50 km', 'C=dinamik yük, P=uygulanan yük']],
    use:'CNC tezgâh eksenleri, 3D yazıcı, robot kolu, lazer kesim, paketleme makineleri.',
    care:'Gres: 100 km veya 3 ayda bir. Toza karşı keçe ek. Araba ses çıkarıyorsa = içeride toz birikmiş; söküp temizle, yeniden gresle.',
    std:'ISO 12090, DIN 645'},

  {id:'spring', cat:'Yay & Damper', title:'Yay',
    short:'Esneklik ile kuvvet depolayan/serbest bırakan eleman.',
    desc:'Yaylar elastik deformasyon ile enerji depolar ve serbest bıraktığında geri verir. Pnömatik silindirin geri dönüşünde, butonların yaylanmasında, valflerin kapanmasında kullanılır.',
    types:[['Basma Yayı','En yaygın, helisel. Süspansiyon, valf.'],['Çekme Yayı','İki uçtan asılır. Garaj kapısı, terazi.'],['Burulma Yayı','Açısal kuvvet. Mandallar, kapı menteşeleri.'],['Dilim Yayı (Disk)','Eksenel, yüksek kuvvet düşük yol. Debriyaj.'],['Yaprak Yayı','Lamine, uzun. Kamyon süspansiyonu.']],
    formulas:[['Yay Sabiti','k = G × d⁴ / (8 × D³ × n)', 'G=kayma modülü, d=tel çapı, D=ortalama çap'],['Yay Kuvveti','F = k × x', 'x=sıkışma miktarı (mm), F=Newton'],['Depolanan Enerji','E = ½ × k × x²']],
    use:'Buton yaylanması, valf kapama, debriyaj, pnömatik silindir geri dönüşü, otomobil süspansiyonu, saat mekanizması.',
    care:'Yorgunluk: 10⁶ çevrim sonrası kontrol. Çatlak/oksidasyon = değiştir. Aşırı sıkıştırma → kalıcı deformasyon.',
    std:'DIN 2089 (basma), DIN 2088 (burulma)'},

  {id:'cam', cat:'Mekanizmalar', title:'Kam Mekanizması',
    short:'Düzgün dönmeyi düzensiz hareket biçimine çeviren oval/yumru disk.',
    desc:'Bir kam disk döner; üzerine yaslanmış makaralı kol, kamın yüzeyini takip eder. Bu sayede dönme hareketi, istenen profile göre yukarı-aşağı hareket olarak çıkar.',
    types:[['Diskli Kam','Düz, yana hareket. Otomobil eksantrik mili.'],['Silindirik Kam','Yan yüzeyde kanal. Tezgah taretleri.'],['Konik Kam','Konik yüzeyde profil. Özel makinalar.']],
    formulas:[['Maks. Yükselme','h = R_max − R_min', 'kam profilinin yarıçap farkı']],
    use:'İçten yanmalı motor valf kontrolü, dikiş makinesi iğne hareketi, otomatik torna takım hareketi.',
    care:'Yüzey aşınması: profil bozulursa hareket geç başlar. Vuruntu sesi = makara aşınmış.',
    std:'—'},

  {id:'crank', cat:'Mekanizmalar', title:'Krank-Biyel',
    short:'Döner hareketi piston hareketine çevirir (içten yanmalı motorun temeli).',
    desc:'Krank mili döner, biyel kolu pistona bağlı; krankın dönmesi pistonu yukarı-aşağı iter. İçten yanmalı motorlarda yanma basıncı pistonu iterek krank dönmesi sağlar (ters mantık).',
    types:[['Tek Silindirli','Basit, motosiklet'],['Çok Silindirli','Otomobil V8 vb.'],['Eksantrikli','Pres makineleri']],
    formulas:[['Piston Yolu','S = 2 × r', 'r=krank yarıçapı'],['Piston Hız Ortalaması','v_ort = 2 × S × n / 60', 'S=strok, n=rpm']],
    use:'İçten yanmalı motor, kompresör, pres makinesi (eksantrik pres), bisiklet pedal-zincir aktarımı.',
    care:'Yağ basıncı: 3-5 bar olmalı. Anormal ses = ana yatak veya kol yatağı arızası.',
    std:'—'},

  {id:'pulley', cat:'Mekanizmalar', title:'Palanga (Makara Sistemi)',
    short:'Kuvvet kazancı sağlayan makaralı kaldırma sistemi.',
    desc:'Birden fazla makara ve halat ile kuvvet azaltılır, ama yol uzar. n makaralı sistemde uygulanan kuvvet F/n olur. Vinç ve asansörlerin kaldırma kapasitesini artırmak için kullanılır.',
    types:[['Sabit Makara','1:1, sadece yön değişir'],['Hareketli Makara','2:1, yarı kuvvet ama 2 kat yol'],['Palanga (Çoklu)','n:1 oranında kuvvet kazancı']],
    formulas:[['Kuvvet Kazancı','F = G / n', 'G=yük, n=makara sayısı'],['Yol','s_kuvvet = n × s_yük', 'mekanik avantajın bedeli']],
    use:'Köprülü vinç, çatı taşıyıcı vinç, yelkenli halat sistemi, asansör halat tertibatı (genelde 2:1).',
    care:'Halat kontrolü: tellerin %10\'u kopmuşsa halatı değiştir. Aşırı yük kaldırma sigortası test edilmeli.',
    std:'ASME B30, EN 13135'},

  {id:'brake', cat:'Fren & Kavrama', title:'Disk Fren',
    short:'Sürtünme ile dönen mili durduran fren sistemi.',
    desc:'Mile bağlı bir disk ile sabit balatalar arasında sürtünme yaratarak kinetik enerjiyi ısıya çevirir, mili yavaşlatır veya durdurur. Endüstride elektromanyetik tahrikli versiyonları yaygın — enerji kesilirse fren otomatik devreye girer (fail-safe).',
    types:[['Mekanik Disk Fren','Operatör pedalı/kolu çeker'],['Hidrolik Disk Fren','Otomobil ön fren tipi'],['Pnömatik Disk Fren','Kamyon, tren'],['Elektromanyetik Fren','Asansör, vinç (enerji kesince çalışır)']],
    formulas:[['Fren Torku','M = μ × F × R', 'μ=sürtünme katsayısı, F=balata kuvveti, R=disk yarıçapı'],['Isı Enerjisi','Q = ½ × J × ω²', 'J=atalet momenti, ω=açısal hız']],
    use:'Asansör güvenlik freni, vinç tutucu fren, otomobil/motorsiklet fren, elektrikli araç motor fren.',
    care:'Balata kalınlığı: 2mm altında değiştir. Aşırı ısınma → fren kaybı (fade). Asansör frenini yılda bir test et.',
    std:'EN 81-20 (asansör), ECE R13 (otomotiv)'},

  {id:'clutch', cat:'Fren & Kavrama', title:'Debriyaj (Kavrama)',
    short:'Dönmekte olan iki mili birbirine bağlayıp ayırabilen mekanizma.',
    desc:'Motor dönüyorken bile çıkış milini geçici olarak ayrı tutmaya yarar. Otomobilde vites değiştirirken motoru tekerden ayırmak için kullanılır. Endüstride yumuşak kalkış için elektromanyetik versiyon yaygındır.',
    types:[['Sürtünmeli Debriyaj','Plakalar arasında sürtünme. Otomobil.'],['Elektromanyetik','Anında bağlama/ayırma. Endüstri otomasyon.'],['Manyetik Toz','Yumuşak kavrama, akım ile ayarlanabilir tork.'],['Hidrolik Tork Konvertör','Otomatik şanzıman.']],
    formulas:[['İletilen Tork','M = μ × F × R_ort × n_yüzey', 'n=temas yüzeyi sayısı']],
    use:'Otomobil, motorsiklet, traktör. Endüstri: otomatik tezgâhlarda yumuşak başlatma.',
    care:'Sürtünmeli debriyajda balata: 5-7mm. Yarım debriyajla uzun süre kullanma → balatayı yakar.',
    std:'—'}
];

function openMech(){
  switchTab('mech');
  renderMech();
}

function renderMech(){
  const root=document.getElementById('mechList');
  if(!root)return;
  const cats=[...new Set(MECH_ITEMS.map(m=>m.cat))];
  root.innerHTML='';
  const intro=document.createElement('div');
  intro.style.cssText='margin-bottom:14px;padding:14px;background:#0e2436;color:#9bd1ff;border-radius:10px;font-size:13px;line-height:1.6';
  intro.innerHTML='<b>⚙ MEKANİK BİLGİ KARTLARI</b> — Otomasyon sistemlerinin mekanik tarafı: yataklama, dişli, kayış, vida, fren, debriyaj. Bir karta tıkla → detaylı bilgi, formüller, kullanım alanları, bakım ipuçları.';
  root.appendChild(intro);

  cats.forEach(cat=>{
    const h=document.createElement('div');h.className='cat';h.textContent=cat;
    root.appendChild(h);
    const g=document.createElement('div');g.className='mech-grid';
    MECH_ITEMS.filter(m=>m.cat===cat).forEach(item=>{
      const d=document.createElement('div');d.className='mech-card';
      d.onclick=()=>showMechDetail(item.id);
      d.innerHTML=`
        <div class="mvis">${MECH_SVG[item.id]||''}</div>
        <div class="mbody">
          <div class="mlvl">${item.cat}</div>
          <h3>${item.title}</h3>
          <p>${item.short}</p>
        </div>
      `;
      g.appendChild(d);
    });
    root.appendChild(g);
  });
}

/* Canlı simülasyon SVG'leri — modal'da kullanılır. Hız `--spd` CSS değişkeniyle ayarlanır */
const MECH_ANIM = {
  bearing: `<svg viewBox="0 0 220 220" class="mech-anim" style="--spd:3s">
    <defs>
      <radialGradient id="ringGrad"><stop offset="0" stop-color="#2a323d"/><stop offset="1" stop-color="#161b22"/></radialGradient>
    </defs>
    <circle cx="110" cy="110" r="95" fill="url(#ringGrad)" stroke="#8a96a3" stroke-width="3"/>
    <circle cx="110" cy="110" r="78" fill="none" stroke="#8a96a3" stroke-width="2"/>
    <circle cx="110" cy="110" r="42" fill="none" stroke="#8a96a3" stroke-width="2"/>
    <circle cx="110" cy="110" r="25" fill="#1c232d" stroke="#8a96a3" stroke-width="3"/>
    <g class="rotate-shaft">
      <line x1="110" y1="85" x2="110" y2="135" stroke="#f5b301" stroke-width="3"/>
      <line x1="85" y1="110" x2="135" y2="110" stroke="#f5b301" stroke-width="3"/>
    </g>
    <g class="rotate-cage">
      ${Array.from({length:10},(_,i)=>{
        const a=i*36;
        return `<circle cx="110" cy="110" r="9" fill="#f5b301" stroke="#0a0d12" stroke-width="1.5" transform="rotate(${a} 110 110) translate(0 -60)"/>`;
      }).join('')}
    </g>
    <text x="110" y="208" text-anchor="middle" fill="#8a96a3" font-family="monospace" font-size="10">RULMAN — bilyalar mil çevresinde döner</text>
  </svg>`,

  rackpinion: `<svg viewBox="0 0 280 220" class="mech-anim" style="--spd:4s">
    <g class="rotate-cw" style="transform-origin:70px 90px">
      <circle cx="70" cy="90" r="40" fill="none" stroke="#8a96a3" stroke-width="2.5"/>
      ${Array.from({length:14},(_,i)=>{
        const a=i*(360/14);
        return `<rect x="-3" y="-50" width="6" height="14" fill="#f5b301" transform="rotate(${a} 0 0) translate(70 90)" style="transform-box:fill-box"/>`;
      }).join('')}
      <line x1="60" y1="80" x2="80" y2="100" stroke="#0a0d12" stroke-width="2"/>
      <line x1="80" y1="80" x2="60" y2="100" stroke="#0a0d12" stroke-width="2"/>
      <circle cx="70" cy="90" r="7" fill="#8a96a3"/>
    </g>
    <g class="slide-rack">
      <rect x="0" y="140" width="280" height="22" fill="#1c232d" stroke="#8a96a3" stroke-width="2"/>
      ${Array.from({length:24},(_,i)=>`<rect x="${4+i*11.5}" y="128" width="6" height="14" fill="#f5b301"/>`).join('')}
    </g>
    <text x="140" y="200" text-anchor="middle" fill="#8a96a3" font-family="monospace" font-size="10">PİNYON DÖNDÜKÇE KREMAYER İLERLER</text>
  </svg>`,

  gearbox: `<svg viewBox="0 0 280 200" class="mech-anim" style="--spd:3s">
    <rect x="15" y="30" width="250" height="130" fill="#0a0d12" stroke="#8a96a3" stroke-width="3" rx="10"/>
    <g class="rotate-cw" style="transform-origin:80px 80px">
      <circle cx="80" cy="80" r="28" fill="none" stroke="#8a96a3" stroke-width="2"/>
      ${Array.from({length:10},(_,i)=>{
        const a=i*36;
        return `<rect x="-3" y="-36" width="6" height="10" fill="#f5b301" transform="rotate(${a} 0 0) translate(80 80)" style="transform-box:fill-box"/>`;
      }).join('')}
      <line x1="70" y1="70" x2="90" y2="90" stroke="#0a0d12" stroke-width="2"/>
      <line x1="90" y1="70" x2="70" y2="90" stroke="#0a0d12" stroke-width="2"/>
      <circle cx="80" cy="80" r="6" fill="#8a96a3"/>
    </g>
    <g class="rotate-ccw-slow" style="transform-origin:180px 110px">
      <circle cx="180" cy="110" r="42" fill="none" stroke="#8a96a3" stroke-width="2"/>
      ${Array.from({length:16},(_,i)=>{
        const a=i*22.5;
        return `<rect x="-3" y="-50" width="6" height="10" fill="#f5b301" transform="rotate(${a} 0 0) translate(180 110)" style="transform-box:fill-box"/>`;
      }).join('')}
      <line x1="170" y1="100" x2="190" y2="120" stroke="#0a0d12" stroke-width="2"/>
      <line x1="190" y1="100" x2="170" y2="120" stroke="#0a0d12" stroke-width="2"/>
      <circle cx="180" cy="110" r="6" fill="#8a96a3"/>
    </g>
    <line x1="0" y1="80" x2="50" y2="80" stroke="#8a96a3" stroke-width="4"/>
    <text x="25" y="72" text-anchor="middle" fill="#f5b301" font-family="monospace" font-size="8" font-weight="700">GİRİŞ</text>
    <text x="25" y="100" text-anchor="middle" fill="#f5b301" font-family="monospace" font-size="8">1500rpm</text>
    <line x1="225" y1="110" x2="280" y2="110" stroke="#8a96a3" stroke-width="4"/>
    <text x="255" y="102" text-anchor="middle" fill="#27d07a" font-family="monospace" font-size="8" font-weight="700">ÇIKIŞ</text>
    <text x="255" y="130" text-anchor="middle" fill="#27d07a" font-family="monospace" font-size="8">375rpm</text>
    <text x="140" y="185" text-anchor="middle" fill="#8a96a3" font-family="monospace" font-size="10">i=4:1 → DEVİR DÜŞER, TORK ARTAR</text>
  </svg>`,

  beltdrive: `<svg viewBox="0 0 280 200" class="mech-anim" style="--spd:3s">
    <g class="rotate-cw" style="transform-origin:60px 100px">
      <circle cx="60" cy="100" r="32" fill="none" stroke="#8a96a3" stroke-width="3"/>
      <circle cx="60" cy="100" r="26" fill="none" stroke="#5b6675" stroke-width="1.5"/>
      <line x1="50" y1="90" x2="70" y2="110" stroke="#f5b301" stroke-width="2.5"/>
      <line x1="70" y1="90" x2="50" y2="110" stroke="#f5b301" stroke-width="2.5"/>
      <circle cx="60" cy="100" r="6" fill="#8a96a3"/>
    </g>
    <g class="rotate-cw-slow" style="transform-origin:200px 100px">
      <circle cx="200" cy="100" r="50" fill="none" stroke="#8a96a3" stroke-width="3"/>
      <circle cx="200" cy="100" r="44" fill="none" stroke="#5b6675" stroke-width="1.5"/>
      <line x1="184" y1="84" x2="216" y2="116" stroke="#f5b301" stroke-width="2.5"/>
      <line x1="216" y1="84" x2="184" y2="116" stroke="#f5b301" stroke-width="2.5"/>
      <circle cx="200" cy="100" r="6" fill="#8a96a3"/>
    </g>
    <path d="M 60 68 L 200 50 M 60 132 L 200 150" stroke="#f5b301" stroke-width="4" fill="none" class="belt-flow"/>
    <text x="140" y="190" text-anchor="middle" fill="#8a96a3" font-family="monospace" font-size="10">KÜÇÜK KASNAK HIZLI, BÜYÜK YAVAŞ DÖNER</text>
  </svg>`,

  chain: `<svg viewBox="0 0 280 200" class="mech-anim" style="--spd:3s">
    <g class="rotate-cw" style="transform-origin:60px 100px">
      <circle cx="60" cy="100" r="30" fill="none" stroke="#8a96a3" stroke-width="2"/>
      ${Array.from({length:12},(_,i)=>{
        const a=i*30;
        return `<rect x="-3" y="-36" width="6" height="6" fill="#f5b301" transform="rotate(${a} 0 0) translate(60 100)" style="transform-box:fill-box"/>`;
      }).join('')}
      <circle cx="60" cy="100" r="6" fill="#8a96a3"/>
    </g>
    <g class="rotate-cw-slow" style="transform-origin:200px 100px">
      <circle cx="200" cy="100" r="48" fill="none" stroke="#8a96a3" stroke-width="2"/>
      ${Array.from({length:18},(_,i)=>{
        const a=i*20;
        return `<rect x="-3" y="-54" width="6" height="6" fill="#f5b301" transform="rotate(${a} 0 0) translate(200 100)" style="transform-box:fill-box"/>`;
      }).join('')}
      <circle cx="200" cy="100" r="6" fill="#8a96a3"/>
    </g>
    <path d="M 60 70 L 200 52 M 60 130 L 200 148" stroke="#aabbcc" stroke-width="3" fill="none" stroke-dasharray="8 4" class="chain-flow"/>
    <text x="140" y="190" text-anchor="middle" fill="#8a96a3" font-family="monospace" font-size="10">ZİNCİR KAYMADAN AKTARIM — POZİSYON HASSAS</text>
  </svg>`,

  screw: `<svg viewBox="0 0 280 160" class="mech-anim" style="--spd:4s">
    <rect x="10" y="70" width="260" height="30" fill="#0a0d12" stroke="#8a96a3" stroke-width="2"/>
    <g class="screw-thread">
      ${Array.from({length:25},(_,i)=>`<path d="M ${15+i*10} 70 L ${20+i*10} 100" stroke="#f5b301" stroke-width="2.5" fill="none"/>`).join('')}
    </g>
    <g class="slide-nut">
      <rect x="100" y="50" width="50" height="70" fill="#1c232d" stroke="#27d07a" stroke-width="2.5"/>
      <line x1="100" y1="62" x2="150" y2="62" stroke="#27d07a" stroke-width="1"/>
      <line x1="100" y1="108" x2="150" y2="108" stroke="#27d07a" stroke-width="1"/>
      <text x="125" y="90" text-anchor="middle" fill="#27d07a" font-family="monospace" font-size="9" font-weight="700">SOMUN</text>
    </g>
    <g class="rotate-cw" style="transform-origin:25px 85px">
      <rect x="5" y="75" width="20" height="20" fill="#f5b301" stroke="#8a96a3" stroke-width="1"/>
      <line x1="5" y1="85" x2="25" y2="85" stroke="#0a0d12" stroke-width="1.5"/>
    </g>
    <text x="140" y="145" text-anchor="middle" fill="#8a96a3" font-family="monospace" font-size="10">VİDA DÖNDÜKÇE SOMUN İLERLER (DÖNME → DOĞRUSAL)</text>
  </svg>`,

  worm: `<svg viewBox="0 0 280 230" class="mech-anim" style="--spd:5s">
    <g class="rotate-ccw-slow" style="transform-origin:140px 60px">
      <circle cx="140" cy="60" r="42" fill="none" stroke="#8a96a3" stroke-width="2"/>
      ${Array.from({length:16},(_,i)=>{
        const a=i*22.5;
        return `<rect x="-3" y="-50" width="6" height="10" fill="#f5b301" transform="rotate(${a} 0 0) translate(140 60)" style="transform-box:fill-box"/>`;
      }).join('')}
      <circle cx="140" cy="60" r="6" fill="#8a96a3"/>
    </g>
    <g class="rotate-cw-fast" style="transform-origin:140px 140px">
      <rect x="40" y="130" width="200" height="22" fill="#1c232d" stroke="#8a96a3" stroke-width="2"/>
      ${Array.from({length:14},(_,i)=>`<ellipse cx="${50+i*14}" cy="141" rx="4" ry="11" fill="#f5b301"/>`).join('')}
    </g>
    <line x1="140" y1="105" x2="140" y2="125" stroke="#8a96a3" stroke-width="2" stroke-dasharray="3 2"/>
    <text x="140" y="180" text-anchor="middle" fill="#8a96a3" font-family="monospace" font-size="10">VİDA HIZLI DÖNER, DİŞLİ YAVAŞ</text>
    <text x="140" y="195" text-anchor="middle" fill="#27d07a" font-family="monospace" font-size="10" font-weight="700">i = 1:30 — KENDİ KİLİTLENİR</text>
  </svg>`,

  coupling: `<svg viewBox="0 0 280 160" class="mech-anim" style="--spd:3s">
    <g class="rotate-cw" style="transform-origin:140px 80px">
      <rect x="20" y="65" width="80" height="30" fill="#1c232d" stroke="#8a96a3" stroke-width="2"/>
      <rect x="180" y="65" width="80" height="30" fill="#1c232d" stroke="#8a96a3" stroke-width="2"/>
      <rect x="95" y="50" width="20" height="60" fill="#f5b301" stroke="#0a0d12" stroke-width="1.5"/>
      <rect x="165" y="50" width="20" height="60" fill="#f5b301" stroke="#0a0d12" stroke-width="1.5"/>
      <path d="M 115 60 L 165 60 M 115 100 L 165 100" stroke="#8a96a3" stroke-width="2"/>
      <circle cx="140" cy="80" r="6" fill="#27d07a"/>
    </g>
    <text x="40" y="40" fill="#8a96a3" font-family="monospace" font-size="9" font-weight="700">MOTOR</text>
    <text x="220" y="40" fill="#27d07a" font-family="monospace" font-size="9" font-weight="700">REDÜKTÖR</text>
    <text x="140" y="145" text-anchor="middle" fill="#8a96a3" font-family="monospace" font-size="10">İKİ MİL BİRLİKTE DÖNER — KAYIPSIZ TORK</text>
  </svg>`,

  linrail: `<svg viewBox="0 0 280 160" class="mech-anim" style="--spd:3s">
    <rect x="20" y="80" width="240" height="18" fill="#1c232d" stroke="#8a96a3" stroke-width="2"/>
    <line x1="20" y1="80" x2="260" y2="80" stroke="#5b6675" stroke-width="1"/>
    <line x1="20" y1="98" x2="260" y2="98" stroke="#5b6675" stroke-width="1"/>
    <g class="slide-carriage">
      <rect x="100" y="55" width="80" height="48" fill="#161b22" stroke="#f5b301" stroke-width="2.5" rx="4"/>
      <rect x="110" y="88" width="14" height="14" fill="#27d07a"/>
      <rect x="156" y="88" width="14" height="14" fill="#27d07a"/>
      <circle cx="140" cy="68" r="5" fill="#f5b301"/>
      <text x="140" y="80" text-anchor="middle" fill="#f5b301" font-family="monospace" font-size="8" font-weight="700">ARABA</text>
    </g>
    <text x="140" y="135" text-anchor="middle" fill="#8a96a3" font-family="monospace" font-size="10">CNC EKSENİ — SIFIR GERİ TEPME, 0.01mm HASSAS</text>
  </svg>`,

  spring: `<svg viewBox="0 0 280 160" class="mech-anim" style="--spd:1.2s">
    <rect x="0" y="78" width="30" height="24" fill="#1c232d" stroke="#8a96a3" stroke-width="2"/>
    <g class="spring-bounce">
      <path d="M 30 90 L 50 75 L 65 105 L 80 75 L 95 105 L 110 75 L 125 105 L 140 75 L 155 105 L 170 90" stroke="#f5b301" stroke-width="3" fill="none"/>
      <rect x="170" y="78" width="30" height="24" fill="#27d07a" stroke="#0a0d12" stroke-width="2"/>
      <line x1="200" y1="90" x2="240" y2="90" stroke="#27d07a" stroke-width="3"/>
      <path d="M 240 90 L 232 84 L 232 96 Z" fill="#27d07a"/>
    </g>
    <text x="140" y="140" text-anchor="middle" fill="#8a96a3" font-family="monospace" font-size="10">F=k·x — KUVVET SIKIŞMA İLE ARTAR</text>
  </svg>`,

  cam: `<svg viewBox="0 0 240 240" class="mech-anim" style="--spd:3s">
    <g class="rotate-cw" style="transform-origin:120px 140px">
      <ellipse cx="120" cy="140" rx="65" ry="42" fill="#1c232d" stroke="#f5b301" stroke-width="3"/>
      <circle cx="120" cy="140" r="7" fill="#8a96a3"/>
      <line x1="115" y1="140" x2="125" y2="140" stroke="#0a0d12" stroke-width="2"/>
      <line x1="120" y1="135" x2="120" y2="145" stroke="#0a0d12" stroke-width="2"/>
    </g>
    <g class="cam-follower">
      <line x1="120" y1="98" x2="120" y2="40" stroke="#aabbcc" stroke-width="4"/>
      <rect x="100" y="20" width="40" height="22" fill="#27d07a" stroke="#0a0d12" stroke-width="2"/>
      <circle cx="120" cy="100" r="8" fill="#f5b301" stroke="#0a0d12" stroke-width="1.5"/>
    </g>
    <text x="120" y="220" text-anchor="middle" fill="#8a96a3" font-family="monospace" font-size="10">KAM DÖNER → İTİCİ AŞAĞI-YUKARI</text>
  </svg>`,

  crank: `<svg viewBox="0 0 280 220" class="mech-anim" style="--spd:2.5s">
    <line x1="20" y1="20" x2="260" y2="20" stroke="#5b6675" stroke-width="1" stroke-dasharray="3 2"/>
    <line x1="20" y1="190" x2="260" y2="190" stroke="#5b6675" stroke-width="1" stroke-dasharray="3 2"/>
    <g class="rotate-cw" style="transform-origin:80px 130px">
      <circle cx="80" cy="130" r="50" fill="#1c232d" stroke="#8a96a3" stroke-width="2.5"/>
      <circle cx="80" cy="130" r="6" fill="#8a96a3"/>
      <circle cx="80" cy="80" r="9" fill="#f5b301" stroke="#0a0d12" stroke-width="2"/>
    </g>
    <g class="crank-rod">
      <line class="connecting-rod" x1="80" y1="80" x2="220" y2="60" stroke="#f5b301" stroke-width="6" stroke-linecap="round"/>
      <rect class="piston-block" x="200" y="40" width="60" height="40" fill="#27d07a" stroke="#0a0d12" stroke-width="2"/>
    </g>
    <text x="140" y="210" text-anchor="middle" fill="#8a96a3" font-family="monospace" font-size="10">DÖNME → PİSTON İLERİ-GERİ (MOTOR PRENSİBİ)</text>
  </svg>`,

  pulley: `<svg viewBox="0 0 220 240" class="mech-anim" style="--spd:2.5s">
    <rect x="80" y="10" width="60" height="14" fill="#5b6675"/>
    <circle cx="110" cy="40" r="22" fill="#1c232d" stroke="#8a96a3" stroke-width="2.5"/>
    <circle cx="110" cy="40" r="5" fill="#f5b301"/>
    <g class="rope-pull">
      <line x1="92" y1="40" x2="92" y2="200" stroke="#f5b301" stroke-width="3"/>
      <line x1="128" y1="40" x2="128" y2="180" stroke="#f5b301" stroke-width="3"/>
      <rect x="80" y="180" width="60" height="35" fill="#27d07a" stroke="#0a0d12" stroke-width="2.5"/>
      <text x="110" y="203" text-anchor="middle" fill="#0a0d12" font-family="monospace" font-size="11" font-weight="700">G</text>
      <path d="M 92 200 L 86 207 L 98 207 Z" fill="#f5b301"/>
    </g>
    <text x="135" y="105" fill="#8a96a3" font-family="monospace" font-size="9" font-weight="700">F = G/2</text>
    <text x="110" y="232" text-anchor="middle" fill="#8a96a3" font-family="monospace" font-size="9">YARI KUVVET, ÇİFT YOL</text>
  </svg>`,

  brake: `<svg viewBox="0 0 220 220" class="mech-anim" style="--spd:1.5s">
    <g class="rotate-brake">
      <circle cx="110" cy="110" r="80" fill="#1c232d" stroke="#8a96a3" stroke-width="3"/>
      <circle cx="110" cy="110" r="62" fill="#161b22" stroke="#5b6675" stroke-width="2"/>
      <circle cx="110" cy="110" r="8" fill="#f5b301"/>
      ${Array.from({length:8},(_,i)=>`<line x1="${110+Math.cos(i*Math.PI/4)*30}" y1="${110+Math.sin(i*Math.PI/4)*30}" x2="${110+Math.cos(i*Math.PI/4)*55}" y2="${110+Math.sin(i*Math.PI/4)*55}" stroke="#5b6675" stroke-width="1.5"/>`).join('')}
    </g>
    <rect class="brake-pad" x="158" y="90" width="35" height="40" fill="#ff4d4f" stroke="#0a0d12" stroke-width="2"/>
    <rect x="195" y="100" width="20" height="20" fill="#5b6675"/>
    <text x="110" y="210" text-anchor="middle" fill="#8a96a3" font-family="monospace" font-size="10">BALATA DİSKE BASTIRIR → SÜRTÜNME → DURMA</text>
  </svg>`,

  clutch: `<svg viewBox="0 0 280 180" class="mech-anim" style="--spd:3s">
    <g class="rotate-cw" style="transform-origin:80px 80px">
      <rect x="20" y="65" width="80" height="30" fill="#1c232d" stroke="#8a96a3" stroke-width="2"/>
      <rect x="95" y="50" width="14" height="60" fill="#f5b301"/>
    </g>
    <g class="clutch-right">
      <g class="rotate-cw" style="transform-origin:200px 80px">
        <rect x="180" y="65" width="80" height="30" fill="#1c232d" stroke="#8a96a3" stroke-width="2"/>
        <rect x="171" y="50" width="14" height="60" fill="#f5b301"/>
      </g>
    </g>
    <text x="60" y="40" fill="#8a96a3" font-family="monospace" font-size="9" font-weight="700">MOTOR</text>
    <text x="220" y="40" fill="#27d07a" font-family="monospace" font-size="9" font-weight="700">ÇIKIŞ</text>
    <text x="140" y="155" text-anchor="middle" fill="#8a96a3" font-family="monospace" font-size="10">DEBRİYAJ AYRILIR → ÇIKIŞ DURUR</text>
  </svg>`
};

/* Gerçek kullanım örnekleri */
const MECH_USAGE = {
  bearing: [
    {title:'Çamaşır Makinesi Tamburu',desc:'Çamaşır makinesinin tamburunun mili büyük bilyalı rulmanlarda döner. 8-10 yıllık ömür sonunda rulmanlar yorulur, makine vuruntulu çalışır.'},
    {title:'Otomobil Tekerlek Göbeği',desc:'Tekerlek mili konik makaralı rulmanda yataklanır. Hem yan hem eksenel kuvvetlere dayanır. 100bin km\'de kontrol önerilir.'},
    {title:'Rüzgâr Türbini Ana Yatağı',desc:'Devasa kanatların ağırlığını taşıyan ana yatak rulmandır. Çapı 3 metreye kadar, ömrü 20 yıl tasarlanır.'},
    {title:'CNC Tezgâh Spindle',desc:'Yüksek hassas spindle (kafa) milleri yüksek hızlı seramik bilyalı rulmanlarla yataklanır. 50.000+ rpm dönerler.'}
  ],
  rackpinion: [
    {title:'CNC Tezgâh X-Y Ekseni',desc:'Büyük CNC freze tezgâhlarında 2+ metre eksen için vidalı mil yerine helisel kremayer kullanılır. Düz dişlinin sessizlik sorunu çözülür.'},
    {title:'Otobüs/Tır Direksiyon Kutusu',desc:'Direksiyon mili pinyondur, tekerlek bağlama kolu kremayere bağlıdır. Volan dönünce tekerlek yön değiştirir.'},
    {title:'Otomatik Bahçe Kapısı',desc:'Motor pinyona bağlı, kapının altında kremayer var. Pinyon döner, kapı kayar.'},
    {title:'Asansör Güvenlik Freni',desc:'Halat koparsa governorlu fren tetiklenir, kremayer dişlere takılır ve kabin durdurulur. Güvenlik kritiği.'}
  ],
  gearbox: [
    {title:'Otomobil Şanzıman',desc:'5 ileri + 1 geri vites: her vites farklı diş çiftleri ile farklı redüksiyon oranı sağlar. 1. vites en yüksek redüksiyon (yüksek tork), 5. vites en düşük (yüksek hız).'},
    {title:'Konveyör Tahriği',desc:'Motor 1500rpm döner, redüktör 50rpm\'e düşürür ve torku 30 kat artırır. Bant ağır ürünleri taşır.'},
    {title:'Asansör Makinesi',desc:'2hp motor → 1:30 sonsuz vida redüktörü → kasnak yavaş döner, halat çekilir. Kendi-kilitleyici özelliği güvenlik.'},
    {title:'Rüzgâr Türbini',desc:'Kanat 15 rpm döner → planet redüktör 1500 rpm\'e çıkarır → jeneratör elektrik üretir.'},
    {title:'Robot Eklem',desc:'Servo motor 3000 rpm → 1:100 harmonic redüktör → eklem 30 rpm, ama yüksek tork ve hassasiyet.'}
  ],
  beltdrive: [
    {title:'Çamaşır Makinesi',desc:'Motor küçük kasnaklı, tambur büyük kasnaklı. V kayışla bağlı. Motor 2800 rpm → tambur 1400 rpm sıkma.'},
    {title:'Otomobil Eksantrik Tahriği',desc:'Triger kayışı krank milini eksantrik miline bağlar. Kayma yok = senkron çalışma. 60-100 bin km\'de değiştirilmeli.'},
    {title:'Endüstriyel Vantilatör',desc:'Motor → V kayış → büyük vantilatör çarkı. Devir azaltma için kasnak çap farkı kullanılır.'},
    {title:'3D Yazıcı Eksenleri',desc:'GT2 triger kayışı motor → eksen hareketi. 0.1 mm hassasiyet, sessiz çalışma.'},
    {title:'Tarım Makineleri',desc:'Biçerdöver bıçak millerine güç kayışla aktarılır. Kayış sigorta görevi görür — taş çarparsa kayış kayar, makine zarar görmez.'}
  ],
  chain: [
    {title:'Motorsiklet/Bisiklet Tahriği',desc:'Çıkış mili pinyonu → arka teker pinyonu, arada zincir. Kayma sıfır = tüm güç tekerlere ulaşır.'},
    {title:'Çift Çekişli Asansör',desc:'Halat yerine zincir kullanan yük asansörleri. 4 ton kapasiteye kadar.'},
    {title:'Otomobil Eksantrik Mili',desc:'Eski araçlarda triger kayışı yerine zincir vardı. Ömürlü ama gürültülü.'},
    {title:'Konveyör Sistemleri',desc:'Et endüstrisi, dökümhane gibi yüksek sıcaklık ortamlarda kayış işe yaramaz, paslanmaz zincir kullanılır.'}
  ],
  screw: [
    {title:'CNC Freze Z Ekseni',desc:'Bilyalı vidalı mil ile Z ekseni hassas hareket eder. 0.005 mm geri tepme. Spindle yukarı-aşağı pozisyonlanır.'},
    {title:'Otomobil Direksiyon Kolonu',desc:'Bazı yaşlı sistemlerde direksiyon kolon mili vidalı bilyalıdır — direksiyon dönmesi tekerlek dönmesini sağlar.'},
    {title:'3D Yazıcı Z Ekseni',desc:'Filament tepside her katman 0.2 mm yükselmeli. Vidalı mil bu hassasiyeti sağlar.'},
    {title:'Hidrolik Pres Vidası',desc:'El pompalı hidrolik preslerin yükseltme vidası trapez tip. Geri itme var ama maliyet ucuz.'},
    {title:'Lazer Kesim Tezgâhı',desc:'Lazer kafası vidalı mil ile gezer. Yüksek hızlı, hassas pozisyonlama.'}
  ],
  worm: [
    {title:'Asansör Tahrik Makinesi',desc:'Klasik asansörlerde motor → sonsuz vida → kasnak. Kendi-kilitleyici özelliği sayesinde elektrik kesilince kabin düşmez.'},
    {title:'Köprülü Vinç',desc:'1 tonun üstündeki yük asansörlerinde standart. Yüksek redüksiyon, yüksek tork.'},
    {title:'Sahne Asansörü (Tiyatro)',desc:'Yavaş ve sessiz hareket gerekli olduğu için sonsuz vida ideal.'},
    {title:'Müzik Aleti Akort Dilleri',desc:'Gitar/keman akort dilleri tek ağız sonsuz vidadır. Kullanıcı kolayca akort eder, ama tel gerginliği akoru kendi kendine bozamaz.'},
    {title:'Konveyör Düşük Hızlı Tahrik',desc:'Şişeleme hattı, fırıncılık fırın bantları gibi yavaş hareket gerektiren yerlerde.'}
  ],
  coupling: [
    {title:'Motor-Pompa Bağlantısı',desc:'Su pompasının motora bağlandığı yer. Esnek kaplin titreşim ve hizalama hatasını yutar.'},
    {title:'Motor-Redüktör Bağlantısı',desc:'Endüstriyel motor → kaplin → redüktör. Şok darbeyi sönümler.'},
    {title:'Jeneratör Bağlantısı',desc:'Dizel motoru jeneratöre bağlayan kavrama. Senkron çalışma kritik.'},
    {title:'Gemi Şaft Bağlantısı',desc:'Gemi motoru → kaplin → şaft → pervane. Gemi gövdesi esnediğinde kaplin sapmayı tolere eder.'}
  ],
  linrail: [
    {title:'CNC Tezgâh X-Y-Z Eksenleri',desc:'En yaygın kullanım. Vidalı mil + lineer kılavuz çifti her eksende. Hassasiyet 0.01 mm.'},
    {title:'3D Yazıcı (CoreXY, Cartesian)',desc:'Her eksende lineer kılavuz veya lineer yatak kullanılır. CoreXY tasarımda XY ekseni kayışlarla, Z vidalı mil ile.'},
    {title:'Otomatik Test Cihazları',desc:'Tıbbi laboratuvarda pipet kafası lineer kılavuzla XY-Z hareket eder.'},
    {title:'Robot Lineer Eksen',desc:'Sanayi robotlarına lineer 7. eksen eklemek için ray kullanılır. Robot bir ray üzerinde gezer.'},
    {title:'Asansör Kılavuz Rayı',desc:'Kabin kılavuz rayları üzerinde kayar — silindirik makaralı kızak. Sessiz ve emniyetli.'}
  ],
  spring: [
    {title:'Otomobil Süspansiyonu',desc:'Helisel basma yayı ile damperin birlikte çalışması yolun titreşimini emer. Yay yorulduğunda araç sallanır.'},
    {title:'Pnömatik Silindir Geri Dönüş',desc:'Tek etkili silindirde piston basınçla ileri gider, basınç kesilince yay geri çeker.'},
    {title:'Buton-Anahtar Yayları',desc:'Her butonun içinde küçük basma yayı vardır — bırakınca eski konuma döner.'},
    {title:'Saat Mekanizması',desc:'Klasik mekanik saatlerde sarılı yay enerji deposudur. Yavaş yavaş gevşeyerek dişlileri çalıştırır.'},
    {title:'Garaj Kapısı Karşı Ağırlık Yayı',desc:'Çekme yayları kapının ağırlığını dengeler. Kapı tek elle kolayca açılır.'}
  ],
  cam: [
    {title:'İçten Yanmalı Motor Eksantrik Mili',desc:'Eksantrik mili üzerindeki kam profilleri valfleri açar/kapatır. Her silindirin emme ve egzoz zamanlaması kam profili ile belirlenir.'},
    {title:'Dikiş Makinesi',desc:'Tek bir motorun dönmesi, kam mekanizmaları sayesinde iğne hareketini, çağanozun dönmesini ve kumaşı ilerletmeyi zamanlayarak yapar.'},
    {title:'Otomatik Tornalama',desc:'Eski otomatik tornalarda her takımın hareketi kam profilinden türetilirdi. Bugün CNC ile yapılıyor.'},
    {title:'Saçaklı Makineler',desc:'Halı dokumada saçak hareketi kam mekanizmasıyla yapılır.'}
  ],
  crank: [
    {title:'İçten Yanmalı Motor',desc:'Yanma odasındaki yanmadan oluşan basınç pistonu iter, biyel kolu krank mili döndürür. Termodinamik enerji → mekanik enerji.'},
    {title:'Buhar Lokomotifi',desc:'Eski buharlı trenlerin tekerleklerini hareket ettiren mekanizma — buhar pistonu iter, biyel kolu tekerleği döndürür.'},
    {title:'Eksantrik Pres',desc:'Sanayide metal saç şekillendirme için kullanılır. Krank dönüşü ile büyük kuvvet oluşur. Kalıp arasındaki sac şekil alır.'},
    {title:'Su Pompası (Pistonlu)',desc:'Eski el-kuyu pompaları krank-biyel ile çalışır. Kol çevirme → piston yukarı-aşağı → su çıkar.'},
    {title:'Kompresör',desc:'Pistonlu hava kompresöründe elektrik motorunun dönmesi pistonu hareket ettirir, hava sıkıştırılır.'}
  ],
  pulley: [
    {title:'Köprülü Vinç (4-makaralı)',desc:'10 ton kanca kaldırmak için motor sadece 2.5 ton kuvvet uygular. 4 makaralı palanga sistemi avantajı sağlar.'},
    {title:'Asansör Kabini',desc:'Asansör halatı genelde 2:1 makaralıdır — motor 1 ton çekerse kabin 2 ton kaldırır, ama 2 kat halat hareket eder.'},
    {title:'Yelkenli Tekneler',desc:'Yelken halatları (donanım) palanga sistemleri ile çalışır. Tek el yelken çekebilir.'},
    {title:'Çatı Kalibrasyonu',desc:'Şantiyede çatıya malzeme çıkarmak için basit palanga (1 sabit + 1 hareketli makara).'},
    {title:'Sportif Antrenman (Lat Pulldown)',desc:'Spor salonu makineleri palanga ile ağırlık yönünü değiştirir, kullanıcı oturarak çekme yapabilir.'}
  ],
  brake: [
    {title:'Otomobil Disk Fren',desc:'Pedala basınca hidrolik basınç balatayı diske bastırır, sürtünme aracı durdurur. Kinetik enerji ısıya dönüşür (frenin kızması).'},
    {title:'Asansör Güvenlik Freni',desc:'Elektromanyetik fren — enerji varsa açık (kabin hareket eder), elektrik kesilirse otomatik kapanır (fail-safe).'},
    {title:'Vinç Kaldırma Freni',desc:'Vinç motoru durunca yük aşağı kaymasın diye motor mili üstünde fren — enerji kesilince devreye girer.'},
    {title:'Yüksek Hızlı Tren (Disk + Magnet)',desc:'TGV-tipi trenlerde tekerlek disk freni + manyetik fren birlikte. Acil durdurmada kullanılır.'},
    {title:'Bisiklet Disk Fren',desc:'Yağmurda da etkili olduğu için dağ bisikletlerinde tercih edilir. Pad balata diske bastırır.'}
  ],
  clutch: [
    {title:'Otomobil Vites Değiştirme',desc:'Pedalı basınca debriyaj ayrılır, motor tekerden kopar. Vites değişir, pedal bırakılınca tekrar bağlanır.'},
    {title:'Yumuşak Kalkış (Soft-Start)',desc:'Büyük motorlar kalkışta darbeli yüklenmesin diye elektromanyetik debriyaj kademe kademe bağlar.'},
    {title:'Tezgah Spindle Kavraması',desc:'CNC tezgah aniden durmasın diye motor-spindle arası manyetik toz debriyaj. Akım ile tork ayarlanır.'},
    {title:'Otomatik Şanzıman (Tork Konvertör)',desc:'Hidrolik tork konvertör — debriyaj görevi görür. Sıvı kavrama, pedal yok.'},
    {title:'Helikopter Rotor Kavraması',desc:'Motor çalışıp ısınana kadar rotor dönmez. Sonra debriyaj bağlanır, rotor hızla dönmeye başlar.'}
  ]
};

function showMechDetail(id){
  const item=MECH_ITEMS.find(m=>m.id===id);
  if(!item)return;
  // Stat tracking
  if(typeof PROFILE!=='undefined'){
    PROFILE.stats.mechCardsViewed = (PROFILE.stats.mechCardsViewed||0)+1;
    saveProfile(PROFILE);
    checkBadges();
  }
  document.getElementById('infoTitle').textContent=item.title;
  const body=document.getElementById('infoBody');
  const animSvg = MECH_ANIM[id] || MECH_SVG[id] || '';
  const usage = MECH_USAGE[id] || [];
  body.innerHTML=`
    <div class="mech-anim-wrap">
      ${animSvg}
      <div class="mech-anim-controls">
        <span class="mech-anim-lbl">⚙ Canlı Simülasyon</span>
        <label class="mech-speed-label">Hız:
          <input type="range" id="mechSpeedSlider" min="0.3" max="3" step="0.1" value="1" oninput="setMechSpeed(this.value)">
        </label>
        <button class="btn ghost sm" onclick="toggleMechAnim(this)">⏸ Durdur</button>
      </div>
    </div>
    <div class="info-section">
      <h4>Tanım</h4>
      <p>${item.desc}</p>
    </div>
    ${usage.length?`<div class="info-section">
      <h4>Kullanım Örnekleri</h4>
      <div class="usage-list">
        ${usage.map(u=>`<div class="usage-card">
          <div class="usage-title">▸ ${u.title}</div>
          <div class="usage-desc">${u.desc}</div>
        </div>`).join('')}
      </div>
    </div>`:''}
    <div class="info-section">
      <h4>Çeşitler</h4>
      <div class="info-grid">
        ${item.types.map(t=>`<div class="ig"><div class="k">${t[0]}</div><div class="v">${t[1]}</div></div>`).join('')}
      </div>
    </div>
    ${item.formulas?`<div class="info-section">
      <h4>Formüller</h4>
      ${item.formulas.map(f=>`<div style="background:#0a0d12;padding:10px;border-radius:6px;border:1px solid var(--line);margin-bottom:6px">
        <div style="font-size:11px;color:var(--accent);letter-spacing:1px;text-transform:uppercase;margin-bottom:3px">${f[0]}</div>
        <div style="font-family:'JetBrains Mono',monospace;color:var(--ink);font-size:14px;font-weight:600">${f[1]}</div>
        ${f[2]?`<div style="font-size:11px;color:var(--muted);margin-top:3px">${f[2]}</div>`:''}
      </div>`).join('')}
    </div>`:''}
    <div class="info-section">
      <h4>Bakım & Dikkat</h4>
      <p>${item.care}</p>
    </div>
    ${item.std?`<div class="info-section">
      <h4>Standart</h4>
      <p style="font-size:12px;color:var(--muted)"><code>${item.std}</code></p>
    </div>`:''}
  `;
  document.getElementById('infoModal').classList.add('show');
}

function setMechSpeed(val){
  const svg = document.querySelector('.mech-anim');
  if(svg){
    // Hız çarpanı: 1 = normal, 2 = 2x hızlı, 0.5 = yarı hız
    // CSS animation-duration multiplier'ı ayarlamak için custom property
    svg.style.setProperty('--spd-mult', (1/val).toFixed(2));
  }
}

function toggleMechAnim(btn){
  const svg = document.querySelector('.mech-anim');
  if(!svg)return;
  const stopped = svg.classList.toggle('paused');
  btn.textContent = stopped ? '▶ Başlat' : '⏸ Durdur';
}