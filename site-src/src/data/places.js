/* ============================================================
   ROTA YAHYALI — Tek merkezî veri kaynağı
   Yeni bir gezi noktası / galeri karesi eklemek için sadece
   buraya bir nesne ekleyin; sayfa otomatik güncellenir.
   ============================================================ */

const commons = (file, w = 1400) =>
  `https://commons.wikimedia.org/wiki/Special:FilePath/${file}?width=${w}`;

/* ---- Gezilecek Yerler (kartlar) ---- */
export const places = [
  {
    slug: 'kapuzbasi',
    tag: 'Doğa Harikası',
    title: 'Kapuzbaşı Şelaleleri',
    desc: "Aladağlar Milli Parkı'nın kalbinde, kayalıklardan fışkıran 7 kollu dev çağlayan. Debisiyle Türkiye'nin en görkemli şelalelerinden biri.",
    meta: ['⏱ ~1.5 sa merkeze', '🥾 Yürüyüş'],
    gradient: 'bg-kapuzbasi',
    localImg: 'img/kapuzbasi.jpg',
    remoteImg: commons('Heybetli_g%C3%B6rkemiyle_Kapuzba%C5%9F%C4%B1_%C5%9Eelalesi.jpg'),
  },
  {
    slug: 'aladaglar',
    tag: 'Milli Park',
    title: 'Aladağlar Milli Parkı',
    desc: "Karlı zirveleri, buzul gölleri ve efsanevi tırmanış rotalarıyla dağcıların gözdesi. Türkiye'nin en etkileyici dağ ekosistemlerinden.",
    meta: ['🏔️ 3756 m', '⛺ Kamp'],
    gradient: 'bg-aladaglar',
    localImg: 'img/aladaglar.jpg',
    remoteImg: commons('Alada%C4%9Flar_Mountains.jpg'),
  },
  {
    slug: 'derebag',
    tag: 'Şelale',
    title: 'Derebağ Şelalesi',
    desc: 'Süleymanfakılı yakınında, yosunlu kayalardan süzülen incecik perde. Serin gölgeliği ve piknik alanıyla huzur veren bir kaçamak.',
    meta: ['🌿 Piknik', '📸 Fotoğraf'],
    gradient: 'bg-derebag',
    localImg: 'img/derebag.jpg',
    remoteImg: null,
  },
  {
    slug: 'kovali',
    tag: 'Kanyon & Su',
    title: 'Kovalı Şelalesi',
    desc: 'Zamantı vadisinin saklı köşesi. Kanyon yürüyüşü sevenler için berrak havuzları ve doğal kaydırağıyla tam bir yaz durağı.',
    meta: ['🚶 Kanyon', '💧 Yüzme'],
    gradient: 'bg-kovali',
    localImg: 'img/kovali.jpg',
    remoteImg: null,
  },
  {
    slug: 'barsama',
    tag: 'Tarih',
    title: 'Barsama Antik Yerleşimi',
    desc: 'Roma ve Bizans izleri taşıyan kaya mezarları ve kalıntılar. Yahyalı’nın binlerce yıllık geçmişine açılan bir pencere.',
    meta: ['🏛️ Antik', '🗿 Kaya mezar'],
    gradient: 'bg-barsama',
    localImg: 'img/barsama.jpg',
    remoteImg: null,
  },
  {
    slug: 'camlica',
    tag: 'Yayla',
    title: 'Çamlıca & Yaylalar',
    desc: 'Sedir ve karaçam ormanlarıyla kaplı serin yaylalar. Temiz havası ve yayla kültürüyle yazın en gözde soluklanma noktaları.',
    meta: ['🌲 Orman', '🌡️ Serin'],
    gradient: 'bg-camlica',
    localImg: 'img/camlica.jpg',
    remoteImg: null,
  },
];

/* ---- Hakkında bölümü öne çıkanları ---- */
export const highlights = [
  { icon: 'peak', title: "Aladağlar'ın kucağında", text: 'Deniz seviyesinden ~1210 m yükseklikte; ilçe sınırları 3000 m’yi aşan zirvelere uzanır.' },
  { icon: 'drop', title: 'Suyun ülkesi', text: 'Kapuzbaşı, Derebağ ve Kovalı şelaleleri; Zamantı Irmağı ve sayısız kaynak.' },
  { icon: 'weave', title: 'El emeği miras', text: 'Dünya müzelerinde sergilenen Yahyalı halısı ve coğrafi işaretli Yahyalı rokası.' },
];

/* ---- İstatistikler (hero sayaçları) ---- */
export const stats = [
  { value: 7, label: 'Katlı Şelale' },
  { value: 3756, label: 'm Zirve (Aladağlar)' },
  { value: 55000, label: 'Hektar Milli Park', plus: true },
  { value: 1, label: 'Coğrafi İşaretli Roka' },
];

/* ---- Tarihçe (zaman çizelgesi) ---- */
export const timeline = [
  { era: 'Antik Çağ', title: 'İlk yerleşimler', text: 'Bölge; Hitit, Roma ve Bizans dönemlerinde önemli bir geçiş ve yerleşim alanıydı. Barsama gibi antik yerleşimler, kaya mezarları ve kalıntılarla bu geçmişe tanıklık eder.' },
  { era: '11.–13. Yüzyıl', title: 'Selçuklu dönemi', text: "Malazgirt sonrası Anadolu'nun Türkleşmesiyle bölge Selçuklu hâkimiyetine girdi. Zamantı havzası, ticaret ve konar-göçer Türkmen boyları için önemli bir yurt oldu." },
  { era: '14.–15. Yüzyıl', title: 'Beylikler & Dulkadiroğulları', text: 'Bölge, Dulkadiroğulları Beyliği ile Türkmen boylarının etki alanında şekillendi. Yörenin adının, buraya yerleşen bir Türkmen ileri geleni “Yahya”dan geldiği rivayet edilir.' },
  { era: '16. Yüzyıl →', title: 'Osmanlı dönemi', text: 'Osmanlı idaresinde tarım, hayvancılık ve el sanatlarıyla gelişen bir kaza haline geldi. Yahyalı halısı bu dönemde ününü Anadolu dışına taşıdı.' },
  { era: 'Cumhuriyet', title: 'Bugünkü Yahyalı', text: "1944'te ilçe statüsü kazandı. Bugün Kayseri'nin doğa turizmi, halıcılık ve tarımıyla öne çıkan; Aladağlar'a açılan güney kapısı konumundadır." },
];

