// Vesikalık anahtarlık üretici — arayüz, önizleme ve STL indirme.
import Module from './vendor/manifold.js';
import {
  MODELS, PARAMS, BASE, modelById, defaultsFor, sanitize, build, frontOutline,
  layoutForPrint, toBinarySTL, meshBounds,
} from './geo.js';
import { STICKERS, stickerById, svgDataUrl } from './stickers.js';

const $ = (s) => document.querySelector(s);
const el = (tag, attrs = {}, ...kids) => {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'class') e.className = v;
    else if (k === 'html') e.innerHTML = v;
    else if (k.startsWith('on')) e.addEventListener(k.slice(2), v);
    else e.setAttribute(k, v);
  }
  for (const c of kids) if (c != null) e.append(c);
  return e;
};

// Model değişince korunan (kullanıcının fotoğrafına / yazıcısına ait) ayarlar.
const KEEP_ON_SWITCH = ['pw', 'ph', 'pt', 'gt', 'ov', 'clips', 'lock', 'd', 'pclr', 'clr',
  'hole', 'yazi', 'yazi2', 'yaziTip', 'yaziH',
  'stOn', 'stImg', 'stShape', 'stW', 'stH', 'stDepth', 'yapi', 'arkaYuz', 'kb'];

const PRESETS = [
  [35, 45, 'Vesikalık 35×45'],
  [50, 60, 'Biyometrik 50×60'],
  [45, 35, 'Yatay 45×35'],
  [30, 40, '30×40'],
  [25, 35, '25×35'],
];

const COLORS = [
  ['Turkuaz', '#19b3ad'], ['Deniz mavisi', '#2f6fc0'], ['Kaplumbağa yeşili', '#4c9a52'],
  ['Kum', '#d8bf8a'], ['Güneş turuncusu', '#f08a24'], ['Beyaz', '#ececec'],
  ['Siyah', '#2e2f33'], ['Pembe', '#e48db0'],
];
const DEFAULT_COLOR = COLORS[0][1];

const GROUPS = [
  ['yapi', 'Yapı'],
  ['yazi', 'Arka yazı'],
  ['sticker', 'Renkli sticker'],
  ['foto', 'Fotoğraf'],
  ['cerceve', 'Gövde'],
  ['klips', 'Klips ve tolerans', true],
];

// ---------------------------------------------------------------------------
// durum

let modelId = 'caretta';
let params = defaultsFor(modelId);
let M = null;           // manifold wasm
let result = null;      // son build() çıktısı
let view = 'front';
let color = DEFAULT_COLOR;

