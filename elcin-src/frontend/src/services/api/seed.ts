import { config } from '@/config';
import type {
  Activity,
  CalendarEvent,
  DeveloperMessage,
  FirmwareRelease,
  Memory,
  Surprise,
} from '@/types';

/**
 * Başlangıç verisi.
 *
 * Boş bir uygulama soğuk hissettirir; Elçin ilk açılışta zaten bir şeyler
 * hatırlıyor olmalı. Bu kayıtlar backend geldiğinde yerlerini gerçek veriye
 * bırakacak, o yüzden hiçbiri koda gömülü davranışa bağlı değil.
 */

function daysAgo(days: number, hour = 12): string {
  const date = new Date();
  date.setDate(date.getDate() - days);
  date.setHours(hour, Math.floor(Math.random() * 59), 0, 0);
  return date.toISOString();
}

function hoursAgo(hours: number): string {
  return new Date(Date.now() - hours * 3_600_000).toISOString();
}

export function seedMemories(): Memory[] {
  const user = config.app.defaultUserName;
  return [
    {
      id: 'mem_kahve',
      kind: 'preference',
      content: `${user} sabahları kahve içmeyi seviyor.`,
      importance: 0.82,
      tags: ['sevdikleri', 'kahve'],
      createdAt: daysAgo(12, 9),
      updatedAt: daysAgo(2, 9),
      pinned: true,
    },
    {
      id: 'mem_muzik',
      kind: 'preference',
      content: `${user} çalışırken sakin müzik dinliyor.`,
      importance: 0.7,
      tags: ['sevdikleri', 'müzik'],
      createdAt: daysAgo(9, 15),
      updatedAt: daysAgo(9, 15),
    },
    {
      id: 'mem_yagmur',
      kind: 'preference',
      content: `${user} yağmurlu havaları seviyor.`,
      importance: 0.65,
      tags: ['sevdikleri', 'hava'],
      createdAt: daysAgo(7, 20),
      updatedAt: daysAgo(7, 20),
    },
    {
      id: 'mem_is',
      kind: 'short_term',
      content: 'Bu hafta işte yoğun olduğunu söyledi.',
      importance: 0.45,
      tags: ['ruh hali', 'iş'],
      createdAt: daysAgo(1, 19),
      updatedAt: daysAgo(1, 19),
    },
    {
      id: 'mem_akif',
      kind: 'relationship',
      content: `Elçin'i ${config.app.developer} yaptı ve ${user}'e hediye etti.`,
      importance: 0.98,
      tags: ['kimlik', 'yakınları'],
      createdAt: daysAgo(30, 10),
      updatedAt: daysAgo(30, 10),
      pinned: true,
    },
    {
      id: 'mem_kedi',
      kind: 'fact',
      content: `${user} kedilere bayılıyor ama alerjisi var.`,
      importance: 0.6,
      tags: ['hayat'],
      createdAt: daysAgo(5, 17),
      updatedAt: daysAgo(5, 17),
    },
  ];
}

export function seedActivities(): Activity[] {
  return [
    { id: 'act_1', kind: 'chat', title: 'Sohbet ettiniz', detail: '6 mesaj', at: hoursAgo(1.2) },
    { id: 'act_2', kind: 'touch', title: "Elçin'e dokunuldu", detail: 'Çift dokunuş', at: hoursAgo(2.4) },
    { id: 'act_3', kind: 'memory', title: 'Yeni bir şey hatırladı', detail: 'Yağmurlu havalar', at: hoursAgo(5) },
    { id: 'act_4', kind: 'touch', title: "Elçin'e dokunuldu", detail: 'Tek dokunuş', at: hoursAgo(7) },
    { id: 'act_5', kind: 'sleep', title: 'Uykuya geçti', at: hoursAgo(11) },
    { id: 'act_6', kind: 'wake', title: 'Uyandı', at: hoursAgo(22) },
    { id: 'act_7', kind: 'chat', title: 'Sohbet ettiniz', detail: '14 mesaj', at: daysAgo(1, 21) },
    { id: 'act_8', kind: 'device', title: 'Cihaz yeniden bağlandı', at: daysAgo(2, 8) },
    { id: 'act_9', kind: 'surprise', title: 'Bir sürpriz açıldı', detail: 'Gizli mesaj', at: daysAgo(3, 20) },
    { id: 'act_10', kind: 'chat', title: 'Sohbet ettiniz', detail: '3 mesaj', at: daysAgo(6, 13) },
  ];
}

