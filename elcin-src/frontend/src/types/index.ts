/**
 * Elçin'in ortak tip sözlüğü.
 *
 * Bu dosya frontend ile ileride yazılacak backend arasındaki sözleşmedir:
 * mock servisler de, gerçek REST/WebSocket istemcisi de aynı şekilleri üretir.
 * Bu yüzden burada UI'a özgü hiçbir alan tutulmaz.
 */

/* ----------------------------------------------------------------- kimlik */

export type UserRole = 'user' | 'developer';

export interface User {
  id: string;
  /** Ekranlarda ve Elçin'in hitabında kullanılan ad. */
  displayName: string;
  role: UserRole;
}

/* ------------------------------------------------------------- duygu/mood */

export const MOODS = [
  'normal',
  'happy',
  'sad',
  'curious',
  'thinking',
  'surprised',
  'excited',
  'sleepy',
  'talking',
  'love',
] as const;

export type Mood = (typeof MOODS)[number];

/** Avatarın ve OLED yüzünün oynatabileceği animasyonlar. */
export const ANIMATIONS = [
  'idle',
  'blink',
  'smile',
  'laugh',
  'sad',
  'surprise',
  'think',
  'talk',
  'heart',
  'sleep',
  'wake',
  'loading',
] as const;

export type AnimationName = (typeof ANIMATIONS)[number];

export interface MoodState {
  mood: Mood;
  /** 0–1 arası yoğunluk; avatarın ne kadar abartılı oynayacağını belirler. */
  intensity: number;
  /** Elçin'in o anki ruh halini neyin tetiklediği (insan okuyabilir). */
  reason: string;
  since: string;
}

export interface MoodSample {
  at: string;
  mood: Mood;
  intensity: number;
  reason: string;
}

/* ------------------------------------------------------------------ sohbet */

export type MessageAuthor = 'user' | 'elcin' | 'system';

export interface Message {
  id: string;
  conversationId: string;
  author: MessageAuthor;
  text: string;
  createdAt: string;
  mood?: Mood;
  animation?: AnimationName;
  /** Cevabın hangi hafıza kayıtlarına dayandığı — UI'da rozet olarak gösterilir. */
  usedMemoryIds?: string[];
  pending?: boolean;
}

export interface Conversation {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messageCount: number;
}

/* ------------------------------------------------------------------ hafıza */

export const MEMORY_KINDS = [
  'preference',
  'fact',
  'event',
  'relationship',
  'short_term',
] as const;

export type MemoryKind = (typeof MEMORY_KINDS)[number];

export interface Memory {
  id: string;
  kind: MemoryKind;
  content: string;
  /** 0–1. Düşük önemli kayıtlar kısa süreli hafızadan zamanla düşer. */
  importance: number;
  /** Serbest etiketler: "kahve", "iş", "müzik"… */
  tags: string[];
  createdAt: string;
  updatedAt: string;
  /** Hangi mesajdan çıkarıldığı — kaynağa geri dönebilmek için. */
  sourceMessageId?: string;
  /** Kullanıcı elle eklediyse/düzenlediyse AI bunu ezmez. */
  pinned?: boolean;
}

export interface MemoryDraft {
  kind: MemoryKind;
  content: string;
  importance: number;
  tags?: string[];
  sourceMessageId?: string;
}

/* ------------------------------------------------------------------ cihaz */

export const DEVICE_STATES = [
  'boot',
  'welcome',
  'idle',
  'touch',
  'thinking',
  'responding',
  'sleeping',
  'offline',
  'error',
  'pairing',
] as const;

export type DeviceState = (typeof DEVICE_STATES)[number];

export type TouchGesture =
  | 'touch_down'
  | 'touch_up'
  | 'single_tap'
  | 'double_tap'
  | 'long_press'
  | 'very_long_press';

export interface DeviceStatus {
  deviceId: string;
  name: string;
  online: boolean;
  state: DeviceState;
  mood: Mood;
  animation: AnimationName;
  firmware: string;
  /** dBm; -30 mükemmel, -90 kopmak üzere. */
  wifiRssi: number;
  ssid: string;
  /** Saniye. */
  uptime: number;
  lastSeen: string;
  peripherals: {
    wifi: boolean;
    oled: boolean;
    touch: boolean;
    cloud: boolean;
  };
}

