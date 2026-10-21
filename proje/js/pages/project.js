// Proje sayfası: özet (gelir/maliyet/kâr), görev panosu, çalışma saatleri, giderler, teklifler ve ekip.

import { store } from '../store.js';
import { html, raw, money, num, fmtDate, today, addDays, pct, toCsv, download } from '../util.js';
import {
  PROJECT_STATUS, projectFinance, projectProgress, tasksOf, memberLoad, quoteTotals, quoteStatus, EXPENSE_CATEGORIES, quoteLinesFromProject, nextQuoteNumber,
} from '../calc.js';
import { icon, avatar, statusBadge, progress, empty, dueBadge, toast, formDialog } from '../ui.js';
import { projectForm, taskForm, timeEntryForm, expenseForm, go } from '../forms.js';
import { boardHtml, bindBoard } from './board.js';

const TABS = [['', 'Özet'], ['gorevler', 'Görevler'], ['zaman', 'Çalışma saatleri'], ['giderler', 'Giderler'], ['teklifler', 'Teklifler'], ['ekip', 'Ekip']];

export default {
  title: (p) => store.get('projects', p.id)?.name ?? 'Proje bulunamadı',
  actions: (p) => (store.get('projects', p.id)
    ? html`<a class="btn hide-sm" href="#/projeler">${icon('back')} Projeler</a><button type="button" class="btn" data-act="edit">${icon('edit')} <span class="hide-sm">Düzenle</span></button><button type="button" class="btn btn-primary" data-act="task">${icon('plus')} Görev</button>`
    : ''),
  mountActions(el, p) {
    el.querySelector('[data-act="edit"]')?.addEventListener('click', () => projectForm(store.get('projects', p.id)));
    el.querySelector('[data-act="task"]')?.addEventListener('click', () => taskForm(null, { projectId: p.id }));
  },
  render(p) {
    const s = store.state;
    const project = store.get('projects', p.id);
    if (!project) return empty('folder', 'Proje bulunamadı', 'Silinmiş olabilir.', html`<a class="btn" href="#/projeler">Projelere dön</a>`);
    const tab = p.tab ?? '';
    const client = s.clients.find((c) => c.id === project.clientId);
    const manager = s.members.find((m) => m.id === project.managerId);
    return html`
      <section class="project-head card">
        <div class="grow">
          <div class="chips"><small class="muted">${project.code}</small>
            <label class="status-select">${statusBadge('project', project.status)}
              <select data-status aria-label="Proje durumu">${Object.entries(PROJECT_STATUS).map(([k, l]) => html`<option value="${k}" ${k === project.status ? 'selected' : ''}>${l}</option>`)}</select></label></div>
          <p class="meta">
            <span>${icon('briefcase', 15)} ${client ? html`<a href="#/musteriler/${client.id}">${client.name}</a>` : 'Müşterisiz'}</span>
            <span>${icon('calendar', 15)} ${fmtDate(project.startDate)} → ${fmtDate(project.dueDate)}</span>
            ${manager ? html`<span>${icon('user', 15)} ${manager.name}</span>` : ''}
          </p>
        </div>
      </section>
      <nav class="tabs tabs-line" aria-label="Proje bölümleri">${TABS.map(([k, l]) => html`<a class="tab ${tab === k ? 'active' : ''}" href="#/projeler/${project.id}${k ? `/${k}` : ''}" ${tab === k ? raw('aria-current="page"') : ''}>${l}</a>`)}</nav>
      ${({ '': overview, gorevler: tasksTab, zaman: timeTab, giderler: expensesTab, teklifler: quotesTab, ekip: teamTab }[tab] ?? overview)(project)}`;
  },
  mount(el, p) {
    const project = store.get('projects', p.id);
    if (!project) return;
    el.querySelector('[data-status]')?.addEventListener('change', (e) => {
      store.upsert('projects', { ...project, status: e.target.value }, { log: `${project.name}: ${PROJECT_STATUS[e.target.value]}` });
      toast('Proje durumu güncellendi');
    });
    if ((p.tab ?? '') === 'gorevler') bindBoard(el.querySelector('.board-host'), { projectId: p.id });
    el.addEventListener('click', (e) => {
      const href = e.target.closest('[data-href]');
      if (href) { go(href.dataset.href); return; }
      const act = e.target.closest('[data-act]');
      if (!act) return;
      switch (act.dataset.act) {
        case 'task': taskForm(null, { projectId: p.id }); break;
        case 'open-task': taskForm(store.get('tasks', act.dataset.id)); break;
        case 'time': timeEntryForm({ projectId: p.id }); break;
        case 'entry': timeEntryForm({ entry: store.get('timeEntries', act.dataset.id) }); break;
        case 'expense': expenseForm(null, { projectId: p.id }); break;
        case 'edit-expense': expenseForm(store.get('expenses', act.dataset.id)); break;
        case 'quote-from-costs': quoteFromCosts(project); break;
        case 'edit': projectForm(project); break;
        case 'csv-time': exportTime(project); break;
        case 'csv-expense': exportExpenses(project); break;
        default: break;
      }
    });
    el.querySelector('[data-team-form]')?.addEventListener('change', (e) => {
      const form = e.currentTarget;
      const memberIds = [...form.querySelectorAll('input[name="member"]:checked')].map((i) => i.value);
      const managerId = form.elements.manager.value || null;
      if (managerId && !memberIds.includes(managerId)) memberIds.push(managerId);
      store.upsert('projects', { ...project, memberIds, managerId });
      toast('Proje ekibi güncellendi');
    });
  },
};

