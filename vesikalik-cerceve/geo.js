// Vesikalık anahtarlık — geometri üreticisi.
//
// Tüm ölçüler mm. Koordinatlar "montajlı" hâldedir ve baskı yönüyle aynıdır:
//   z = 0      → anahtarlığın ön yüzü (tablaya yatar)
//   z = ft     → fotoğraf yığınının başladığı yer (koruyucu + fotoğraf)
//   zb0..zb1   → arka kapak (tırnaklarıyla birlikte)
//   zt         → gövdenin arka kenarı (dudak)
// Arka kapak da aynı yönde basılır: iç yüzü (fotoğrafa bakan) tablaya, yazılı yüzü yukarı.
//
// Kilit sistemi vidasızdır: arka kapağın kenarlarında düzlem içinde esneyen dil
// (konsol) tırnaklar var; ucundaki çıkıntı gövde duvarındaki kanala oturur.
// Duvarın üst iç kenarındaki pah tırnağı içeri iter, kapak bastırınca "klik" diye
// yerine girer.

import { normalizeText, layoutLine } from './font.js';

export const WINDOW_SHAPES = {
  rect: 'Dikdörtgen',
  round: 'Yuvarlak köşe',
  oval: 'Oval',
  arch: 'Kemer',
};

// Bütün modellerin ortak varsayılanları.
export const BASE = {
  pw: 35, ph: 45,     // fotoğraf ölçüsü
  pt: 0.3,            // fotoğraf kalınlığı
  gt: 0,              // şeffaf koruyucu (asetat/pleksi) kalınlığı, 0 = yok
  ov: 1.5,            // pencerenin fotoğrafın üstüne bindirmesi (her kenar)
  win: 'oval', wr: 3, bevel: true,
  B: 3,               // yuva çevresindeki en ince kenar
  deco: true,         // ön yüzdeki kazıma süs çizgileri
  hole: 4.5,          // anahtar halkası deliği
  ft: 1.2,            // ön yüz kalınlığı
  bt: 1.6,            // arka kapak kalınlığı
  lip: 1.5,           // kapağın üstünde kalan duvar (kanal + giriş pahı)
  clips: 2, lock: 'detent', d: 0.6,
  clr: 0.3,           // fotoğraf ile yuva duvarı arası
  pclr: 0.2,          // kapak ile yuva duvarı arası
  yazi: 'DALYAN', yazi2: '',
  yaziH: 4.5, yaziTip: 'raised',
  stOn: false, stImg: 'caretta', stShape: 'circle',
  stW: 22, stH: 22, stDepth: 0.3,
};

export const STICKER_SHAPES = { circle: 'Daire', oval: 'Oval', rect: 'Yuvarlak kare' };

export const MODELS = [
  { id: 'caretta', ad: 'Caretta', tarif: 'Deniz kaplumbağası: fotoğraf kabukta, halka başında.',
    def: { win: 'oval', B: 3 } },
  { id: 'bulut', ad: 'Bulut', tarif: 'Pofuduk bulut kenarlı anahtarlık.',
    def: { win: 'round', wr: 5, B: 3 } },
  { id: 'yengec', ad: 'Mavi Yengeç', tarif: 'Dalyan’ın mavi yengeci: kıskaçlar, bacaklar, yan dikenler.',
    def: { win: 'oval', B: 3 } },
  { id: 'mezar', ad: 'Kaya Mezarı', tarif: 'Kaunos kral mezarı cephesi: alınlık, sütunlar, basamaklar.',
    def: { win: 'rect', B: 4.5, bevel: false } },
  { id: 'gunes', ad: 'Güneş', tarif: 'İztuzu güneşi: ışınlı oval gövde.',
    def: { win: 'oval', B: 3 } },
  { id: 'madalyon', ad: 'Madalyon', tarif: 'Boncuk kenarlı oval madalyon.',
    def: { win: 'oval', B: 3 } },
  { id: 'klasik', ad: 'Klasik', tarif: 'Sade, yuvarlak köşeli anahtarlık.',
    def: { win: 'round', wr: 3, B: 3.5, deco: false } },
  // minik seri: fotoğrafı sıkı saran, küçük gövdeli modeller
  { id: 'damla', ad: 'Damla', minik: true, tarif: 'Minik su damlası; halka sivri ucunda.',
    def: { win: 'round', wr: 4, B: 2.8, hole: 4 } },
  { id: 'balik', ad: 'Balık', minik: true, tarif: 'Minik balık: yuvarlak baş, yan yüzgeçler, çatal kuyruk.',
    def: { win: 'oval', B: 2.8, hole: 4 } },
  { id: 'kalp', ad: 'Kalp', minik: true, tarif: 'Minik kalp: iki tepeli üst, sivri alt, halka ortada.',
    def: { win: 'round', wr: 4, B: 2.8, hole: 4 } },
  { id: 'ahtapot', ad: 'Ahtapot', minik: true, tarif: 'Minik ahtapot: kubbe kafa, gözler, kıvrık kollar.',
    def: { win: 'arch', B: 2.8, hole: 4 } },
  { id: 'kabuk', ad: 'Deniz Kabuğu', minik: true, tarif: 'Minik tarak kabuğu: tırtıklı üst kenar, kaburga çizgileri.',
    def: { win: 'arch', B: 2.8, hole: 4 } },
];

