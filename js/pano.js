/* =================================================================
   PANO TOPLAMA SİHİRBAZI — Elektrik Panosu Tasarım Aracı
   ================================================================= */

/* ── Sabitler ────────────────────────────────────────────────── */
const P_UNIT   = 26;              // px / DIN modülü
const P_SLOTS  = 32;              // modül / ray
const P_COMP_H = 68;              // bileşen yüksekliği px
const P_RAIL_H = 96;              // ray satır yüksekliği px
const P_DUCT_H = 28;              // kanal satır yüksekliği px
const P_TERM_R = 5;               // terminal nokta yarıçapı px
const P_W      = P_SLOTS * P_UNIT; // panel genişliği = 832px

/* ── Bileşen Tipleri ─────────────────────────────────────────── */
const PT = {
  psu24: {
    name: '24V DC Güç Kaynağı', short: 'PSU', u: 5, cat: 'güç',
    clr: '#1a3a6b', prefix: 'G',
    terms: [
      { id: 'Lin',  lbl: 'L in',  side: 't', off: 0.20, clr: '#cc3333' },
      { id: 'Nin',  lbl: 'N in',  side: 't', off: 0.50, clr: '#888888' },
      { id: 'PEin', lbl: 'PE',    side: 't', off: 0.80, clr: '#667700' },
      { id: 'Lp',   lbl: '+24V',  side: 'b', off: 0.30, clr: '#cc0000' },
      { id: 'M',    lbl: '0V',    side: 'b', off: 0.70, clr: '#0000aa' },
    ]
  },
  mcb1p: {
    name: '1F Otomatik Sigorta', short: 'MCB', u: 1, cat: 'koruma',
    clr: '#252a30', prefix: 'Q',
    terms: [
      { id: 'in',  lbl: 'in',  side: 't', off: 0.50, clr: '#cc3333' },
      { id: 'out', lbl: 'out', side: 'b', off: 0.50, clr: '#cc3333' },
    ]
  },
  mcb3p: {
    name: '3F Otomatik Sigorta', short: 'MCB', u: 3, cat: 'koruma',
    clr: '#252a30', prefix: 'Q',
    terms: [
      { id: 'L1i', lbl: 'L1i', side: 't', off: 0.17, clr: '#cc3333' },
      { id: 'L2i', lbl: 'L2i', side: 't', off: 0.50, clr: '#555555' },
      { id: 'L3i', lbl: 'L3i', side: 't', off: 0.83, clr: '#888888' },
      { id: 'L1o', lbl: 'L1o', side: 'b', off: 0.17, clr: '#cc3333' },
      { id: 'L2o', lbl: 'L2o', side: 'b', off: 0.50, clr: '#555555' },
      { id: 'L3o', lbl: 'L3o', side: 'b', off: 0.83, clr: '#888888' },
    ]
  },
  kontaktor: {
    name: 'Kontaktör', short: 'KM', u: 4, cat: 'kumanda',
    clr: '#0d2a1a', prefix: 'KM',
    terms: [
      { id: 'L1i', lbl: 'L1i', side: 't', off: 0.14, clr: '#cc3333' },
      { id: 'L2i', lbl: 'L2i', side: 't', off: 0.35, clr: '#555555' },
      { id: 'L3i', lbl: 'L3i', side: 't', off: 0.57, clr: '#888888' },
      { id: 'L1o', lbl: 'L1o', side: 'b', off: 0.14, clr: '#cc3333' },
      { id: 'L2o', lbl: 'L2o', side: 'b', off: 0.35, clr: '#555555' },
      { id: 'L3o', lbl: 'L3o', side: 'b', off: 0.57, clr: '#888888' },
      { id: 'A1',  lbl: 'A1',  side: 'b', off: 0.78, clr: '#cc0000' },
      { id: 'A2',  lbl: 'A2',  side: 'b', off: 0.90, clr: '#0000aa' },
    ]
  },
  termik: {
    name: 'Termik Röle', short: 'F', u: 3, cat: 'koruma',
    clr: '#2a1a0d', prefix: 'F',
    terms: [
      { id: 'L1i', lbl: 'L1i', side: 't', off: 0.17, clr: '#cc3333' },
      { id: 'L2i', lbl: 'L2i', side: 't', off: 0.50, clr: '#555555' },
      { id: 'L3i', lbl: 'L3i', side: 't', off: 0.83, clr: '#888888' },
      { id: 'L1o', lbl: 'L1o', side: 'b', off: 0.17, clr: '#cc3333' },
      { id: 'L2o', lbl: 'L2o', side: 'b', off: 0.50, clr: '#555555' },
      { id: 'L3o', lbl: 'L3o', side: 'b', off: 0.83, clr: '#888888' },
      { id: 'k95', lbl: '95',  side: 't', off: 0.70, clr: '#669900' },
      { id: 'k96', lbl: '96',  side: 't', off: 0.85, clr: '#669900' },
    ]
  },
  plc: {
    name: 'PLC CPU S7-1200', short: 'S7-1200', u: 8, cat: 'kontrol',
    clr: '#002060', prefix: 'A',
    terms: [
      { id: 'L',   lbl: 'L',   side: 't', off: 0.06, clr: '#cc3333' },
      { id: 'N',   lbl: 'N',   side: 't', off: 0.12, clr: '#888888' },
      { id: 'PE',  lbl: 'PE',  side: 't', off: 0.18, clr: '#667700' },
      { id: 'I00', lbl: 'I0.0',side: 't', off: 0.32, clr: '#0055aa' },
      { id: 'I01', lbl: 'I0.1',side: 't', off: 0.42, clr: '#0055aa' },
      { id: 'I02', lbl: 'I0.2',side: 't', off: 0.52, clr: '#0055aa' },
      { id: 'I03', lbl: 'I0.3',side: 't', off: 0.62, clr: '#0055aa' },
      { id: 'Q00', lbl: 'Q0.0',side: 'b', off: 0.32, clr: '#aa0000' },
      { id: 'Q01', lbl: 'Q0.1',side: 'b', off: 0.42, clr: '#aa0000' },
      { id: 'Q02', lbl: 'Q0.2',side: 'b', off: 0.52, clr: '#aa0000' },
      { id: 'Q03', lbl: 'Q0.3',side: 'b', off: 0.62, clr: '#aa0000' },
      { id: 'Lp',  lbl: '+24', side: 'b', off: 0.06, clr: '#cc0000' },
      { id: 'M',   lbl: '0V',  side: 'b', off: 0.12, clr: '#0000aa' },
    ]
  },
  relay: {
    name: 'Röle Modülü', short: 'K', u: 1, cat: 'kumanda',
    clr: '#2a1a3a', prefix: 'K',
    terms: [
      { id: 'A1',  lbl: 'A1',  side: 't', off: 0.50, clr: '#cc0000' },
      { id: 'A2',  lbl: 'A2',  side: 'b', off: 0.50, clr: '#0000aa' },
      { id: 'c14', lbl: '14',  side: 't', off: 0.25, clr: '#00aa00' },
      { id: 'c11', lbl: '11',  side: 'b', off: 0.25, clr: '#00aa00' },
    ]
  },
  klR: {
    name: 'Kırmızı Klemens (+24V)', short: '+', u: 1, cat: 'klemens',
    clr: '#aa0000', prefix: 'X',
    terms: [
      { id: 'a', lbl: 'a', side: 't', off: 0.50, clr: '#ff3333' },
      { id: 'b', lbl: 'b', side: 'b', off: 0.50, clr: '#ff3333' },
    ]
  },
  klB: {
    name: 'Siyah Klemens (0V)', short: '−', u: 1, cat: 'klemens',
    clr: '#001a66', prefix: 'X',
    terms: [
      { id: 'a', lbl: 'a', side: 't', off: 0.50, clr: '#3333ff' },
      { id: 'b', lbl: 'b', side: 'b', off: 0.50, clr: '#3333ff' },
    ]
  },
  klPE: {
    name: 'Sarı-Yeşil Klemens (PE)', short: 'PE', u: 1, cat: 'klemens',
    clr: '#4a5a00', prefix: 'X',
    terms: [
      { id: 'a', lbl: 'a', side: 't', off: 0.50, clr: '#aacc00' },
      { id: 'b', lbl: 'b', side: 'b', off: 0.50, clr: '#aacc00' },
    ]
  },
  klW: {
    name: 'Gri Klemens (Sinyal)', short: '○', u: 1, cat: 'klemens',
    clr: '#3a4450', prefix: 'X',
    terms: [
      { id: 'a', lbl: 'a', side: 't', off: 0.50, clr: '#aaaaaa' },
      { id: 'b', lbl: 'b', side: 'b', off: 0.50, clr: '#aaaaaa' },
    ]
  },
  kapak: {
    name: 'Son Kapak', short: '|', u: 0.5, cat: 'aksesuar',
    clr: '#666666', prefix: '',
    terms: []
  },
};

