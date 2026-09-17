/**
 * Merkezî yapılandırma.
 *
 * Kural: hiçbir bileşen zaman aşımı, URL, eşik değeri gibi sabitleri kendi
 * içinde tutmaz — hepsi burada toplanır. Gizli anahtarlar burada *yer almaz*;
 * AI anahtarı yalnızca backend'de durur, tarayıcı yalnızca kendi oturumunu
 * taşır.
 */

const env = import.meta.env;

export const config = {
  app: {
    name: 'Elçin',
    tagline: 'Masanda yaşayan küçük bir dost',
    developer: 'Mehmet Akif Soylusu',
    /** Elçin'in varsayılan hitabı; kullanıcı ayarlardan değiştirebilir. */
    defaultUserName: 'Gülçin',
    version: '0.1.0',
  },

  api: {
    /** Backend gelene kadar boş; boşken mock servisler devreye girer. */
    baseUrl: (env.VITE_API_URL as string | undefined) ?? '',
    wsUrl: (env.VITE_WS_URL as string | undefined) ?? '',
    timeoutMs: 15_000,
  },

  ai: {
    /** 'mock' geliştirme sırasında API maliyeti doğurmaz. */
    provider: ((env.VITE_AI_PROVIDER as string | undefined) ?? 'mock') as 'mock' | 'cloud',
    model: (env.VITE_AI_MODEL as string | undefined) ?? 'demo-1',
    /** Bağlama taşınan son mesaj sayısı. */
    contextWindow: 12,
    /** Bir cevabın hafızaya yazılması için gereken en düşük önem puanı. */
    memoryThreshold: 0.45,
    /** Demo cevaplarında "düşünüyor" hissi veren gecikme aralığı (ms). */
    thinkingDelay: [520, 1250] as const,
    typingSpeedCps: 42,
  },

  device: {
    defaultId: 'elcin-001',
    /** Cihaza yüklü firmware; uygulama sürümünden bağımsız ilerler. */
    firmware: '1.0.0',
    heartbeatMs: 5_000,
    /** Bu süre boyunca heartbeat gelmezse cihaz çevrimdışı sayılır. */
    offlineAfterMs: 15_000,
    /** Etkileşimsiz geçen bu süreden sonra Elçin uykuya dalar. */
    sleepTimeoutMs: 120_000,
    /** Dokunma sonrası tepkinin ekranda kaldığı süre. */
    touchTimeoutMs: 3_500,
    reconnectBackoffMs: [1_000, 2_000, 4_000, 8_000, 16_000] as const,
    oledAddress: '0x3C',
    pins: { sda: 20, scl: 21, touch: 3 },
  },

  ui: {
    /** Açılış sekansının toplam süresi (ms). */
    bootDuration: 3_400,
    /** Açılışın bir kez oynatıldığını hatırlatan anahtar. */
    bootSeenKey: 'elcin.boot.seen',
    toastDuration: 4_000,
    /** Gizli modu açan avatar tıklama sayısı ve zaman penceresi. */
    secretTapCount: 7,
    secretTapWindowMs: 3_000,
    mobileBreakpoint: 900,
  },

  storage: {
    prefix: 'elcin.v1.',
  },
} as const;

export type AppConfig = typeof config;
