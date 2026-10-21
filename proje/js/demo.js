// demo.js — "Örnek verilerle dene": kurgusal firma, müşteriler, ekip, projeler, görevler, giderler,
// hazır kalemler ve teklifler. Tarihler bugüne göre üretilir.

import { uid, addDays, today } from './util.js';
import { DEFAULT_SETTINGS, SCHEMA_VERSION } from './store.js';

export function demoState(base = today()) {
  const d = (days) => addDays(base, days);
  const ts = (days) => new Date(`${d(days)}T09:00:00`).toISOString();
  const id = () => uid();

  const clients = [
    { id: id(), name: 'Deniz Kıyı Otel', contactName: 'Selin Aydın', phone: '0532 000 11 22', email: 'selin@ornek-otel.test', taxOffice: 'Muğla', taxNo: '1234567890', address: 'Sahil Yolu No: 12, Muğla', notes: 'Yılbaşı etkinliği için düzenli müşteri.' },
    { id: id(), name: 'Kuzey Yapı A.Ş.', contactName: 'Murat Demir', phone: '0216 000 33 44', email: 'murat@ornek-yapi.test', taxOffice: 'Kadıköy', taxNo: '9876543210', address: 'Atatürk Cad. No: 5, İstanbul', notes: '' },
    { id: id(), name: 'Elif & Can Düğünü', contactName: 'Elif Şahin', phone: '0555 000 55 66', email: 'elif@ornek.test', taxOffice: '', taxNo: '', address: 'İzmir', notes: 'Bireysel müşteri, fatura TC kimlik no ile.' },
  ];
  const [otel, yapi, dugun] = clients;

  const members = [
    { id: id(), name: 'Ayşe Yıldız', role: 'Proje yöneticisi', email: 'ayse@ornek.test', phone: '0530 100 00 01', costRate: 450, billRate: 900, weeklyCapacity: 40, color: '#6d5efc', active: true },
    { id: id(), name: 'Mehmet Kaya', role: 'Yazılımcı', email: 'mehmet@ornek.test', phone: '0530 100 00 02', costRate: 400, billRate: 850, weeklyCapacity: 40, color: '#0ea5e9', active: true },
    { id: id(), name: 'Zeynep Arslan', role: 'Tasarımcı', email: 'zeynep@ornek.test', phone: '0530 100 00 03', costRate: 350, billRate: 750, weeklyCapacity: 32, color: '#ec4899', active: true },
    { id: id(), name: 'Burak Çelik', role: 'Teknisyen', email: 'burak@ornek.test', phone: '0530 100 00 04', costRate: 250, billRate: 500, weeklyCapacity: 45, color: '#f59e0b', active: true },
  ];
  const [ayse, mehmet, zeynep, burak] = members;

  const projects = [
    { id: id(), code: 'PRJ-0001', name: 'Yılbaşı galası fotoğraf kabini', clientId: otel.id, status: 'devam', startDate: d(-10), dueDate: d(12), budget: 0, description: 'Otel lobisinde 2 kabin, baskı ve dijital paylaşım; kurumsal çerçeve tasarımı.', memberIds: [ayse.id, zeynep.id, burak.id], managerId: ayse.id },
    { id: id(), code: 'PRJ-0002', name: 'Kurumsal web sitesi', clientId: yapi.id, status: 'devam', startDate: d(-25), dueDate: d(20), budget: 0, description: '8 sayfalık kurumsal site, yönetim paneli, iki dil.', memberIds: [ayse.id, mehmet.id, zeynep.id], managerId: ayse.id },
    { id: id(), code: 'PRJ-0003', name: 'Düğün fotoğraf kabini', clientId: dugun.id, status: 'planlandi', startDate: d(30), dueDate: d(30), budget: 18000, description: 'Düğün gecesi 5 saat kabin, sınırsız baskı.', memberIds: [burak.id], managerId: burak.id },
  ];
  const [gala, web, wedding] = projects;

  const task = (projectId, title, assigneeId, status, priority, dueDays, estimateHours, description = '') => ({
    id: id(), projectId, title, assigneeId, status, priority, startDate: '', dueDate: d(dueDays), estimateHours, description,
    completedAt: status === 'done' ? ts(-1) : null,
  });
  const tasks = [
    task(gala.id, 'Çerçeve tasarımı (otel logosu ile)', zeynep.id, 'done', 'high', -3, 6),
    task(gala.id, 'Kabin ve yazıcı test kurulumu', burak.id, 'doing', 'normal', 5, 8),
    task(gala.id, 'Baskı malzemesi siparişi', ayse.id, 'todo', 'urgent', -1, 2, '600 baskılık kâğıt ve mürekkep.'),
    task(gala.id, 'Etkinlik günü kurulum ve operasyon', burak.id, 'todo', 'high', 12, 10),
    task(web.id, 'Ana sayfa ve iç sayfa tasarımları', zeynep.id, 'review', 'high', 2, 16),
    task(web.id, 'Yönetim paneli geliştirme', mehmet.id, 'doing', 'high', 10, 32),
    task(web.id, 'İçerik girişi ve çeviriler', ayse.id, 'todo', 'normal', 15, 8),
    task(web.id, 'Yayına alma ve SEO ayarları', mehmet.id, 'todo', 'normal', 20, 6),
    task(wedding.id, 'Düğün çerçevesi tasarımı', null, 'todo', 'normal', 25, 4),
  ];

  const entry = (projectId, taskId, member, days, hours, note) => ({
    id: id(), projectId, taskId, memberId: member.id, memberName: member.name, costRate: member.costRate, date: d(days), hours, note,
  });
  const timeEntries = [
    entry(gala.id, tasks[0].id, zeynep, -4, 5, 'Taslaklar ve revizyon'),
    entry(gala.id, tasks[1].id, burak, -1, 3, 'Atölyede test'),
    entry(web.id, tasks[4].id, zeynep, -6, 12, 'Tasarım'),
    entry(web.id, tasks[5].id, mehmet, -3, 14, 'Panel geliştirme'),
    entry(web.id, tasks[5].id, mehmet, -1, 6, 'Panel geliştirme'),
  ];

  const expenses = [
    { id: id(), projectId: gala.id, date: d(-5), category: 'Malzeme', description: 'Baskı kâğıdı ve mürekkep (600 baskı)', supplier: 'Örnek Tedarik', amount: 4200, vatRate: 20 },
    { id: id(), projectId: gala.id, date: d(-2), category: 'Ulaşım', description: 'Kabin nakliyesi', supplier: '', amount: 1500, vatRate: 20 },
    { id: id(), projectId: web.id, date: d(-20), category: 'Yazılım / lisans', description: 'Barındırma ve alan adı (1 yıl)', supplier: 'Örnek Hosting', amount: 2400, vatRate: 20 },
  ];

  const catalog = [
    { id: id(), name: 'Fotoğraf kabini kiralama (4 saat)', description: 'Kurulum, operatör ve sınırsız dijital paylaşım dahil', unit: 'paket', unitPrice: 12000, vatRate: 20, category: 'Etkinlik' },
    { id: id(), name: 'Ek saat', description: 'Kabin kiralama ek süre', unit: 'saat', unitPrice: 2000, vatRate: 20, category: 'Etkinlik' },
    { id: id(), name: 'Baskı (10x15)', description: 'Anında baskı', unit: 'adet', unitPrice: 15, vatRate: 20, category: 'Etkinlik' },
    { id: id(), name: 'Özel çerçeve tasarımı', description: 'Etkinliğe özel baskı ve dijital çerçeve', unit: 'hizmet', unitPrice: 2500, vatRate: 20, category: 'Tasarım' },
    { id: id(), name: 'Web sitesi sayfa tasarımı', description: 'Masaüstü ve mobil uyumlu', unit: 'adet', unitPrice: 4000, vatRate: 20, category: 'Web' },
    { id: id(), name: 'Yazılım geliştirme', description: 'Saatlik geliştirme', unit: 'saat', unitPrice: 850, vatRate: 20, category: 'Web' },
    { id: id(), name: 'Barındırma ve bakım (yıllık)', description: 'Sunucu, yedekleme, güncellemeler', unit: 'paket', unitPrice: 6000, vatRate: 20, category: 'Web' },
  ];
  const item = (c, qty, discount = 0) => ({ catalogId: c.id, description: c.name, detail: c.description, qty, unit: c.unit, unitPrice: c.unitPrice, discount, vatRate: c.vatRate });

  const templates = [
    { id: id(), name: 'Etkinlik paketi', description: 'Kabin + tasarım + 300 baskı', items: [item(catalog[0], 1), item(catalog[3], 1), item(catalog[2], 300)], notes: '', terms: '' },
    { id: id(), name: 'Kurumsal web sitesi paketi', description: '8 sayfa + panel + 1 yıl bakım', items: [item(catalog[4], 8), item(catalog[5], 40), item(catalog[6], 1)], notes: '', terms: '' },
  ];

  const year = base.slice(0, 4);
  const quotes = [
    { id: id(), number: `TKF-${year}-0001`, clientId: yapi.id, projectId: web.id, title: 'Kurumsal web sitesi', date: d(-30), validUntil: d(-15), status: 'accepted', items: templates[1].items.map((x) => ({ ...x })), generalDiscount: 5, notes: '', terms: DEFAULT_SETTINGS.defaultTerms, decidedAt: ts(-27) },
    { id: id(), number: `TKF-${year}-0002`, clientId: otel.id, projectId: gala.id, title: 'Yılbaşı galası fotoğraf kabini', date: d(-14), validUntil: d(1), status: 'accepted', items: [item(catalog[0], 2), item(catalog[1], 2), item(catalog[3], 1), item(catalog[2], 600, 10)], generalDiscount: 0, notes: 'İki kabin, lobi ve balo salonu.', terms: DEFAULT_SETTINGS.defaultTerms, decidedAt: ts(-12) },
    { id: id(), number: `TKF-${year}-0003`, clientId: dugun.id, projectId: wedding.id, title: 'Düğün fotoğraf kabini', date: d(-2), validUntil: d(13), status: 'sent', items: [item(catalog[0], 1), item(catalog[1], 1), item(catalog[3], 1)], generalDiscount: 0, notes: '', terms: DEFAULT_SETTINGS.defaultTerms, sentAt: ts(-2) },
  ];

  const stamp = (list, days) => list.map((x) => ({ createdAt: ts(days), updatedAt: ts(days), ...x }));
  return {
    version: SCHEMA_VERSION,
    settings: {
      ...structuredClone(DEFAULT_SETTINGS),
      company: { name: 'Örnek Prodüksiyon Ltd. Şti.', address: 'Örnek Mah. Deneme Sok. No: 1, İstanbul', phone: '0212 000 00 00', email: 'info@ornek-produksiyon.test', web: 'ornek-produksiyon.test', taxOffice: 'Beşiktaş', taxNo: '0000000000', iban: 'TR00 0000 0000 0000 0000 0000 00', logo: '' },
      onboarded: true,
      // Örnek veri kendi kurgusal ekibiyle gelir; varsayılan ekip "Tüm verileri sil" ile geri gelir
      teamSeeded: true,
    },
    clients: stamp(clients, -40),
    members: stamp(members, -40),
    projects: stamp(projects, -30),
    tasks: stamp(tasks, -20),
    timeEntries: stamp(timeEntries, -5),
    expenses: stamp(expenses, -5),
    catalog: stamp(catalog, -40),
    templates: stamp(templates, -40),
    quotes: stamp(quotes, -14),
    activity: [{ id: id(), at: new Date().toISOString(), text: 'Örnek veriler yüklendi' }],
  };
}
