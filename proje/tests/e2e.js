// Uçtan uca test (gerçek tarayıcı): node tests/e2e.js  (Playwright gerekir; NODE_PATH ile global kurulum da olur)
// Müşteri → ekip → proje → otomatik atama → pano → çalışma saati ve gider → maliyetten teklif → iskonto/KDV → PDF →
// kabul ve projeye dönüştürme → şablon → arama → raporlar → yedek indir/sil/geri yükle → mobil görünüm → koyu tema.
// Varsayılan ekip: yeni kurulumda, eski veride (bir kez) ve sıfırlamada gelir; silinen kişi geri gelmez.

import { createRequire } from 'node:module';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');

const here = path.dirname(fileURLToPath(import.meta.url));
const siteRoot = path.resolve(here, '..', '..');
const out = process.env.E2E_OUT || fs.mkdtempSync(path.join(os.tmpdir(), 'pys-e2e-'));
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png' };

const server = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]);
  if (p.endsWith('/')) p += 'index.html';
  const file = path.join(siteRoot, path.normalize(p));
  if (!file.startsWith(siteRoot)) { res.writeHead(403); res.end(); return; }
  fs.readFile(file, (err, data) => {
    if (err) { res.writeHead(404); res.end(); return; }
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] ?? 'application/octet-stream' });
    res.end(data);
  });
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const base = `http://127.0.0.1:${server.address().port}/proje/`;

const browser = await chromium.launch();
const errors = [];
let step = 0;
const ok = (name) => console.log(`✔ ${++step}. ${name}`);
const watch = (page) => {
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
  page.on('dialog', (d) => { errors.push(`beklenmeyen tarayıcı penceresi: ${d.message()}`); d.dismiss(); });
};

const iso = (offset = 0) => { const d = new Date(); d.setDate(d.getDate() + offset); return d.toISOString().slice(0, 10); };