export interface FirmwareRelease {
  version: string;
  releasedAt: string;
  notes: string;
  size: number;
  checksum: string;
}

/* ------------------------------------------------ gerçek zamanlı protokol */

/** ESP32 → cloud → tarayıcı yönünde akan olaylar. */
export type DeviceEvent =
  | { type: 'device_event'; event: 'touch'; touch: TouchGesture; at: string }
  | { type: 'device_event'; event: 'state'; state: DeviceState; at: string }
  | { type: 'device_event'; event: 'heartbeat'; status: DeviceStatus; at: string }
  | { type: 'device_event'; event: 'log'; level: LogLevel; message: string; at: string }
  | { type: 'device_event'; event: 'connection'; online: boolean; at: string };

/** Tarayıcı → cloud → ESP32 yönünde giden komutlar. */
export type DeviceCommand =
  | { type: 'device_command'; command: 'animation'; animation: AnimationName }
  | { type: 'device_command'; command: 'mood'; mood: Mood }
  | { type: 'device_command'; command: 'state'; state: DeviceState }
  | { type: 'device_command'; command: 'message'; text: string }
  | { type: 'device_command'; command: 'reboot' }
  | { type: 'device_command'; command: 'ota'; version: string };

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface DeviceLog {
  id: string;
  at: string;
  level: LogLevel;
  message: string;
}

/* --------------------------------------------------------------- aktivite */

export type ActivityKind =
  | 'touch'
  | 'chat'
  | 'sleep'
  | 'wake'
  | 'memory'
  | 'device'
  | 'surprise'
  | 'system';

export interface Activity {
  id: string;
  kind: ActivityKind;
  title: string;
  detail?: string;
  at: string;
}

/* ----------------------------------------------------------------- takvim */

export type CalendarEventKind = 'birthday' | 'anniversary' | 'special' | 'reminder';

export interface CalendarEvent {
  id: string;
  kind: CalendarEventKind;
  title: string;
  /** ISO tarih (YYYY-MM-DD). Saat bilinçli olarak yok: bunlar "gün"ler. */
  date: string;
  /** Her yıl tekrar eder mi (doğum günü gibi). */
  recurring: boolean;
  note?: string;
  /** Elçin'in o gün söyleyeceği mesaj; boşsa AI üretir. */
  message?: string;
}

/* --------------------------------------------------------------- sürpriz */

export type SurpriseKind = 'message' | 'animation' | 'note' | 'easter_egg';

export interface Surprise {
  id: string;
  kind: SurpriseKind;
  title: string;
  /** Açıldığında görünen içerik. */
  body: string;
  locked: boolean;
  /** Kilidin nasıl açıldığını anlatan ipucu. */
  hint: string;
  /** Bu tarihten önce açılamaz. */
  unlocksAt?: string;
  openedAt?: string;
}

/** Geliştiriciden (Mehmet Akif) Gülçin'e bırakılan mesaj. */
export interface DeveloperMessage {
  id: string;
  sender: 'developer';
  recipient: 'gulcin';
  title: string;
  body: string;
  createdAt: string;
  deliverAt?: string;
  readAt?: string;
}

/* ----------------------------------------------------------------- ayarlar */

export type ThemeMode = 'dark' | 'light' | 'system';

export interface Settings {
  theme: ThemeMode;
  /** Elçin'in kullanıcıya hitabı. */
  userName: string;
  reduceMotion: boolean;
  soundEnabled: boolean;
  /** Elçin kendiliğinden konuşma başlatsın mı. */
  proactiveMessages: boolean;
  /** Konuşmalardan otomatik hafıza çıkarımı. */
  autoMemory: boolean;
  aiProvider: 'mock' | 'cloud';
  /** Cihaz simülasyonu mu, gerçek WebSocket mi. */
  deviceTransport: 'mock' | 'live';
}