// Arayüz bu listeden form üretir; sınırlar build() içinde de uygulanır.
export const PARAMS = [
  { k: 'yazi', g: 'yazi', ad: 'Arka yazı (1. satır)', type: 'text', max: 14,
    ipucu: 'Arka kapağa kabartma basılır. Türkçe harf, rakam, - . ! ♥ (<3) desteklenir.' },
  { k: 'yazi2', g: 'yazi', ad: 'Arka yazı (2. satır)', type: 'text', max: 14 },
  { k: 'yaziTip', g: 'yazi', ad: 'Yazı tipi', type: 'select',
    options: { raised: 'Kabartma', engraved: 'Oyma' } },
  { k: 'yaziH', g: 'yazi', ad: 'Harf yüksekliği', min: 3, max: 9, step: 0.5 },

  { k: 'stOn', g: 'sticker', ad: 'Arka kapağa renkli sticker', type: 'bool',
    ipucu: 'Kapağa sticker yuvası açılır; sticker kâğıdına basıp kesip yapıştırırsın.' },
  { k: 'stImg', g: 'sticker', ad: 'Görsel', type: 'sticker', show: (p) => p.stOn,
    options: { caretta: 1, gunbatimi: 1, yengec: 1, mezar: 1, bulut: 1, ozel: 1 } },
  { k: 'stShape', g: 'sticker', ad: 'Sticker şekli', type: 'select', options: STICKER_SHAPES,
    show: (p) => p.stOn },
  { k: 'stW', g: 'sticker', ad: 'Sticker genişliği', min: 8, max: 60, step: 0.5, show: (p) => p.stOn,
    ipucu: 'Kapağa sığmazsa otomatik küçülür.' },
  { k: 'stH', g: 'sticker', ad: 'Sticker yüksekliği', min: 8, max: 70, step: 0.5,
    show: (p) => p.stOn && p.stShape !== 'circle' },
  { k: 'stDepth', g: 'sticker', ad: 'Yuva derinliği', min: 0.1, max: 0.8, step: 0.05,
    show: (p) => p.stOn, ipucu: 'Vinil/kâğıt sticker için 0.2–0.3; üstüne şeffaf bant/laminasyon yapacaksan 0.4–0.5.' },

  { k: 'pw', g: 'foto', ad: 'Fotoğraf genişliği', min: 15, max: 80, step: 0.5 },
  { k: 'ph', g: 'foto', ad: 'Fotoğraf yüksekliği', min: 15, max: 80, step: 0.5 },
  { k: 'pt', g: 'foto', ad: 'Fotoğraf kalınlığı', min: 0.1, max: 1.2, step: 0.05 },
  { k: 'gt', g: 'foto', ad: 'Şeffaf koruyucu kalınlığı', min: 0, max: 2, step: 0.1,
    ipucu: '0 = koruyucu yok. Anahtarlıkta fotoğraf yıpranmasın diye 0.3–0.5 mm asetat önerilir.' },
  { k: 'ov', g: 'foto', ad: 'Pencere bindirmesi', min: 0.5, max: 6, step: 0.1,
    ipucu: 'Fotoğrafın her kenardan gövde altında kalan kısmı.' },

  { k: 'win', g: 'cerceve', ad: 'Pencere şekli', type: 'select', options: WINDOW_SHAPES },
  { k: 'wr', g: 'cerceve', ad: 'Pencere köşe yarıçapı', min: 0.5, max: 10, step: 0.5,
    show: (p) => p.win === 'round' },
  { k: 'bevel', g: 'cerceve', ad: 'Pencere kenarı pahlı', type: 'bool' },
  { k: 'deco', g: 'cerceve', ad: 'Ön yüz süs çizgileri', type: 'bool' },
  { k: 'B', g: 'cerceve', ad: 'En ince kenar', min: 2.5, max: 12, step: 0.5 },
  { k: 'hole', g: 'cerceve', ad: 'Halka deliği çapı', min: 2.5, max: 8, step: 0.5 },
  { k: 'ft', g: 'cerceve', ad: 'Ön yüz kalınlığı', min: 0.8, max: 3, step: 0.1 },
  { k: 'bt', g: 'cerceve', ad: 'Arka kapak kalınlığı', min: 1.2, max: 3, step: 0.1 },

  { k: 'clips', g: 'klips', ad: 'Klips sayısı', type: 'select',
    options: { 2: '2 (uzun kenarlar)', 4: '4 (her kenar)' } },
  { k: 'lock', g: 'klips', ad: 'Kilit tipi', type: 'select',
    options: { detent: 'Sökülebilir (fotoğraf değişir)', fixed: 'Kalıcı (sıkı kilit)' } },
  { k: 'd', g: 'klips', ad: 'Tırnak kilit derinliği', min: 0.3, max: 1.2, step: 0.05,
    ipucu: 'Büyüdükçe kilit sertleşir. PLA için 0.5–0.7 iyi.' },
  { k: 'lip', g: 'klips', ad: 'Kapak üstü duvar (dudak)', min: 1.0, max: 3, step: 0.1 },
  { k: 'pclr', g: 'klips', ad: 'Kapak toleransı', min: 0.05, max: 0.6, step: 0.05,
    ipucu: 'Kapak yuvaya sıkı giriyorsa artır.' },
  { k: 'clr', g: 'klips', ad: 'Fotoğraf boşluğu', min: 0.1, max: 1, step: 0.05 },
];

export function modelById(id) {
  return MODELS.find((m) => m.id === id) || MODELS[0];
}

export function defaultsFor(id) {
  return { ...BASE, ...modelById(id).def };
}

// Parametreleri sınırla ve tiplerini düzelt.
export function sanitize(id, raw) {
  const m = modelById(id);
  const p = { ...BASE, ...m.def, ...raw };
  for (const d of PARAMS) {
    if (d.type === 'bool') p[d.k] = p[d.k] === true || p[d.k] === 'true' || p[d.k] === 1;
    else if (d.type === 'text') p[d.k] = String(p[d.k] ?? '').slice(0, d.max);
    else if (d.type === 'select' || d.type === 'sticker') {
      const keys = Object.keys(d.options);
      let v = String(p[d.k]);
      if (!keys.includes(v)) v = String(BASE[d.k]);
      p[d.k] = /^\d+$/.test(v) ? Number(v) : v;
    } else {
      let v = Number(p[d.k]);
      if (!Number.isFinite(v)) v = BASE[d.k];
      p[d.k] = Math.min(d.max, Math.max(d.min, v));
    }
  }
  return p;
}

// ---------------------------------------------------------------------------
// WASM nesneleri elle silinmeli; ürettiğimiz her nesneyi kaydedip iş bitince
// topluca siliyoruz.