/* ---- Galeri ---- */
export const gallery = [
  { cap: 'Kapuzbaşı Şelaleleri', ph: 'ph-g1', ar: '3/4', local: 'img/g-kapuzbasi.jpg', remote: commons('Alada%C4%9Flar%C4%B1n_g%C3%B6z_nuru_Kapuzba%C5%9F%C4%B1_%C5%9Eelalesi.jpg', 1200) },
  { cap: 'Aladağlar zirveleri', ph: 'ph-g5', ar: '4/3', local: 'img/g-aladaglar.jpg', remote: commons('Aladaglar_detail.JPG', 1200) },
  { cap: 'Zamantı Irmağı & Kapuzbaşı', ph: 'ph-g4', ar: '1/1', local: 'img/g-zamanti.jpg', remote: commons('Zamant%C4%B1_%C4%B1rma%C4%9F%C4%B1yla_bir_b%C3%BCt%C3%BCn_olan_Kapuzba%C5%9F%C4%B1_%C5%9Eelalesi.jpg', 1200) },
  { cap: 'Yahyalı halısı', ph: 'ph-g3', ar: '4/3', local: 'img/g-hali.jpg', remote: null },
  { cap: 'Derebağ Şelalesi', ph: 'ph-g6', ar: '3/4', local: 'img/g-derebag.jpg', remote: null },
  { cap: 'Yayla manzarası', ph: 'ph-g2', ar: '4/3', local: 'img/g-yayla.jpg', remote: null },
  { cap: 'Roka tarlaları', ph: 'ph-g2', ar: '1/1', local: 'img/g-roka.jpg', remote: null },
  { cap: 'Kovalı kanyonu', ph: 'ph-g4', ar: '3/4', local: 'img/g-kovali.jpg', remote: null },
  { cap: 'Barsama kalıntıları', ph: 'ph-g3', ar: '4/3', local: 'img/g-barsama.jpg', remote: null },
];

/* ---- Harita noktaları (yaklaşık koordinatlar) ---- */
export const mapPoints = [
  { n: 'Yahyalı Merkez', d: 'İlçe merkezi · başlangıç noktası', lat: 38.0989, lng: 35.3567, z: 13, key: true },
  { n: 'Kapuzbaşı Şelaleleri', d: 'Aladağlar içinde 7 kollu dev çağlayan', lat: 37.7667, lng: 35.5333, z: 13 },
  { n: 'Aladağlar Milli Parkı', d: 'Karlı zirveler & tırmanış rotaları', lat: 37.83, lng: 35.2, z: 11 },
  { n: 'Derebağ Şelalesi', d: 'Süleymanfakılı yakını · piknik', lat: 38.055, lng: 35.245, z: 13 },
  { n: 'Kovalı Şelalesi', d: 'Zamantı vadisi · kanyon & havuz', lat: 37.92, lng: 35.43, z: 13 },
  { n: 'Barsama Antik Yerleşimi', d: 'Roma-Bizans kaya mezarları', lat: 38.07, lng: 35.4, z: 13 },
  { n: 'Zamantı Irmağı', d: 'İlçeyi besleyen ana su yolu', lat: 37.95, lng: 35.45, z: 12 },
];

/* ---- Görsel telif kaynakları ---- */
export const credits = [
  { label: 'Kapuzbaşı Şelalesi', href: 'https://commons.wikimedia.org/wiki/File:Heybetli_g%C3%B6rkemiyle_Kapuzba%C5%9F%C4%B1_%C5%9Eelalesi.jpg' },
  { label: 'Aladağlar Dağları', href: 'https://commons.wikimedia.org/wiki/File:Alada%C4%9Flar_Mountains.jpg' },
  { label: 'Demirkazık Zirvesi', href: 'https://commons.wikimedia.org/wiki/File:BDK_%28_Buyuk_Demir_Kazik%29_Mountain_%283756_m%29._Aladaglar_National_Park.jpg' },
  { label: 'Kapuzbaşı (Aladağların göz nuru)', href: 'https://commons.wikimedia.org/wiki/File:Alada%C4%9Flar%C4%B1n_g%C3%B6z_nuru_Kapuzba%C5%9F%C4%B1_%C5%9Eelalesi.jpg' },
  { label: 'Aladağlar detay', href: 'https://commons.wikimedia.org/wiki/File:Aladaglar_detail.JPG' },
  { label: 'Zamantı Irmağı & Kapuzbaşı', href: 'https://commons.wikimedia.org/wiki/File:Zamant%C4%B1_%C4%B1rma%C4%9F%C4%B1yla_bir_b%C3%BCt%C3%BCn_olan_Kapuzba%C5%9F%C4%B1_%C5%9Eelalesi.jpg' },
];

export const aboutRemoteImg = commons('BDK_%28_Buyuk_Demir_Kazik%29_Mountain_%283756_m%29._Aladaglar_National_Park.jpg', 1200);