try {
  const context = await browser.newContext({ viewport: { width: 1366, height: 900 }, acceptDownloads: true, locale: 'tr-TR' });
  const page = await context.newPage();
  watch(page);
  const modal = () => page.locator('.modal').last();
  const field = (label) => modal().getByLabel(label, { exact: true });
  const submit = () => modal().locator('.modal-foot .btn-primary').click();
  const toast = (text) => page.locator('.toast', { hasText: text }).first().waitFor();
  const go = async (hash) => { await page.evaluate((h) => { location.hash = h; }, hash); await page.waitForTimeout(80); };

  const stored = () => page.evaluate(() => JSON.parse(localStorage.getItem('proje-yonetimi:v1')));
  const DEFAULT_TEAM = ['Ersagun Yılmaz', 'Mehmet Alp Karamavuş', 'Mehmet Akif Soyuslu', 'Kuddusi Köksal'];
  const cardNames = () => page.locator('.member-card h3').allInnerTexts();

  await page.goto(base);
  await page.getByRole('heading', { name: 'Hoş geldiniz' }).waitFor();
  await page.locator('.steps li.done', { hasText: 'Ekip hazır: 4 kişi' }).waitFor();
  assert.deepEqual((await stored()).members.map((m) => m.name), DEFAULT_TEAM);
  await go('#/ekip');
  assert.deepEqual((await cardNames()).sort(), [...DEFAULT_TEAM].sort());
  await page.locator('.team-notice', { hasText: 'saatlik maliyet girilmedi' }).waitFor();
  await page.screenshot({ path: path.join(out, 'varsayilan-ekip.png') });
  ok('ilk açılış: karşılama, başlangıç adımları ve varsayılan 4 kişilik ekip');

  // Bu özellikten önce kullanılmış tarayıcı: ekip bir kez eklenir, aynı adlı kişi tekrarlanmaz, silinen geri gelmez
  await page.evaluate(() => localStorage.setItem('proje-yonetimi:v1', JSON.stringify({
    version: 1, settings: { company: { name: 'Eski Firma' } }, clients: [{ id: 'c1', name: 'Eski Müşteri' }],
    members: [{ id: 'm1', name: 'mehmet akif soyuslu', role: 'Yönetici', costRate: 500, weeklyCapacity: 40, active: true }],
  })));
  await page.reload();
  await page.locator('.member-card').nth(3).waitFor();
  let s = await stored();
  assert.equal(s.members.length, 4);
  assert.equal(s.settings.teamSeeded, true);
  assert.equal(s.clients[0].name, 'Eski Müşteri');
  await page.locator('.member-card', { hasText: 'Kuddusi Köksal' }).getByRole('button', { name: /düzenle/ }).click();
  await modal().getByRole('button', { name: 'Sil' }).click();
  await page.locator('.modal').last().getByRole('button', { name: 'Sil' }).click();
  await toast('Silindi');
  await page.reload();
  await page.locator('.member-card').nth(2).waitFor();
  assert.equal(await page.locator('.member-card').count(), 3);
  ok('eski veride ekip bir kez eklendi (aynı adlı kişi atlandı); silinen kişi yeniden açılışta geri gelmedi');

  await page.evaluate(() => localStorage.clear());
  await page.goto(base);
  await page.getByRole('heading', { name: 'Hoş geldiniz' }).waitFor();

  // Müşteri (adında HTML: ekrana kod olarak değil, metin olarak yazılmalı)
  const evil = 'Test Müşteri <img src=x onerror="window.__xss=1">';
  await page.getByRole('button', { name: 'Boş başla: ilk müşteri' }).click();
  await field('Müşteri adı *').fill(evil);
  await field('Yetkili kişi').fill('Can Yılmaz');
  await field('Telefon').fill('0532 111 22 33');
  await submit();
  await toast('Müşteri eklendi');
  ok('müşteri eklendi');

  // Ekip
  await go('#/ekip');
  for (const [name, role, cost, bill] of [['Ali Usta', 'Teknisyen', 300, 600], ['Veli Tasarım', 'Tasarımcı', 400, 0]]) {
    await page.getByRole('button', { name: 'Ekip üyesi' }).first().click();
    await field('Ad soyad *').fill(name);
    await field('Görevi / rolü').fill(role);
    await field('Saatlik maliyet (₺)').fill(String(cost));
    if (bill) await field('Saatlik satış ücreti (₺)').fill(String(bill));
    await submit();
    await toast('Ekip üyesi eklendi');
  }
  assert.equal(await page.locator('.member-card').count(), 6);
  ok('ekip: varsayılan 4 kişiye 2 çalışan eklendi (rol, maliyet ve satış ücreti)');

  // Proje
  await go('#/projeler');
  await page.getByRole('button', { name: 'Proje', exact: true }).click();
  await field('Proje adı *').fill('Test Projesi');
  await field('Müşteri').selectOption({ label: evil });
  await modal().getByLabel('Ali Usta (Teknisyen)').check();
  await modal().getByLabel('Veli Tasarım (Tasarımcı)').check();
  await field('Teslim tarihi').fill(iso(20));
  await submit();
  await page.waitForURL(/#\/projeler\/[^/]+$/);
  const projectId = page.url().split('/').pop();
  ok('proje oluşturuldu, ekip atandı');

  // Görevler: "Öner" en boş kişiyi seçer
  const ids = await page.evaluate(() => {
    const s = JSON.parse(localStorage.getItem('proje-yonetimi:v1'));
    return Object.fromEntries(s.members.map((m) => [m.name, m.id]));
  });
  for (const [title, hours, due, expected] of [['Kurulum yap', 10, iso(-1), 'Ali Usta'], ['Tasarım yap', 5, iso(5), 'Veli Tasarım']]) {
    await page.locator('#page-actions').getByRole('button', { name: 'Görev' }).click();
    await field('Görev *').fill(title);
    await modal().getByRole('button', { name: 'Öner' }).click();
    assert.equal(await field('Sorumlu').inputValue(), ids[expected], `${title}: önerilen kişi ${expected} olmalı`);
    await field('Öncelik').selectOption('high');
    await field('Teslim tarihi').fill(due);
    await field('Tahmini süre (saat)').fill(String(hours));
    await submit();
    await toast('Görev eklendi');
  }
  ok('görevler eklendi; "Öner" iş yüküne göre Ali’yi, sonra Veli’yi seçti');

  // Pano: sonraki aşama düğmesi ve sürükle-bırak
  await go(`#/projeler/${projectId}/gorevler`);
  const col = (status) => page.locator(`.col[data-status="${status}"]`);
  assert.equal(await col('todo').locator('.task-card').count(), 2);
  await col('todo').locator('.task-card', { hasText: 'Kurulum yap' }).locator('[data-next]').click();
  await col('doing').locator('.task-card', { hasText: 'Kurulum yap' }).waitFor();
  await page.dragAndDrop('.task-card:has-text("Tasarım yap")', '.col[data-status="review"] .col-body');
  await col('review').locator('.task-card', { hasText: 'Tasarım yap' }).waitFor();
  assert.ok(await col('doing').locator('.task-card.late').count() === 1, 'geciken görev işaretli');
  ok('pano: ileri taşıma ve sürükle-bırak, gecikme işareti');

  // Çalışma saati (görev penceresinden)
  await col('doing').locator('.task-card', { hasText: 'Kurulum yap' }).click();
  await modal().getByRole('button', { name: 'Saat gir' }).click();
  assert.equal(await field('Çalışan *').inputValue(), ids['Ali Usta']);
  await field('Süre (saat) *').fill('4');
  await field('Not').fill('Ön kurulum');
  await submit();
  await toast('Çalışma saati kaydedildi');
  ok('çalışma saati girildi (görevin sorumlusu otomatik seçili)');

  // Gider
  await go(`#/projeler/${projectId}/giderler`);
  await page.getByRole('button', { name: 'Gider ekle' }).click();
  await field('Açıklama *').fill('Malzeme alımı');
  await field('Tutar (KDV hariç, ₺) *').fill('1000');
  await submit();
  await toast('Gider kaydedildi');
  ok('gider eklendi');

  // Özet: maliyet hesapları
  await go(`#/projeler/${projectId}`);
  const kpi = (label) => page.locator('.kpi', { hasText: label }).locator('.kpi-value').innerText();
  assert.match(await kpi('Planlanan maliyet'), /6\.000,00/, 'planlanan: 10×300 + 5×400 + 1000');
  assert.match(await kpi('Gerçekleşen maliyet'), /2\.200,00/, 'gerçekleşen: 4×300 + 1000');
  ok('proje özeti: planlanan 6.000 ₺, gerçekleşen 2.200 ₺');

  // Hazır kalem
  await go('#/katalog');
  await page.locator('#page-actions').getByRole('button', { name: 'Kalem' }).click();
  await field('Kalem adı *').fill('Kurulum hizmeti');
  await field('Birim').selectOption('hizmet');
  await field('Birim fiyat (KDV hariç, ₺) *').fill('2500');
  await submit();
  await toast('Hazır kalem kaydedildi');
  ok('hazır kalem eklendi');

  // Maliyetten teklif
  await go(`#/projeler/${projectId}/teklifler`);
  await page.getByRole('button', { name: 'Maliyetten teklif oluştur' }).click();
  await field('Kâr payı (%) *').fill('50');
  await submit();
  await page.waitForURL(/#\/teklifler\/[^/]+$/);
  const quoteId = page.url().split('/').pop();
  const grand = () => page.locator('[data-totals] dd.grand').innerText();
  assert.equal(await page.locator('tr[data-i]').count(), 3, 'teknisyen, tasarımcı, malzeme satırları');
  assert.match(await grand(), /12\.600,00/, '(10×600 + 5×600 + 1500) × 1,20');
  ok('maliyetten teklif: satış ücreti / maliyet+kâr payı ve gider satırları, KDV dahil 12.600 ₺');

  await page.getByRole('button', { name: 'Hazır kalemden ekle' }).click();
  await modal().getByRole('button', { name: /Kurulum hizmeti/ }).click();
  await modal().getByRole('button', { name: 'Bitti' }).click();
  assert.match(await grand(), /15\.600,00/);
  await page.locator('#q-gd').fill('10');
  assert.match(await grand(), /14\.040,00/, '%10 genel iskonto KDV öncesi');
  await page.locator('tr[data-i="0"] [data-k="qty"]').fill('12');
  assert.match(await page.locator('tr[data-i="0"] [data-line-total]').innerText(), /7\.200,00/);
  assert.match(await grand(), /15\.336,00/);
  await page.locator('#q-title').fill('Test Projesi teklifi');
  await page.reload();
  await page.locator('[data-totals] dd.grand').waitFor();
  assert.match(await grand(), /15\.336,00/, 'yeniden açılınca korunur');
  ok('teklif düzenleyici: hazır kalem, genel iskonto, satır değişikliği, kendiliğinden kayıt');

  // Önizleme ve PDF
  await page.getByRole('link', { name: /PDF/ }).click();
  await page.locator('.doc').waitFor();
  const doc = await page.locator('.doc').innerText();
  assert.match(doc, /FİYAT TEKLİFİ/);
  assert.match(doc, /On Beş Bin Üç Yüz Otuz Altı Türk Lirası/);
  assert.ok(!(await page.evaluate(() => window.__xss)), 'müşteri adındaki HTML çalışmamalı');
  await page.emulateMedia({ media: 'print' });
  await page.screenshot({ path: path.join(out, 'teklif-yazdir.png'), fullPage: true });
  await page.pdf({ path: path.join(out, 'teklif.pdf'), format: 'A4', printBackground: true });
  await page.emulateMedia({ media: 'screen' });
  assert.ok(fs.statSync(path.join(out, 'teklif.pdf')).size > 20000);
  ok('A4 önizleme, yazıyla tutar, PDF çıktısı');

  // Kabul: bağlı projenin geliri olur
  await go(`#/teklifler/${quoteId}`);
  await page.locator('#q-status').selectOption('accepted');
  await toast('Teklif kabul edildi');
  await go(`#/projeler/${projectId}`);
  assert.match(await kpi('Gelir'), /12\.780,00/, 'gelir = kabul edilen teklifin KDV hariç tutarı');
  ok('kabul edilen teklif projenin geliri oldu (12.780 ₺ KDV hariç)');

  // Şablon olarak kaydet ve şablondan teklif
  await go(`#/teklifler/${quoteId}`);
  await page.locator('[data-more]').click();
  await page.getByRole('menuitem', { name: 'Şablon olarak kaydet' }).click();
  await field('Şablon adı *').fill('Kurulum paketi');
  await submit();
  await toast('Şablon kaydedildi');
  await go('#/katalog');
  await page.getByRole('tab', { name: /Teklif şablonları/ }).click();
  await page.locator('.template-card', { hasText: 'Kurulum paketi' }).getByRole('button', { name: 'Teklif oluştur' }).click();
  // "yeni?template=…" adresi kayıt kimliğine yönlenene kadar bekle
  await page.waitForURL(/#\/teklifler\/[0-9a-f-]{36}$/);
  assert.equal(await page.locator('tr[data-i]').count(), 4);
  ok('teklif şablon olarak kaydedildi; şablondan yeni teklif 4 satırla açıldı');

  // Projesiz teklif kabul edilince projeye dönüştür
  await page.locator('#q-client').selectOption({ label: evil });
  await page.locator('#q-title').fill('Ek iş');
  await page.locator('#q-status').selectOption('accepted');
  await modal().getByRole('button', { name: 'Proje oluştur' }).click();
  await page.waitForURL(/#\/projeler\/[^/]+\/ekip$/);
  // Adres değişince sayfa bir sonraki olayda çizilir; başlığı beklemeden okumak eski sayfayı yakalayabilir
  await page.locator('#page-title', { hasText: /^Ek iş$/ }).waitFor({ timeout: 5000 });
  ok('projesiz teklif kabul edilince projeye dönüştürüldü');

  // Arama ve görev süzgeçleri
  await page.locator('#global-search').fill('Kurulum');
  await page.locator('.search-results a', { hasText: 'Kurulum yap' }).waitFor();
  await page.locator('#global-search').press('Escape');
  await go('#/gorevler');
  await page.getByRole('button', { name: 'Liste' }).click();
  await page.getByLabel('Gecikenler').check();
  assert.equal(await page.locator('tr[data-task]').count(), 1);
  assert.match(await page.locator('tr[data-task]').innerText(), /Kurulum yap/);
  ok('genel arama, liste görünümü ve "Gecikenler" süzgeci');

  await go('#/raporlar');
  await page.locator('tr', { hasText: 'Test Projesi' }).first().waitFor();
  await go(`#/ekip/${ids['Ali Usta']}`);
  await page.getByRole('link', { name: /WhatsApp/ }).waitFor();
  assert.match(decodeURIComponent(await page.getByRole('link', { name: /WhatsApp/ }).getAttribute('href')), /Kurulum yap/);
  ok('raporlar ve çalışanın görev listesini WhatsApp’la gönderme bağlantısı');

  // Ayarlar, yedek, sıfırlama, geri yükleme
  await go('#/ayarlar');
  await page.getByLabel('Firma adı').fill('Deneme Ltd.');
  await page.getByLabel('Firma adı').press('Tab');
  await page.locator('#brand-company', { hasText: 'Deneme Ltd.' }).waitFor();
  const [download] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Yedek indir (.json)' }).click()]);
  const backup = path.join(out, 'yedek.json');
  await download.saveAs(backup);
  const data = JSON.parse(fs.readFileSync(backup, 'utf8'));
  assert.equal(data.projects.length, 2);
  assert.equal(data.settings.company.name, 'Deneme Ltd.');
  await page.getByRole('button', { name: 'Tüm verileri sil' }).click();
  await field('Onay için SİL yazın *').fill('sil');
  await submit();
  await page.getByRole('heading', { name: 'Hoş geldiniz' }).waitFor();
  assert.deepEqual((await stored()).members.map((m) => m.name), DEFAULT_TEAM, 'sıfırlamadan sonra varsayılan ekip gelir');
  await go('#/ayarlar');
  await page.locator('[data-restore]').setInputFiles(backup);
  await modal().getByRole('button', { name: 'Yedeği yükle' }).click();
  await toast('Yedek yüklendi');
  await page.reload();
  await go('#/projeler');
  await page.locator('.project-card', { hasText: 'Test Projesi' }).waitFor();
  assert.equal((await stored()).members.length, 6, 'yedekten yüklenince ekip çoğalmaz');
  ok('firma bilgisi, yedek indir → tümünü sil (varsayılan ekip geri gelir) → yedekten yükle → yeniden açılınca korunur');

  assert.ok(!(await page.evaluate(() => window.__xss)), 'kullanıcı verisindeki HTML hiçbir sayfada çalışmamalı');
  await page.screenshot({ path: path.join(out, 'masaustu-projeler.png') });

  // Koyu tema
  await page.locator('[data-theme-toggle]').click();
  await page.locator('[data-theme-toggle]').click();
  assert.equal(await page.evaluate(() => document.documentElement.dataset.theme), 'dark');
  await go('#/');
  await page.screenshot({ path: path.join(out, 'koyu-panel.png') });
  ok('koyu tema');

  // Mobil
  const phone = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
  const m = await phone.newPage();
  watch(m);
  await m.goto(base);
  await m.getByRole('button', { name: 'Örnek verilerle dene' }).click();
  await m.locator('.kpis').waitFor();
  const quote = await m.evaluate(() => JSON.parse(localStorage.getItem('proje-yonetimi:v1')).quotes[0].id);
  const project = await m.evaluate(() => JSON.parse(localStorage.getItem('proje-yonetimi:v1')).projects[0].id);
  for (const route of ['', 'projeler', `projeler/${project}`, `projeler/${project}/gorevler`, 'gorevler', 'teklifler', `teklifler/${quote}`, `teklifler/${quote}/yazdir`, 'musteriler', 'ekip', 'katalog', 'raporlar', 'ayarlar']) {
    await m.evaluate((h) => { location.hash = h; }, `#/${route}`);
    await m.waitForTimeout(120);
    const overflow = await m.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    assert.ok(overflow <= 1, `#/${route}: yatay taşma ${overflow}px`);
    await m.screenshot({ path: path.join(out, `mobil-${route.replace(/[0-9a-f-]{36}/g, 'kayit').replace(/\//g, '-') || 'panel'}.png`) });
  }
  await m.locator('.bottom-nav').waitFor();
  await m.locator('[data-nav-toggle]').click();
  await m.locator('.sidebar .nav a', { hasText: 'Müşteriler' }).click();
  await m.waitForURL(/#\/musteriler$/);
  ok('mobil: 13 sayfada yatay taşma yok, alt menü ve açılır menü çalışıyor');

  // Pencere görünen alana sığmalı: iPhone'da vh, tarayıcı çubukları gizliyken ölçülür ve açık çubuklarla görünen
  // alandan uzundur. Bunu sabit konumlu alanı alttan 160 px kısaltarak (açık alt araç çubuğu gibi) taklit et.
  const TOOLBAR = 160;
  await m.addStyleTag({ content: `.modal-wrap { bottom: ${TOOLBAR}px !important; }` });
  await m.locator('#page-actions .btn-primary').click();
  const sheet = m.locator('.modal').last();
  await sheet.locator('.modal-foot .btn-primary').waitFor();
  await m.waitForTimeout(350);
  const visibleBottom = m.viewportSize().height - TOOLBAR;
  const head = await sheet.locator('.modal-head').boundingBox();
  const save = await sheet.locator('.modal-foot .btn-primary').boundingBox();
  await m.screenshot({ path: path.join(out, 'mobil-pencere-kisa-alan.png') });
  assert.ok(head.y >= 0, `pencere başlığı ekranın üstünde kaldı (${head.y})`);
  assert.ok(save.y + save.height <= visibleBottom, `Kaydet düğmesi görünen alanın dışında: ${Math.round(save.y + save.height)} > ${visibleBottom}`);
  await m.keyboard.press('Escape');
  await sheet.waitFor({ state: 'detached' });
  ok('mobil: tarayıcı alt çubuğu açıkken de pencerenin başlığı ve Kaydet düğmesi görünür');

  assert.deepEqual(errors, [], `konsol hataları:\n${errors.join('\n')}`);
  ok('konsolda hata yok');
  console.log(`\nTüm adımlar geçti. Ekran görüntüleri ve PDF: ${out}`);
} catch (err) {
  console.error('\n✖ HATA:', err.message);
  if (errors.length) console.error('Konsol:', errors.join('\n'));
  process.exitCode = 1;
} finally {
  await browser.close();
  server.close();
}
