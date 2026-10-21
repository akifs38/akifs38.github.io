// Raporlar: proje kârlılığı, ekip saatleri ve işçilik maliyeti, teklif sonuçları (aylık), gider kategorileri. CSV dışa aktarma.

import { store } from '../store.js';
import { html, money, num, pct, today, addDays, toCsv, download } from '../util.js';
import { projectFinance, quoteTotals, quoteStatus, PROJECT_STATUS, EXPENSE_CATEGORIES } from '../calc.js';
import { icon, statusBadge, progress, empty, refresh } from '../ui.js';
import { go } from '../forms.js';

let period = '30';
const PERIODS = [['30', 'Son 30 gün'], ['90', 'Son 90 gün'], ['365', 'Son 1 yıl'], ['all', 'Tümü']];

const since = () => (period === 'all' ? '0000-00-00' : addDays(today(), -Number(period)));
const csvNum = (v) => (Number(v) || 0).toFixed(2).replace('.', ',');

function profitability() {
  const s = store.state;
  return s.projects.map((p) => ({ p, f: projectFinance(s, p.id), client: s.clients.find((c) => c.id === p.clientId) }))
    .sort((a, b) => b.f.profit - a.f.profit);
}

function teamHours() {
  const s = store.state;
  const from = since();
  return s.members.map((m) => {
    const entries = s.timeEntries.filter((e) => e.memberId === m.id && e.date >= from);
    const hours = entries.reduce((sum, e) => sum + (Number(e.hours) || 0), 0);
    const cost = entries.reduce((sum, e) => sum + (Number(e.hours) || 0) * (e.costRate ?? m.costRate ?? 0), 0);
    const done = s.tasks.filter((t) => t.assigneeId === m.id && t.status === 'done' && (t.completedAt ?? '').slice(0, 10) >= from).length;
    return { m, hours, cost, value: hours * (Number(m.billRate) || 0), done };
  }).sort((a, b) => b.hours - a.hours);
}

function monthlyQuotes() {
  const s = store.state;
  const t = today();
  const months = [];
  const d = new Date();
  for (let i = 5; i >= 0; i--) {
    const m = new Date(d.getFullYear(), d.getMonth() - i, 1);
    months.push(`${m.getFullYear()}-${String(m.getMonth() + 1).padStart(2, '0')}`);
  }
  return months.map((key) => {
    const list = s.quotes.filter((q) => String(q.date ?? '').startsWith(key));
    const accepted = list.filter((q) => q.status === 'accepted');
    return {
      key,
      label: new Date(`${key}-01T00:00:00`).toLocaleDateString('tr-TR', { month: 'short', year: '2-digit' }),
      count: list.length,
      offered: list.reduce((sum, q) => sum + quoteTotals(q).taxBase, 0),
      accepted: accepted.reduce((sum, q) => sum + quoteTotals(q).taxBase, 0),
      lost: list.filter((q) => ['rejected', 'expired'].includes(quoteStatus(q, t))).length,
    };
  });
}

