// Hesap testleri: node --test tests/*.test.js (proje/ klasöründe)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  quoteTotals, quoteStatus, projectFinance, memberLoad, suggestAssignee, quoteLinesFromProject,
  nextQuoteNumber, nextProjectCode, projectProgress, isOverdue, startOfWeek,
} from '../js/calc.js';
import { toNumber, money, html, raw, toCsv, daysBetween, addDays } from '../js/util.js';
import { emptyState, normalize } from '../js/store.js';
import { demoState } from '../js/demo.js';

const T = '2026-10-21';

function state(extra = {}) {
  return { ...emptyState(), ...extra };
}

test('teklif toplamı: satır iskontosu, genel iskonto, KDV oranlarına göre matrah', () => {
  const t = quoteTotals({
    generalDiscount: 10,
    items: [
      { qty: 2, unitPrice: 1000, discount: 0, vatRate: 20 },   // 2000
      { qty: 10, unitPrice: 15, discount: 10, vatRate: 20 },   // 150 − 15 = 135
      { qty: 1, unitPrice: 500, discount: 0, vatRate: 10 },    // 500
    ],
  });
  assert.equal(t.grossTotal, 2650);
  assert.equal(t.lineDiscount, 15);
  assert.equal(t.subtotal, 2635);
  assert.equal(t.generalDiscount, 263.5);
  assert.equal(t.taxBase, 2371.5);
  assert.deepEqual(t.vatGroups, [
    { rate: 10, base: 450, vat: 45 },
    { rate: 20, base: 1921.5, vat: 384.3 },
  ]);
  assert.equal(t.vatTotal, 429.3);
  assert.equal(t.total, 2800.8);
});

test('boş ve hatalı satırlar sıfır sayılır; iskonto 0–100 arasına sıkıştırılır', () => {
  const t = quoteTotals({ items: [{ qty: 'x', unitPrice: 100 }, { qty: 1, unitPrice: 100, discount: 150, vatRate: 20 }], generalDiscount: -5 });
  assert.equal(t.subtotal, 0);
  assert.equal(t.total, 0);
  assert.equal(quoteTotals({}).total, 0);
});

test('gönderilen teklifin geçerliliği geçince süresi doldu sayılır', () => {
  assert.equal(quoteStatus({ status: 'sent', validUntil: '2026-10-20' }, T), 'expired');
  assert.equal(quoteStatus({ status: 'sent', validUntil: T }, T), 'sent');
  assert.equal(quoteStatus({ status: 'accepted', validUntil: '2026-01-01' }, T), 'accepted');
  assert.equal(quoteStatus({}, T), 'draft');
});

test('proje finansı: planlanan ve gerçekleşen işçilik, gider, teklif geliri, kâr', () => {
  const a = { id: 'a', name: 'A', costRate: 100, billRate: 200 };
  const b = { id: 'b', name: 'B', costRate: 300 };
  const s = state({
    members: [a, b],
    projects: [{ id: 'p', memberIds: ['a', 'b'], budget: 99999 }],
    tasks: [
      { id: 't1', projectId: 'p', assigneeId: 'a', estimateHours: 10, status: 'done' },
      { id: 't2', projectId: 'p', assigneeId: null, estimateHours: 2, status: 'todo' }, // ekip ortalaması 200
    ],
    timeEntries: [
      { id: 'e1', projectId: 'p', taskId: 't1', memberId: 'a', hours: 8, costRate: 120 }, // kayıt anındaki ücret
      { id: 'e2', projectId: 'p', taskId: null, memberId: 'b', hours: 1 },
    ],
    expenses: [{ id: 'x', projectId: 'p', amount: 500 }],
    quotes: [
      { id: 'q1', projectId: 'p', status: 'accepted', items: [{ qty: 1, unitPrice: 5000, vatRate: 20 }] },
      { id: 'q2', projectId: 'p', status: 'sent', items: [{ qty: 1, unitPrice: 100000, vatRate: 20 }] },
    ],
  });
  const f = projectFinance(s, 'p');
  assert.equal(f.estimateHours, 12);
  assert.equal(f.plannedLabor, 1400);
  assert.equal(f.actualHours, 9);
  assert.equal(f.actualLabor, 1260);
  assert.equal(f.expenses, 500);
  assert.equal(f.actualCost, 1760);
  assert.equal(f.revenue, 5000, 'kabul edilmiş teklif bütçenin yerine geçer, KDV hariç');
  assert.equal(f.revenueSource, 'teklif');
  assert.equal(f.profit, 3240);
  assert.equal(f.margin, 64.8);
});

