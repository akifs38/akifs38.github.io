// Ekip: çalışan kartları (rol, ücretler, iş yükü) ve çalışan sayfası (görevleri, çalışma saatleri, paylaşım).

import { store } from '../store.js';
import { html, money, byName, fmtDate, today, num } from '../util.js';
import { memberLoad, PRIORITY_ORDER } from '../calc.js';
import { icon, avatar, statusBadge, progress, empty, dueBadge } from '../ui.js';
import { memberForm, taskForm, timeEntryForm, go } from '../forms.js';
import { whatsappLink, memberTasksText } from './share.js';

export default {
  title: (p) => (p.id ? store.get('members', p.id)?.name ?? 'Çalışan bulunamadı' : 'Ekip'),
  actions: (p) => (p.id
    ? html`<a class="btn" href="#/ekip">${icon('back')} <span class="hide-sm">Ekip</span></a>`
    : html`<button type="button" class="btn btn-primary" data-act="new">${icon('plus')} Ekip üyesi</button>`),
  mountActions(el) {
    el.querySelector('[data-act="new"]')?.addEventListener('click', () => memberForm());
  },
  render(p) {
    return p.id ? detail(p.id) : list();
  },
  mount(el, p) {
    el.addEventListener('click', (e) => {
      const act = e.target.closest('[data-act]');
      if (act) {
        const id = act.dataset.id ?? p.id;
        const member = store.get('members', id);
        switch (act.dataset.act) {
          case 'new': memberForm(); return;
          case 'edit': memberForm(member); return;
          case 'task': taskForm(null, { assigneeId: id }); return;
          case 'time': timeEntryForm({ memberId: id }); return;
          case 'open-task': taskForm(store.get('tasks', act.dataset.task)); return;
          case 'entry': timeEntryForm({ entry: store.get('timeEntries', act.dataset.entry) }); return;
          default: break;
        }
      }
      const href = e.target.closest('[data-href]');
      if (href && !e.target.closest('a, button')) go(href.dataset.href);
    });
  },
};

function list() {
  const s = store.state;
  if (!s.members.length) {
    return empty('users', 'Ekip boş', 'Çalışanları rolleri ve saatlik maliyetleriyle ekleyin; görevler onlara atanır, maliyet ve iş yükü buna göre hesaplanır.',
      html`<button type="button" class="btn btn-primary" data-act="new">${icon('plus')} İlk ekip üyesini ekle</button>`);
  }
  const t = today();
  const cur = s.settings.currency;
  const members = [...s.members].sort((a, b) => (a.active === false) - (b.active === false) || byName(a, b));
  return html`<div class="cards">${members.map((m) => {
    const l = memberLoad(s, m.id, t);
    return html`<article class="card member-card ${m.active === false ? 'inactive' : ''}" data-href="ekip/${m.id}">
      <header class="member-head">${avatar(m, 44)}<div class="grow"><h3>${m.name}</h3><small class="muted">${m.role || 'Rol girilmedi'}${m.active === false ? ' · pasif' : ''}</small></div>
        <button type="button" class="icon-btn" data-act="edit" data-id="${m.id}" aria-label="${m.name} düzenle">${icon('edit', 16)}</button></header>
      <div class="member-stats">
        <div><small class="muted">Açık görev</small><b>${l.openTasks}${l.overdue ? html` <span class="neg">(${l.overdue} gecikmiş)</span>` : ''}</b></div>
        <div><small class="muted">Kalan iş</small><b>${num(l.openHours)} sa</b></div>
        <div><small class="muted">Bu hafta</small><b>${num(l.weekHours)} sa</b></div>
      </div>
      <div class="load"><small class="muted">Doluluk (haftalık ${l.capacity} sa)</small>${progress(l.utilization, l.utilization > 100 ? 'red' : l.utilization > 75 ? 'amber' : 'green')}<span class="num">%${l.utilization}</span></div>
      <footer class="member-foot"><small>Maliyet <b>${money(m.costRate ?? 0, cur)}</b>/sa</small><small>Satış <b>${m.billRate ? money(m.billRate, cur) : '—'}</b>/sa</small>
        <button type="button" class="btn btn-sm btn-soft" data-act="task" data-id="${m.id}">${icon('plus', 14)} Görev</button></footer>
    </article>`;
  })}</div>`;
}

