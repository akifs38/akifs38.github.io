// Görev panosu (kanban): sütunlar arasında sürükle-bırak, karttan bir sonraki aşamaya geçirme, tıklayınca düzenleme.
// Görevler sayfası ve proje sayfası ortak kullanır.

import { store } from '../store.js';
import { html, num, today } from '../util.js';
import { TASK_STATUS, PRIORITY, PRIORITY_ORDER, loggedHours } from '../calc.js';
import { icon, avatar, dueBadge } from '../ui.js';
import { taskForm, setTaskStatus } from '../forms.js';

const ORDER = Object.keys(TASK_STATUS);

export function sortTasks(list) {
  return [...list].sort((a, b) => PRIORITY_ORDER[a.priority ?? 'normal'] - PRIORITY_ORDER[b.priority ?? 'normal']
    || (a.dueDate || '9999').localeCompare(b.dueDate || '9999')
    || String(a.title).localeCompare(String(b.title), 'tr'));
}

export function boardHtml(tasks, { showProject = true } = {}) {
  const s = store.state;
  const t = today();
  return html`<div class="board">${ORDER.map((status) => {
    const col = sortTasks(tasks.filter((x) => x.status === status));
    return html`<section class="col" data-status="${status}" aria-label="${TASK_STATUS[status]}">
      <header class="col-head"><span class="dot dot-${status}"></span><h3>${TASK_STATUS[status]}</h3><span class="count">${col.length}</span>
        <button type="button" class="icon-btn sm" data-new-task="${status}" aria-label="${TASK_STATUS[status]} sütununa görev ekle">${icon('plus', 16)}</button></header>
      <div class="col-body">${col.map((x) => {
        const m = s.members.find((mm) => mm.id === x.assigneeId);
        const p = s.projects.find((pp) => pp.id === x.projectId);
        const logged = loggedHours(s, x.id);
        const late = x.status !== 'done' && x.dueDate && x.dueDate < t;
        return html`<article class="task-card prio-${x.priority ?? 'normal'} ${late ? 'late' : ''}" draggable="true" data-task="${x.id}" tabindex="0" aria-label="${x.title}">
          <div class="task-top"><b>${x.title}</b>
            ${status !== 'done' ? html`<button type="button" class="icon-btn sm next" data-next="${x.id}" title="Sonraki aşama: ${TASK_STATUS[ORDER[ORDER.indexOf(status) + 1]]}" aria-label="Sonraki aşamaya taşı">${icon('arrowRight', 15)}</button>` : ''}</div>
          ${showProject && p ? html`<small class="muted">${p.name}</small>` : ''}
          <div class="task-meta">${avatar(m, 24)}
            ${x.priority && x.priority !== 'normal' ? html`<span class="prio-tag prio-tag-${x.priority}">${PRIORITY[x.priority]}</span>` : ''}
            ${x.estimateHours || logged ? html`<span class="hours" title="Girilen / tahmini saat">${icon('clock', 13)} ${num(logged)}/${num(x.estimateHours || 0)}</span>` : ''}
            ${dueBadge(x.dueDate, x.status === 'done')}</div>
        </article>`;
      })}${col.length ? '' : html`<p class="col-empty">Görev yok</p>`}</div>
    </section>`;
  })}</div>`;
}

/** Pano olaylarını bağlar. context: yeni görevde kullanılacak proje (varsa). */
export function bindBoard(el, { projectId } = {}) {
  el.addEventListener('click', (e) => {
    const next = e.target.closest('[data-next]');
    if (next) {
      const task = store.get('tasks', next.dataset.next);
      const i = ORDER.indexOf(task.status);
      if (i < ORDER.length - 1) setTaskStatus(task, ORDER[i + 1]);
      return;
    }
    const add = e.target.closest('[data-new-task]');
    if (add) { taskForm(null, { projectId, status: add.dataset.newTask }); return; }
    const card = e.target.closest('[data-task]');
    if (card) taskForm(store.get('tasks', card.dataset.task));
  });
  el.addEventListener('keydown', (e) => {
    const card = e.target.closest?.('[data-task]');
    if (card && (e.key === 'Enter' || e.key === ' ') && e.target === card) {
      e.preventDefault();
      taskForm(store.get('tasks', card.dataset.task));
    }
  });
  let dragged = null;
  el.addEventListener('dragstart', (e) => {
    const card = e.target.closest('[data-task]');
    if (!card) return;
    dragged = card.dataset.task;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', dragged);
    requestAnimationFrame(() => card.classList.add('dragging'));
  });
  el.addEventListener('dragend', (e) => {
    e.target.closest?.('[data-task]')?.classList.remove('dragging');
    el.querySelectorAll('.col.over').forEach((c) => c.classList.remove('over'));
  });
  el.addEventListener('dragover', (e) => {
    const col = e.target.closest('.col');
    if (!col || !dragged) return;
    e.preventDefault();
    el.querySelectorAll('.col.over').forEach((c) => c !== col && c.classList.remove('over'));
    col.classList.add('over');
  });
  el.addEventListener('drop', (e) => {
    const col = e.target.closest('.col');
    if (!col) return;
    e.preventDefault();
    const id = e.dataTransfer.getData('text/plain') || dragged;
    dragged = null;
    const task = store.get('tasks', id);
    if (task) setTaskStatus(task, col.dataset.status);
  });
}