function installGC(M) {
  if (M.__vcGC) return M.__vcGC;
  const reg = [];
  const track = (r) => {
    if (Array.isArray(r)) r.forEach(track);
    else if (r && typeof r.delete === 'function') reg.push(r);
    return r;
  };
  const wrap = (obj, names) => {
    for (const n of names) {
      const f = obj[n];
      if (typeof f !== 'function') continue;
      obj[n] = function (...a) { return track(f.apply(this, a)); };
    }
  };
  wrap(M.Manifold, ['cube', 'cylinder', 'sphere', 'extrude', 'union', 'difference',
    'intersection', 'hull', 'compose', 'ofMesh']);
  wrap(M.Manifold.prototype, ['add', 'subtract', 'intersect', 'decompose', 'warp',
    'translate', 'rotate', 'scale', 'mirror', 'hull', 'simplify', 'slice']);
  wrap(M.CrossSection, ['square', 'circle', 'union', 'difference', 'intersection',
    'hull', 'ofPolygons', 'compose']);
  wrap(M.CrossSection.prototype, ['add', 'subtract', 'intersect', 'translate', 'rotate',
    'scale', 'mirror', 'offset', 'hull', 'simplify', 'decompose']);
  M.__vcGC = {
    cleanup() {
      for (const o of reg) { try { o.delete(); } catch (e) { /* zaten silinmiş */ } }
      reg.length = 0;
    },
  };
  return M.__vcGC;
}

// ---------------------------------------------------------------------------

export function build(M, id, raw, opts = {}) {
  const gc = installGC(M);
  try {
    const r = buildInner(M, id, raw, opts);
    const { frame, plate, centers } = r;
    const plates = M.Manifold.union(centers.map((cx) => plate.translate([cx, 0, 0])));
    const fb = frame.boundingBox();
    const pb = plate.boundingBox();
    const stats = {
      frame: { status: frame.status(), pieces: frame.decompose().length, vol: frame.volume() },
      plate: { status: plate.status(), pieces: plate.decompose().length, vol: plate.volume() },
    };
    if (opts.check) stats.overlap = plates.intersect(frame).volume();
    return {
      p: r.p, model: r.model, warn: r.warn,
      frame: toMesh(frame),
      plate: toMesh(plate),
      platesAssembled: toMesh(plates),
      plateCount: centers.length,
      centers,
      stats,
      dims: {
        ...r.dims,
        frame: [fb.max[0] - fb.min[0], fb.max[1] - fb.min[1], fb.max[2] - fb.min[2]],
        frameMin: [...fb.min], frameMax: [...fb.max],
        plate: [pb.max[0] - pb.min[0], pb.max[1] - pb.min[1], pb.max[2] - pb.min[2]],
        plateMin: [...pb.min], plateMax: [...pb.max],
      },
      photo: r.photo,
    };
  } finally {
    gc.cleanup();
  }
}

const SIDE_ANG = { R: 0, T: 90, L: 180, B: 270 };
const MINI_SHAPES = ['damla', 'balik', 'kalp', 'ahtapot', 'kabuk'];