/* ── Durum Modeli ────────────────────────────────────────────── */
let PS = {
  rows: [],
  wires: [],
  ghost: null,
  sel: null,
  w0: null,
  cabling: false,
  wColor: '#cc0000',
  wSection: '1.5',
  uid: 1,
  labelNums: {},
};

/* ── Kablo kalınlığı tablosu ─────────────────────────────────── */
const WIRE_PX = { '0.5': 1.5, '0.75': 1.5, '1': 2, '1.5': 2, '2.5': 2.5, '4': 3, '6': 4, '10': 5 };

/* ── Kategori sırası ─────────────────────────────────────────── */
const PAL_ORDER = ['güç', 'koruma', 'kumanda', 'kontrol', 'klemens', 'aksesuar'];

/* ── Yardımcı: Benzersiz ID ──────────────────────────────────── */
function pUid() { return PS.uid++; }

/* ── Yardımcı: Etiket otomatik oluştur ──────────────────────── */
function pNextLabel(prefix) {
  if (!prefix) return '';
  if (!PS.labelNums[prefix]) PS.labelNums[prefix] = 0;
  PS.labelNums[prefix]++;
  return prefix + PS.labelNums[prefix];
}

/* ── Açılış Fonksiyonu ───────────────────────────────────────── */
function openPano() {
  switchTab('pano');
  // Eğer zaten başlatıldıysa yalnızca render et
  if (PS.rows.length === 0) {
    panoLoad();
    if (PS.rows.length === 0) panoClear();
  }
  panoRender();
  // ESC tuşu dinleyici
  if (!window._panoEscBound) {
    window._panoEscBound = true;
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        if (PS.ghost) { panoSetGhost(null); }
        else if (PS.w0) { PS.w0 = null; panoRenderWires(); panoRenderRows(); }
        else if (PS.sel) { panoSelectComp(null); }
      }
    });
  }
}

