// Projeler: duruma göre süzülen proje kartları (ilerleme, ekip, gelir/maliyet/kâr).

import { store } from '../store.js';
import { html, money, matches, fmtDate } from '../util.js';
import { ACTIVE_PROJECT, projectFinance, projectProgress, tasksOf } from '../calc.js';
import { icon, avatar, statusBadge, progress, empty, dueBadge, refresh, refreshKeepingFocus } from '../ui.js';
import { projectForm, go } from '../forms.js';

let filter = 'aktif';
let query = '';

const FILTERS = [['aktif', 'Aktif'], ['teklif', 'Teklif aşamasında'], ['tamamlandi', 'Tamamlanan'], ['tumu', 'Tümü']];

export default {
  title: 'Projeler',
  actions: () => html`<button type="button" class="btn btn-primary" data-act="new">${icon('plus')} Proje</button>`,
  mountActions(el) {
    el.querySelector('[data-act="new"]').addEventListener('click', () => projectForm());
  },
  render() {
    const s = store.state;
    if (!s.projects.length) {
      return empty('folder', 'Henüz proje yok', 'Proje oluşturun, müşteriye bağlayın, ekibi atayın; görevler ve maliyetler projede toplanır.',
        html`<button type="button" class="btn btn-primary" data-act="new">${icon('plus')} İlk projeyi oluştur</button>`);
    }
    const cur = s.settings.currency;
    const visible = s.projects
      .filter((p) => filter === 'tumu' || (filter === 'aktif' ? ACTIVE_PROJECT.has(p.status) : filter === 'tamamlandi' ? ['tamamlandi', 'iptal'].includes(p.status) : p.status === filter))
      .filter((p) => matches(query, p.name, p.code, s.clients.find((c) => c.id === p.clientId)?.name))
      .sort((a, b) => (a.dueDate || '9999').localeCompare(b.dueDate || '9999'));
    const count = (f) => s.projects.filter((p) => f === 'tumu' || (f === 'aktif' ? ACTIVE_PROJECT.has(p.status) : f === 'tamamlandi' ? ['tamamlandi', 'iptal'].includes(p.status) : p.status === f)).length;
    return html`
      <div class="toolbar">
        <div class="tabs" role="tablist">${FILTERS.map(([k, l]) => html`<button type="button" role="tab" class="tab ${filter === k ? 'active' : ''}" aria-selected="${filter === k}" data-filter="${k}">${l} <span class="count">${count(k)}</span></button>`)}</div>
        <label class="input-icon">${icon('search', 16)}<input type="search" data-search placeholder="Proje ara" value="${query}" aria-label="Proje ara"></label>
      </div>
      ${visible.length ? html`<div class="cards">${visible.map((p) => {
        const c = s.clients.find((cc) => cc.id === p.clientId);
        const f = projectFinance(s, p.id);
        const pr = projectProgress(tasksOf(s, p.id));
        const team = (p.memberIds ?? []).map((id) => s.members.find((m) => m.id === id)).filter(Boolean);
        return html`<article class="card project-card clickable" data-href="projeler/${p.id}">
          <header><small class="muted">${p.code}</small>${statusBadge('project', p.status)}</header>
          <h3>${p.name}</h3>
          <p class="muted small">${icon('briefcase', 14)} ${c?.name ?? 'Müşterisiz'}</p>
          <div class="progress-line">${progress(pr.pct)}<small class="muted">%${pr.pct} · ${pr.done}/${pr.total} görev</small></div>
          <div class="money-row">
            <div><small class="muted">Gelir</small><b>${money(f.revenue, cur)}</b></div>
            <div><small class="muted">Maliyet</small><b>${money(f.actualCost, cur)}</b></div>
            <div><small class="muted">Kâr</small><b class="${f.profit < 0 ? 'neg' : 'pos'}">${money(f.profit, cur)}</b></div>
          </div>
          <footer><span class="avatars">${team.slice(0, 5).map((m) => avatar(m, 26))}${team.length > 5 ? html`<span class="more">+${team.length - 5}</span>` : ''}</span>
            ${p.dueDate ? dueBadge(p.dueDate, !ACTIVE_PROJECT.has(p.status)) : html`<small class="muted">Teslim ${fmtDate(p.dueDate)}</small>`}</footer>
        </article>`;
      })}</div>` : html`<p class="muted pad">Bu süzgece uyan proje yok.</p>`}`;
  },
  mount(el) {
    el.addEventListener('click', (e) => {
      const f = e.target.closest('[data-filter]');
      if (f) { filter = f.dataset.filter; refresh(); return; }
      if (e.target.closest('[data-act="new"]')) { projectForm(); return; }
      const card = e.target.closest('[data-href]');
      if (card) go(card.dataset.href);
    });
    const input = el.querySelector('[data-search]');
    input?.addEventListener('input', () => {
      query = input.value;
      refreshKeepingFocus('[data-search]');
    });
  },
};
