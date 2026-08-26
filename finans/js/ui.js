// ui.js — Yeniden kullanılabilir arayüz bileşenleri: toast, modal, onay,
// progress bar, kart, boş durum ve SVG grafikler.

import { el, esc, money, clamp } from './utils.js';

// ---- Toast ----
let toastRoot;
export function toast(msg, type = 'success') {
  if (!toastRoot) {
    toastRoot = el('div', { class: 'toast-root' });
    document.body.appendChild(toastRoot);
  }
  const t = el('div', { class: `toast toast-${type}`, text: msg });
  toastRoot.appendChild(t);
  requestAnimationFrame(() => t.classList.add('show'));
  setTimeout(() => {
    t.classList.remove('show');
    setTimeout(() => t.remove(), 250);
  }, 2800);
}

// ---- Modal / Bottom sheet ----
// options: { title, body(HTMLElement), sheet(bool), onClose }
export function openModal({ title, body, sheet = false, onClose } = {}) {
  const overlay = el('div', { class: 'modal-overlay' });
  const box = el('div', { class: 'modal' + (sheet ? ' modal-sheet' : '') });
  const header = el('div', { class: 'modal-head' }, [
    el('h3', { text: title || '' }),
    el('button', { class: 'icon-btn', 'aria-label': 'Kapat', html: '&times;', onClick: close }),
  ]);
  const content = el('div', { class: 'modal-body' }, [body]);
  box.append(header, content);
  overlay.appendChild(box);
  document.body.appendChild(overlay);
  document.body.style.overflow = 'hidden';
  requestAnimationFrame(() => overlay.classList.add('show'));

  function close() {
    overlay.classList.remove('show');
    document.body.style.overflow = '';
    setTimeout(() => overlay.remove(), 220);
    if (onClose) onClose();
  }
  overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
  document.addEventListener('keydown', function onKey(e) {
    if (e.key === 'Escape') { close(); document.removeEventListener('keydown', onKey); }
  });
  return { close, overlay, box };
}

// ---- Onay diyaloğu ----
export function confirmDialog({ title = 'Emin misiniz?', message = '', confirmText = 'Sil', danger = true, onConfirm }) {
  const body = el('div', {}, [
    el('p', { class: 'muted', text: message }),
    el('div', { class: 'modal-actions' }, [
      el('button', { class: 'btn btn-ghost', text: 'Vazgeç', onClick: () => m.close() }),
      el('button', {
        class: 'btn ' + (danger ? 'btn-danger' : 'btn-primary'),
        text: confirmText,
        onClick: () => { m.close(); onConfirm && onConfirm(); },
      }),
    ]),
  ]);
  const m = openModal({ title, body });
  return m;
}

// ---- Progress bar ----
// value/max -> renkli çubuk. over: bütçe aşımı uyarısı
export function progressBar(value, max, { color, showPct = false } = {}) {
  const pct = max > 0 ? clamp((value / max) * 100, 0, 100) : 0;
  const over = max > 0 && value > max;
  const wrap = el('div', { class: 'pbar' });
  const fill = el('div', { class: 'pbar-fill' + (over ? ' over' : '') });
  fill.style.width = pct + '%';
  if (color && !over) fill.style.background = color;
  wrap.appendChild(fill);
  if (showPct) wrap.appendChild(el('span', { class: 'pbar-label', text: Math.round((max > 0 ? value / max : 0) * 100) + '%' }));
  return wrap;
}

// ---- Kart ----
export function statCard({ label, value, sub, tone = 'neutral', icon }) {
  return el('div', { class: `stat-card tone-${tone}` }, [
    icon ? el('div', { class: 'stat-icon', text: icon }) : null,
    el('div', { class: 'stat-body' }, [
      el('div', { class: 'stat-label', text: label }),
      el('div', { class: 'stat-value', text: value }),
      sub ? el('div', { class: 'stat-sub', text: sub }) : null,
    ]),
  ]);
}

// ---- Boş durum ----
export function emptyState({ icon = '📭', title, message, actionText, onAction }) {
  return el('div', { class: 'empty' }, [
    el('div', { class: 'empty-icon', text: icon }),
    el('h3', { text: title }),
    message ? el('p', { class: 'muted', text: message }) : null,
    actionText ? el('button', { class: 'btn btn-primary', text: actionText, onClick: onAction }) : null,
  ]);
}

// ---- Bölüm başlığı ----
export function sectionCard(title, children, { action } = {}) {
  const head = el('div', { class: 'card-head' }, [
    el('h3', { text: title }),
    action || null,
  ]);
  return el('section', { class: 'card' }, [head, ...(Array.isArray(children) ? children : [children])]);
}

// ================= SVG Grafikler =================

const PALETTE = ['#4f8cff', '#22c55e', '#f97316', '#a855f7', '#ec4899',
  '#14b8a6', '#eab308', '#ef4444', '#64748b', '#8b5cf6', '#06b6d4', '#f43f5e'];