/* ── Ana Render ──────────────────────────────────────────────── */
function panoRender() {
  panoRenderPalette();
  panoRenderToolbar();
  panoRenderRows();
  panoRenderWires();
}

/* ── Palet Render ────────────────────────────────────────────── */
function panoRenderPalette() {
  const panel = document.getElementById('panoPalettePanel');
  if (!panel) return;
  panel.innerHTML = '';

  const title = document.createElement('div');
  title.className = 'pano-pal-title';
  title.textContent = 'BILEŞENLER';
  panel.appendChild(title);

  // Kategorilere göre grupla
  const byCat = {};
  for (const [key, pt] of Object.entries(PT)) {
    if (!byCat[pt.cat]) byCat[pt.cat] = [];
    byCat[pt.cat].push({ key, pt });
  }

  for (const cat of PAL_ORDER) {
    if (!byCat[cat]) continue;

    const catEl = document.createElement('div');
    catEl.className = 'pano-pal-cat';
    catEl.textContent = cat.toUpperCase();
    panel.appendChild(catEl);

    for (const { key, pt } of byCat[cat]) {
      const item = document.createElement('div');
      item.className = 'pano-pal-item' + (PS.ghost === key ? ' active' : '');
      item.title = pt.name + ' (' + pt.u + ' modül)';
      item.addEventListener('click', () => panoSetGhost(key));

      const swatch = document.createElement('div');
      swatch.className = 'pano-pal-swatch';
      swatch.style.background = pt.clr;
      swatch.textContent = pt.short.length <= 3 ? pt.short : pt.short.slice(0, 3);

      const nameEl = document.createElement('div');
      nameEl.className = 'pano-pal-name';
      nameEl.textContent = pt.name;

      const uEl = document.createElement('div');
      uEl.className = 'pano-pal-u';
      uEl.textContent = pt.u + 'M';

      item.appendChild(swatch);
      item.appendChild(nameEl);
      item.appendChild(uEl);
      panel.appendChild(item);
    }
  }
}

/* ── Toolbar Render ──────────────────────────────────────────── */
function panoRenderToolbar() {
  const tb = document.getElementById('panoToolbar');
  if (!tb) return;
  tb.innerHTML = '';

  // Kablo Modu butonu
  const cableBtn = document.createElement('button');
  cableBtn.className = 'btn ghost sm pano-cable-btn' + (PS.cabling ? ' active' : '');
  cableBtn.textContent = PS.cabling ? '✂ Kablo Modu Açık' : '⚡ Kablo Modu';
  cableBtn.addEventListener('click', () => {
    PS.cabling = !PS.cabling;
    if (!PS.cabling) { PS.w0 = null; }
    panoRenderToolbar();
    panoRenderRows();
    panoRenderWires();
  });
  tb.appendChild(cableBtn);

  // Renk seçici
  const clrLbl = document.createElement('span');
  clrLbl.className = 'pano-label';
  clrLbl.textContent = 'Renk:';
  tb.appendChild(clrLbl);

  const clrInput = document.createElement('input');
  clrInput.type = 'color';
  clrInput.className = 'pano-wire-clr';
  clrInput.value = PS.wColor;
  clrInput.title = 'Kablo rengi';
  clrInput.addEventListener('input', (e) => { PS.wColor = e.target.value; });
  tb.appendChild(clrInput);

  // Kesit seçici
  const secLbl = document.createElement('span');
  secLbl.className = 'pano-label';
  secLbl.textContent = 'mm²:';
  tb.appendChild(secLbl);

  const secSel = document.createElement('select');
  secSel.className = 'pano-wire-sec';
  secSel.title = 'Kablo kesiti';
  ['0.5','0.75','1','1.5','2.5','4','6','10'].forEach(v => {
    const opt = document.createElement('option');
    opt.value = v;
    opt.textContent = v;
    if (v === PS.wSection) opt.selected = true;
    secSel.appendChild(opt);
  });
  secSel.addEventListener('change', (e) => { PS.wSection = e.target.value; });
  tb.appendChild(secSel);

  // Ayraç
  const sep1 = document.createElement('div');
  sep1.className = 'pano-toolbar-sep';
  tb.appendChild(sep1);

  // Ray ekle butonu
  const addRailBtn = document.createElement('button');
  addRailBtn.className = 'btn ghost sm';
  addRailBtn.textContent = '+ Ray';
  addRailBtn.title = 'Yeni DIN ray satırı ekle';
  addRailBtn.addEventListener('click', () => panoAddRow('rail'));
  tb.appendChild(addRailBtn);

  // Kanal ekle butonu
  const addDuctBtn = document.createElement('button');
  addDuctBtn.className = 'btn ghost sm';
  addDuctBtn.textContent = '+ Kanal';
  addDuctBtn.title = 'Yeni kablo kanalı ekle';
  addDuctBtn.addEventListener('click', () => panoAddRow('duct'));
  tb.appendChild(addDuctBtn);

  // Ayraç
  const sep2 = document.createElement('div');
  sep2.className = 'pano-toolbar-sep';
  tb.appendChild(sep2);

  // BOM butonu
  const bomBtn = document.createElement('button');
  bomBtn.className = 'btn ghost sm';
  bomBtn.textContent = '📋 Malzeme Listesi';
  bomBtn.title = 'Malzeme ve kablo listesini göster/gizle';
  bomBtn.addEventListener('click', panoBOM);
  tb.appendChild(bomBtn);

  // Kaydet butonu
  const saveBtn = document.createElement('button');
  saveBtn.className = 'btn ghost sm';
  saveBtn.textContent = '💾 Kaydet';
  saveBtn.addEventListener('click', () => { panoSave(); toast('Pano kaydedildi', 'ok'); });
  tb.appendChild(saveBtn);

  // Sıfırla butonu
  const clrBtn = document.createElement('button');
  clrBtn.className = 'btn ghost sm';
  clrBtn.textContent = 'Sıfırla';
  clrBtn.addEventListener('click', () => {
    if (confirm('Pano sıfırlansın mı? Tüm bileşenler ve kablolar silinecek.')) {
      panoClear();
      panoRender();
    }
  });
  tb.appendChild(clrBtn);
}