function readHash() {
  const h = location.hash.replace(/^#/, '');
  if (!h) return;
  const sp = new URLSearchParams(h);
  const id = sp.get('m');
  if (id && MODELS.some((m) => m.id === id)) modelId = id;
  const raw = defaultsFor(modelId);
  for (const d of PARAMS) if (sp.has(d.k)) raw[d.k] = sp.get(d.k);
  params = sanitize(modelId, raw);
  const c = sp.get('c');
  if (c && COLORS.some(([, v]) => v === '#' + c)) color = '#' + c;
}

function hashString() {
  const def = defaultsFor(modelId);
  const sp = new URLSearchParams();
  sp.set('m', modelId);
  for (const d of PARAMS) if (String(params[d.k]) !== String(def[d.k])) sp.set(d.k, params[d.k]);
  if (color !== DEFAULT_COLOR) sp.set('c', color.slice(1));
  return sp.toString();
}

function writeHash() {
  history.replaceState(null, '', '#' + hashString());
}

// ---------------------------------------------------------------------------
// model kartları

function renderModels() {
  const box = $('#models');
  box.innerHTML = '';
  for (const m of MODELS) {
    const b = el('button', { class: 'mcard' + (m.id === modelId ? ' on' : ''), type: 'button',
      'data-id': m.id, title: m.tarif });
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 10 10');
    b.append(svg, el('span', {}, m.ad));
    if (m.minik) b.append(el('i', { class: 'tag' }, 'minik'));
    b.addEventListener('click', () => selectModel(m.id));
    box.append(b);
  }
  renderDesc();
}

function renderDesc() {
  const m = modelById(modelId);
  $('#mdesc').innerHTML = `<b>${m.ad}.</b> ${m.tarif}`;
}

let thumbKey = '';
function renderThumbs() {
  if (!M) return;
  const key = `${params.pw}x${params.ph}`;
  if (key === thumbKey) return;
  thumbKey = key;
  for (const m of MODELS) {
    const b = $(`.mcard[data-id="${m.id}"]`);
    if (!b) continue;
    try {
      const o = frontOutline(M, m.id, { ...defaultsFor(m.id), pw: params.pw, ph: params.ph });
      const svg = b.querySelector('svg');
      const pad = 3;
      svg.setAttribute('viewBox', `${o.minX - pad} ${o.minY - pad} ${o.maxX - o.minX + 2 * pad} ${o.maxY - o.minY + 2 * pad}`);
      svg.innerHTML = `<path d="${o.d}"/>`;
    } catch (e) { console.warn('küçük resim', m.id, e); }
  }
}

function selectModel(id) {
  if (id === modelId) return;
  const keep = {};
  for (const k of KEEP_ON_SWITCH) keep[k] = params[k];
  modelId = id;
  params = sanitize(id, { ...defaultsFor(id), ...keep });
  document.querySelectorAll('.mcard').forEach((b) => b.classList.toggle('on', b.dataset.id === id));
  renderDesc();
  renderForm();
  schedule(0);
}

// ---------------------------------------------------------------------------
// form

const rows = new Map();   // k -> {row, set(v)}

function fmt(v, step) {
  const dec = String(step).includes('.') ? String(step).split('.')[1].length : 0;
  return Number(v).toFixed(dec);
}

function renderForm() {
  const m = modelById(modelId);
  const form = $('#form');
  form.innerHTML = '';
  rows.clear();
  for (const [g, title, collapsed] of GROUPS) {
    const defs = PARAMS.filter((d) => d.g === g);
    if (!defs.length) continue;
    let wrap;
    if (collapsed) {
      wrap = el('details', { class: 'grp' }, el('summary', {}, title));
    } else {
      wrap = el('div', { class: 'grp' }, el('div', { class: 'gtitle' }, title));
    }
    for (const d of defs) wrap.append(makeRow(d));
    if (g === 'sticker') wrap.append(stickerActionsRow());
    form.append(wrap);
  }
  renderPresets();
  refreshVisibility();
}

function makeRow(d) {
  const row = el('div', { class: 'row' });
  const id = 'p_' + d.k;
  if (d.type === 'select') {
    row.append(el('label', {}, d.ad));
    const seg = el('div', { class: 'seg' });
    const btns = [];
    for (const [v, label] of Object.entries(d.options)) {
      const b = el('button', { type: 'button', 'data-v': v }, label);
      b.addEventListener('click', () => setParam(d.k, /^\d+$/.test(v) ? Number(v) : v));
      btns.push(b);
      seg.append(b);
    }
    row.append(seg);
    rows.set(d.k, { row, d, set: (v) => btns.forEach((b) => b.classList.toggle('on', b.dataset.v === String(v))) });
  } else if (d.type === 'sticker') {
    row.append(el('label', {}, d.ad));
    const grid = el('div', { class: 'stk' });
    const btns = [];
    for (const st of STICKERS) {
      const b = el('button', { type: 'button', 'data-v': st.id, title: st.ad },
        el('img', { src: svgDataUrl(st.svg), alt: st.ad }), el('span', {}, st.ad));
      b.addEventListener('click', () => setParam(d.k, st.id));
      btns.push(b);
      grid.append(b);
    }
    const file = el('input', { type: 'file', accept: 'image/*', hidden: '' });
    const own = el('button', { type: 'button', 'data-v': 'ozel', title: 'Kendi görselini yükle' },
      el('div', { class: 'stk-own' }, '+'), el('span', {}, 'Kendi görselin'), file);
    own.addEventListener('click', (e) => {
      if (e.target === file) return;
      if (userSticker && params.stImg !== 'ozel') setParam(d.k, 'ozel');
      else file.click();
    });
    file.addEventListener('change', () => {
      const f = file.files && file.files[0];
      if (!f) return;
      const img = new Image();
      img.onload = () => {
        userSticker = img;
        own.querySelector('.stk-own').replaceChildren(el('img', { src: img.src, alt: '' }));
        if (params.stImg === 'ozel') refreshSticker(); else setParam(d.k, 'ozel');
      };
      img.src = URL.createObjectURL(f);
      file.value = '';
    });
    btns.push(own);
    grid.append(own);
    row.append(grid);
    if (d.ipucu) row.append(el('div', { class: 'ip' }, d.ipucu));
    rows.set(d.k, { row, d, set: (v) => btns.forEach((b) => b.classList.toggle('on', b.dataset.v === String(v))) });
  } else if (d.type === 'text') {
    const inp = el('input', { type: 'text', id, maxlength: d.max, autocomplete: 'off', spellcheck: 'false' });
    inp.addEventListener('input', () => setParam(d.k, inp.value, false, inp));
    row.append(el('label', { for: id }, d.ad), el('div', { class: 'txt-in' }, inp));
    if (d.ipucu) row.append(el('div', { class: 'ip' }, d.ipucu));
    rows.set(d.k, { row, d, set: (v, src) => { if (src !== inp) inp.value = v; } });
  } else if (d.type === 'bool') {
    const inp = el('input', { type: 'checkbox', id });
    inp.addEventListener('change', () => setParam(d.k, inp.checked));
    row.append(el('label', { for: id }, d.ad), el('label', { class: 'sw' }, inp, el('i')));
    rows.set(d.k, { row, d, set: (v) => { inp.checked = !!v; } });
  } else {
    const num = el('input', { type: 'number', id, min: d.min, max: d.max, step: d.step, inputmode: 'decimal' });
    const rng = el('input', { type: 'range', min: d.min, max: d.max, step: d.step, 'aria-label': d.ad });
    num.addEventListener('change', () => {
      const v = Number(String(num.value).replace(',', '.'));
      if (Number.isFinite(v)) setParam(d.k, v, true);
      else num.value = fmt(params[d.k], d.step);
    });
    num.addEventListener('input', () => {
      const v = Number(num.value);
      if (Number.isFinite(v) && v >= d.min && v <= d.max) setParam(d.k, v, false, num);
    });
    rng.addEventListener('input', () => setParam(d.k, Number(rng.value)));
    row.append(el('label', { for: id }, d.ad),
      el('div', { class: 'num-in' }, num, el('span', {}, d.unit || 'mm')), rng);
    if (d.ipucu) row.append(el('div', { class: 'ip' }, d.ipucu));
    rows.set(d.k, { row, d, set: (v, src) => {
      if (src !== num) num.value = fmt(v, d.step);
      rng.value = v;
    } });
  }
  return row;
}

function syncForm(src) {
  for (const [k, r] of rows) r.set(params[k], src);
  refreshVisibility();
  renderPresets();
}

function refreshVisibility() {
  const m = modelById(modelId);
  for (const [, r] of rows) {
    const vis = !r.d.show || r.d.show(params, m);
    r.row.style.display = vis ? '' : 'none';
  }
}

function renderPresets() {
  const box = $('#presets');
  box.innerHTML = '';
  for (const [w, h, label] of PRESETS) {
    const on = params.pw === w && params.ph === h;
    const c = el('button', { class: 'chip' + (on ? ' on' : ''), type: 'button' }, label);
    c.addEventListener('click', () => { params = sanitize(modelId, { ...params, pw: w, ph: h }); syncForm(); schedule(0); });
    box.append(c);
  }
}

function setParam(k, v, clampNow = false, src = null) {
  const next = sanitize(modelId, { ...params, [k]: v });
  params = next;
  if (clampNow || !src) syncForm(src);
  else { refreshVisibility(); renderPresets(); }
  schedule();
}

// ---------------------------------------------------------------------------
// renkli sticker: görsel, kesim şekli, önizleme dokusu, baskı sayfası

let userSticker = null;
const stickerCache = new Map();

function stickerImage() {
  const id = params.stImg;
  if (id === 'ozel') return Promise.resolve(userSticker || null);
  const st = stickerById(id) || STICKERS[0];
  if (!stickerCache.has(st.id)) {
    stickerCache.set(st.id, new Promise((res) => {
      const img = new Image();
      img.onload = () => res(img);
      img.onerror = () => res(null);
      img.src = svgDataUrl(st.svg);
    }));
  }
  return stickerCache.get(st.id);
}

// Sticker'ı mm ölçüsünde canvas'a çizer. bleed: kesim dışına taşan görsel (mm),
// cut: kesim çizgisi çizilsin mi.
function drawSticker(img, st, pxmm, { bleed = 0, cut = false } = {}) {
  const W = (st.w + 2 * bleed) * pxmm, H = (st.h + 2 * bleed) * pxmm;
  const cv = document.createElement('canvas');
  cv.width = Math.round(W);
  cv.height = Math.round(H);
  const c = cv.getContext('2d');
  const r3 = Math.min(3, st.w / 2, st.h / 2) * pxmm;
  const clip = (grow) => {
    c.beginPath();
    const w = (st.w + 2 * grow) * pxmm, h = (st.h + 2 * grow) * pxmm;
    if (st.shape === 'rect') c.roundRect(W / 2 - w / 2, H / 2 - h / 2, w, h, r3 + grow * pxmm);
    else c.ellipse(W / 2, H / 2, w / 2, h / 2, 0, 0, Math.PI * 2);
  };
  c.save();
  clip(bleed);
  c.clip();
  if (img) {
    const k = Math.max(W / img.width, H / img.height);
    c.drawImage(img, (W - img.width * k) / 2, (H - img.height * k) / 2, img.width * k, img.height * k);
  } else {
    c.fillStyle = '#ddd';
    c.fillRect(0, 0, W, H);
  }
  c.restore();
  if (cut) {
    clip(0);
    c.lineWidth = Math.max(1, 0.12 * pxmm);
    c.strokeStyle = 'rgba(0,0,0,.55)';
    c.setLineDash([1.2 * pxmm, 0.8 * pxmm]);
    c.stroke();
  }
  return cv;
}

async function refreshSticker() {
  if (!viewer || !result) return;
  const st = result.dims.sticker;
  if (!st) { viewer.setSticker(null); return; }
  const img = await stickerImage();
  viewer.setSticker(st, drawSticker(img, st, 16));
}

function stickerActionsRow() {
  const row = el('div', { class: 'row' });
  const sheet = el('button', { class: 'btn', type: 'button' }, '🖨️ Sticker sayfası (A4)');
  const png = el('button', { class: 'btn', type: 'button' }, '⬇ PNG (300 dpi)');
  sheet.addEventListener('click', printStickerSheet);
  png.addEventListener('click', downloadStickerPng);
  row.append(el('div', { class: 'st-act' }, sheet, png),
    el('div', { class: 'ip', id: 'stInfo' }));
  rows.set('_stActions', { row, d: { show: (p) => p.stOn }, set: () => {} });
  return row;
}

function stickerInfo() {
  const box = $('#stInfo');
  if (!box) return;
  const st = result && result.dims.sticker;
  box.textContent = st
    ? `Kesim ölçüsü ${st.w.toFixed(1)} × ${st.h.toFixed(1)} mm · yuva ${(st.w + 0.5).toFixed(1)} × ${(st.h + 0.5).toFixed(1)} mm, ${st.depth.toFixed(2)} mm derin. Yapışkanlı kâğıda basıp kesik çizgiden kes.`
    : '';
}

async function printStickerSheet() {
  const st = result && result.dims.sticker;
  if (!st) return;
  const win = window.open('', '_blank');
  if (!win) { toast('Açılır pencereye izin ver'); return; }
  const img = await stickerImage();
  const bleed = 1, gap = 3;
  const url = drawSticker(img, st, 12, { bleed, cut: true }).toDataURL('image/png');
  const cw = st.w + 2 * bleed, chh = st.h + 2 * bleed;
  const cols = Math.max(1, Math.floor((190 + gap) / (cw + gap)));
  const rowsN = Math.max(1, Math.floor((265 + gap) / (chh + gap)));
  const n = cols * rowsN;
  const imgs = Array.from({ length: n }, () => `<img src="${url}" alt="">`).join('');
  win.document.write(`<!doctype html><html lang="tr"><head><meta charset="utf-8">
<title>Sticker sayfası ${st.w.toFixed(1)}×${st.h.toFixed(1)} mm</title>
<style>@page{size:A4;margin:10mm}*{box-sizing:border-box}body{margin:0;font-family:Arial,sans-serif;color:#333}
.h{font-size:9pt;line-height:1.4;margin:0 0 4mm;height:8mm}
.g{display:flex;flex-wrap:wrap;gap:${gap}mm;width:190mm}
img{width:${cw}mm;height:${chh}mm;display:block}
@media screen{body{padding:10mm;background:#eee}.g{background:#fff;padding:0;outline:1px solid #ccc}}</style></head>
<body><p class="h"><b>${n} adet sticker · kesim ölçüsü ${st.w.toFixed(1)} × ${st.h.toFixed(1)} mm</b> —
Yazdırırken ölçek <b>%100 / Gerçek boyut</b> olsun ("Sayfaya sığdır" kapalı). Kesik çizgiden kes.</p>
<div class="g">${imgs}</div>
<script>window.onload=function(){setTimeout(function(){window.print()},400)}<\/script></body></html>`);
  win.document.close();
}

async function downloadStickerPng() {
  const st = result && result.dims.sticker;
  if (!st) return;
  const img = await stickerImage();
  const cv = drawSticker(img, st, 300 / 25.4, { bleed: 1, cut: true });
  cv.toBlob((blob) => {
    const name = `sticker_${params.stImg}_${st.w.toFixed(1)}x${st.h.toFixed(1)}mm.png`;
    download({ name, buf: blob });
  }, 'image/png');
}

// ---------------------------------------------------------------------------
// üretim

let timer = 0;
function schedule(ms = 90) {
  clearTimeout(timer);
  timer = setTimeout(regenerate, ms);
}

function regenerate() {
  writeHash();
  if (!M) return;
  const t0 = performance.now();
  try {
    result = build(M, modelId, params);
  } catch (e) {
    console.error(e);
    showWarn(['Bu ölçülerle geometri üretilemedi: ' + (e.message || e)]);
    return;
  }
  const ms = performance.now() - t0;
  $('#busy').textContent = `${ms.toFixed(0)} ms`;
  renderThumbs();
  showStats();
  showWarn(result.warn);
  prepareDownloads();
  if (viewer) viewer.update(result);
  stickerInfo();
  refreshSticker();
}

function showStats() {
  const r = result, dm = r.dims;
  const dens = 1.24; // PLA g/cm³
  const vol = r.stats.frame.vol + r.stats.plate.vol * r.plateCount;
  const grams = (vol / 1000) * dens;
  const depth = Math.max(dm.zt, dm.plateMax[2] - dm.frameMin[2]);
  const items = [
    [`${dm.frame[0].toFixed(1)} × ${dm.frame[1].toFixed(1)}`, 'Dış ölçü mm'],
    [`${depth.toFixed(1)} mm`, 'Kalınlık'],
    [`${dm.window[0].toFixed(1)} × ${dm.window[1].toFixed(1)}`, 'Görünen alan mm'],
    [`≈ ${grams.toFixed(1)} g`, 'PLA (tam dolu)'],
  ];
  $('#stats').innerHTML = items.map(([b, s]) => `<div class="stat"><b>${b}</b><span>${s}</span></div>`).join('');
}

function showWarn(list) {
  const w = $('#warn');
  if (!list || !list.length) { w.classList.remove('show'); w.innerHTML = ''; return; }
  w.innerHTML = '<ul>' + list.map((t) => `<li>${t}</li>`).join('') + '</ul>';
  w.classList.add('show');
}

const files = {};
function prepareDownloads() {
  const base = `anahtarlik_${modelId}_${params.pw}x${params.ph}`.replace(/\./g, '_');
  const mk = (which, suffix) => {
    const buf = toBinarySTL(layoutForPrint(result, which), `${base}_${suffix}`);
    return { name: `${base}_${suffix}.stl`, buf };
  };
  files.all = mk('all', 'tumu');
  files.frame = mk('frame', 'cerceve');
  files.plate = result.plateCount ? mk('plate', 'kapak') : null;
  const kb = (f) => `${(f.buf.byteLength / 1024).toFixed(0)} KB`;
  $('#szAll').textContent = kb(files.all);
  $('#szFrame').textContent = kb(files.frame);
  $('#szPlate').textContent = files.plate ? kb(files.plate) : '';
  // kaset tek parça: kapak yok, gövde = tümü
  $('#dlPlate').hidden = !files.plate;
  $('#dlFrame').hidden = !files.plate;
  ['#dlAll', '#dlFrame', '#dlPlate'].forEach((s) => { $(s).disabled = false; });
}

function download(f) {
  const blob = f.buf instanceof Blob ? f.buf : new Blob([f.buf], { type: 'model/stl' });
  const url = URL.createObjectURL(blob);
  const a = el('a', { href: url, download: f.name });
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
  toast(`${f.name} indirildi`);
}

function toast(msg) {
  const t = $('#toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toast.t);
  toast.t = setTimeout(() => t.classList.remove('show'), 2200);
}

// ---------------------------------------------------------------------------
// fotoğraf dokusu

const photoCanvas = document.createElement('canvas');
let userImage = null;

function drawPhoto(wmm, hmm) {
  const k = 12;
  const W = Math.round(wmm * k), H = Math.round(hmm * k);
  photoCanvas.width = W;
  photoCanvas.height = H;
  const c = photoCanvas.getContext('2d');
  if (userImage) {
    const s = Math.max(W / userImage.width, H / userImage.height);
    const iw = userImage.width * s, ih = userImage.height * s;
    c.drawImage(userImage, (W - iw) / 2, (H - ih) / 2, iw, ih);
    return;
  }
  const g = c.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, '#dfe9f3');
  g.addColorStop(1, '#bcd0e4');
  c.fillStyle = g;
  c.fillRect(0, 0, W, H);
  const cx = W / 2, u = Math.min(W, H * 0.78);
  c.fillStyle = '#5b6b7e';
  c.beginPath();
  c.ellipse(cx, H * 0.40, u * 0.21, u * 0.27, 0, 0, Math.PI * 2);
  c.fill();
  c.beginPath();
  c.moveTo(cx - u * 0.48, H);
  c.bezierCurveTo(cx - u * 0.46, H * 0.70, cx - u * 0.22, H * 0.68, cx, H * 0.68);
  c.bezierCurveTo(cx + u * 0.22, H * 0.68, cx + u * 0.46, H * 0.70, cx + u * 0.48, H);
  c.closePath();
  c.fill();
  c.fillStyle = 'rgba(30,40,55,.55)';
  c.font = `500 ${Math.round(H * 0.06)}px Oswald, sans-serif`;
  c.textAlign = 'center';
  c.fillText(`${wmm} × ${hmm} mm`, cx, H * 0.1);
}

$('#photoIn').addEventListener('change', (e) => {
  const f = e.target.files && e.target.files[0];
  if (!f) return;
  const img = new Image();
  img.onload = () => { userImage = img; if (viewer && result) viewer.update(result); };
  img.src = URL.createObjectURL(f);
});

// ---------------------------------------------------------------------------
// 3B önizleme (three.js CDN'den; yüklenemezse STL üretimi yine çalışır)

let viewer = null;

async function initViewer() {
  const THREE = await import('three');
  const { OrbitControls } = await import('three/addons/controls/OrbitControls.js');
  const host = $('#viewer');
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  host.prepend(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, 1, 1, 5000);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.12;

  scene.add(new THREE.HemisphereLight(0xffffff, 0x334455, 1.1));
  const key = new THREE.DirectionalLight(0xffffff, 1.6);
  key.position.set(60, 120, 160);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0xffffff, 0.7);
  rim.position.set(-120, 40, -140);
  scene.add(rim);

  // Gövde koordinatları: ön yüz z=0, arka +z. Önden bakış için y ekseninde 180° çevir.
  const asm = new THREE.Group();
  asm.rotation.y = Math.PI;
  scene.add(asm);
  const bed = new THREE.Group();
  bed.rotation.x = -Math.PI / 2;
  scene.add(bed);

  const matFrame = new THREE.MeshStandardMaterial({ color, roughness: 0.55, metalness: 0.05 });
  const matPlate = new THREE.MeshStandardMaterial({ color, roughness: 0.65, metalness: 0.05 });
  const tex = new THREE.CanvasTexture(photoCanvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  const matPhoto = new THREE.MeshBasicMaterial({ map: tex, side: THREE.DoubleSide });

  let frameObj = null, platesObj = null, bedObj = null, grid = null;
  // Önizlemede metal anahtar halkası (deliğin içinden geçer, gövdeye dik durur)
  const ringR = 11;
  const keyRing = new THREE.Mesh(new THREE.TorusGeometry(ringR, 0.9, 14, 72),
    new THREE.MeshStandardMaterial({ color: 0xc9ced6, roughness: 0.25, metalness: 0.9 }));
  keyRing.rotation.y = Math.PI / 2;
  asm.add(keyRing);
  // arka kapaktaki renkli sticker (dokusu app tarafında çizilir)
  let stickerObj = null;
  function setSticker(st, canvas) {
    if (stickerObj) {
      asm.remove(stickerObj);
      stickerObj.geometry.dispose();
      stickerObj.material.map.dispose();
      stickerObj.material.dispose();
      stickerObj = null;
    }
    if (!st || !canvas) return;
    const t = new THREE.CanvasTexture(canvas);
    t.colorSpace = THREE.SRGBColorSpace;
    stickerObj = new THREE.Mesh(new THREE.PlaneGeometry(st.w, st.h),
      new THREE.MeshBasicMaterial({ map: t, transparent: true, alphaTest: 0.5 }));
    stickerObj.position.set(st.cx, st.cy, st.z + 0.05);
    stickerObj.userData.z = st.z + 0.05;
    asm.add(stickerObj);
  }
  const photoObjs = [];
  let explode = 0, explodeTarget = 0, slideT = 0;
  let fitR = 60;

  function geom(m) {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(m.pos, 3));
    g.setIndex(new THREE.BufferAttribute(m.idx, 1));
    const flat = g.toNonIndexed();
    g.dispose();
    flat.computeVertexNormals();
    return flat;
  }
  function replace(obj, parent, m, mat) {
    if (obj) { parent.remove(obj); obj.geometry.dispose(); }
    if (!m.idx.length) return null;
    const o = new THREE.Mesh(geom(m), mat);
    parent.add(o);
    return o;
  }

  function setColor(c) {
    const col = new THREE.Color(c);
    matFrame.color.copy(col);
    matPlate.color.copy(col).multiplyScalar(0.86);
  }
  setColor(color);

  function update(res) {
    frameObj = replace(frameObj, asm, res.frame, matFrame);
    platesObj = replace(platesObj, asm, res.platesAssembled, matPlate);
    const lay = layoutForPrint(res, 'all');
    const lb = meshBounds(lay);
    bedObj = replace(bedObj, bed, lay, matFrame);

    const [rx, ry] = res.dims.ring;
    keyRing.position.set(rx, ry + ringR, res.dims.zt / 2);

    drawPhoto(res.photo.w, res.photo.h);
    tex.needsUpdate = true;
    while (photoObjs.length) { const p = photoObjs.pop(); asm.remove(p); p.geometry.dispose(); }
    for (const cx of res.centers) {
      const p = new THREE.Mesh(new THREE.PlaneGeometry(res.photo.w, res.photo.h), matPhoto);
      p.rotation.y = Math.PI;
      p.position.set(cx, 0, res.photo.z + 0.02);
      p.userData.z = res.photo.z + 0.02;
      p.userData.slide = res.dims.kaset ? res.photo.h * 0.85 : 0;
      asm.add(p);
      photoObjs.push(p);
    }

    // montaj grubunu ortala
    const d = res.dims;
    const yTop = Math.max(d.frameMax[1], d.ring[1] + 2 * ringR + 1);
    const cy = (d.frameMin[1] + yTop) / 2;
    asm.position.set(0, -cy, 0);
    fitR = Math.hypot(d.frame[0], yTop - d.frameMin[1], Math.max(d.zt, d.plateMax[2])) / 2;

    // baskı tablası: grup x ekseninde -90° döndüğü için yerel y → dünya -z
    const lw = lb.max[0] - lb.min[0], ld = lb.max[1] - lb.min[1];
    bedObj.position.set(-lw / 2, -ld / 2, 0);
    if (grid) { scene.remove(grid); grid.geometry.dispose(); }
    const gs = Math.ceil(Math.max(lw, ld) / 10) * 10 + 20;
    grid = new THREE.GridHelper(gs, gs / 5, 0x3a4450, 0x262d36);
    scene.add(grid);
    applyView(false);
  }

  function applyView(animate = true) {
    const isBed = view === 'bed';
    asm.visible = !isBed;
    bed.visible = isBed;
    if (grid) grid.visible = isBed;
    explodeTarget = view === 'explode' ? Math.max(14, fitR * 0.45) : 0;
    if (!animate) explode = explodeTarget;
    // dar (dikey) ekranlarda yatay görüş açısı belirleyici olur
    const vh = (camera.fov * Math.PI) / 360;
    const hh = Math.atan(Math.tan(vh) * camera.aspect);
    const r = fitR / Math.tan(Math.min(vh, hh)) * 1.15;
    let pos;
    if (view === 'front') pos = [r * 0.18, r * 0.12, r];
    else if (view === 'explode') pos = [-r * 0.75, r * 0.35, -r * 0.65];
    else if (view === 'back') pos = [r * 0.15, r * 0.15, -r];
    else pos = [r * 0.35, r * 0.75, r * 0.75];
    camera.position.set(...pos);
    controls.target.set(0, 0, 0);
    controls.update();
  }

  let lastW = 0;
  function resize() {
    const w = host.clientWidth, h = host.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    // Mobilde adres çubuğu yüksekliği oynatır; kamerayı yalnız genişlik değişince yeniden oturt.
    if (w !== lastW) { lastW = w; if (frameObj) applyView(false); }
  }
  new ResizeObserver(resize).observe(host);
  resize();

  function tick() {
    explode += (explodeTarget - explode) * 0.15;
    slideT += ((view === 'explode' ? 1 : 0) - slideT) * 0.12;
    if (platesObj) platesObj.position.z = explode;
    if (stickerObj) stickerObj.position.z = stickerObj.userData.z + explode;
    for (const p of photoObjs) {
      // kaset: fotoğraf yarıktan yukarı kayar; klipsli: kapakla birlikte geriye açılır
      if (p.userData.slide) p.position.y = slideT * p.userData.slide;
      else p.position.z = p.userData.z + explode * 0.5;
    }
    controls.update();
    renderer.render(scene, camera);
    requestAnimationFrame(tick);
  }
  tick();

  return { update, applyView, setColor, setSticker };
}