function buildInner(M, id, raw, opts) {
  const { Manifold: Mf, CrossSection: CS } = M;
  const seg = opts.seg || 72;
  const m = modelById(id);
  const p = sanitize(id, raw);
  const warn = [];

  // ---- 2B yardımcılar ----
  const rect = (x0, x1, y0, y1) =>
    CS.square([x1 - x0, y1 - y0]).translate([x0, y0]);
  const rrect = (w, h, r) => {
    r = Math.max(0, Math.min(r, w / 2 - 0.01, h / 2 - 0.01));
    if (r < 0.05) return CS.square([w, h], true);
    return CS.square([w - 2 * r, h - 2 * r], true).offset(r, 'Round', 2, seg);
  };
  const circle = (rad, cx = 0, cy = 0) => CS.circle(rad, seg).translate([cx, cy]);
  const ellipse = (a, b) => CS.circle(1, seg * 2).scale([a, b]);
  const capsule = (x1, y1, r1, x2, y2, r2) => CS.hull([circle(r1, x1, y1), circle(r2, x2, y2)]);
  const poly = (pts) => {
    let s = 0;
    for (let i = 0; i < pts.length; i++) {
      const [x1, y1] = pts[i], [x2, y2] = pts[(i + 1) % pts.length];
      s += x1 * y2 - x2 * y1;
    }
    return CS.ofPolygons([s < 0 ? [...pts].reverse() : pts]);
  };
  // |x/a|^n + |y/b|^n = 1 eğrisi (n=2 elips, büyüdükçe köşeleşir)
  const sePoint = (a, b, n, t) => {
    const c = Math.cos(t), s = Math.sin(t);
    return [a * Math.sign(c) * Math.abs(c) ** (2 / n), b * Math.sign(s) * Math.abs(s) ** (2 / n)];
  };
  const seNormal = (a, b, n, [x, y]) => {
    const gx = Math.sign(x) * Math.abs(x / a) ** (n - 1) / a;
    const gy = Math.sign(y) * Math.abs(y / b) ** (n - 1) / b;
    const l = Math.hypot(gx, gy) || 1;
    return [gx / l, gy / l];
  };
  const superEll = (a, b, n, N = 180) =>
    poly(Array.from({ length: N }, (_, i) => sePoint(a, b, n, (2 * Math.PI * i) / N)));
  // Kapalı bir hattın içine, kenardan `inset` içeride `w` kalınlığında çizgi (süs).
  const band = (cs, inset, w) => cs.offset(-inset, 'Round', 2, seg).subtract(cs.offset(-inset - w, 'Round', 2, seg));
  const prism = (cs, z0, z1) => Mf.extrude(cs, z1 - z0).translate([0, 0, z0]);
  const box = (x0, x1, y0, y1, z0, z1) =>
    Mf.cube([x1 - x0, y1 - y0, z1 - z0]).translate([x0, y0, z0]);

  // ---- türetilmiş ölçüler ----
  const portrait = p.ph >= p.pw;
  const Cx = p.pw / 2 + p.clr;       // yuva yarı genişliği
  const Cy = p.ph / 2 + p.clr;       // yuva yarı yüksekliği
  const Px = Cx - p.pclr, Py = Cy - p.pclr;   // kapak yarı ölçüleri
  const B = p.B;
  const K = Cx + B, H = Cy + B;      // en sade (dikdörtgen) gövdenin yarı ölçüleri

  const zb0 = p.ft + p.gt + p.pt + 0.1;
  const zb1 = zb0 + p.bt;
  const zt = zb1 + p.lip;

  const D = p.d + 0.25;              // kanal derinliği (duvar yüzünden)
  const gTop = zb1 + 0.15;           // kanal tavanı
  let ch;                            // giriş pahı
  if (p.lock === 'detent') ch = Math.min(0.6, Math.max(0.2, zt - (gTop + D)));
  else ch = Math.min(0.6, Math.max(0.2, p.lip - 0.5));
  if (zt - ch < gTop + 0.2) warn.push('Dudak çok ince: kilit zayıf kalabilir, "Kapak üstü duvar" değerini artır.');

  const tw = 2.0;                    // tırnak dili genişliği (düzlem içinde)
  const g = Math.max(0.8, p.d + 0.3);// dil arkasındaki yarık
  const nl = 5;                      // çıkıntı boyu
  const clipSides = p.clips === 4 ? ['R', 'T', 'L', 'B'] : (portrait ? ['R', 'L'] : ['T', 'B']);
  const notchSide = portrait || p.clips === 4 ? 'B' : 'R';
  const halfN = (s) => (s === 'R' || s === 'L' ? Cx : Cy);   // kenara dik yarı ölçü (yuva)
  const halfE = (s) => (s === 'R' || s === 'L' ? Cy : Cx);   // kenar boyunca yarı uzunluk
  const tongueL = (s) => {
    const hv = halfE(s) - p.pclr;
    return Math.max(6, Math.min(18, 0.9 * hv, hv + nl / 2 - 2));
  };
  // Çentik, kenarda tırnak varsa onun serbest ucunun ötesine kayar.
  const notchV = (s) => (clipSides.includes(s) ? Math.max(0, Math.min(halfE(s) - 4.5, nl / 2 + g + 5)) : 0);

  // ---- dış hat (model) ----
  const parts = [];
  const deco = [];
  let ring;
  const lr = p.hole / 2 + 2.6;       // halka kulağının yarıçapı
  const fit = (n) => 2 ** (1 / n);   // köşesi yuvaya değen süper elips çarpanı

  if (m.id === 'caretta') {
    const n = 3, a = Cx * fit(n) + B, b = Cy * fit(n) + B;
    const shell = superEll(a, b, n);
    parts.push(shell);
    const hy = b + 7;                                   // baş
    parts.push(CS.hull([ellipse(7.5, 8.5).translate([0, hy]), rect(-5.5, 5.5, b - 4, b - 3)]));
    const sx = a * 0.72, sy = b * 0.5;                  // ön yüzgeç (omuz)
    const front = CS.union([
      capsule(sx - 2, sy, 6, sx + 9, sy - 2, 4),
      capsule(sx + 9, sy - 2, 4, sx + 17, sy - 10, 1.8),
    ]);
    const hx = a * 0.6, hyy = -b * 0.62;               // arka yüzgeç
    const rear = capsule(hx - 2, hyy, 4.5, hx + 9, hyy - 9, 2.2);
    parts.push(front, front.mirror([1, 0]), rear, rear.mirror([1, 0]));
    parts.push(capsule(0, -b + 2, 2.6, 0, -b - 6, 1.0)); // kuyruk
    ring = [0, b + 4.2];
    deco.push(band(shell, 1.0, 0.7));
    deco.push(circle(1.0, -3.4, hy + 3.2), circle(1.0, 3.4, hy + 3.2));
  } else if (m.id === 'bulut') {
    // Yuvanın çevresinde, dikdörtgen bir yol boyunca birbirine binen kabarcıklar.
    const ex = K - 1.5, ey = H - 1.5;
    const sc = K / 20.8;
    const pattern = [12, 8.5, 10, 7.5, 9.5, 8, 10.5, 7.5, 9, 8.5, 10, 8];
    const per = 4 * (ex + ey);
    const at = (s) => {                       // tepe ortasından saat yönünde
      s = ((s % per) + per) % per;
      if (s < ex) return [s, ey];
      if ((s -= ex) < 2 * ey) return [ex, ey - s];
      if ((s -= 2 * ey) < 2 * ex) return [ex - s, -ey];
      if ((s -= 2 * ex) < 2 * ey) return [-ex, -ey + s];
      return [-ex + (s - 2 * ey), ey];
    };
    const rs = [], ss = [0];
    for (let i = 0; ss[i] < per; i++) {
      rs.push(pattern[i % pattern.length] * sc);
      ss.push(ss[i] + 0.78 * (pattern[i % pattern.length] + pattern[(i + 1) % pattern.length]) * sc);
    }
    const k = per / ss[rs.length];            // halkayı eşit kapat
    parts.push(rrect(2 * K, 2 * H, B));
    rs.forEach((r, i) => { const [x, y] = at(ss[i] * k); parts.push(circle(r, x, y)); });
    ring = [0, ey + rs[0] - lr - 0.6];
    deco.push(band(CS.union(parts.slice()), 1.0, 0.7));
  } else if (m.id === 'yengec') {
    const n = 2.6, a = Cx * fit(n) + B + 1.5, b = Cy * fit(n) + B;
    const edgeX = (y) => a * (1 - Math.abs(y / b) ** n) ** (1 / n);
    const carap = superEll(a, b, n);
    parts.push(carap);
    const side = [];
    side.push(capsule(a - 4, 0.22 * b, 3.2, a + 8, 0.34 * b, 0.9));           // yan diken
    for (const [fy, dy] of [[-0.02, -7], [-0.3, -8], [-0.55, -8]]) {          // yürüme bacakları
      const y0 = fy * b, x0 = edgeX(y0) - 3;
      side.push(capsule(x0, y0, 2.0, x0 + 11, y0 + dy, 1.3));
    }
    {                                                                         // yüzme bacağı (kürek)
      const y0 = -0.8 * b, x0 = edgeX(y0) - 3;
      side.push(capsule(x0, y0, 2.0, x0 + 7, -b - 3, 2.8));
    }
    side.push(capsule(0.5 * a, 0.8 * b, 3.2, 0.62 * a, b + 6, 3.0));          // kol
    {                                                                         // kıskaç
      const cx = 0.62 * a + 1, cy = b + 10, r = 6;
      const dir = Math.atan2(1, -0.25), half = 15 * Math.PI / 180, L = 12;
      const wedge = poly([[cx, cy],
        [cx + L * Math.cos(dir - half), cy + L * Math.sin(dir - half)],
        [cx + L * Math.cos(dir + half), cy + L * Math.sin(dir + half)]]);
      side.push(circle(r, cx, cy).subtract(wedge));
    }
    const sideU = CS.union(side);
    parts.push(sideU, sideU.mirror([1, 0]));
    ring = [0, b + 3.5];
    deco.push(band(carap, 1.0, 0.7));
    deco.push(circle(1.1, -5, b - 3.6), circle(1.1, 5, b - 3.6));
  } else if (m.id === 'mezar') {
    const cor = 2.2, ah = 2.8;                       // korniş taşması, arşitrav yüksekliği
    const w = K + cor;
    const ph = Math.max(11, 0.45 * w);               // alınlık yüksekliği
    const y0 = H + ah;
    const tri = poly([[-w, y0], [w, y0], [0, y0 + ph]]);
    parts.push(rect(-K, K, -H, H), rect(-w, w, H, y0), tri,
      rect(-K - 1.8, K + 1.8, -H - 2.5, -H), rect(-K - 3.6, K + 3.6, -H - 5, -H - 2.5));
    const inr = (w * ph) / (w + Math.hypot(w, ph)); // alınlığın iç teğet çemberi
    ring = [0, y0 + inr];
    if (p.deco) {
      const lw = 0.7;
      for (const sx of [-1, 1]) {                    // sütunlar ve başlıkları
        const x1 = sx * (Cx + 1.0), x2 = sx * (K - 1.0);
        deco.push(capsule(x1, -H + 1, lw / 2, x1, H - 2.2, lw / 2));
        deco.push(capsule(x2, -H + 1, lw / 2, x2, H - 2.2, lw / 2));
        deco.push(capsule(x1, H - 1.2, lw / 2, x2, H - 1.2, lw / 2));
      }
      deco.push(capsule(-w + 1.2, H + ah / 2, lw / 2, w - 1.2, H + ah / 2, lw / 2));
      deco.push(band(tri, 1.3, lw));
    }
  } else if (m.id === 'gunes') {
    const n = 3, a = Cx * fit(n) + B, b = Cy * fit(n) + B;
    const disc = superEll(a, b, n);
    parts.push(disc);
    const N = 16;
    for (let i = 1; i < N; i++) {                    // i=0 tepede, yerine halka kulağı var
      const t = Math.PI / 2 + (2 * Math.PI * i) / N;
      const P = sePoint(a, b, n, t), nn = seNormal(a, b, n, P);
      parts.push(capsule(P[0] - nn[0] * 2, P[1] - nn[1] * 2, 3.0, P[0] + nn[0] * 7.5, P[1] + nn[1] * 7.5, 0.9));
    }
    ring = [0, b + 3.6];
    deco.push(band(disc, 1.0, 0.7));
  } else if (m.id === 'madalyon') {
    const n = 2.6, a = Cx * fit(n) + B, b = Cy * fit(n) + B;
    const core = superEll(a, b, n);
    parts.push(core);
    // kenara boncuk dizisi: eğri boyunca eşit aralıklı daireler
    const pts = Array.from({ length: 720 }, (_, i) => sePoint(a, b, n, (2 * Math.PI * i) / 720));
    let acc = 0, total = 0;
    for (let i = 0; i < pts.length; i++) {
      const q = pts[(i + 1) % pts.length];
      total += Math.hypot(q[0] - pts[i][0], q[1] - pts[i][1]);
    }
    const count = Math.round(total / 4.4), step = total / count;
    let next = 0, placed = 0;
    for (let i = 0; i < pts.length && placed < count; i++) {
      if (acc >= next) { parts.push(circle(2.3, pts[i][0], pts[i][1])); next += step; placed++; }
      const q = pts[(i + 1) % pts.length];
      acc += Math.hypot(q[0] - pts[i][0], q[1] - pts[i][1]);
    }
    ring = [0, b + 3.8];
    deco.push(band(core, 1.0, 0.7));
  } else if (MINI_SHAPES.includes(m.id)) {
    // minik seri: hepsi yuvayı B kadar saran yuvarlak köşeli çekirdeğe eklentiyle kurulur
    const rc = Math.max(0.5, Math.min(5, (B * Math.SQRT2 - 1.5) / (Math.SQRT2 - 1)));
    const core = rrect(2 * K, 2 * H, rc);
    const lw = 0.6;
    const line = (x1, y1, x2, y2) => capsule(x1, y1, lw / 2, x2, y2, lw / 2);
    if (m.id === 'damla') {
      // Büyük yarıçaplı köşeli gövde aşağı ve yukarı uzatılır ki köşe yayları yuvaya
      // ~B kadar et bıraksın; üst köşeler halka ucuyla birleşip damla sivriliği verir.
      const rb = 12, ext = 8;
      const tipY = H + ext + 5;
      const belly = rrect(2 * K, 2 * H + 2 * ext, rb);
      const drop = CS.hull([belly, circle(lr, 0, tipY)]);
      parts.push(drop);
      ring = [0, tipY];
      deco.push(band(drop, 1.0, lw));
      for (let i = 0; i < 4; i++) {                       // parıltı kavisi
        const t1 = (112 + i * 9) * Math.PI / 180, t2 = (112 + (i + 1) * 9) * Math.PI / 180;
        deco.push(line(11 * Math.cos(t1), Cy - 2 + 11 * Math.sin(t1), 11 * Math.cos(t2), Cy - 2 + 11 * Math.sin(t2)));
      }
    } else if (m.id === 'balik') {
      const hr = K * 0.95, hc = H - K * 0.55;            // baş
      const body = CS.hull([core, circle(hr, 0, hc)]);
      const tail = poly([[-3, -H + 1], [3, -H + 1], [11, -H - 9], [5, -H - 7.5], [0, -H - 5],
        [-5, -H - 7.5], [-11, -H - 9]]).offset(-0.8, 'Round', 2, seg).offset(0.8, 'Round', 2, seg);
      const fin = capsule(K - 1.5, 0.05 * H, 2.6, K + 4.5, -0.2 * H, 1.0);
      parts.push(body, tail, fin, fin.mirror([1, 0]));
      ring = [0, hc + hr - lr - 0.4];
      deco.push(band(body, 1.0, lw), circle(1.4, -8, Cy + 3.2));
      deco.push(line(K - 1, 0.02 * H, K + 3.2, -0.17 * H), line(-K + 1, 0.02 * H, -K - 3.2, -0.17 * H));
    } else if (m.id === 'kalp') {
      const R = K * 0.6, lx = K - R + 1.5, ly = H + 1;
      const lobes = CS.union([circle(R, -lx, ly), circle(R, lx, ly)]);
      const tip = circle(1.6, 0, -H - 0.6 * K);
      const vee = CS.union([CS.hull([circle(R, -lx, ly), tip, circle(rc, -(K - rc), -H + rc)]),
        CS.hull([circle(R, lx, ly), tip, circle(rc, K - rc, -H + rc)])]);
      const heart = CS.union([core, lobes, vee]);
      parts.push(heart);
      const cusp = ly + Math.sqrt(Math.max(0, R * R - lx * lx));
      ring = [0, cusp + 1.5];
      deco.push(band(heart, 1.0, lw));
    } else if (m.id === 'ahtapot') {
      const dr = K + 1, dc = H - K * 0.55;               // kafa kubbesi
      const head = CS.union([core, circle(dr, 0, dc)]);
      parts.push(head);
      const n = 6;
      for (let i = 0; i < n; i++) {
        const x = -K + 2.6 + (i * (2 * K - 5.2)) / (n - 1);
        const dx = (x < 0 ? -1 : 1) * 3;
        parts.push(capsule(x, -H + 2, 2.6, x + dx, -H - 5, 2.2),
          capsule(x + dx, -H - 5, 2.2, x + dx * 0.2, -H - 9, 1.6));
      }
      ring = [0, dc + dr - lr - 0.4];
      deco.push(band(head, 1.0, lw), circle(1.5, -6.5, Cy + 3.4), circle(1.5, 6.5, Cy + 3.4));
    } else {                                             // deniz kabuğu (tarak)
      const Rf = K + 2, fc = H - Rf + 7;
      const bumps = [], centers = [];
      for (let i = 0; i <= 8; i++) {
        const t = (25 + (130 * i) / 8) * Math.PI / 180;
        const x = Rf * Math.cos(t), y = fc + Rf * Math.sin(t);
        centers.push([x, y]);
        bumps.push(circle(i === 4 ? lr : 3.6, x, y));
      }
      const fan = CS.hull([core, ...centers.map(([x, y]) => circle(0.1, x, y))]);
      const hinge = poly([[-K * 0.45, -H + 2], [K * 0.45, -H + 2], [K * 0.62, -H - 5], [-K * 0.62, -H - 5]]);
      const shell = CS.union([fan, ...bumps, hinge]);
      parts.push(shell);
      ring = centers[4];
      for (const [i, [x, y]] of centers.entries()) {    // kaburgalar
        if (i === 4) continue;
        deco.push(line(0, -H - 2, x * 0.94, y - 1.5));
      }
      deco.push(line(-K * 0.5, -H + 0.6, K * 0.5, -H + 0.6));
    }
  } else {
    const rMax = Math.max(0, (B * Math.SQRT2 - 2) / (Math.SQRT2 - 1));
    parts.push(rrect(2 * K, 2 * H, Math.min(6, rMax)));
    ring = [0, H + p.hole / 2 + 1.0];
  }

  // halka kulağı + delik
  parts.push(CS.hull([circle(lr, ring[0], ring[1]), circle(lr * 0.85, ring[0], ring[1] - lr - 1.5)]));
  let outer = CS.union(parts);
  if (m.id === 'mezar') outer = outer.offset(-0.8, 'Round', 2, seg).offset(0.8, 'Round', 2, seg);
  outer = outer.subtract(circle(p.hole / 2, ring[0], ring[1]));

  // Yuva (+0.5 mm), kilit kanalları ve çentiğin ayak izi; gövde bunların dışında
  // en az 1 mm et bırakmalı.
  const footParts = [CS.square([2 * Cx + 1, 2 * Cy + 1], true)];
  for (const s of clipSides) {
    footParts.push(rect(0, halfN(s) + D, -(nl + 1.2) / 2, (nl + 1.2) / 2).rotate(SIDE_ANG[s]));
  }
  {
    const v = notchV(notchSide);
    footParts.push(rect(0, halfN(notchSide) + 1.6, v - 3.5, v + 3.5).rotate(SIDE_ANG[notchSide]));
  }
  const foot = CS.union(footParts);
  if (foot.subtract(outer.offset(-1.0, 'Round', 2, seg)).area() > 0.2) {
    warn.push('Gövde kenarı yuvaya çok yakın: "En ince kenar" değerini artır.');
  }
  if (circle(p.hole / 2 + 1.0, ring[0], ring[1]).intersect(foot).area() > 0.01) {
    warn.push('Halka deliği yuvaya çok yakın: deliği küçült ya da kenarı artır.');
  }

  // ---- pencere ----
  const ww = p.pw - 2 * p.ov, wh = p.ph - 2 * p.ov;
  if (ww < 5 || wh < 5) warn.push('Pencere çok küçük: bindirmeyi azalt.');
  let win;
  if (p.win === 'rect') win = CS.square([ww, wh], true);
  else if (p.win === 'round') win = rrect(ww, wh, p.wr);
  else if (p.win === 'oval') win = ellipse(ww / 2, wh / 2);
  else {
    const rr = Math.min(ww / 2, wh * 0.75);
    const ys = wh / 2 - rr;
    win = rect(-ww / 2, ww / 2, -wh / 2, ys).add(CS.circle(rr, seg).scale([ww / 2 / rr, 1]).translate([0, ys]));
  }
  if (m.id === 'mezar' && p.deco) deco.push(win.offset(1.65, 'Miter').subtract(win.offset(0.95, 'Miter')));

  // ---- GÖVDE ----
  let frame = prism(outer, 0, zt);
  const cuts = [];
  cuts.push(prism(win, -1, p.ft + 0.5));
  if (p.bevel) {
    const bv = Math.min(0.7 * p.ft, 1.0);
    const big = win.offset(bv, p.win === 'rect' ? 'Miter' : 'Round', 2, seg);
    cuts.push(Mf.hull([prism(big, -0.01, 0.001), prism(win, bv, bv + 0.01)]));
  }
  if (p.deco && deco.length) {
    const dd = Math.min(0.4, p.ft * 0.35);
    cuts.push(prism(CS.union(deco), -1, dd));
  }
  const cav = CS.square([2 * Cx, 2 * Cy], true);
  cuts.push(prism(cav, p.ft, zt + 1));
  // giriş pahı
  cuts.push(Mf.hull([
    prism(cav, zt - ch, zt - ch + 0.01),
    prism(cav.offset(ch + 0.5, 'Miter'), zt + 0.5, zt + 0.51),
  ]));
  // kilit kanalları
  for (const s of clipSides) {
    const e = halfN(s), gl = nl + 1.2;
    const za = zb0 - 0.3;
    let gr = box(e - 0.2, e + D, -gl / 2, gl / 2, za, gTop);
    if (p.lock === 'detent') {
      gr = Mf.hull([gr, box(e - 0.2, e - 0.1, -gl / 2, gl / 2, gTop, gTop + D + 0.1)]);
    }
    cuts.push(gr.rotate([0, 0, SIDE_ANG[s]]));
  }
  // kapağı kaldırma çentiği (kapaktaki kulakçık buraya oturur)
  {
    const s = notchSide, e = halfN(s), v = notchV(s);
    const zf = Math.max(p.ft + 0.4, zb0 - 1.0);
    cuts.push(box(e - 0.1, e + 1.6, v - 3.5, v + 3.5, zf, zt + 1).rotate([0, 0, SIDE_ANG[s]]));
  }
  frame = frame.subtract(Mf.union(cuts));

  // ---- ARKA KAPAK ----
  let pcs = rrect(2 * Px, 2 * Py, 0.6);
  const pCuts = [], pAdds = [];
  for (const s of clipSides) {
    const e = halfN(s) - p.pclr;     // kapak kenarı
    const L = tongueL(s);
    const v0 = nl / 2 - L;           // dilin kök ucu
    const ang = SIDE_ANG[s];
    pCuts.push(rect(e - tw - g, e - tw, v0, nl / 2 + g).rotate(ang));
    pCuts.push(rect(e - tw - g, e + 1, nl / 2, nl / 2 + g).rotate(ang));
    pAdds.push(rect(e - 0.01, halfN(s) + p.d, -nl / 2, nl / 2).rotate(ang));
  }
  {
    const s = notchSide, e = halfN(s), v = notchV(s);
    pAdds.push(rect(e - p.pclr - 0.5, e + 1.3, v - 2, v + 2).rotate(SIDE_ANG[s]));
  }
  pcs = pcs.subtract(CS.union(pCuts)).add(CS.union(pAdds));
  let plate = prism(pcs, zb0, zb1);

  // ---- arka yüz: sticker yuvası + yazı (üst üste ortalanmış blok) ----
  const lines = [normalizeText(p.yazi), normalizeText(p.yazi2)].filter(Boolean);
  const hasSide = (sd) => clipSides.includes(sd);
  const availW = 2 * (Px - (hasSide('R') || hasSide('L') ? tw + g + 1.2 : 1.5));
  const availH = 2 * (Py - (hasSide('T') || hasSide('B') ? tw + g + 1.2 : 1.5));
  const gapST = 2.5;                                   // sticker ile yazı arası
  const gapU = 3.4;                                    // satır arası (aksanlara yer)
  const lay = lines.map(layoutLine);
  const blockU = lines.length ? lines.length * 6 + (lines.length - 1) * gapU : 0;
  const minTextH = lines.length ? Math.min(p.yaziH, 3) / 6 * (blockU + 3.2) : 0;

  let st = null;
  if (p.stOn) {
    let w = p.stW, h = p.stShape === 'circle' ? p.stW : p.stH;
    const budgetH = availH - (lines.length ? minTextH + gapST : 0);
    const k = Math.min(1, availW / (w + 0.5), budgetH / (h + 0.5));
    if (k < 1) {
      w *= k; h *= k;
      warn.push(`Sticker kapağa sığsın diye ${w.toFixed(1)} × ${h.toFixed(1)} mm'ye küçüldü.`);
    }
    st = { w, h, shape: p.stShape, depth: Math.min(p.stDepth, p.bt - 0.8) };
  }

  let s = 0, textH = 0;
  if (lines.length) {
    const maxW = Math.max(...lay.map((l) => l.width));
    const budgetH = availH - (st ? st.h + 0.5 + gapST : 0);
    s = Math.min(p.yaziH / 6, availW / Math.max(maxW, 1), budgetH / (blockU + 3.2));
    if (s * 6 < p.yaziH - 0.05) warn.push(`Yazı kapağa sığsın diye harf yüksekliği ${(s * 6).toFixed(1)} mm'ye indi.`);
    if (s * 6 < 2.5) warn.push('Yazı çok uzun: harfler baskıda okunmayabilir.');
    textH = blockU * s;
  }
  // blok: üstte sticker, altında yazı; ikisi birlikte kapakta ortalanır
  const stackH = (st ? st.h : 0) + (st && lines.length ? gapST : 0) + textH;
  const stackTop = stackH / 2;
  if (st) {
    st.cx = 0;
    st.cy = stackTop - st.h / 2;
    const so = st.w / 2 + 0.25, sv = st.h / 2 + 0.25;  // yuva = sticker + 0.25 mm pay
    let pocket;
    if (st.shape === 'circle') pocket = circle(so);
    else if (st.shape === 'oval') pocket = ellipse(so, sv);
    else pocket = rrect(2 * so, 2 * sv, Math.min(3, so, sv));
    plate = plate.subtract(prism(pocket.translate([st.cx, st.cy]), zb1 - st.depth, zb1 + 1));
    st.z = zb1 - st.depth;
  }

  let textInfo = null;
  if (lines.length) {
    const textCenter = stackTop - (st ? st.h + gapST : 0) - textH / 2;
    const sw = Math.max(0.8, Math.min(1.4, s * 1.1));
    const caps = [];
    lay.forEach((l, i) => {
      const base = blockU / 2 - 6 - i * (6 + gapU) + textCenter / s;
      for (const [[x1, y1], [x2, y2]] of l.segs) {
        caps.push(capsule((x1 - l.width / 2) * s, (y1 + base) * s, sw / 2,
          (x2 - l.width / 2) * s, (y2 + base) * s, sw / 2));
      }
    });
    const txt = CS.union(caps);
    if (p.yaziTip === 'engraved') {
      const dep = Math.min(0.6, p.bt - 0.8);
      plate = plate.subtract(prism(txt, zb1 - dep, zb1 + 1));
    } else {
      plate = plate.add(prism(txt, zb1 - 0.01, zb1 + Math.min(0.6, p.lip - 0.3)));
    }
    textInfo = { h: s * 6, lines };
  }

  return {
    p, model: m, warn, frame, plate, centers: [0],
    dims: {
      zt, zb0, zb1, Cx, Cy, Px, Py,
      window: [ww, wh],
      ring, hole: p.hole,
      text: textInfo,
      sticker: st,
    },
    photo: { w: p.pw, h: p.ph, z: p.ft + p.gt },
  };
}