function overview(project) {
  const s = store.state;
  const cur = s.settings.currency;
  const f = projectFinance(s, project.id);
  const tasks = tasksOf(s, project.id);
  const pr = projectProgress(tasks);
  const t = today();
  const upcoming = tasks.filter((x) => x.status !== 'done').sort((a, b) => (a.dueDate || '9999').localeCompare(b.dueDate || '9999')).slice(0, 6);
  const team = (project.memberIds ?? []).map((id) => s.members.find((m) => m.id === id)).filter(Boolean);
  const budgetTone = f.budgetUse == null ? 'violet' : f.budgetUse > 100 ? 'red' : f.budgetUse > 80 ? 'amber' : 'green';
  return html`
    <section class="kpis">
      <div class="kpi"><span class="kpi-label">Gelir (KDV hariç)</span><strong class="kpi-value">${money(f.revenue, cur)}</strong><small class="kpi-sub">${f.revenueSource === 'teklif' ? 'Kabul edilen tekliflerden' : 'Proje bütçesinden'}</small></div>
      <div class="kpi"><span class="kpi-label">Planlanan maliyet</span><strong class="kpi-value">${money(f.plannedCost, cur)}</strong><small class="kpi-sub">${num(f.estimateHours)} sa işçilik ${money(f.plannedLabor, cur)} + gider</small></div>
      <div class="kpi"><span class="kpi-label">Gerçekleşen maliyet</span><strong class="kpi-value">${money(f.actualCost, cur)}</strong><small class="kpi-sub">${num(f.actualHours)} sa ${money(f.actualLabor, cur)} + gider ${money(f.expenses, cur)}</small></div>
      <div class="kpi ${f.profit < 0 ? 'kpi-red' : 'kpi-green'}"><span class="kpi-label">Kâr</span><strong class="kpi-value">${money(f.profit, cur)}</strong><small class="kpi-sub">${f.margin == null ? 'Gelir girilmedi' : `Marj ${pct(f.margin)} · planlanan ${money(f.plannedProfit, cur)}`}</small></div>
    </section>
    <div class="grid-2">
      <section class="card">
        <header class="card-head"><h2>İlerleme ve bütçe</h2></header>
        <div class="pad">
          <p class="label-row"><span>Görevler</span><b>%${pr.pct} · ${pr.done}/${pr.total}</b></p>${progress(pr.pct)}
          <p class="label-row"><span>Bütçe kullanımı (gerçekleşen maliyet / gelir)</span><b>${f.budgetUse == null ? '—' : pct(f.budgetUse)}</b></p>${progress(f.budgetUse ?? 0, budgetTone)}
          ${project.description ? html`<h3 class="sub">Kapsam</h3><p class="pre">${project.description}</p>` : ''}
        </div>
      </section>
      <section class="card">
        <header class="card-head"><h2>Sıradaki görevler</h2><a class="link" href="#/projeler/${project.id}/gorevler">Pano</a></header>
        ${upcoming.length ? html`<ul class="rows">${upcoming.map((x) => {
          const m = s.members.find((mm) => mm.id === x.assigneeId);
          return html`<li class="row clickable" data-act="open-task" data-id="${x.id}">${avatar(m, 28)}<div class="grow"><b>${x.title}</b><small class="muted">${m?.name ?? 'Atanmamış'}</small></div>${statusBadge('task', x.status)}${dueBadge(x.dueDate)}</li>`;
        })}</ul>` : html`<p class="muted pad">Açık görev yok. <button type="button" class="link" data-act="task">Görev ekle</button></p>`}
      </section>
    </div>
    <section class="card">
      <header class="card-head"><h2>Ekip</h2><a class="link" href="#/projeler/${project.id}/ekip">Düzenle</a></header>
      ${team.length ? html`<ul class="rows">${team.map((m) => {
        const l = memberLoad(s, m.id, t);
        const mine = tasks.filter((x) => x.assigneeId === m.id && x.status !== 'done').length;
        return html`<li class="row">${avatar(m, 30)}<div class="grow"><b>${m.name}</b><small class="muted">${m.role ?? ''} · bu projede ${mine} açık görev · toplam doluluk %${l.utilization}</small></div>${project.managerId === m.id ? html`<span class="badge badge-violet">Sorumlu</span>` : ''}</li>`;
      })}</ul>` : html`<p class="muted pad">Projeye ekip atanmadı. <a class="link" href="#/projeler/${project.id}/ekip">Ekip ata</a></p>`}
    </section>`;
}

