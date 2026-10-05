// Vesikalık çerçeve — geometri üreticisi.
//
// Tüm ölçüler mm. Koordinatlar "montajlı" hâldedir ve baskı yönüyle aynıdır:
//   z = 0      → çerçevenin ön yüzü (tablaya yatar)
//   z = ft     → fotoğraf yığınının başladığı yer (koruyucu + fotoğraf)
//   zb0..zb1   → arka kapak (tırnaklarıyla birlikte)
//   zt         → çerçevenin arka kenarı (dudak)
// Arka kapak da aynı yönde basılır: iç yüzü (fotoğrafa bakan) tablaya, ayak/mıknatıs
// yuvası yukarı.
//
// Kilit sistemi vidasızdır: arka kapağın kenarlarında düzlem içinde esneyen dil
// (konsol) tırnaklar var; ucundaki çıkıntı çerçeve duvarındaki kanala oturur.
// Duvarın üst iç kenarındaki pah tırnağı içeri iter, kapak bastırınca "klik" diye
// yerine girer.

export const SQ2 = Math.SQRT2;

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
  win: 'round', wr: 2, bevel: false,
  B: 6, r: 3,         // kenar genişliği, dış köşe yarıçapı
  mid: 6,             // ikili modelde iki fotoğraf arası
  ft: 1.6,            // ön yüz kalınlığı
  bt: 2.0,            // arka kapak kalınlığı
  lip: 1.6,           // kapağın üstünde kalan duvar (kanal + giriş pahı)
  clips: 2, lock: 'detent', d: 0.6,
  clr: 0.3,           // fotoğraf ile yuva duvarı arası
  pclr: 0.2,          // kapak ile yuva duvarı arası
  stand: true, ang: 15,
  magD: 10, magT: 2, magN: 2,
  hole: 4.5,
  slotW: 13, slotH: 3.5,
  nailD: 6,
};

export const MODELS = [
  { id: 'masa', ad: 'Klasik Masa', shape: 'rect', count: 1, feats: ['stand'],
    tarif: 'Dikdörtgen masa çerçevesi, arka kapağa bütünleşik ayak.',
    def: { B: 6, r: 3, win: 'round', wr: 2 } },
  { id: 'ikili', ad: 'İkili Masa', shape: 'rect', count: 2, feats: ['stand'],
    tarif: 'Yan yana iki vesikalık, iki ayrı klipsli kapak.',
    def: { B: 6, r: 3, win: 'round', wr: 2, mid: 6 } },
  { id: 'kemer', ad: 'Kemerli', shape: 'arch', count: 1, feats: ['stand'],
    tarif: 'Üstü yuvarlak kemer çerçeve ve kemer pencere.',
    def: { B: 6, win: 'arch', bevel: true } },
  { id: 'oval', ad: 'Oval Madalyon', shape: 'oval', count: 1, feats: ['stand'],
    tarif: 'Eliptik dış hat, oval pencere, pahlı kenar. Altı düz, ayakla durur.',
    def: { B: 5, win: 'oval', bevel: true } },
  { id: 'duvar', ad: 'Duvar Askılı', shape: 'rect', count: 1, feats: ['keyhole'],
    tarif: 'Arkada gizli anahtar deliği askı; çivi ya da yapışkanlı kancaya asılır.',
    def: { B: 8, r: 2, win: 'rect', bevel: true } },
  { id: 'magnet', ad: 'Buzdolabı Magneti', shape: 'rect', count: 1, feats: ['magnet'],
    tarif: 'İnce çerçeve; kapakta yuvarlak mıknatıslar için geçme yuva.',
    def: { B: 4, r: 3, ft: 1.2, bt: 1.6, win: 'round', wr: 2 } },
  { id: 'anahtarlik', ad: 'Anahtarlık', shape: 'rect', count: 1, feats: ['ring'],
    tarif: 'Yuvarlak hatlı, halka delikli kulaklı anahtarlık.',
    def: { B: 3.5, r: 5, ft: 1.2, bt: 1.6, lip: 1.5, win: 'round', wr: 3 } },
  { id: 'yaka', ad: 'Yaka Kartı', shape: 'rect', count: 1, feats: ['slot'],
    tarif: 'Boyun ipi / yaka klipsi için yarıklı kart tutucu.',
    def: { B: 4, r: 3, ft: 1.2, bt: 1.6, win: 'rect' } },
];

