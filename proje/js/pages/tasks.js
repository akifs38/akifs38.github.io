// Görevler: tüm projelerin görevleri; pano ya da liste görünümü, projeye/kişiye/önceliğe göre süzgeç, CSV.

import { store } from '../store.js';
import { html, raw, matches, fmtDate, num, today, toCsv, download, byName } from '../util.js';
import { TASK_STATUS, PRIORITY, isOverdue, loggedHours } from '../calc.js';
import { icon, avatar, statusBadge, empty, dueBadge, refresh, refreshKeepingFocus } from '../ui.js';
import { taskForm } from '../forms.js';
import { boardHtml, bindBoard, sortTasks } from './board.js';

const f = { view: 'board', project: '', member: '', priority: '', late: false, q: '', done: true };

function filtered() {
  const s = store.state;
  const t = today();
  return s.tasks.filter((x) =>
    (!f.project || x.projectId === f.project)
    && (!f.member || (f.member === '-' ? !x.assigneeId : x.assigneeId === f.member))
    && (!f.priority || x.priority === f.priority)
    && (!f.late || isOverdue(x, t))
    && (f.done || x.status !== 'done')
    && matches(f.q, x.title, x.description));
}

const sel = (value, current) => (String(value) === String(current) ? raw('selected') : '');

export default {
  title: 'Görevler',
  actions: () => html`<button type="button" class="btn btn-ghost hide-sm" data-act="csv">${icon('download')} CSV</button><button type="button" class="btn btn-primary" data-act="new">${icon('plus')} Görev</button>`,
  mountActions(el) {
    el.querySelector('[data-act="new"]').addEventListener('click', () => taskForm(null, { projectId: f.project || undefined, assigneeId: f.member && f.member !== '-' ? f.member : undefined }));
    el.querySelector('[data-act="csv"]').addEventListener('click', exportCsv);
  },
  render() {
    const s = store.state;
    if (!s.projects.length) {
      return empty('tasks', 'Önce bir proje oluşturun', 'Görevler projelere bağlıdır. Proje oluşturup ekibi atayın, sonra görevleri dağıtın.', html`<a class="btn btn-primary" href="#/projeler">Projeler</a>`);
    }
    const tasks = filtered();
    const t = today();
    const projects = [...s.projects].sort(byName);
    const members = [...s.members].sort(byName);
    return html`
      <div class="toolbar wrap">
        <div class="seg" role="group" aria-label="Görünüm">
          <button type="button" class="${f.view === 'board' ? 'active' : ''}" data-view="board" aria-pressed="${f.view === 'board'}">${icon('board', 16)} Pano</button>
          <button type="button" class="${f.view === 'list' ? 'active' : ''}" data-view="list" aria-pressed="${f.view === 'list'}">${icon('list', 16)} Liste</button>
        </div>
        <label class="input-icon">${icon('search', 16)}<input type="search" data-q placeholder="Görev ara" value="${f.q}" aria-label="Görev ara"></label>
        <select data-f="project" aria-label="Proje"><option value="">Tüm projeler</option>${projects.map((p) => html`<option value="${p.id}" ${sel(p.id, f.project)}>${p.name}</option>`)}</select>
        <select data-f="member" aria-label="Sorumlu"><option value="">Herkes</option><option value="-" ${sel('-', f.member)}>Atanmamış</option>${members.map((m) => html`<option value="${m.id}" ${sel(m.id, f.member)}>${m.name}</option>`)}</select>
        <select data-f="priority" aria-label="Öncelik"><option value="">Tüm öncelikler</option>${Object.entries(PRIORITY).map(([k, l]) => html`<option value="${k}" ${sel(k, f.priority)}>${l}</option>`)}</select>
        <label class="check"><input type="checkbox" data-f="late" ${f.late ? raw('checked') : ''}> Gecikenler</label>
        <label class="check"><input type="checkbox" data-f="done" ${f.done ? raw('checked') : ''}> Tamamlananlar</label>
      </div>
      <div class="board-host">
      ${f.view === 'board'
        ? boardHtml(tasks)
        : tasks.length ? html`<section class="card"><div class="table-wrap"><table class="table">
          <thead><tr><th>Görev</th><th>Proje</th><th>Sorumlu</th><th>Durum</th><th>Öncelik</th><th class="r">Saat</th><th>Teslim</th></tr></thead>
          <tbody>${sortTasks(tasks).sort((a, b) => (a.status === 'done') - (b.status === 'done')).map((x) => {
            const m = s.members.find((mm) => mm.id === x.assigneeId);
            return html`<tr class="clickable ${isOverdue(x, t) ? 'late' : ''}" data-task="${x.id}">
              <td data-label="Görev"><b>${x.title}</b></td>
              <td data-label="Proje">${s.projects.find((p) => p.id === x.projectId)?.name ?? '—'}</td>
              <td data-label="Sorumlu"><span class="inline">${avatar(m, 24)} ${m?.name ?? 'Atanmamış'}</span></td>
              <td data-label="Durum">${statusBadge('task', x.status)}</td>
              <td data-label="Öncelik">${statusBadge('priority', x.priority ?? 'normal')}</td>
              <td data-label="Saat" class="r">${num(loggedHours(s, x.id))}/${num(x.estimateHours || 0)}</td>
              <td data-label="Teslim">${dueBadge(x.dueDate, x.status === 'done') || '—'}</td></tr>`;
          })}</tbody></table></div></section>`
          : html`<p class="muted pad">Süzgece uyan görev yok.</p>`}
      </div>`;
  },
  mount(el) {
    const host = el.querySelector('.board-host');
    if (host) bindBoard(host, { projectId: f.project || undefined });
    el.addEventListener('click', (e) => {
      const v = e.target.closest('[data-view]');
      // Pano kartları ve liste satırları (data-task) bindBoard'da açılır
      if (v) { f.view = v.dataset.view; refresh(); }
    });
    el.querySelectorAll('[data-f]').forEach((input) => input.addEventListener('change', () => {
      f[input.dataset.f] = input.type === 'checkbox' ? input.checked : input.value;
      refresh();
    }));
    el.querySelector('[data-q]')?.addEventListener('input', (e) => {
      f.q = e.target.value;
      refreshKeepingFocus('[data-q]');
    });
  },
};

function exportCsv() {
  const s = store.state;
  const rows = [['Görev', 'Proje', 'Sorumlu', 'Durum', 'Öncelik', 'Başlangıç', 'Teslim', 'Tahmini saat', 'Girilen saat', 'Açıklama']];
  for (const x of sortTasks(filtered())) {
    rows.push([
      x.title,
      s.projects.find((p) => p.id === x.projectId)?.name ?? '',
      s.members.find((m) => m.id === x.assigneeId)?.name ?? '',
      TASK_STATUS[x.status],
      PRIORITY[x.priority ?? 'normal'],
      fmtDate(x.startDate),
      fmtDate(x.dueDate),
      String(x.estimateHours || 0).replace('.', ','),
      String(loggedHours(s, x.id)).replace('.', ','),
      x.description ?? '',
    ]);
  }
  download(`gorevler-${today()}.csv`, toCsv(rows), 'text/csv;charset=utf-8');
}