function detail(id) {
  const s = store.state;
  const m = store.get('members', id);
  if (!m) return empty('users', 'Çalışan bulunamadı', 'Silinmiş olabilir.', html`<a class="btn" href="#/ekip">Ekibe dön</a>`);
  const t = today();
  const cur = s.settings.currency;
  const l = memberLoad(s, id, t);
  const tasks = s.tasks.filter((x) => x.assigneeId === id)
    .sort((a, b) => (a.status === 'done') - (b.status === 'done') || (a.dueDate || '9999').localeCompare(b.dueDate || '9999') || PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]);
  const entries = s.timeEntries.filter((e) => e.memberId === id).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 15);
  const projectName = (pid) => s.projects.find((p) => p.id === pid)?.name ?? '—';
  const wa = whatsappLink(m.phone, memberTasksText(m));
  return html`
    <div class="grid-side">
      <section class="card">
        <header class="member-head">${avatar(m, 52)}<div class="grow"><h2>${m.name}</h2><small class="muted">${m.role || ''}${m.active === false ? ' · pasif' : ''}</small></div></header>
        <dl class="info">
          <dt>Telefon</dt><dd>${m.phone ? html`<a href="tel:${m.phone.replace(/\s/g, '')}">${m.phone}</a>` : '—'}</dd>
          <dt>E-posta</dt><dd>${m.email ? html`<a href="mailto:${m.email}">${m.email}</a>` : '—'}</dd>
          <dt>Saatlik maliyet</dt><dd>${money(m.costRate ?? 0, cur)}</dd>
          <dt>Saatlik satış</dt><dd>${m.billRate ? money(m.billRate, cur) : '—'}</dd>
          <dt>Haftalık kapasite</dt><dd>${l.capacity} saat</dd>
        </dl>
        <div class="load">${progress(l.utilization, l.utilization > 100 ? 'red' : l.utilization > 75 ? 'amber' : 'green')}<span class="num">%${l.utilization}</span></div>
        <p class="muted small">${l.openTasks} açık görev, ${num(l.openHours)} saat kalan iş${l.overdue ? `, ${l.overdue} gecikmiş` : ''}.</p>
        <div class="btn-row">
          <button type="button" class="btn btn-sm" data-act="edit">${icon('edit', 15)} Düzenle</button>
          <a class="btn btn-sm" href="${wa}" target="_blank" rel="noopener">${icon('message', 15)} Görevleri WhatsApp'la gönder</a>
        </div>
      </section>
      <div class="stack">
        <section class="card">
          <header class="card-head"><h2>Görevleri</h2><button type="button" class="btn btn-sm" data-act="task">${icon('plus', 15)} Görev ata</button></header>
          ${tasks.length ? html`<ul class="rows">${tasks.map((x) => html`<li class="row clickable ${x.status === 'done' ? 'done' : ''}" data-act="open-task" data-task="${x.id}">
            <div class="grow"><b>${x.title}</b><small class="muted">${projectName(x.projectId)}${x.estimateHours ? ` · ${num(x.estimateHours)} sa` : ''}</small></div>
            ${statusBadge('task', x.status)}${dueBadge(x.dueDate, x.status === 'done')}</li>`)}</ul>` : html`<p class="muted pad">Atanmış görev yok.</p>`}
        </section>
        <section class="card">
          <header class="card-head"><h2>Son çalışma kayıtları</h2><button type="button" class="btn btn-sm" data-act="time">${icon('clock', 15)} Saat gir</button></header>
          ${entries.length ? html`<div class="table-wrap"><table class="table"><thead><tr><th>Tarih</th><th>Proje</th><th>Not</th><th class="r">Saat</th><th class="r">Maliyet</th></tr></thead><tbody>
            ${entries.map((e) => html`<tr class="clickable" data-act="entry" data-entry="${e.id}"><td data-label="Tarih">${fmtDate(e.date)}</td><td data-label="Proje">${projectName(e.projectId)}</td><td data-label="Not">${e.note || '—'}</td><td data-label="Saat" class="r">${num(e.hours)}</td><td data-label="Maliyet" class="r">${money((e.hours || 0) * (e.costRate ?? m.costRate ?? 0), cur)}</td></tr>`)}
          </tbody></table></div>` : html`<p class="muted pad">Çalışma kaydı yok.</p>`}
        </section>
      </div>
    </div>`;
}

