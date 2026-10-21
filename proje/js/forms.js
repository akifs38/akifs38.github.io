// forms.js — Kayıt pencereleri (müşteri, çalışan, proje, görev, çalışma saati, gider, hazır kalem). Her sayfa aynılarını
// kullanır; kaydetme ve silme kuralları burada.

import { store } from './store.js';
import { html, today, byName, toNumber, round2 } from './util.js';
import {
  PROJECT_STATUS, TASK_STATUS, PRIORITY, EXPENSE_CATEGORIES, UNITS, VAT_RATES, suggestAssignee, nextProjectCode, memberLoad,
} from './calc.js';
import { formDialog, confirmDialog, toast } from './ui.js';

export const go = (path) => { location.hash = `#/${path}`; };

const sorted = (list) => [...list].sort(byName);
export const clientOptions = (empty = '— Müşteri seçin —') => [['', empty], ...sorted(store.state.clients).map((c) => [c.id, c.name])];
export const memberOptions = (empty = '— Atanmamış —', { activeOnly = true, include } = {}) =>
  [['', empty], ...sorted(store.state.members.filter((m) => !activeOnly || m.active !== false || m.id === include)).map((m) => [m.id, m.role ? `${m.name} · ${m.role}` : m.name])];
export const projectOptions = (empty = '— Proje seçin —', { clientId } = {}) =>
  [['', empty], ...[...store.state.projects]
    .filter((p) => !clientId || p.clientId === clientId)
    .sort((a, b) => String(b.code).localeCompare(String(a.code)))
    .map((p) => [p.id, `${p.code ?? ''} ${p.name}`.trim()])];
const vatOptions = () => VAT_RATES.map((r) => [r, `%${r}`]);

function plural(refs) {
  const names = { projects: 'proje', quotes: 'teklif', tasks: 'görev', timeEntries: 'çalışma kaydı', expenses: 'gider' };
  return Object.entries(refs).filter(([, n]) => n > 0).map(([k, n]) => `${n} ${names[k]}`).join(', ');
}

// ---------- Müşteri ----------
export function clientForm(client = null, { onSaved } = {}) {
  const fields = [
    { name: 'name', label: 'Müşteri adı', required: true, placeholder: 'Firma ya da kişi adı', full: true },
    { name: 'contactName', label: 'Yetkili kişi' },
    { name: 'phone', label: 'Telefon', type: 'tel' },
    { name: 'email', label: 'E-posta', type: 'email' },
    { name: 'taxOffice', label: 'Vergi dairesi' },
    { name: 'taxNo', label: 'Vergi / TC kimlik no' },
    { name: 'address', label: 'Adres', type: 'textarea', rows: 2 },
    { name: 'notes', label: 'Notlar', type: 'textarea', rows: 2 },
  ];
  formDialog({
    title: client ? 'Müşteriyi düzenle' : 'Yeni müşteri',
    fields,
    values: client ?? {},
    onSubmit: (v) => {
      const saved = store.upsert('clients', { ...(client ?? {}), ...v }, { log: client ? `Müşteri güncellendi: ${v.name}` : `Yeni müşteri: ${v.name}` });
      toast(client ? 'Müşteri güncellendi' : 'Müşteri eklendi');
      onSaved?.(saved);
    },
    extraButtons: client ? [{ label: 'Sil', tone: 'danger', run: (close) => deleteClient(client, close) }] : [],
  });
}

export async function deleteClient(client, close) {
  const refs = store.references('clients', client.id);
  const linked = plural(refs);
  const ok = await confirmDialog(
    linked ? `"${client.name}" müşterisine bağlı ${linked} var. Müşteri silinirse bu kayıtlar kalır ama müşteri bilgisi boş görünür.` : `"${client.name}" silinsin mi?`,
    { ok: 'Sil', danger: true },
  );
  if (!ok) return;
  store.remove('clients', client.id, { log: `Müşteri silindi: ${client.name}` });
  close?.();
  toast('Müşteri silindi');
  if (location.hash.startsWith('#/musteriler/')) go('musteriler');
}