/* ── Satırları Render ────────────────────────────────────────── */
function panoRenderRows() {
  const inner = document.getElementById('panoInner');
  if (!inner) return;
  inner.innerHTML = '';

  // Pano içi tıklama → deselect
  inner.addEventListener('click', (e) => {
    if (e.target === inner && PS.sel) {
      panoSelectComp(null);
    }
  });

  for (const row of PS.rows) {
    const rowEl = panoRenderRow(row);
    inner.appendChild(rowEl);
  }

  // Ray/Kanal ekle çubuğu
  const addBar = document.createElement('div');
  addBar.className = 'pano-add-row-bar';

  const addRailBtn2 = document.createElement('button');
  addRailBtn2.className = 'btn ghost sm';
  addRailBtn2.textContent = '+ Ray Ekle';
  addRailBtn2.addEventListener('click', () => panoAddRow('rail'));

  const addDuctBtn2 = document.createElement('button');
  addDuctBtn2.className = 'btn ghost sm';
  addDuctBtn2.textContent = '+ Kanal Ekle';
  addDuctBtn2.addEventListener('click', () => panoAddRow('duct'));

  addBar.appendChild(addRailBtn2);
  addBar.appendChild(addDuctBtn2);
  inner.appendChild(addBar);

  // Ghost yerleştirme ipucu
  if (PS.ghost) {
    const hint = document.createElement('div');
    hint.className = 'pano-esc-hint';
    hint.textContent = 'ESC ile iptal · Ray üzerine tıkla → yerleştir';
    inner.appendChild(hint);

    // Work area cursor
    const work = document.getElementById('panoWork');
    if (work) work.classList.add('pano-placing');
  } else {
    const work = document.getElementById('panoWork');
    if (work) work.classList.remove('pano-placing');
  }

  // Kablo modu class
  const work = document.getElementById('panoWork');
  if (work) {
    if (PS.cabling) work.classList.add('pano-cabling');
    else work.classList.remove('pano-cabling');
  }
}

/* ── Tek Satır Render ────────────────────────────────────────── */
function panoRenderRow(row) {
  const rowEl = document.createElement('div');
  rowEl.className = 'pano-row';
  rowEl.dataset.rowId = row.id;

  let inner;
  if (row.type === 'duct') {
    inner = panoRenderDuct(row);
  } else {
    inner = panoRenderRail(row);
  }
  rowEl.appendChild(inner);

  // Silme butonu (satır boşsa)
  const delBtn = document.createElement('button');
  delBtn.className = 'pano-row-del';
  delBtn.textContent = '×';
  delBtn.title = 'Satırı sil';
  delBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    panoDeleteRow(row.id);
  });
  rowEl.appendChild(delBtn);

  return rowEl;
}

/* ── Kanal Render ────────────────────────────────────────────── */
function panoRenderDuct(row) {
  const duct = document.createElement('div');
  duct.className = 'pano-duct';
  duct.style.width = P_W + 'px';

  // Slot çizgileri
  const slots = document.createElement('div');
  slots.className = 'pano-duct-slots';
  for (let i = 0; i < 80; i++) {
    const s = document.createElement('div');
    s.className = 'pano-duct-slot';
    slots.appendChild(s);
  }
  duct.appendChild(slots);

  // Etiket
  const lbl = document.createElement('div');
  lbl.className = 'pano-duct-label';
  lbl.textContent = row.label || '';
  duct.appendChild(lbl);

  return duct;
}

