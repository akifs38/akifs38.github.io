// Kontrol paneli: özet sayılar, geciken ve yaklaşan görevler, ekip iş yükü, projeler, son teklifler ve hareketler.

import { store } from '../store.js';
import { html, money, today, addDays, fmtDate, fmtDateTime, pct, daysBetween } from '../util.js';
import {
  ACTIVE_PROJECT, quoteTotals, quoteStatus, projectFinance, projectProgress, memberLoad, isOverdue, tasksOf, PRIORITY_ORDER,
} from '../calc.js';
import { icon, avatar, statusBadge, progress, dueBadge, empty, toast } from '../ui.js';
import { taskForm, projectForm, clientForm, memberForm, go } from '../forms.js';
import { demoState } from '../demo.js';

export default {
  title: 'Kontrol paneli',
  actions: () => html`<a class="btn btn-primary" href="#/teklifler/yeni">${icon('plus')} <span class="hide-sm">Teklif</span></a>`,
  render() {
    const s = store.state;
    const t = today();
    const cur = s.settings.currency;
    const hasData = s.projects.length || s.clients.length || s.members.length || s.quotes.length;

    if (!hasData) return onboarding();

    const activeProjects = s.projects.filter((p) => ACTIVE_PROJECT.has(p.status));
    const openTasks = s.tasks.filter((x) => x.status !== 'done');
    const overdue = openTasks.filter((x) => isOverdue(x, t));
    const pending = s.quotes.filter((q) => quoteStatus(q, t) === 'sent');
    const pendingTotal = pending.reduce((sum, q) => sum + quoteTotals(q).total, 0);
    const monthStart = `${t.slice(0, 7)}-01`;
    const acceptedThisMonth = s.quotes.filter((q) => q.status === 'accepted' && (q.decidedAt ?? q.date ?? '').slice(0, 10) >= monthStart);
    const acceptedTotal = acceptedThisMonth.reduce((sum, q) => sum + quoteTotals(q).taxBase, 0);
    const finances = activeProjects.map((p) => projectFinance(s, p.id));
    const revenue = finances.reduce((sum, f) => sum + f.revenue, 0);
    const profit = finances.reduce((sum, f) => sum + f.profit, 0);

    const soon = openTasks
      .filter((x) => x.dueDate && x.dueDate <= addDays(t, 7))
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate) || PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority])
      .slice(0, 8);
    const members = s.members.filter((m) => m.active !== false);
    const backupDays = s.settings.lastBackupAt ? daysBetween(s.settings.lastBackupAt.slice(0, 10), t) : null;

    return html`
      ${backupDays === null || backupDays > 7 ? html`<div class="notice">${icon('database')}<span>Veriler yalnızca bu tarayıcıda. ${backupDays === null ? 'Henüz yedek alınmadı.' : `Son yedek ${backupDays} gün önce.`} Düzenli yedek alın.</span><a class="btn btn-sm" href="#/ayarlar">Yedek al</a></div>` : ''}
      <section class="kpis">
        ${kpi('folder', 'Aktif projeler', activeProjects.length, `${s.projects.filter((p) => p.status === 'tamamlandi').length} tamamlandı`, 'projeler')}
        ${kpi('tasks', 'Açık görevler', openTasks.length, overdue.length ? `${overdue.length} gecikti` : 'Geciken yok', 'gorevler', overdue.length ? 'red' : '')}
        ${kpi('quote', 'Bekleyen teklifler', money(pendingTotal, cur), `${pending.length} teklif yanıt bekliyor`, 'teklifler')}
        ${kpi('wallet', 'Bu ay kabul edilen', money(acceptedTotal, cur), `${acceptedThisMonth.length} teklif · KDV hariç`, 'raporlar', 'green')}
        ${kpi('chart', 'Aktif projelerde kâr', money(profit, cur), revenue > 0 ? `Marj ${pct((profit / revenue) * 100)}` : 'Gelir girilmedi', 'raporlar', profit < 0 ? 'red' : '')}
      </section>

      <div class="grid-2">
        <section class="card">
          <header class="card-head"><h2>Geciken ve yaklaşan görevler</h2><a href="#/gorevler" class="link">Tümü</a></header>
          ${soon.length ? html`<ul class="rows">${soon.map((x) => {
            const p = s.projects.find((pp) => pp.id === x.projectId);
            const m = s.members.find((mm) => mm.id === x.assigneeId);
            return html`<li class="row clickable" data-task="${x.id}">
              ${avatar(m, 30)}
              <div class="grow"><b>${x.title}</b><small class="muted">${p?.name ?? '—'}${m ? ` · ${m.name}` : ' · atanmamış'}</small></div>
              ${statusBadge('priority', x.priority ?? 'normal')}${dueBadge(x.dueDate)}
            </li>`;
          })}</ul>` : html`<p class="muted pad">7 gün içinde teslimi olan açık görev yok.</p>`}
        </section>

        <section class="card">
          <header class="card-head"><h2>Ekip iş yükü</h2><a href="#/ekip" class="link">Ekip</a></header>
          ${members.length ? html`<ul class="rows">${members.map((m) => {
            const l = memberLoad(s, m.id, t);
            return html`<li class="row clickable" data-href="ekip/${m.id}">
              ${avatar(m, 30)}
              <div class="grow"><b>${m.name}</b><small class="muted">${m.role ?? ''} · ${l.openTasks} açık görev · ${l.openHours} saat${l.overdue ? ` · ${l.overdue} gecikmiş` : ''}</small>
                ${progress(l.utilization, l.utilization > 100 ? 'red' : l.utilization > 75 ? 'amber' : 'green')}</div>
              <span class="num">%${l.utilization}</span>
            </li>`;
          })}</ul>` : html`<p class="muted pad">Ekip üyesi yok. <button type="button" class="link" data-act="member">Ekle</button></p>`}
        </section>
      </div>

      <section class="card">
        <header class="card-head"><h2>Aktif projeler</h2><a href="#/projeler" class="link">Tüm projeler</a></header>
        ${activeProjects.length ? html`<div class="table-wrap"><table class="table">
          <thead><tr><th>Proje</th><th>Müşteri</th><th>İlerleme</th><th class="r">Gelir</th><th class="r">Maliyet</th><th class="r">Kâr</th><th>Teslim</th></tr></thead>
          <tbody>${activeProjects.map((p, i) => {
            const f = finances[i];
            const pr = projectProgress(tasksOf(s, p.id));
            const c = s.clients.find((cc) => cc.id === p.clientId);
            return html`<tr class="clickable" data-href="projeler/${p.id}">
              <td data-label="Proje"><b>${p.name}</b><br><small class="muted">${p.code}</small></td>
              <td data-label="Müşteri">${c?.name ?? '—'}</td>
              <td data-label="İlerleme" class="w-progress">${progress(pr.pct)}<small class="muted">${pr.done}/${pr.total} görev</small></td>
              <td data-label="Gelir" class="r">${money(f.revenue, cur)}</td>
              <td data-label="Maliyet" class="r">${money(f.actualCost, cur)}</td>
              <td data-label="Kâr" class="r ${f.profit < 0 ? 'neg' : 'pos'}">${money(f.profit, cur)}</td>
              <td data-label="Teslim">${dueBadge(p.dueDate)}</td>
            </tr>`;
          })}</tbody></table></div>` : html`<p class="muted pad">Aktif proje yok. <button type="button" class="link" data-act="project">Proje oluştur</button></p>`}
      </section>

      <div class="grid-2">
        <section class="card">
          <header class="card-head"><h2>Son teklifler</h2><a href="#/teklifler" class="link">Tümü</a></header>
          ${s.quotes.length ? html`<ul class="rows">${[...s.quotes].sort((a, b) => String(b.date).localeCompare(String(a.date))).slice(0, 6).map((q) => html`
            <li class="row clickable" data-href="teklifler/${q.id}">
              <span class="row-icon">${icon('quote')}</span>
              <div class="grow"><b>${q.number}</b> ${q.title ?? ''}<small class="muted">${s.clients.find((c) => c.id === q.clientId)?.name ?? '—'} · ${fmtDate(q.date)}</small></div>
              <span class="num">${money(quoteTotals(q).total, q.currency || cur)}</span>${statusBadge('quote', quoteStatus(q, t))}
            </li>`)}</ul>` : html`<p class="muted pad">Henüz teklif yok.</p>`}
        </section>
        <section class="card">
          <header class="card-head"><h2>Son hareketler</h2></header>
          ${s.activity.length ? html`<ul class="activity">${s.activity.slice(0, 8).map((a) => html`<li><span>${a.text}</span><small class="muted">${fmtDateTime(a.at)}</small></li>`)}</ul>` : html`<p class="muted pad">Hareket yok.</p>`}
        </section>
      </div>`;
  },
  mount(el) {
    el.addEventListener('click', (e) => {
      const task = e.target.closest('[data-task]');
      if (task) { taskForm(store.get('tasks', task.dataset.task)); return; }
      const href = e.target.closest('[data-href]');
      if (href) { go(href.dataset.href); return; }
      const act = e.target.closest('[data-act]')?.dataset.act;
      if (act === 'demo') {
        store.replaceAll(demoState());
        toast('Örnek veriler yüklendi; Ayarlar › Veri bölümünden silebilirsiniz.');
      } else if (act === 'project') projectForm();
      else if (act === 'client') clientForm();
      else if (act === 'member') memberForm();
      else if (act === 'task') taskForm();
    });
  },
};