// Donut / pasta grafik. data: [{name, amount, icon}]
export function donutChart(data, { size = 200 } = {}) {
  const total = data.reduce((s, d) => s + d.amount, 0);
  const wrap = el('div', { class: 'chart-donut' });
  if (total <= 0) {
    return el('div', { class: 'chart-empty muted', text: 'Veri yok' });
  }
  const cx = size / 2; const cy = size / 2; const r = size / 2 - 6; const inner = r * 0.6;
  const ns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('viewBox', `0 0 ${size} ${size}`);
  svg.setAttribute('class', 'donut-svg');
  let a0 = -Math.PI / 2;
  data.forEach((d, i) => {
    const frac = d.amount / total;
    const a1 = a0 + frac * Math.PI * 2;
    const large = frac > 0.5 ? 1 : 0;
    const x0 = cx + r * Math.cos(a0); const y0 = cy + r * Math.sin(a0);
    const x1 = cx + r * Math.cos(a1); const y1 = cy + r * Math.sin(a1);
    const xi1 = cx + inner * Math.cos(a1); const yi1 = cy + inner * Math.sin(a1);
    const xi0 = cx + inner * Math.cos(a0); const yi0 = cy + inner * Math.sin(a0);
    const path = document.createElementNS(ns, 'path');
    path.setAttribute('d', `M ${x0} ${y0} A ${r} ${r} 0 ${large} 1 ${x1} ${y1} L ${xi1} ${yi1} A ${inner} ${inner} 0 ${large} 0 ${xi0} ${yi0} Z`);
    path.setAttribute('fill', PALETTE[i % PALETTE.length]);
    path.setAttribute('stroke', 'var(--bg-card)');
    path.setAttribute('stroke-width', '2');
    const title = document.createElementNS(ns, 'title');
    title.textContent = `${d.name}: ${money(d.amount)}`;
    path.appendChild(title);
    svg.appendChild(path);
    a0 = a1;
  });
  const center = document.createElementNS(ns, 'text');
  center.setAttribute('x', cx); center.setAttribute('y', cy - 4);
  center.setAttribute('text-anchor', 'middle'); center.setAttribute('class', 'donut-center');
  center.textContent = money(total, { compact: true });
  const centerSub = document.createElementNS(ns, 'text');
  centerSub.setAttribute('x', cx); centerSub.setAttribute('y', cy + 14);
  centerSub.setAttribute('text-anchor', 'middle'); centerSub.setAttribute('class', 'donut-center-sub');
  centerSub.textContent = 'Toplam';
  svg.append(center, centerSub);

  const legend = el('div', { class: 'chart-legend' });
  data.forEach((d, i) => {
    const pct = Math.round((d.amount / total) * 100);
    legend.appendChild(el('div', { class: 'legend-item' }, [
      el('span', { class: 'legend-dot', html: `<i style="background:${PALETTE[i % PALETTE.length]}"></i>` }),
      el('span', { class: 'legend-name', text: `${d.icon || ''} ${d.name}` }),
      el('span', { class: 'legend-val', text: `${money(d.amount, { compact: true })} · %${pct}` }),
    ]));
  });
  wrap.append(svg, legend);
  return wrap;
}

// Bar grafik. bars: [{label, value, color}]
export function barChart(bars, { height = 180, formatVal } = {}) {
  const max = Math.max(1, ...bars.map((b) => Math.abs(b.value)));
  const wrap = el('div', { class: 'chart-bars', style: `--h:${height}px` });
  for (const b of bars) {
    const h = (Math.abs(b.value) / max) * 100;
    const col = el('div', { class: 'bar-col' }, [
      el('div', { class: 'bar-value', text: formatVal ? formatVal(b.value) : money(b.value, { compact: true }) }),
      el('div', { class: 'bar-track' }, [
        el('div', { class: 'bar-fill', style: `height:${h}%;background:${b.color || '#4f8cff'}` }),
      ]),
      el('div', { class: 'bar-label', text: b.label }),
    ]);
    wrap.appendChild(col);
  }
  return wrap;
}

// Çizgi/alan trend grafik. points: [{label, value}]
export function trendChart(points, { height = 180, color = '#4f8cff' } = {}) {
  const wrap = el('div', { class: 'chart-trend' });
  if (!points.length) return el('div', { class: 'chart-empty muted', text: 'Veri yok' });
  const w = 600; const h = height; const pad = 28;
  const max = Math.max(1, ...points.map((p) => p.value));
  const stepX = (w - pad * 2) / Math.max(1, points.length - 1);
  const ns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('viewBox', `0 0 ${w} ${h + 24}`);
  svg.setAttribute('class', 'trend-svg');
  svg.setAttribute('preserveAspectRatio', 'none');
  const coords = points.map((p, i) => [pad + i * stepX, pad + (1 - p.value / max) * (h - pad)]);
  const line = coords.map((c, i) => (i ? 'L' : 'M') + c[0].toFixed(1) + ' ' + c[1].toFixed(1)).join(' ');
  const area = `${line} L ${coords[coords.length - 1][0]} ${h} L ${coords[0][0]} ${h} Z`;
  const areaPath = document.createElementNS(ns, 'path');
  areaPath.setAttribute('d', area); areaPath.setAttribute('fill', color); areaPath.setAttribute('opacity', '0.12');
  const linePath = document.createElementNS(ns, 'path');
  linePath.setAttribute('d', line); linePath.setAttribute('fill', 'none');
  linePath.setAttribute('stroke', color); linePath.setAttribute('stroke-width', '2.5');
  linePath.setAttribute('stroke-linejoin', 'round'); linePath.setAttribute('vector-effect', 'non-scaling-stroke');
  svg.append(areaPath, linePath);
  coords.forEach((c, i) => {
    const dot = document.createElementNS(ns, 'circle');
    dot.setAttribute('cx', c[0]); dot.setAttribute('cy', c[1]); dot.setAttribute('r', '3.5');
    dot.setAttribute('fill', color);
    const title = document.createElementNS(ns, 'title');
    title.textContent = `${points[i].label}: ${money(points[i].value)}`;
    dot.appendChild(title);
    svg.appendChild(dot);
  });
  const labels = el('div', { class: 'trend-labels' });
  points.forEach((p) => labels.appendChild(el('span', { text: p.label })));
  wrap.append(svg, labels);
  return wrap;
}

export { PALETTE };