// ---------- Çalışan ----------
export function memberForm(member = null, { onSaved } = {}) {
  const fields = [
    { name: 'name', label: 'Ad soyad', required: true },
    { name: 'role', label: 'Görevi / rolü', placeholder: 'Ör. Tasarımcı' },
    { name: 'phone', label: 'Telefon', type: 'tel' },
    { name: 'email', label: 'E-posta', type: 'email' },
    { name: 'costRate', label: 'Saatlik maliyet (₺)', type: 'money', min: 0, hint: 'Firmaya maliyeti: maaş + yan haklar ÷ çalışma saati' },
    { name: 'billRate', label: 'Saatlik satış ücreti (₺)', type: 'money', min: 0, hint: 'Teklifte kullanılır; boşsa maliyet + kâr payı' },
    { name: 'weeklyCapacity', label: 'Haftalık kapasite (saat)', type: 'number', min: 1, step: '1' },
    { name: 'color', label: 'Renk', type: 'color' },
    { name: 'active', label: 'Aktif çalışan (görev atanabilir)', type: 'checkbox', full: true },
  ];
  formDialog({
    title: member ? 'Çalışanı düzenle' : 'Yeni ekip üyesi',
    fields,
    values: member ? { ...member, active: member.active !== false } : { weeklyCapacity: 40, color: randomColor(), active: true },
    onSubmit: (v) => {
      if (v.weeklyCapacity <= 0) v.weeklyCapacity = 40;
      const saved = store.upsert('members', { ...(member ?? {}), ...v }, { log: member ? `Ekip üyesi güncellendi: ${v.name}` : `Ekibe katıldı: ${v.name}` });
      toast(member ? 'Kaydedildi' : 'Ekip üyesi eklendi');
      onSaved?.(saved);
    },
    extraButtons: member ? [{ label: 'Sil', tone: 'danger', run: (close) => deleteMember(member, close) }] : [],
  });
}