/* ── Ray Render ──────────────────────────────────────────────── */
function panoRenderRail(row) {
  const wrap = document.createElement('div');
  wrap.className = 'pano-rail-wrap';
  wrap.style.width = P_W + 'px';

  // DIN ray çubuğu
  const rail = document.createElement('div');
  rail.className = 'pano-din-rail';
  wrap.appendChild(rail);

  // Etiket
  const lbl = document.createElement('div');
  lbl.className = 'pano-rail-label';
  lbl.textContent = row.label || '';
  wrap.appendChild(lbl);

  // Bileşen katmanı
  const compsLayer = document.createElement('div');
  compsLayer.className = 'pano-rail-comps';
  wrap.appendChild(compsLayer);

  // Ghost yerleştirme
  let ghostEl = null;

  const handleMouseMove = (e) => {
    if (!PS.ghost) {
      if (ghostEl) { ghostEl.remove(); ghostEl = null; }
      return;
    }
    const rect = wrap.getBoundingClientRect();
    const relX = e.clientX - rect.left;
    const slot = Math.floor(relX / P_UNIT);
    const pt = PT[PS.ghost];
    const w = pt.u * P_UNIT;
    const snapped = slot * P_UNIT;

    if (!ghostEl) {
      ghostEl = document.createElement('div');
      ghostEl.className = 'pano-ghost';
      ghostEl.style.width = w + 'px';
      ghostEl.style.background = pt.clr;
      compsLayer.appendChild(ghostEl);
    }

    const valid = panoSlotsAreEmpty(row, slot, pt.u);
    ghostEl.classList.toggle('invalid', !valid);
    ghostEl.style.left = snapped + 'px';
  };

  const handleMouseLeave = () => {
    if (ghostEl) { ghostEl.remove(); ghostEl = null; }
  };

  const handleClick = (e) => {
    if (!PS.ghost) return;
    const rect = wrap.getBoundingClientRect();
    const relX = e.clientX - rect.left;
    const slot = Math.floor(relX / P_UNIT);
    panoPlaceComp(row.id, slot);
    if (ghostEl) { ghostEl.remove(); ghostEl = null; }
  };

  wrap.addEventListener('mousemove', handleMouseMove);
  wrap.addEventListener('mouseleave', handleMouseLeave);
  wrap.addEventListener('click', handleClick);

  // Bileşenleri çiz
  for (const comp of row.comps) {
    const compEl = panoRenderComp(comp, row);
    compsLayer.appendChild(compEl);
  }

  return wrap;
}

/* ── Bileşen Render ──────────────────────────────────────────── */
function panoRenderComp(comp, row) {
  const pt = PT[comp.type];
  if (!pt) return document.createElement('div');

  const w = pt.u * P_UNIT;

  const el = document.createElement('div');
  el.className = 'pano-comp' + (PS.sel === comp.id ? ' selected' : '');
  el.style.left = (comp.slot * P_UNIT) + 'px';
  el.style.width = w + 'px';
  el.style.background = pt.clr;
  el.dataset.cid = comp.id;

  // Kısa isim
  const shortEl = document.createElement('div');
  shortEl.className = 'pano-comp-short';
  shortEl.textContent = pt.short;
  el.appendChild(shortEl);

  // Etiket
  const codeEl = document.createElement('div');
  codeEl.className = 'pano-comp-code';
  codeEl.textContent = comp.label;
  el.appendChild(codeEl);

  // Seçim (cabling modunda değilse)
  el.addEventListener('click', (e) => {
    e.stopPropagation();
    if (PS.ghost) return;
    if (!PS.cabling) {
      panoSelectComp(PS.sel === comp.id ? null : comp.id);
    }
  });

  // Seçili silme butonu
  if (PS.sel === comp.id && !PS.cabling) {
    const delBtn = document.createElement('button');
    delBtn.className = 'pano-comp-del';
    delBtn.textContent = '×';
    delBtn.title = 'Bileşeni sil';
    delBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      panoDeleteComp(comp.id);
    });
    el.appendChild(delBtn);
  }

  // Terminaller
  for (const term of pt.terms) {
    const termEl = document.createElement('div');
    termEl.className = 'pano-term' + (PS.w0 && PS.w0.cid === comp.id && PS.w0.tid === term.id ? ' wire-start' : '');
    termEl.style.background = term.clr;
    termEl.title = term.lbl;
    termEl.dataset.cid = comp.id;
    termEl.dataset.tid = term.id;

    const tx = term.off * w;
    const ty = term.side === 't' ? 0 : P_COMP_H;
    termEl.style.left = tx + 'px';
    termEl.style.top  = ty + 'px';

    if (PS.cabling) {
      termEl.addEventListener('click', (e) => {
        e.stopPropagation();
        if (!PS.w0) {
          panoStartWire(comp.id, term.id);
        } else {
          panoEndWire(comp.id, term.id);
        }
      });
    }

    el.appendChild(termEl);
  }

  return el;
}