// ---------------------------------------------------------------------------
// başlangıç

function initControls() {
  document.querySelectorAll('#views button').forEach((b) => {
    b.addEventListener('click', () => {
      view = b.dataset.v;
      document.querySelectorAll('#views button').forEach((x) => x.classList.toggle('on', x === b));
      if (viewer) viewer.applyView();
    });
  });
  const cbox = $('#colors');
  for (const [name, c] of COLORS) {
    const b = el('button', { type: 'button', title: name, 'aria-label': name, style: `background:${c}` });
    if (c === color) b.classList.add('on');
    b.addEventListener('click', () => {
      color = c;
      cbox.querySelectorAll('button').forEach((x) => x.classList.toggle('on', x === b));
      if (viewer) viewer.setColor(c);
      writeHash();
    });
    cbox.append(b);
  }
  $('#reset').addEventListener('click', () => {
    params = defaultsFor(modelId);
    syncForm();
    schedule(0);
  });
  $('#dlAll').addEventListener('click', () => download(files.all));
  $('#dlFrame').addEventListener('click', () => download(files.frame));
  $('#dlPlate').addEventListener('click', () => download(files.plate));
  $('#share').addEventListener('click', async () => {
    writeHash();
    try { await navigator.clipboard.writeText(location.href); toast('Bağlantı kopyalandı'); }
    catch { toast('Adres çubuğundaki bağlantıyı kopyala'); }
  });
}

async function main() {
  readHash();
  renderModels();
  renderForm();
  syncForm();
  initControls();

  const viewerP = initViewer().then((v) => { viewer = v; if (result) { v.update(result); refreshSticker(); } })
    .catch((e) => {
      console.warn('önizleme yüklenemedi', e);
      $('#loading').textContent = 'Önizleme yüklenemedi — STL indirme yine çalışır.';
    });

  try {
    M = await Module();
    M.setup();
  } catch (e) {
    $('#loading').textContent = 'Geometri motoru yüklenemedi: ' + (e.message || e);
    return;
  }
  regenerate();
  await viewerP;
  if (viewer) $('#loading').remove();
}

main();

// test ve hata ayıklama için
window.__vc = { get result() { return result; }, get params() { return params; }, BASE };