test('teklif yoksa gelir proje bütçesidir', () => {
  const s = state({ projects: [{ id: 'p', memberIds: [], budget: 1000 }] });
  const f = projectFinance(s, 'p');
  assert.equal(f.revenue, 1000);
  assert.equal(f.revenueSource, 'bütçe');
  assert.equal(f.margin, 100);
});

test('iş yükü: kalan saat, geciken görev, kapasite oranı, bu haftaki saat', () => {
  const s = state({
    members: [{ id: 'a', weeklyCapacity: 20 }],
    tasks: [
      { id: 't1', assigneeId: 'a', status: 'doing', estimateHours: 10, dueDate: '2026-10-20' },
      { id: 't2', assigneeId: 'a', status: 'todo', estimateHours: 6, dueDate: '2026-10-30' },
      { id: 't3', assigneeId: 'a', status: 'done', estimateHours: 50 },
    ],
    timeEntries: [
      { id: 'e', taskId: 't1', memberId: 'a', hours: 4, date: '2026-10-20' },
      { id: 'e2', taskId: 't3', memberId: 'a', hours: 3, date: '2026-10-10' },
    ],
  });
  const l = memberLoad(s, 'a', T);
  assert.equal(l.openTasks, 2);
  assert.equal(l.openHours, 12);
  assert.equal(l.overdue, 1);
  assert.equal(l.capacity, 20);
  assert.equal(l.utilization, 60);
  assert.equal(l.weekHours, 4, 'hafta pazartesi başlar');
  assert.equal(startOfWeek(T), '2026-10-19');
});

test('atama önerisi: proje ekibinden en boş kişi, role göre süzülür', () => {
  const s = state({
    members: [
      { id: 'a', name: 'Ayşe', role: 'Tasarımcı', weeklyCapacity: 40 },
      { id: 'b', name: 'Burak', role: 'Teknisyen', weeklyCapacity: 40 },
      { id: 'c', name: 'Can', role: 'Tasarımcı', weeklyCapacity: 40, active: false },
      { id: 'd', name: 'Deniz', role: 'Teknisyen', weeklyCapacity: 40 },
    ],
    projects: [{ id: 'p', memberIds: ['a', 'b', 'c'] }],
    tasks: [{ id: 't', assigneeId: 'b', status: 'todo', estimateHours: 8 }],
  });
  assert.equal(suggestAssignee(s, { projectId: 'p' }, T).id, 'a', 'Ayşe boş, Burak 8 saat dolu');
  assert.equal(suggestAssignee(s, { projectId: 'p', role: 'teknisyen' }, T).id, 'b', 'rol eşleşen tek ekip üyesi');
  assert.equal(suggestAssignee(s, { projectId: 'yok' }, T).id, 'a', 'ekip yoksa tüm aktif çalışanlar');
  assert.equal(suggestAssignee(state(), {}, T), null);
});

test('maliyetten teklif: role göre saat, satış ücreti ya da maliyet + kâr payı, giderler', () => {
  const s = state({
    members: [{ id: 'a', role: 'Yazılımcı', costRate: 100, billRate: 250 }, { id: 'b', role: 'Tasarımcı', costRate: 100 }],
    projects: [{ id: 'p', memberIds: ['a', 'b'] }],
    tasks: [
      { id: 't1', projectId: 'p', assigneeId: 'a', estimateHours: 4 },
      { id: 't2', projectId: 'p', assigneeId: 'b', estimateHours: 2 },
      { id: 't3', projectId: 'p', assigneeId: 'a', estimateHours: 0 },
    ],
    expenses: [{ id: 'x', projectId: 'p', category: 'Malzeme', amount: 1000 }],
  });
  const lines = quoteLinesFromProject(s, 'p', 30, 20);
  assert.deepEqual(lines.map((l) => [l.description, l.qty, l.unitPrice]), [
    ['Yazılımcı hizmeti', 4, 250],
    ['Tasarımcı hizmeti', 2, 130],
    ['Malzeme giderleri', 1, 1300],
  ]);
  assert.ok(lines.every((l) => l.vatRate === 20));
});

test('teklif ve proje numaraları yıl içinde artar', () => {
  const s = state({ quotes: [{ id: '1', number: 'TKF-2026-0007' }, { id: '2', number: 'TKF-2025-0099' }, { id: '3', number: 'X' }] });
  assert.equal(nextQuoteNumber(s, T), 'TKF-2026-0008');
  assert.equal(nextQuoteNumber(s, '2027-01-02'), 'TKF-2027-0001');
  s.settings.quotePrefix = 'A.B';
  assert.equal(nextQuoteNumber(s, T), 'A.B-2026-0001', 'önek düzenli ifade gibi yorumlanmaz');
  assert.equal(nextProjectCode(state({ projects: [{ id: 'p', code: 'PRJ-0012' }] })), 'PRJ-0013');
});