// Arayüz bu listeden form üretir; sınırlar build() içinde de uygulanır.
export const PARAMS = [
  { k: 'pw', g: 'foto', ad: 'Fotoğraf genişliği', min: 15, max: 150, step: 0.5 },
  { k: 'ph', g: 'foto', ad: 'Fotoğraf yüksekliği', min: 15, max: 150, step: 0.5 },
  { k: 'pt', g: 'foto', ad: 'Fotoğraf kalınlığı', min: 0.1, max: 1.2, step: 0.05 },
  { k: 'gt', g: 'foto', ad: 'Şeffaf koruyucu kalınlığı', min: 0, max: 3, step: 0.1,
    ipucu: '0 = koruyucu yok. Asetat ≈ 0.2–0.5, pleksi 1–2 mm.' },
  { k: 'ov', g: 'foto', ad: 'Pencere bindirmesi', min: 0.5, max: 6, step: 0.1,
    ipucu: 'Fotoğrafın her kenardan çerçeve altında kalan kısmı.' },

  { k: 'win', g: 'cerceve', ad: 'Pencere şekli', type: 'select', options: WINDOW_SHAPES },
  { k: 'wr', g: 'cerceve', ad: 'Pencere köşe yarıçapı', min: 0.5, max: 10, step: 0.5,
    show: (p) => p.win === 'round' },
  { k: 'bevel', g: 'cerceve', ad: 'Pencere kenarı pahlı', type: 'bool' },
  { k: 'B', g: 'cerceve', ad: 'Kenar genişliği', min: 3, max: 30, step: 0.5 },
  { k: 'r', g: 'cerceve', ad: 'Dış köşe yarıçapı', min: 0, max: 20, step: 0.5,
    show: (p, m) => m.shape === 'rect' },
  { k: 'mid', g: 'cerceve', ad: 'İki fotoğraf arası', min: 4, max: 30, step: 0.5,
    show: (p, m) => m.count > 1 },
  { k: 'ft', g: 'cerceve', ad: 'Ön yüz kalınlığı', min: 0.8, max: 4, step: 0.1 },
  { k: 'bt', g: 'cerceve', ad: 'Arka kapak kalınlığı', min: 1.2, max: 4, step: 0.1 },

  { k: 'stand', g: 'ek', ad: 'Masa ayağı', type: 'bool', feat: 'stand' },
  { k: 'ang', g: 'ek', ad: 'Ayak eğimi (dikeyden)', min: 8, max: 30, step: 1, unit: '°',
    feat: 'stand', show: (p) => p.stand },
  { k: 'nailD', g: 'ek', ad: 'Çivi / kanca başı çapı', min: 4, max: 9, step: 0.5, feat: 'keyhole' },
  { k: 'magN', g: 'ek', ad: 'Mıknatıs adedi', type: 'select',
    options: { 1: '1 adet', 2: '2 adet', 4: '4 adet' }, feat: 'magnet' },
  { k: 'magD', g: 'ek', ad: 'Mıknatıs çapı', min: 4, max: 20, step: 0.5, feat: 'magnet' },
  { k: 'magT', g: 'ek', ad: 'Mıknatıs kalınlığı', min: 1, max: 5, step: 0.5, feat: 'magnet' },
  { k: 'hole', g: 'ek', ad: 'Halka deliği çapı', min: 2.5, max: 8, step: 0.5, feat: 'ring' },
  { k: 'slotW', g: 'ek', ad: 'İp yarığı genişliği', min: 6, max: 25, step: 0.5, feat: 'slot' },
  { k: 'slotH', g: 'ek', ad: 'İp yarığı yüksekliği', min: 2, max: 6, step: 0.5, feat: 'slot' },

  { k: 'clips', g: 'klips', ad: 'Klips sayısı', type: 'select',
    options: { 2: '2 (uzun kenarlar)', 4: '4 (her kenar)' } },
  { k: 'lock', g: 'klips', ad: 'Kilit tipi', type: 'select',
    options: { detent: 'Sökülebilir (fotoğraf değişir)', fixed: 'Kalıcı (sıkı kilit)' } },
  { k: 'd', g: 'klips', ad: 'Tırnak kilit derinliği', min: 0.3, max: 1.2, step: 0.05,
    ipucu: 'Büyüdükçe kilit sertleşir. PLA için 0.5–0.7 iyi.' },
  { k: 'lip', g: 'klips', ad: 'Kapak üstü duvar (dudak)', min: 1.0, max: 4, step: 0.1 },
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
    else if (d.type === 'select') {
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

function buildInner(M, id, raw, opts) {
  const { Manifold: Mf, CrossSection: CS } = M;
  const seg = opts.seg || 72;
  const m = modelById(id);
  const p = sanitize(id, raw);
  const has = (f) => m.feats.includes(f);
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
  const prism = (cs, z0, z1) => Mf.extrude(cs, z1 - z0).translate([0, 0, z0]);
  const box = (x0, x1, y0, y1, z0, z1) =>
    Mf.cube([x1 - x0, y1 - y0, z1 - z0]).translate([x0, y0, z0]);

  // ---- türetilmiş ölçüler ----
  const n = m.count;
  const portrait = p.ph >= p.pw;
  const Cx = p.pw / 2 + p.clr;       // yuva yarı genişliği
  const Cy = p.ph / 2 + p.clr;       // yuva yarı yüksekliği
  const pitch = 2 * Cx + p.mid;
  const centers = n === 1 ? [0] : [-pitch / 2, pitch / 2];
  const Ex = n === 1 ? Cx : pitch / 2 + Cx;
  const Ey = Cy;
  const Px = Cx - p.pclr, Py = Cy - p.pclr;   // kapak yarı ölçüleri

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
  // Çentik, kenarda tırnak varsa onun serbest ucunun ötesine; ayaklı modelde ise
  // ayak tam ortadan geçtiği için yine yana kayar.
  const notchV = (s) => {
    if (!clipSides.includes(s) && !(has('stand') && p.stand)) return 0;
    return Math.max(0, Math.min(halfE(s) - 4.5, nl / 2 + g + 5));
  };

  // ---- dış hat ----
  const B = p.B;
  let Bt = B;
  const nailR = p.nailD / 2 + 0.3;
  const shank = Math.max(2.4, p.nailD * 0.5);
  const keyTravel = Math.max(3, p.nailD * 0.6);
  if (has('keyhole')) {
    const need = 1.8 + 2 * nailR + keyTravel + 1.6;
    if (need > Bt) Bt = need;
  }
  const yBot = -(Ey + B);
  let yTop;
  let outer;
  const wmin = Math.max(2.5, B * 0.5);
  if (m.shape === 'rect') {
    const W = 2 * (Ex + B), H = 2 * Ey + B + Bt;
    const rMax = Math.max(0, (B * SQ2 - 2.5) / (SQ2 - 1));
    const r = Math.min(p.r, rMax);
    if (p.r > rMax + 0.01) warn.push(`Dış köşe yarıçapı ${r.toFixed(1)} mm ile sınırlandı (kenar ince).`);
    outer = rrect(W, H, r).translate([0, (Bt - B) / 2]);
    yTop = Ey + Bt;
  } else if (m.shape === 'oval') {
    const a = SQ2 * Ex + B, b = SQ2 * Ey + B;
    outer = ellipse(a, b);
    if (p.stand) outer = outer.intersect(rect(-a - 1, a + 1, yBot, b + 1));
    yTop = b;
  } else if (m.shape === 'arch') {
    const R = Ex + B;
    const yc = Ey - Math.sqrt(Math.max(0, (R - wmin) ** 2 - Ex ** 2));
    outer = rect(-R, R, yBot, yc).add(circle(R, 0, yc));
    yTop = yc + R;
  }
  const outerBottomY = m.shape === 'oval' && !p.stand ? -(SQ2 * Ey + B) : yBot;

  if (has('ring')) {
    const lr = p.hole / 2 + 2.8;
    const cy = yTop + p.hole / 2 + 1.0;
    outer = outer.add(CS.hull([circle(lr, 0, cy), rect(-lr, lr, yTop - 2, yTop - 1.5)]))
      .subtract(circle(p.hole / 2, 0, cy));
  }
  if (has('slot')) {
    const sw = p.slotW, sh = p.slotH;
    const tabW = sw + 7, tabH = sh + 5;
    const cy = yTop + 1.6 + sh / 2;
    outer = outer.add(rrect(tabW, tabH + 2, Math.min(3, tabH / 2)).translate([0, cy - 0.5]))
      .subtract(rrect(sw, sh, sh / 2).translate([0, cy]));
  }

  // ---- pencere ----
  const ww = p.pw - 2 * p.ov, wh = p.ph - 2 * p.ov;
  if (ww < 5 || wh < 5) warn.push('Pencere çok küçük: bindirmeyi azalt.');
  const windowCS = (cx) => {
    let w;
    if (p.win === 'rect') w = CS.square([ww, wh], true);
    else if (p.win === 'round') w = rrect(ww, wh, p.wr);
    else if (p.win === 'oval') w = ellipse(ww / 2, wh / 2);
    else {
      const rr = Math.min(ww / 2, wh * 0.75);
      const ys = wh / 2 - rr;
      w = rect(-ww / 2, ww / 2, -wh / 2, ys).add(CS.circle(rr, seg).scale([ww / 2 / rr, 1]).translate([0, ys]));
    }
    return w.translate([cx, 0]);
  };

  // ---- ÇERÇEVE ----
  let frame = prism(outer, 0, zt);
  const cuts = [];
  for (const cx of centers) {
    const win = windowCS(cx);
    cuts.push(prism(win, -1, p.ft + 0.5));
    if (p.bevel) {
      const bv = Math.min(0.7 * p.ft, 1.0, B * 0.3);
      const big = win.offset(bv, p.win === 'rect' ? 'Miter' : 'Round', 2, seg);
      cuts.push(Mf.hull([prism(big, -0.01, 0.001), prism(win, bv, bv + 0.01)]));
    }
    const cav = CS.square([2 * Cx, 2 * Cy], true).translate([cx, 0]);
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
      cuts.push(gr.rotate([0, 0, SIDE_ANG[s]]).translate([cx, 0, 0]));
    }
    // kapağı kaldırma çentiği (kapaktaki kulakçık buraya oturur)
    {
      const s = notchSide, e = halfN(s), v = notchV(s);
      const zf = Math.max(p.ft + 0.4, zb0 - 1.0);
      const nb = box(e - 0.1, e + 1.6, v - 3.5, v + 3.5, zf, zt + 1);
      cuts.push(nb.rotate([0, 0, SIDE_ANG[s]]).translate([cx, 0, 0]));
    }
  }

  if (has('keyhole')) {
    const ks = 1.4;
    const ye = Ey + 1.8 + nailR;
    const ys = ye + keyTravel;
    const zh0 = Math.max(1.0, zt - ks - 2.6);
    if (zt - ks - zh0 < 1.4) warn.push('Askı için çerçeve ince: çivi başı yuvası sığ kaldı.');
    const head = CS.hull([circle(nailR, 0, ye), circle(nailR, 0, ys)]);
    const neck = CS.hull([circle(shank / 2, 0, ye), circle(shank / 2, 0, ys)]);
    cuts.push(prism(head, zh0, zt - ks));
    cuts.push(prism(neck, zt - ks - 0.01, zt + 1));
    cuts.push(prism(circle(nailR, 0, ye), zh0, zt + 1));
  }

  frame = frame.subtract(Mf.union(cuts));

  // ---- ARKA KAPAK ----
  // Kapak yuva merkezinde kurulur (x=0), sonra her yuvaya taşınır.
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

  const plateExtras = [];
  const plateCuts = [];
  // Ayak, dilleri ve kulakçığı kapatmasın diye kenardan bu kadar içeride kalır.
  const safeY = Py - (tw + g + 1);

  let standInfo = null;
  if (has('stand') && p.stand) {
    const th = p.ang * Math.PI / 180;
    const tan = Math.tan(th);
    const yf = -safeY;
    const yT = Math.min(safeY, yf + 1.3 * Py);
    const zf = zt + (yf - outerBottomY) / tan;
    const k = 4;
    const A2 = [yf + k * Math.sin(th), zf + k * Math.cos(th)];
    // saat yönünün tersi (CCW) sıralı
    const poly = [[yf, zb1 - 0.4], [yT, zb1 - 0.4], A2, [yf, zf]];
    const fin = Mf.extrude(CS.ofPolygons([poly]), 3).translate([0, 0, -1.5])
      .warp((v) => { const a = v[0], b = v[1], c = v[2]; v[0] = c; v[1] = a; v[2] = b; });
    plateExtras.push(fin);
    standInfo = { depth: zf + k * Math.cos(th) - zb1 };
  }

  let magInfo = null;
  if (has('magnet')) {
    const mr = p.magD / 2 + 0.1;
    const br = mr + 1.2;
    const top = Math.max(zt, zb0 + 0.6 + p.magT + 0.05);
    let pos;
    if (p.magN === 1) pos = [[0, 0]];
    else if (p.magN === 2) pos = portrait ? [[0, -Py / 2], [0, Py / 2]] : [[-Px / 2, 0], [Px / 2, 0]];
    else pos = [[-Px / 2, -Py / 2], [Px / 2, -Py / 2], [-Px / 2, Py / 2], [Px / 2, Py / 2]];
    for (const [x, y] of pos) {
      if (Math.abs(x) + br > Px - 0.5 || Math.abs(y) + br > Py - 0.5) {
        warn.push('Mıknatıslar kapağa sığmıyor: çap ya da adet azalt.');
        break;
      }
    }
    for (const [x, y] of pos) {
      plateExtras.push(prism(circle(br, x, y), zb1 - 0.01, top));
      plateCuts.push(prism(circle(mr, x, y), top - p.magT - 0.05, top + 1));
    }
    magInfo = { proud: top - zt };
    if (top - zt > 0.05) warn.push(`Mıknatıs yuvası çerçeve arkasından ${(top - zt).toFixed(1)} mm taşıyor (kapağı kalınlaştır).`);
  }

  if (plateExtras.length) plate = plate.add(Mf.union(plateExtras));
  if (plateCuts.length) plate = plate.subtract(Mf.union(plateCuts));

  return {
    p, model: m, warn, frame, plate, centers,
    dims: {
      zt, zb0, zb1, Cx, Cy, Px, Py, Bt,
      window: [ww, wh],
      stand: standInfo, magnet: magInfo,
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
  const head = `${name} - Otomasyon Akademi vesikalik cerceve`.slice(0, 79);
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