function toMesh(man) {
  const mesh = man.getMesh();
  const np = mesh.numProp;
  const vp = mesh.vertProperties;
  const nv = vp.length / np;
  const pos = new Float32Array(nv * 3);
  for (let i = 0; i < nv; i++) {
    pos[i * 3] = vp[i * np];
    pos[i * 3 + 1] = vp[i * np + 1];
    pos[i * 3 + 2] = vp[i * np + 2];
  }
  return { pos, idx: new Uint32Array(mesh.triVerts) };
}

// ---------------------------------------------------------------------------
// STL

export function meshBounds(m) {
  const mn = [Infinity, Infinity, Infinity], mx = [-Infinity, -Infinity, -Infinity];
  for (let i = 0; i < m.pos.length; i += 3) {
    for (let k = 0; k < 3; k++) {
      const v = m.pos[i + k];
      if (v < mn[k]) mn[k] = v;
      if (v > mx[k]) mx[k] = v;
    }
  }
  return { min: mn, max: mx };
}

export function translateMesh(m, [dx, dy, dz]) {
  const pos = new Float32Array(m.pos.length);
  for (let i = 0; i < pos.length; i += 3) {
    pos[i] = m.pos[i] + dx;
    pos[i + 1] = m.pos[i + 1] + dy;
    pos[i + 2] = m.pos[i + 2] + dz;
  }
  return { pos, idx: m.idx };
}