test('ilerleme saat ağırlıklı; gecikme yalnızca açık görevde', () => {
  assert.equal(projectProgress([{ status: 'done', estimateHours: 3 }, { status: 'todo', estimateHours: 1 }]).pct, 75);
  assert.equal(projectProgress([{ status: 'done' }, { status: 'todo' }, { status: 'todo' }, { status: 'todo' }]).pct, 25);
  assert.equal(projectProgress([]).pct, 0);
  assert.equal(isOverdue({ status: 'todo', dueDate: '2026-10-20' }, T), true);
  assert.equal(isOverdue({ status: 'done', dueDate: '2026-10-20' }, T), false);
});

test('yardımcılar: Türkçe sayı, para, kaçışlama, CSV, tarih', () => {
  assert.equal(toNumber('1.234,50'), 1234.5);
  assert.equal(toNumber('1,234.50'), 1234.5);
  assert.equal(toNumber('12,5'), 12.5);
  assert.equal(toNumber('₺ 100'), 100);
  assert.equal(toNumber(''), 0);
  assert.match(money(1234.5), /1\.234,50/);
  assert.equal(String(html`<b>${'<x>'}</b>${raw('<i>')}`), '<b>&lt;x&gt;</b><i>');
  assert.equal(toCsv([['a;b', 'c"d']]), '﻿"a;b";"c""d"');
  assert.equal(daysBetween('2026-10-21', '2026-11-01'), 11);
  assert.equal(addDays('2026-12-31', 1), '2027-01-01');
});

test('yedek doğrulama: eksik alanlar tamamlanır, bozuk kayıtlar atılır', () => {
  const s = normalize({ settings: { vatRate: 10, company: { name: 'X' } }, clients: [{ id: 'c' }, null, { name: 'idsiz' }], projects: [{ id: 'p' }] });
  assert.equal(s.settings.vatRate, 10);
  assert.equal(s.settings.company.name, 'X');
  assert.equal(s.settings.quotePrefix, 'TKF');
  assert.equal(s.clients.length, 1);
  assert.deepEqual(s.projects[0].memberIds, []);
  assert.deepEqual(s.tasks, []);
  assert.throws(() => normalize([]), /Geçersiz/);
});

test('örnek veri tutarlı: her bağ geçerli bir kayda gider', () => {
  const s = normalize(demoState(T));
  const ids = (c) => new Set(s[c].map((x) => x.id));
  const clients = ids('clients'); const members = ids('members'); const projects = ids('projects'); const tasks = ids('tasks');
  for (const p of s.projects) { assert.ok(clients.has(p.clientId)); p.memberIds.forEach((m) => assert.ok(members.has(m))); }
  for (const t of s.tasks) { assert.ok(projects.has(t.projectId)); if (t.assigneeId) assert.ok(members.has(t.assigneeId)); }
  for (const e of s.timeEntries) { assert.ok(projects.has(e.projectId)); assert.ok(tasks.has(e.taskId)); }
  for (const q of s.quotes) assert.ok(clients.has(q.clientId));
  const f = projectFinance(s, s.projects[0].id);
  assert.ok(f.revenue > 0 && f.actualCost > 0 && f.profit > 0);
});

test('tutar yazıyla', async () => {
  const { amountInWords } = await import('../js/util.js');
  assert.equal(amountInWords(12345.5), 'On İki Bin Üç Yüz Kırk Beş Türk Lirası Elli Kuruş');
  assert.equal(amountInWords(1000), 'Bin Türk Lirası');
  assert.equal(amountInWords(1001100), 'Bir Milyon Bin Yüz Türk Lirası');
  assert.equal(amountInWords(0.07), 'Sıfır Türk Lirası Yedi Kuruş');
  assert.equal(amountInWords(250, 'EUR'), 'İki Yüz Elli Avro');
});

test('yedekteki logo yalnızca resim veri adresi olabilir', () => {
  assert.equal(normalize({ settings: { company: { logo: 'javascript:alert(1)' } } }).settings.company.logo, '');
  assert.equal(normalize({ settings: { company: { logo: 'data:image/png;base64,iVBORw0KGgo=' } } }).settings.company.logo, 'data:image/png;base64,iVBORw0KGgo=');
});