/* ── Kablo SVG Render ────────────────────────────────────────── */
function panoRenderWires() {
  const svg = document.getElementById('panoWireSvg');
  if (!svg) return;
  svg.innerHTML = '';

  for (const wire of PS.wires) {
    const p1 = panoGetTermPos(wire.fCid, wire.fTid);
    const p2 = panoGetTermPos(wire.tCid, wire.tTid);
    if (!p1 || !p2) continue;

    const strokeW = WIRE_PX[wire.section] || 2;
    const pathD   = panoRoutePath(p1.x, p1.y, p2.x, p2.y);

    // Hit alanı (görünmez, daha geniş)
    const hitPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    hitPath.setAttribute('d', pathD);
    hitPath.setAttribute('stroke', 'transparent');
    hitPath.setAttribute('stroke-width', Math.max(strokeW + 8, 12));
    hitPath.setAttribute('fill', 'none');
    hitPath.style.cursor = 'pointer';
    hitPath.style.pointerEvents = 'stroke';
    hitPath.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      panoDeleteWire(wire.id);
    });
    hitPath.addEventListener('click', (e) => {
      e.preventDefault();
      if (PS.cabling) panoDeleteWire(wire.id);
    });
    svg.appendChild(hitPath);

    // Görünür kablo
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', pathD);
    path.setAttribute('stroke', wire.color);
    path.setAttribute('stroke-width', strokeW);
    path.setAttribute('fill', 'none');
    path.setAttribute('stroke-linecap', 'round');
    path.className = 'pano-wire-line';
    path.style.pointerEvents = 'none';
    svg.appendChild(path);

    // Kesit etiketi
    const mx = (p1.x + p2.x) / 2;
    const my = (p1.y + p2.y) / 2;
    const secTxt = wire.section + 'mm²';

    const bg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    bg.setAttribute('x', mx - 20);
    bg.setAttribute('y', my - 8);
    bg.setAttribute('width', 40);
    bg.setAttribute('height', 14);
    bg.setAttribute('rx', 3);
    bg.setAttribute('fill', 'rgba(0,0,0,0.55)');
    bg.style.pointerEvents = 'none';
    svg.appendChild(bg);

    const txt = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    txt.setAttribute('x', mx);
    txt.setAttribute('y', my);
    txt.setAttribute('text-anchor', 'middle');
    txt.setAttribute('dominant-baseline', 'middle');
    txt.setAttribute('fill', 'rgba(255,255,255,0.8)');
    txt.setAttribute('font-size', '9');
    txt.setAttribute('font-family', 'JetBrains Mono, monospace');
    txt.style.pointerEvents = 'none';
    txt.textContent = secTxt;
    svg.appendChild(txt);
  }
}

/* ── Terminal Konumunu Hesapla ───────────────────────────────── */
function panoGetTermPos(cid, tid) {
  const inner = document.getElementById('panoInner');
  if (!inner) return null;

  const innerRect = inner.getBoundingClientRect();
  const work = document.getElementById('panoWork');
  const workRect = work ? work.getBoundingClientRect() : { left: 0, top: 0 };
  const scrollLeft = work ? work.scrollLeft : 0;
  const scrollTop  = work ? work.scrollTop  : 0;

  // Bileşeni bul
  const compEl = inner.querySelector(`[data-cid="${cid}"]`);
  if (!compEl) return null;

  const termEl = compEl.querySelector(`[data-cid="${cid}"][data-tid="${tid}"]`);
  if (!termEl) return null;

  const termRect = termEl.getBoundingClientRect();
  const cx = termRect.left + termRect.width  / 2 - workRect.left + scrollLeft - 20; // 20 = padding
  const cy = termRect.top  + termRect.height / 2 - workRect.top  + scrollTop  - 20;
  return { x: cx, y: cy };
}

/* ── Bezier Rota ─────────────────────────────────────────────── */
function panoRoutePath(x1, y1, x2, y2) {
  const my = (y1 + y2) / 2;
  return `M ${x1} ${y1} C ${x1} ${my} ${x2} ${my} ${x2} ${y2}`;
}

/* ── Ghost Yerleştirme Modu ──────────────────────────────────── */
function panoSetGhost(typeKey) {
  if (PS.ghost === typeKey) {
    PS.ghost = null;
  } else {
    PS.ghost = typeKey;
    PS.sel   = null;
    PS.w0    = null;
  }
  panoRenderPalette();
  panoRenderRows();
}

/* ── Boş Slot Kontrolü ───────────────────────────────────────── */
function panoSlotsAreEmpty(row, startSlot, units) {
  if (startSlot < 0) return false;
  if (startSlot + units > P_SLOTS) return false;
  for (const c of row.comps) {
    const pt = PT[c.type];
    if (!pt) continue;
    const cEnd   = c.slot + pt.u;
    const reqEnd = startSlot + units;
    if (startSlot < cEnd && reqEnd > c.slot) return false;
  }
  return true;
}

/* ── Bileşen Yerleştir ───────────────────────────────────────── */
function panoPlaceComp(railId, slot) {
  if (!PS.ghost) return;
  const row = PS.rows.find(r => r.id === railId);
  if (!row || row.type !== 'rail') return;

  const pt = PT[PS.ghost];
  if (!pt) return;

  if (!panoSlotsAreEmpty(row, slot, pt.u)) {
    toast('Bu alanda yer yok!', 'bad');
    return;
  }

  const label = pNextLabel(pt.prefix);
  const comp = {
    id:    pUid(),
    type:  PS.ghost,
    slot:  slot,
    label: label,
  };
  row.comps.push(comp);
  panoSave();
  panoRenderRows();
  panoRenderWires();
  toast('Eklendi: ' + label + ' (' + pt.name + ')', 'ok');
}

/* ── Bileşen Seç ─────────────────────────────────────────────── */
function panoSelectComp(cid) {
  PS.sel = cid;
  panoRenderRows();
  panoRenderWires();
}

/* ── Bileşen Sil ─────────────────────────────────────────────── */
function panoDeleteComp(cid) {
  // Bağlı kabloları da sil
  PS.wires = PS.wires.filter(w => w.fCid !== cid && w.tCid !== cid);
  // Bileşeni satırdan kaldır
  for (const row of PS.rows) {
    const idx = row.comps.findIndex(c => c.id === cid);
    if (idx !== -1) {
      const removed = row.comps.splice(idx, 1)[0];
      toast('Silindi: ' + removed.label, 'ok');
      break;
    }
  }
  if (PS.sel === cid) PS.sel = null;
  panoSave();
  panoRenderRows();
  panoRenderWires();
}