export function mergeMeshes(list) {
  let nv = 0, nt = 0;
  for (const m of list) { nv += m.pos.length; nt += m.idx.length; }
  const pos = new Float32Array(nv), idx = new Uint32Array(nt);
  let ov = 0, ot = 0;
  for (const m of list) {
    pos.set(m.pos, ov);
    const base = ov / 3;
    for (let i = 0; i < m.idx.length; i++) idx[ot + i] = m.idx[i] + base;
    ov += m.pos.length;
    ot += m.idx.length;
  }
  return { pos, idx };
}

// Parçaları baskı tablasına diz (hepsi z=0'a oturur). Satır `maxW` mm'yi
// aşınca alt satıra geçer; böylece ikili model de 180 mm tablalara sığar.
export function layoutForPrint(res, which = 'all', maxW = 170) {
  const gap = 6;
  const parts = [];
  if (which === 'all' || which === 'frame') parts.push(res.frame);
  if (which === 'all' || which === 'plate') {
    for (let i = 0; i < res.plateCount; i++) parts.push(res.plate);
  }
  let x = 0, y = 0, rowH = 0;
  const out = [];
  for (const m of parts) {
    const b = meshBounds(m);
    const w = b.max[0] - b.min[0], h = b.max[1] - b.min[1];
    if (x > 0 && x + w > maxW) { x = 0; y += rowH + gap; rowH = 0; }
    out.push(translateMesh(m, [x - b.min[0], y - b.min[1], -b.min[2]]));
    x += w + gap;
    rowH = Math.max(rowH, h);
  }
  return mergeMeshes(out);
}