export default {
  title: 'Raporlar',
  actions: () => html`<button type="button" class="btn" data-act="csv">${icon('download')} <span class="hide-sm">Kârlılık CSV</span></button>`,
  mountActions(el) {
    el.querySelector('[data-act="csv"]').addEventListener('click', exportProfitability);
  },
  render() {
    const s = store.state;
    if (!s.projects.length && !s.quotes.length) {
      return empty('chart', 'Rapor için veri yok', 'Proje, çalışma saati, gider ve teklif girdikçe kârlılık ve ekip raporları burada oluşur.');
    }
    const cur = s.settings.currency;
    const rows = profitability();
    const tot = rows.reduce((a, r) => ({ revenue: a.revenue + r.f.revenue, cost: a.cost + r.f.actualCost, profit: a.profit + r.f.profit }), { revenue: 0, cost: 0, profit: 0 });
    const team = teamHours();
    const maxHours = Math.max(1, ...team.map((r) => r.hours));
    const months = monthlyQuotes();
    const maxMonth = Math.max(1, ...months.map((m) => m.offered));
    const from = since();
    const expenses = EXPENSE_CATEGORIES.map((c) => [c, s.expenses.filter((x) => x.category === c && x.date >= from).reduce((sum, x) => sum + (Number(x.amount) || 0), 0)]).filter(([, v]) => v > 0);
    const maxExp = Math.max(1, ...expenses.map(([, v]) => v));
    return html`
      <section class="card">
        <header class="card-head"><h2>Proje kârlılığı</h2><span class="muted small">KDV hariç · gerçekleşen maliyet</span></header>
        ${rows.length ? html`<div class="table-wrap"><table class="table">
          <thead><tr><th>Proje</th><th>Müşteri</th><th>Durum</th><th class="r">Gelir</th><th class="r">Maliyet</th><th class="r">Kâr</th><th class="r">Marj</th></tr></thead>
          <tbody>${rows.map(({ p, f, client }) => html`<tr class="clickable" data-href="projeler/${p.id}">
            <td data-label="Proje"><b>${p.name}</b><br><small class="muted">${p.code}</small></td><td data-label="Müşteri">${client?.name ?? '—'}</td>
            <td data-label="Durum">${statusBadge('project', p.status)}</td>
            <td data-label="Gelir" class="r">${money(f.revenue, cur)}</td><td data-label="Maliyet" class="r">${money(f.actualCost, cur)}</td>
            <td data-label="Kâr" class="r ${f.profit < 0 ? 'neg' : 'pos'}">${money(f.profit, cur)}</td><td data-label="Marj" class="r">${f.margin == null ? '—' : pct(f.margin)}</td></tr>`)}</tbody>
          <tfoot><tr><th colspan="3">Toplam</th><th class="r">${money(tot.revenue, cur)}</th><th class="r">${money(tot.cost, cur)}</th><th class="r ${tot.profit < 0 ? 'neg' : 'pos'}">${money(tot.profit, cur)}</th><th class="r">${tot.revenue > 0 ? pct((tot.profit / tot.revenue) * 100) : '—'}</th></tr></tfoot>
        </table></div>` : html`<p class="muted pad">Proje yok.</p>`}
      </section>

      <div class="toolbar"><div class="tabs" role="tablist" aria-label="Dönem">${PERIODS.map(([k, l]) => html`<button type="button" role="tab" class="tab ${period === k ? 'active' : ''}" data-period="${k}">${l}</button>`)}</div></div>

      <div class="grid-2 align-start">
        <section class="card">
          <header class="card-head"><h2>Ekip saatleri</h2><button type="button" class="btn btn-sm btn-ghost" data-act="csv-team">${icon('download', 15)} CSV</button></header>
          ${team.length ? html`<ul class="bars">${team.map((r) => html`<li><span>${r.m.name}</span>${progress((r.hours / maxHours) * 100, 'violet')}<b>${num(r.hours)} sa</b>
            <small class="muted bar-sub">İşçilik maliyeti ${money(r.cost, cur)}${r.value ? ` · satış değeri ${money(r.value, cur)}` : ''} · ${r.done} görev bitti</small></li>`)}</ul>` : html`<p class="muted pad">Ekip yok.</p>`}
        </section>
        <section class="card">
          <header class="card-head"><h2>Gider kategorileri</h2></header>
          ${expenses.length ? html`<ul class="bars">${expenses.map(([c, v]) => html`<li><span>${c}</span>${progress((v / maxExp) * 100, 'amber')}<b>${money(v, cur)}</b></li>`)}</ul>` : html`<p class="muted pad">Bu dönemde gider yok.</p>`}
        </section>
      </div>

      <section class="card">
        <header class="card-head"><h2>Son 6 ayda teklifler</h2><span class="legend"><i class="lg-offered"></i>Verilen <i class="lg-accepted"></i>Kabul edilen</span></header>
        <div class="month-chart" role="img" aria-label="Aylık verilen ve kabul edilen teklif tutarları">
          ${months.map((m) => html`<div class="month">
            <div class="month-bars"><span class="b-offered" style="height:${Math.round((m.offered / maxMonth) * 100)}%" title="Verilen ${money(m.offered, cur)}"></span><span class="b-accepted" style="height:${Math.round((m.accepted / maxMonth) * 100)}%" title="Kabul ${money(m.accepted, cur)}"></span></div>
            <b>${m.label}</b><small class="muted">${m.count} teklif</small></div>`)}
        </div>
        <div class="table-wrap"><table class="table compact">
          <thead><tr><th>Ay</th><th class="r">Teklif</th><th class="r">Verilen (KDV hariç)</th><th class="r">Kabul edilen</th><th class="r">Ret / süresi dolan</th></tr></thead>
          <tbody>${months.map((m) => html`<tr><td data-label="Ay">${m.label}</td><td data-label="Teklif" class="r">${m.count}</td><td data-label="Verilen" class="r">${money(m.offered, cur)}</td><td data-label="Kabul" class="r">${money(m.accepted, cur)}</td><td data-label="Ret" class="r">${m.lost}</td></tr>`)}</tbody>
        </table></div>
      </section>`;
  },
  mount(el) {
    el.addEventListener('click', (e) => {
      const p = e.target.closest('[data-period]');
      if (p) { period = p.dataset.period; refresh(); return; }
      if (e.target.closest('[data-act="csv-team"]')) { exportTeam(); return; }
      const row = e.target.closest('[data-href]');
      if (row) go(row.dataset.href);
    });
  },
};

function exportProfitability() {
  const rows = [['Proje kodu', 'Proje', 'Müşteri', 'Durum', 'Gelir', 'Planlanan maliyet', 'Gerçekleşen işçilik', 'Gider', 'Gerçekleşen maliyet', 'Kâr', 'Marj %']];
  for (const { p, f, client } of profitability()) {
    rows.push([p.code, p.name, client?.name ?? '', PROJECT_STATUS[p.status], csvNum(f.revenue), csvNum(f.plannedCost), csvNum(f.actualLabor), csvNum(f.expenses), csvNum(f.actualCost), csvNum(f.profit), f.margin == null ? '' : csvNum(f.margin)]);
  }
  download(`proje-karlilik-${today()}.csv`, toCsv(rows), 'text/csv;charset=utf-8');
}

function exportTeam() {
  const rows = [['Çalışan', 'Rol', 'Saat', 'İşçilik maliyeti', 'Satış değeri', 'Biten görev']];
  for (const r of teamHours()) rows.push([r.m.name, r.m.role ?? '', csvNum(r.hours), csvNum(r.cost), csvNum(r.value), r.done]);
  download(`ekip-saatleri-${today()}.csv`, toCsv(rows), 'text/csv;charset=utf-8');
}