function tasksTab(project) {
  const tasks = tasksOf(store.state, project.id);
  return html`<div class="board-host">${tasks.length
    ? boardHtml(tasks, { showProject: false })
    : empty('tasks', 'Görev yok', 'Görevleri ekleyip ekibe atayın; panoda sürükleyerek aşamasını değiştirin.', html`<button type="button" class="btn btn-primary" data-act="task">${icon('plus')} Görev ekle</button>`)}</div>`;
}

function timeTab(project) {
  const s = store.state;
  const cur = s.settings.currency;
  const entries = s.timeEntries.filter((e) => e.projectId === project.id).sort((a, b) => b.date.localeCompare(a.date));
  const byMember = new Map();
  for (const e of entries) {
    const key = e.memberId;
    const g = byMember.get(key) ?? { name: s.members.find((m) => m.id === key)?.name ?? e.memberName ?? '—', hours: 0, cost: 0 };
    g.hours += Number(e.hours) || 0;
    g.cost += (Number(e.hours) || 0) * (e.costRate ?? s.members.find((m) => m.id === key)?.costRate ?? 0);
    byMember.set(key, g);
  }
  const totalHours = [...byMember.values()].reduce((sum, g) => sum + g.hours, 0);
  const totalCost = [...byMember.values()].reduce((sum, g) => sum + g.cost, 0);
  return html`
    <div class="toolbar"><button type="button" class="btn btn-primary" data-act="time">${icon('clock')} Saat gir</button>${entries.length ? html`<button type="button" class="btn btn-ghost" data-act="csv-time">${icon('download')} CSV</button>` : ''}</div>
    ${entries.length ? html`
      <section class="card"><header class="card-head"><h2>Kişi bazında</h2><span class="num">${num(totalHours)} sa · ${money(totalCost, cur)}</span></header>
        <ul class="rows">${[...byMember.values()].map((g) => html`<li class="row"><div class="grow"><b>${g.name}</b></div><span class="num">${num(g.hours)} sa</span><span class="num">${money(g.cost, cur)}</span></li>`)}</ul></section>
      <section class="card"><div class="table-wrap"><table class="table">
        <thead><tr><th>Tarih</th><th>Çalışan</th><th>Görev</th><th>Not</th><th class="r">Saat</th><th class="r">Maliyet</th></tr></thead>
        <tbody>${entries.map((e) => html`<tr class="clickable" data-act="entry" data-id="${e.id}">
          <td data-label="Tarih">${fmtDate(e.date)}</td>
          <td data-label="Çalışan">${s.members.find((m) => m.id === e.memberId)?.name ?? e.memberName ?? '—'}</td>
          <td data-label="Görev">${s.tasks.find((x) => x.id === e.taskId)?.title ?? '—'}</td>
          <td data-label="Not">${e.note || '—'}</td>
          <td data-label="Saat" class="r">${num(e.hours)}</td>
          <td data-label="Maliyet" class="r">${money((Number(e.hours) || 0) * (e.costRate ?? 0), cur)}</td></tr>`)}</tbody>
      </table></div></section>`
    : empty('clock', 'Çalışma saati girilmedi', 'Ekibin bu projede harcadığı saatleri girin; gerçekleşen işçilik maliyeti çalışanın saatlik maliyetiyle hesaplanır.')}`;
}