/* ── Satır Ekle ──────────────────────────────────────────────── */
function panoAddRow(type) {
  const num = PS.rows.filter(r => r.type === type).length + 1;
  const label = type === 'rail' ? 'Ray ' + num : 'Kanal ' + num;
  PS.rows.push({ id: pUid(), type, comps: [], label });
  panoSave();
  panoRenderRows();
  panoRenderWires();
}

/* ── Satır Sil ───────────────────────────────────────────────── */
function panoDeleteRow(rowId) {
  const row = PS.rows.find(r => r.id === rowId);
  if (!row) return;
  if (row.comps && row.comps.length > 0) {
    toast('Önce bileşenleri kaldırın!', 'bad');
    return;
  }
  PS.rows = PS.rows.filter(r => r.id !== rowId);
  panoSave();
  panoRenderRows();
  panoRenderWires();
}

/* ── Kablo Başlat ────────────────────────────────────────────── */
function panoStartWire(cid, tid) {
  PS.w0 = { cid, tid };
  panoRenderRows();
  panoRenderWires();
  toast('Terminal seçildi — hedef terminale tıkla', 'ok');
}

/* ── Kablo Bitir ─────────────────────────────────────────────── */
function panoEndWire(cid, tid) {
  if (!PS.w0) return;
  if (PS.w0.cid === cid) {
    PS.w0 = null;
    panoRenderRows();
    return;
  }
  // Zaten aynı bağlantı var mı?
  const exists = PS.wires.some(w =>
    (w.fCid === PS.w0.cid && w.fTid === PS.w0.tid && w.tCid === cid && w.tTid === tid) ||
    (w.fCid === cid && w.fTid === tid && w.tCid === PS.w0.cid && w.tTid === PS.w0.tid)
  );
  if (exists) {
    toast('Bu bağlantı zaten mevcut!', 'bad');
    PS.w0 = null;
    panoRenderRows();
    return;
  }

  const wire = {
    id:      pUid(),
    fCid:    PS.w0.cid,
    fTid:    PS.w0.tid,
    tCid:    cid,
    tTid:    tid,
    color:   PS.wColor,
    section: PS.wSection,
  };
  PS.wires.push(wire);
  PS.w0 = null;
  panoSave();
  panoRenderRows();
  panoRenderWires();
  toast('Kablo bağlandı', 'ok');
}

/* ── Kablo Sil ───────────────────────────────────────────────── */
function panoDeleteWire(wid) {
  PS.wires = PS.wires.filter(w => w.id !== wid);
  panoSave();
  panoRenderWires();
  toast('Kablo silindi', 'ok');
}