function kpi(iconName, label, value, sub, href, tone = '') {
  return html`<a class="kpi ${tone ? `kpi-${tone}` : ''}" href="#/${href}">
    <span class="kpi-icon">${icon(iconName)}</span>
    <span class="kpi-label">${label}</span>
    <strong class="kpi-value">${value}</strong>
    <small class="kpi-sub">${sub}</small>
  </a>`;
}

function onboarding() {
  const company = store.state.settings.company.name;
  const steps = [
    ['settings', 'Firma bilgileri', 'Teklif antetinde görünür: ad, adres, vergi no, IBAN, logo.', html`<a class="btn btn-sm" href="#/ayarlar">${company ? 'Düzenle' : 'Gir'}</a>`, !!company],
    ['users', 'Ekibi ekleyin', 'Çalışanlar, rolleri ve saatlik maliyetleri.', html`<button type="button" class="btn btn-sm" data-act="member">Ekle</button>`, false],
    ['briefcase', 'Müşteri ekleyin', 'Müşteri adı, yetkili, iletişim ve vergi bilgileri.', html`<button type="button" class="btn btn-sm" data-act="client">Ekle</button>`, false],
    ['folder', 'Proje oluşturun', 'Ekibi atayın, görevleri dağıtın, maliyetleri girin.', html`<button type="button" class="btn btn-sm" data-act="project">Oluştur</button>`, false],
    ['quote', 'Fiyat teklifi hazırlayın', 'Hazır kalemlerden ya da proje maliyetinden; PDF olarak kaydedin.', html`<a class="btn btn-sm" href="#/teklifler/yeni">Hazırla</a>`, false],
  ];
  return html`
    <section class="hero">
      <div>
        <h2>Hoş geldiniz</h2>
        <p>Müşterilerinizi, ekibinizi, görevleri, maliyetleri ve fiyat tekliflerini tek yerden yönetin. Her şey bu tarayıcıda saklanır; kurulum ya da üyelik gerekmez.</p>
        <div class="hero-actions">
          <button type="button" class="btn btn-light" data-act="demo">${icon('sparkle')} Örnek verilerle dene</button>
          <button type="button" class="btn btn-outline-light" data-act="client">${icon('plus')} Boş başla: ilk müşteri</button>
        </div>
      </div>
    </section>
    <section class="card">
      <header class="card-head"><h2>Başlangıç adımları</h2></header>
      <ol class="steps">${steps.map(([ic, title, text, action, done]) => html`<li class="${done ? 'done' : ''}"><span class="step-icon">${icon(done ? 'check' : ic)}</span><div class="grow"><b>${title}</b><small class="muted">${text}</small></div>${action}</li>`)}</ol>
    </section>
    ${empty('database', 'Verileriniz sizde', 'Kayıtlar yalnızca bu tarayıcıda tutulur, sunucuya gönderilmez. Başka bilgisayara taşımak ya da yedeklemek için Ayarlar › Veri bölümünden yedek dosyası indirin.')}`;
}