function expensesTab(project) {
  const s = store.state;
  const cur = s.settings.currency;
  const list = s.expenses.filter((x) => x.projectId === project.id).sort((a, b) => b.date.localeCompare(a.date));
  const total = list.reduce((sum, x) => sum + (Number(x.amount) || 0), 0);
  const totalVat = list.reduce((sum, x) => sum + (Number(x.amount) || 0) * (Number(x.vatRate) || 0) / 100, 0);
  const byCat = EXPENSE_CATEGORIES.map((c) => [c, list.filter((x) => x.category === c).reduce((sum, x) => sum + (Number(x.amount) || 0), 0)]).filter(([, v]) => v > 0);
  return html`
    <div class="toolbar"><button type="button" class="btn btn-primary" data-act="expense">${icon('wallet')} Gider ekle</button>${list.length ? html`<button type="button" class="btn btn-ghost" data-act="csv-expense">${icon('download')} CSV</button>` : ''}</div>
    ${list.length ? html`
      <section class="card"><header class="card-head"><h2>Kategoriye göre</h2><span class="num">${money(total, cur)} + KDV ${money(totalVat, cur)}</span></header>
        <ul class="bars">${byCat.map(([c, v]) => html`<li><span>${c}</span>${progress((v / total) * 100, 'violet')}<b>${money(v, cur)}</b></li>`)}</ul></section>
      <section class="card"><div class="table-wrap"><table class="table">
        <thead><tr><th>Tarih</th><th>Kategori</th><th>Açıklama</th><th>Tedarikçi</th><th class="r">Tutar</th><th class="r">KDV dahil</th></tr></thead>
        <tbody>${list.map((x) => html`<tr class="clickable" data-act="edit-expense" data-id="${x.id}">
          <td data-label="Tarih">${fmtDate(x.date)}</td><td data-label="Kategori">${x.category}</td><td data-label="Açıklama">${x.description}</td><td data-label="Tedarikçi">${x.supplier || '—'}</td>
          <td data-label="Tutar" class="r">${money(x.amount, cur)}</td><td data-label="KDV dahil" class="r">${money((Number(x.amount) || 0) * (1 + (Number(x.vatRate) || 0) / 100), cur)}</td></tr>`)}</tbody>
      </table></div></section>`
    : empty('wallet', 'Gider yok', 'Malzeme, ulaşım, kiralama, taşeron gibi giderleri girin; proje maliyetine ve kârına yansır.')}`;
}

function quotesTab(project) {
  const s = store.state;
  const cur = s.settings.currency;
  const t = today();
  const list = s.quotes.filter((q) => q.projectId === project.id);
  return html`
    <div class="toolbar">
      <a class="btn btn-primary" href="#/teklifler/yeni?project=${project.id}${project.clientId ? `&client=${project.clientId}` : ''}">${icon('plus')} Yeni teklif</a>
      <button type="button" class="btn" data-act="quote-from-costs">${icon('sparkle')} Maliyetten teklif oluştur</button>
    </div>
    ${list.length ? html`<section class="card"><ul class="rows">${list.map((q) => html`<li class="row clickable" data-href="teklifler/${q.id}">
      <span class="row-icon">${icon('quote')}</span><div class="grow"><b>${q.number}</b> ${q.title ?? ''}<small class="muted">${fmtDate(q.date)} · geçerlilik ${fmtDate(q.validUntil)}</small></div>
      <span class="num">${money(quoteTotals(q).total, q.currency || cur)}</span>${statusBadge('quote', quoteStatus(q, t))}</li>`)}</ul></section>`
    : empty('quote', 'Bu projeye teklif yok', '"Maliyetten teklif oluştur" görevlerin tahmini saatlerinden ve giderlerden kâr payıyla teklif satırları üretir.')}`;
}