export function toBinarySTL(m, name = 'vesikalik') {
  const nt = m.idx.length / 3;
  const buf = new ArrayBuffer(84 + nt * 50);
  const dv = new DataView(buf);
  const head = `${name} - Otomasyon Akademi vesikalik anahtarlik`.slice(0, 79);
  for (let i = 0; i < head.length; i++) dv.setUint8(i, head.charCodeAt(i) & 0x7f);
  dv.setUint32(80, nt, true);
  let o = 84;
  const P = m.pos, I = m.idx;
  for (let t = 0; t < nt; t++) {
    const a = I[t * 3] * 3, b = I[t * 3 + 1] * 3, c = I[t * 3 + 2] * 3;
    const ux = P[b] - P[a], uy = P[b + 1] - P[a + 1], uz = P[b + 2] - P[a + 2];
    const vx = P[c] - P[a], vy = P[c + 1] - P[a + 1], vz = P[c + 2] - P[a + 2];
    let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
    const l = Math.hypot(nx, ny, nz) || 1;
    nx /= l; ny /= l; nz /= l;
    dv.setFloat32(o, nx, true); dv.setFloat32(o + 4, ny, true); dv.setFloat32(o + 8, nz, true);
    o += 12;
    for (const q of [a, b, c]) {
      dv.setFloat32(o, P[q], true); dv.setFloat32(o + 4, P[q + 1], true); dv.setFloat32(o + 8, P[q + 2], true);
      o += 12;
    }
    dv.setUint16(o, 0, true);
    o += 2;
  }
  return buf;
}

// Kart önizlemeleri için ön yüz dış hattı (SVG path; SVG'de y aşağı olduğu için ters).
export function frontOutline(M, id, raw) {
  const gc = installGC(M);
  try {
    const { frame } = buildInner(M, id, raw, { seg: 40 });
    const polys = frame.slice(0.05).toPolygons();
    const bb = frame.boundingBox();
    let d = '';
    for (const poly of polys) {
      poly.forEach((pt, i) => {
        d += (i ? 'L' : 'M') + pt[0].toFixed(2) + ' ' + (-pt[1]).toFixed(2);
      });
      d += 'Z';
    }
    return { d, minX: bb.min[0], maxX: bb.max[0], minY: -bb.max[1], maxY: -bb.min[1] };
  } finally {
    gc.cleanup();
  }
}