const PALETTE = ['#6d5efc', '#0ea5e9', '#ec4899', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#14b8a6', '#f97316', '#64748b'];
const randomColor = () => PALETTE[store.state.members.length % PALETTE.length];

export async function deleteMember(member, close) {
  const { tasks } = store.references('members', member.id);
  const ok = await confirmDialog(
    tasks ? `${member.name} üzerinde ${tasks} açık görev var; silinirse bu görevler atanmamış olur. Geçmiş çalışma saatleri maliyette kalır. İsterseniz silmek yerine "pasif" yapabilirsiniz.` : `${member.name} ekipten silinsin mi? Geçmiş çalışma saatleri maliyette kalır.`,
    { ok: 'Sil', danger: true },
  );
  if (!ok) return;
  store.remove('members', member.id, { log: `Ekipten çıkarıldı: ${member.name}` });
  close?.();
  toast('Silindi');
  if (location.hash.startsWith('#/ekip/')) go('ekip');
}

// ---------- Proje ----------
export function projectForm(project = null, { clientId, onSaved } = {}) {
  const members = sorted(store.state.members.filter((m) => m.active !== false || project?.memberIds?.includes(m.id)));
  const fields = [
    { name: 'name', label: 'Proje adı', required: true, full: true },
    { name: 'clientId', label: 'Müşteri', type: 'select', options: clientOptions('— Müşterisiz (iç proje) —') },
    { name: 'status', label: 'Durum', type: 'select', options: Object.entries(PROJECT_STATUS) },
    { name: 'startDate', label: 'Başlangıç', type: 'date' },
    { name: 'dueDate', label: 'Teslim tarihi', type: 'date' },
    { name: 'budget', label: 'Bütçe / sözleşme bedeli (KDV hariç, ₺)', type: 'money', min: 0, hint: 'Kabul edilen teklif varsa gelir olarak o kullanılır' },
    { name: 'managerId', label: 'Proje sorumlusu', type: 'select', options: memberOptions('— Seçilmedi —', { include: project?.managerId }) },
    { name: 'memberIds', label: 'Proje ekibi', type: 'checks', options: members.map((m) => [m.id, m.role ? `${m.name} (${m.role})` : m.name]), emptyText: 'Önce Ekip sayfasından çalışan ekleyin.' },
    { name: 'description', label: 'Açıklama / kapsam', type: 'textarea', rows: 3 },
  ];
  formDialog({
    title: project ? 'Projeyi düzenle' : 'Yeni proje',
    fields,
    wide: true,
    values: project ?? { clientId: clientId ?? '', status: 'planlandi', startDate: today(), memberIds: [] },
    onSubmit: (v) => {
      if (v.startDate && v.dueDate && v.dueDate < v.startDate) return 'Teslim tarihi başlangıçtan önce olamaz.';
      if (v.managerId && !v.memberIds.includes(v.managerId)) v.memberIds.push(v.managerId);
      const saved = store.upsert('projects', { ...(project ?? { code: nextProjectCode(store.state) }), ...v, clientId: v.clientId || null, managerId: v.managerId || null }, {
        log: project ? `Proje güncellendi: ${v.name}` : `Yeni proje: ${v.name}`,
      });
      toast(project ? 'Proje güncellendi' : 'Proje oluşturuldu');
      if (onSaved) onSaved(saved);
      else if (!project) go(`projeler/${saved.id}`);
    },
    extraButtons: project ? [{ label: 'Sil', tone: 'danger', run: (close) => deleteProject(project, close) }] : [],
  });
}

export async function deleteProject(project, close) {
  const refs = store.references('projects', project.id);
  const { quotes, ...owned } = refs;
  const linked = plural(owned);
  const ok = await confirmDialog(
    `"${project.name}" silinsin mi?${linked ? ` Projeyle birlikte ${linked} da silinir.` : ''}${quotes ? ` ${quotes} teklif kalır, proje bağı kaldırılır.` : ''}`,
    { ok: 'Projeyi sil', danger: true },
  );
  if (!ok) return;
  store.remove('projects', project.id, { log: `Proje silindi: ${project.name}` });
  close?.();
  toast('Proje silindi');
  go('projeler');
}

// ---------- Görev ----------
export function taskForm(task = null, { projectId, assigneeId, status, onSaved } = {}) {
  const current = task ?? { projectId: projectId ?? '', assigneeId: assigneeId ?? '', status: status ?? 'todo', priority: 'normal', estimateHours: '' };
  const fields = [
    { name: 'title', label: 'Görev', required: true, full: true, placeholder: 'Ne yapılacak?' },
    { name: 'projectId', label: 'Proje', type: 'select', required: true, options: projectOptions() },
    {
      name: 'assigneeId',
      label: 'Sorumlu',
      type: 'select',
      options: memberOptions('— Atanmamış —', { include: task?.assigneeId }),
      action: {
        label: 'Öner',
        icon: 'sparkle',
        run(form) {
          const suggestion = suggestAssignee(store.state, { projectId: form.elements.projectId.value });
          if (!suggestion) { toast('Önerilecek aktif çalışan yok', 'warn'); return; }
          form.elements.assigneeId.value = suggestion.id;
          const load = memberLoad(store.state, suggestion.id);
          toast(`${suggestion.name} önerildi: ${load.openTasks} açık görev, ${load.openHours} saat`);
        },
      },
      hint: '"Öner": proje ekibinden kapasitesine göre en boş kişi',
    },
    { name: 'status', label: 'Durum', type: 'select', options: Object.entries(TASK_STATUS) },
    { name: 'priority', label: 'Öncelik', type: 'select', options: Object.entries(PRIORITY) },
    { name: 'startDate', label: 'Başlangıç', type: 'date' },
    { name: 'dueDate', label: 'Teslim tarihi', type: 'date' },
    { name: 'estimateHours', label: 'Tahmini süre (saat)', type: 'number', min: 0, step: '0.5', hint: 'Planlanan maliyet ve iş yükü bununla hesaplanır' },
    { name: 'description', label: 'Açıklama', type: 'textarea', rows: 3 },
  ];
  formDialog({
    title: task ? 'Görevi düzenle' : 'Yeni görev',
    fields,
    wide: true,
    values: current,
    onSubmit: (v) => {
      if (!store.get('projects', v.projectId)) return 'Bir proje seçin (önce Projeler sayfasından proje oluşturun).';
      if (v.startDate && v.dueDate && v.dueDate < v.startDate) return 'Teslim tarihi başlangıçtan önce olamaz.';
      const wasDone = task?.status === 'done';
      const record = {
        ...(task ?? {}),
        ...v,
        assigneeId: v.assigneeId || null,
        completedAt: v.status === 'done' ? (wasDone ? task.completedAt : new Date().toISOString()) : null,
      };
      const saved = store.upsert('tasks', record, { log: task ? `Görev güncellendi: ${v.title}` : `Yeni görev: ${v.title}` });
      toast(task ? 'Görev güncellendi' : 'Görev eklendi');
      onSaved?.(saved);
    },
    extraButtons: task
      ? [
        { label: 'Sil', tone: 'danger', run: (close) => deleteTask(task, close) },
        { label: 'Saat gir', run: (close) => { close(); timeEntryForm({ projectId: task.projectId, taskId: task.id, memberId: task.assigneeId }); } },
      ]
      : [],
  });
}

export async function deleteTask(task, close) {
  if (!(await confirmDialog(`"${task.title}" görevi silinsin mi? Girilmiş çalışma saatleri projenin maliyetinde kalır.`, { ok: 'Sil', danger: true }))) return;
  store.remove('tasks', task.id, { log: `Görev silindi: ${task.title}` });
  close?.();
  toast('Görev silindi');
}

/** Görev durumunu değiştir (pano sürükle-bırak). */
export function setTaskStatus(task, status) {
  if (task.status === status) return;
  store.upsert('tasks', {
    ...task,
    status,
    completedAt: status === 'done' ? new Date().toISOString() : null,
  }, { log: status === 'done' ? `Görev tamamlandı: ${task.title}` : undefined });
}

// ---------- Çalışma saati ----------
export function timeEntryForm({ projectId, taskId, memberId, entry = null } = {}) {
  const projectTasks = (pid) => [['', '— Görev seçilmedi —'], ...store.state.tasks.filter((t) => t.projectId === pid).map((t) => [t.id, t.title])];
  const values = entry ?? { projectId: projectId ?? '', taskId: taskId ?? '', memberId: memberId ?? '', date: today(), hours: '' };
  const fields = [
    { name: 'projectId', label: 'Proje', type: 'select', required: true, options: projectOptions() },
    { name: 'taskId', label: 'Görev', type: 'select', options: projectTasks(values.projectId) },
    { name: 'memberId', label: 'Çalışan', type: 'select', required: true, options: memberOptions('— Çalışan seçin —', { include: values.memberId }) },
    { name: 'date', label: 'Tarih', type: 'date', required: true },
    { name: 'hours', label: 'Süre (saat)', type: 'number', required: true, min: 0.25, step: '0.25' },
    { name: 'note', label: 'Not', placeholder: 'Ne yapıldı?' },
  ];
  const m = formDialog({
    title: entry ? 'Çalışma kaydını düzenle' : 'Çalışma saati gir',
    fields,
    values,
    onSubmit: (v) => {
      const member = store.get('members', v.memberId);
      if (!member) return 'Çalışan seçin.';
      if (!(v.hours > 0) || v.hours > 24) return 'Süre 0 ile 24 saat arasında olmalı.';
      store.upsert('timeEntries', {
        ...(entry ?? {}),
        ...v,
        taskId: v.taskId || null,
        memberName: member.name,
        // Ücret değişse de geçmiş maliyet değişmesin
        costRate: entry?.memberId === member.id ? entry.costRate : toNumber(member.costRate),
      }, { log: `${member.name}: ${v.hours} saat` });
      toast('Çalışma saati kaydedildi');
    },
    extraButtons: entry ? [{ label: 'Sil', tone: 'danger', run: (close) => { store.remove('timeEntries', entry.id); close(); toast('Silindi'); } }] : [],
  });
  const form = m.el.querySelector('form');
  form.elements.projectId.addEventListener('change', () => {
    form.elements.taskId.innerHTML = projectTasks(form.elements.projectId.value).map(([v, l]) => String(html`<option value="${v}">${l}</option>`)).join('');
  });
  form.elements.taskId.addEventListener('change', () => {
    const t = store.get('tasks', form.elements.taskId.value);
    if (t?.assigneeId && !form.elements.memberId.value) form.elements.memberId.value = t.assigneeId;
  });
}

// ---------- Gider ----------
export function expenseForm(expense = null, { projectId } = {}) {
  const fields = [
    { name: 'projectId', label: 'Proje', type: 'select', required: true, options: projectOptions() },
    { name: 'date', label: 'Tarih', type: 'date', required: true },
    { name: 'category', label: 'Kategori', type: 'select', options: EXPENSE_CATEGORIES.map((c) => [c, c]) },
    { name: 'description', label: 'Açıklama', required: true },
    { name: 'supplier', label: 'Tedarikçi' },
    { name: 'amount', label: 'Tutar (KDV hariç, ₺)', type: 'money', required: true, min: 0 },
    { name: 'vatRate', label: 'KDV', type: 'select', options: vatOptions() },
  ];
  formDialog({
    title: expense ? 'Gideri düzenle' : 'Yeni gider',
    fields,
    values: expense ?? { projectId: projectId ?? '', date: today(), category: EXPENSE_CATEGORIES[0], vatRate: store.state.settings.vatRate },
    onSubmit: (v) => {
      if (!(v.amount > 0)) return 'Tutar sıfırdan büyük olmalı.';
      store.upsert('expenses', { ...(expense ?? {}), ...v, amount: round2(v.amount), vatRate: Number(v.vatRate) }, { log: `Gider: ${v.description}` });
      toast('Gider kaydedildi');
    },
    extraButtons: expense ? [{ label: 'Sil', tone: 'danger', run: (close) => { store.remove('expenses', expense.id); close(); toast('Gider silindi'); } }] : [],
  });
}

// ---------- Hazır kalem ----------
export function catalogForm(item = null) {
  const fields = [
    { name: 'name', label: 'Kalem adı', required: true, full: true, placeholder: 'Ör. Fotoğraf kabini kiralama (4 saat)' },
    { name: 'description', label: 'Açıklama (teklifte satır altında görünür)', type: 'textarea', rows: 2 },
    { name: 'category', label: 'Kategori', placeholder: 'Ör. Etkinlik' },
    { name: 'unit', label: 'Birim', type: 'select', options: UNITS.map((u) => [u, u]) },
    { name: 'unitPrice', label: 'Birim fiyat (KDV hariç, ₺)', type: 'money', required: true, min: 0 },
    { name: 'vatRate', label: 'KDV', type: 'select', options: vatOptions() },
    { name: 'unitCost', label: 'Birim maliyet (isteğe bağlı, ₺)', type: 'money', min: 0, hint: 'Kâr payını görmek için' },
  ];
  formDialog({
    title: item ? 'Hazır kalemi düzenle' : 'Yeni hazır kalem',
    fields,
    values: item ?? { unit: 'adet', vatRate: store.state.settings.vatRate },
    onSubmit: (v) => {
      store.upsert('catalog', { ...(item ?? {}), ...v, vatRate: Number(v.vatRate) });
      toast('Hazır kalem kaydedildi');
    },
    extraButtons: item ? [{
      label: 'Sil',
      tone: 'danger',
      run: async (close) => {
        if (!(await confirmDialog(`"${item.name}" silinsin mi? Bu kalemi içeren teklifler etkilenmez.`, { ok: 'Sil', danger: true }))) return;
        store.remove('catalog', item.id);
        close();
        toast('Silindi');
      },
    }] : [],
  });
}