function teamTab(project) {
  const s = store.state;
  const t = today();
  const members = s.members.filter((m) => m.active !== false || project.memberIds?.includes(m.id));
  if (!members.length) return empty('users', 'Ekip boş', 'Önce Ekip sayfasından çalışan ekleyin.', html`<a class="btn btn-primary" href="#/ekip">Ekip sayfası</a>`);
  return html`<section class="card"><form data-team-form class="pad">
    <div class="field"><label for="manager">Proje sorumlusu</label><select id="manager" name="manager"><option value="">— Seçilmedi —</option>${members.map((m) => html`<option value="${m.id}" ${project.managerId === m.id ? 'selected' : ''}>${m.name}</option>`)}</select></div>
    <h3 class="sub">Proje ekibi</h3>
    <ul class="rows">${members.map((m) => {
      const l = memberLoad(s, m.id, t);
      return html`<li class="row"><label class="check grow"><input type="checkbox" name="member" value="${m.id}" ${project.memberIds?.includes(m.id) ? 'checked' : ''}> ${avatar(m, 28)} <span><b>${m.name}</b><small class="muted">${m.role ?? ''} · ${l.openTasks} açık görev · doluluk %${l.utilization}</small></span></label></li>`;
    })}</ul>
    <p class="muted small">Değişiklikler hemen kaydedilir. Görevlerdeki "Öner" düğmesi bu ekipten en boş kişiyi seçer.</p>
  </form></section>`;
}

function quoteFromCosts(project) {
  const s = store.state;
  const lines = quoteLinesFromProject(s, project.id, s.settings.defaultMargin, s.settings.vatRate);
  if (!lines.length) {
    toast('Önce görevlere tahmini saat girin ya da gider ekleyin.', 'warn');
    return;
  }
  formDialog({
    title: 'Maliyetten teklif oluştur',
    intro: html`<p class="muted">Görevlerin tahmini saatleri role göre gruplanır: çalışanın satış ücreti varsa o, yoksa maliyet + kâr payı kullanılır. Giderlere kâr payı eklenir. Teklif taslak olarak açılır, satırları düzenleyebilirsiniz.</p>`,
    fields: [{ name: 'margin', label: 'Kâr payı (%)', type: 'number', min: 0, step: '1', required: true }],
    values: { margin: s.settings.defaultMargin },
    submit: 'Teklifi oluştur',
    onSubmit: ({ margin }) => {
      const date = today();
      const quote = store.upsert('quotes', {
        number: nextQuoteNumber(s, date),
        clientId: project.clientId ?? null,
        projectId: project.id,
        title: project.name,
        date,
        validUntil: addDays(date, Number(s.settings.quoteValidityDays) || 15),
        status: 'draft',
        currency: s.settings.currency,
        items: quoteLinesFromProject(s, project.id, margin, s.settings.vatRate),
        generalDiscount: 0,
        notes: '',
        terms: s.settings.defaultTerms,
      }, { log: `Maliyetten teklif: ${project.name}` });
      go(`teklifler/${quote.id}`);
    },
  });
}

function exportTime(project) {
  const s = store.state;
  const rows = [['Tarih', 'Çalışan', 'Görev', 'Not', 'Saat', 'Saatlik maliyet', 'Maliyet']];
  for (const e of s.timeEntries.filter((x) => x.projectId === project.id)) {
    const cost = (Number(e.hours) || 0) * (e.costRate ?? 0);
    rows.push([fmtDate(e.date), s.members.find((m) => m.id === e.memberId)?.name ?? e.memberName ?? '', s.tasks.find((x) => x.id === e.taskId)?.title ?? '', e.note ?? '', String(e.hours).replace('.', ','), String(e.costRate ?? 0).replace('.', ','), cost.toFixed(2).replace('.', ',')]);
  }
  download(`${project.code}-calisma-saatleri.csv`, toCsv(rows), 'text/csv;charset=utf-8');
}

function exportExpenses(project) {
  const rows = [['Tarih', 'Kategori', 'Açıklama', 'Tedarikçi', 'Tutar (KDV hariç)', 'KDV %']];
  for (const x of store.state.expenses.filter((e) => e.projectId === project.id)) {
    rows.push([fmtDate(x.date), x.category, x.description, x.supplier ?? '', Number(x.amount).toFixed(2).replace('.', ','), x.vatRate]);
  }
  download(`${project.code}-giderler.csv`, toCsv(rows), 'text/csv;charset=utf-8');
}