/* ── Malzeme Listesi (BOM) ───────────────────────────────────── */
function panoBOM() {
  const bomDiv = document.getElementById('panoBom');
  if (!bomDiv) return;

  if (bomDiv.style.display !== 'none') {
    bomDiv.style.display = 'none';
    return;
  }

  bomDiv.innerHTML = '';
  bomDiv.style.display = 'block';

  // Bileşen sayımı
  const counts = {};
  for (const row of PS.rows) {
    if (row.type !== 'rail') continue;
    for (const comp of row.comps) {
      const key = comp.type;
      if (!counts[key]) counts[key] = { pt: PT[key], items: [] };
      counts[key].items.push(comp);
    }
  }

  // Başlık
  const h4 = document.createElement('h4');
  h4.textContent = 'MALZEME LİSTESİ (BOM)';
  bomDiv.appendChild(h4);

  // Bileşen tablosu
  if (Object.keys(counts).length > 0) {
    const secEl = document.createElement('div');
    secEl.className = 'pano-bom-section';
    secEl.textContent = 'BİLEŞENLER';
    bomDiv.appendChild(secEl);

    const table = document.createElement('table');
    const thead = document.createElement('thead');
    const hrTr = document.createElement('tr');
    ['KOD', 'TANIM', 'ADET', 'NOTLAR'].forEach(h => {
      const th = document.createElement('th');
      th.textContent = h;
      hrTr.appendChild(th);
    });
    thead.appendChild(hrTr);
    table.appendChild(thead);

    const tbody = document.createElement('tbody');
    for (const [typeKey, info] of Object.entries(counts)) {
      const tr = document.createElement('tr');
      const codes = info.items.map(i => i.label).join(', ');

      const tdCode = document.createElement('td');
      tdCode.textContent = codes;

      const tdName = document.createElement('td');
      tdName.textContent = info.pt.name;

      const tdQty = document.createElement('td');
      tdQty.textContent = info.items.length;

      const tdNote = document.createElement('td');
      tdNote.style.color = 'var(--muted)';
      tdNote.textContent = info.pt.cat + ' · ' + info.pt.u + 'M';

      tr.appendChild(tdCode);
      tr.appendChild(tdName);
      tr.appendChild(tdQty);
      tr.appendChild(tdNote);
      tbody.appendChild(tr);
    }
    table.appendChild(tbody);
    bomDiv.appendChild(table);
  }

  // Kablo listesi
  if (PS.wires.length > 0) {
    const secEl2 = document.createElement('div');
    secEl2.className = 'pano-bom-section';
    secEl2.style.marginTop = '12px';
    secEl2.textContent = 'KABLO LİSTESİ';
    bomDiv.appendChild(secEl2);

    const tbl2 = document.createElement('table');
    const thead2 = document.createElement('thead');
    const hTr2 = document.createElement('tr');
    ['RENK', 'BAŞLANGIÇ', 'BİTİŞ', 'KESİT', 'TAH. UZUNLUK'].forEach(h => {
      const th = document.createElement('th');
      th.textContent = h;
      hTr2.appendChild(th);
    });
    thead2.appendChild(hTr2);
    tbl2.appendChild(thead2);

    const tbody2 = document.createElement('tbody');
    for (const wire of PS.wires) {
      const p1 = panoGetTermPos(wire.fCid, wire.fTid);
      const p2 = panoGetTermPos(wire.tCid, wire.tTid);
      let lenStr = '—';
      if (p1 && p2) {
        const manhattan = (Math.abs(p2.x - p1.x) + Math.abs(p2.y - p1.y));
        // Ölçek: 26px / modül, ~18mm / modül gerçekte
        const mm = (manhattan / P_UNIT) * 18;
        lenStr = Math.round(mm / 10) / 10 + ' dm';
      }

      const fComp = _panoFindComp(wire.fCid);
      const tComp = _panoFindComp(wire.tCid);
      const fLabel = fComp ? fComp.label + '.' + wire.fTid : '?';
      const tLabel = tComp ? tComp.label + '.' + wire.tTid : '?';

      const tr = document.createElement('tr');

      const tdClr = document.createElement('td');
      const dot = document.createElement('span');
      dot.className = 'bom-wire-dot';
      dot.style.background = wire.color;
      tdClr.appendChild(dot);
      tdClr.appendChild(document.createTextNode(wire.color));

      const tdFrom = document.createElement('td');
      tdFrom.textContent = fLabel;

      const tdTo = document.createElement('td');
      tdTo.textContent = tLabel;

      const tdSec = document.createElement('td');
      tdSec.textContent = wire.section + ' mm²';

      const tdLen = document.createElement('td');
      tdLen.textContent = lenStr;

      tr.appendChild(tdClr);
      tr.appendChild(tdFrom);
      tr.appendChild(tdTo);
      tr.appendChild(tdSec);
      tr.appendChild(tdLen);
      tbody2.appendChild(tr);
    }
    tbl2.appendChild(tbody2);
    bomDiv.appendChild(tbl2);
  }

  if (Object.keys(counts).length === 0 && PS.wires.length === 0) {
    const empty = document.createElement('p');
    empty.style.color = 'var(--muted)';
    empty.style.fontSize = '12px';
    empty.textContent = 'Panoda henüz bileşen yok.';
    bomDiv.appendChild(empty);
  }
}

/* ── Yardımcı: Bileşeni ID ile bul ──────────────────────────── */
function _panoFindComp(cid) {
  for (const row of PS.rows) {
    if (row.type !== 'rail') continue;
    const c = row.comps.find(x => x.id === cid);
    if (c) return c;
  }
  return null;
}

/* ── Kaydet ──────────────────────────────────────────────────── */
function panoSave() {
  try {
    localStorage.setItem('pano_state', JSON.stringify({
      rows:       PS.rows,
      wires:      PS.wires,
      uid:        PS.uid,
      labelNums:  PS.labelNums,
      wColor:     PS.wColor,
      wSection:   PS.wSection,
    }));
  } catch(e) {
    // localStorage dolu olabilir
  }
}

/* ── Yükle ───────────────────────────────────────────────────── */
function panoLoad() {
  try {
    const raw = localStorage.getItem('pano_state');
    if (!raw) return;
    const data = JSON.parse(raw);
    PS.rows       = data.rows       || [];
    PS.wires      = data.wires      || [];
    PS.uid        = data.uid        || 1;
    PS.labelNums  = data.labelNums  || {};
    PS.wColor     = data.wColor     || '#cc0000';
    PS.wSection   = data.wSection   || '1.5';
    PS.ghost      = null;
    PS.sel        = null;
    PS.w0         = null;
    PS.cabling    = false;
  } catch(e) {
    PS.rows = [];
  }
}

/* ── Sıfırla ─────────────────────────────────────────────────── */
function panoClear() {
  PS = {
    rows: [],
    wires: [],
    ghost: null,
    sel: null,
    w0: null,
    cabling: false,
    wColor: '#cc0000',
    wSection: '1.5',
    uid: 1,
    labelNums: {},
  };

  // Varsayılan başlangıç: kanal→ray→kanal→ray→kanal→ray→kanal
  const defaults = [
    { type: 'duct', label: 'Kanal 1' },
    { type: 'rail', label: 'Ray 1'   },
    { type: 'duct', label: 'Kanal 2' },
    { type: 'rail', label: 'Ray 2'   },
    { type: 'duct', label: 'Kanal 3' },
    { type: 'rail', label: 'Ray 3'   },
    { type: 'duct', label: 'Kanal 4' },
  ];
  for (const d of defaults) {
    PS.rows.push({ id: pUid(), type: d.type, comps: [], label: d.label });
  }
  panoSave();
}