export function seedCalendar(): CalendarEvent[] {
  const year = new Date().getFullYear();
  const soon = new Date();
  soon.setDate(soon.getDate() + 4);
  const iso = (date: Date) =>
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

  return [
    {
      id: 'cal_dogum',
      kind: 'birthday',
      title: `${config.app.defaultUserName}'in doğum günü`,
      date: `${year}-06-14`,
      recurring: true,
      message: 'Doğum günün kutlu olsun 🌸 Bugün senin günün.',
    },
    {
      id: 'cal_tanisma',
      kind: 'anniversary',
      title: 'Elçin ile tanışma günü',
      date: iso(new Date(year, new Date().getMonth(), Math.max(1, new Date().getDate() - 20))),
      recurring: true,
      note: 'Elçin ilk kez açıldığı gün.',
    },
    {
      id: 'cal_yakin',
      kind: 'special',
      title: 'Özel bir gün',
      date: iso(soon),
      recurring: false,
      note: 'Bu gün geldiğinde Elçin bir şey söyleyecek.',
    },
    {
      id: 'cal_hatirlatma',
      kind: 'reminder',
      title: 'Su içmeyi unutma',
      date: iso(new Date()),
      recurring: true,
      message: 'Bugün su içtin mi? 💧',
    },
  ];
}

export function seedSurprises(): Surprise[] {
  const later = new Date();
  later.setDate(later.getDate() + 7);

  return [
    {
      id: 'sur_mesaj',
      kind: 'message',
      title: 'Gizli mesaj',
      body: 'Bazı günler ağır gelir. O günlerde bu ekrana bak: burada seni önemseyen biri var. 🌸',
      locked: false,
      hint: 'İlk sürpriz hep açıktır.',
    },
    {
      id: 'sur_animasyon',
      kind: 'animation',
      title: 'Yeni animasyon',
      body: "Elçin artık kalp atışı yapabiliyor. Cihaz sayfasındaki ❤️ düğmesini dene.",
      locked: false,
      hint: 'Elçin ile 3 kez sohbet et.',
    },
    {
      id: 'sur_not',
      kind: 'note',
      title: 'Özel not',
      body: 'Not defterinin arkasına yazılmış gibi: "Yorulduğunda durmak da ilerlemektir."',
      locked: true,
      hint: 'Bir hafta sonra açılıyor.',
      unlocksAt: later.toISOString(),
    },
    {
      id: 'sur_egg',
      kind: 'easter_egg',
      title: 'Easter Egg',
      body: `Bu küçük dost, ${config.app.developer} tarafından ${config.app.defaultUserName} için geliştirildi. ❤️`,
      locked: true,
      hint: `Ana sayfada Elçin'e arka arkaya ${config.ui.secretTapCount} kez dokun.`,
    },
  ];
}

export function seedDeveloperMessages(): DeveloperMessage[] {
  return [
    {
      id: 'dev_1',
      sender: 'developer',
      recipient: 'gulcin',
      title: 'Akif’ten mesaj',
      body:
        `${config.app.defaultUserName},\n\n` +
        'umarım bu küçük dost yüzünü biraz olsun güldürür.\n\n' +
        'Zor zamanlarında yanında olsun diye yaptım.\n\n❤️',
      createdAt: daysAgo(3, 23),
    },
  ];
}

export function seedFirmware(): FirmwareRelease[] {
  return [
    {
      version: '1.0.0',
      releasedAt: daysAgo(20, 10),
      notes: 'İlk sürüm: OLED yüz, dokunma, Wi-Fi, WebSocket.',
      size: 812_340,
      checksum: 'sha256:9f2c…a41b',
    },
    {
      version: '1.1.0',
      releasedAt: daysAgo(2, 16),
      notes: 'Yeni animasyonlar, daha akıcı göz kırpma, OTA geri alma koruması.',
      size: 864_112,
      checksum: 'sha256:31da…7c09',
    },
  ];
}
