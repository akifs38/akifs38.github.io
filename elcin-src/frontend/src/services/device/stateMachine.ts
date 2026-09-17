import type { DeviceState } from '@/types';

/**
 * ESP32 durum makinesi.
 *
 * Aynı tablo firmware tarafında da uygulanacak (PHASE 6–7); burada tutulmasının
 * sebebi, simülatörün gerçek cihazla birebir aynı kurallara uyması. Geçerli
 * olmayan bir geçiş sessizce yutulmaz — `canTransition` ile önceden sorulur,
 * böylece "cihaz neden bu ekranda kaldı" sorusu ayıklanabilir olur.
 */

export type StateTrigger =
  | 'boot_done'
  | 'welcome_done'
  | 'touch_start'
  | 'touch_end'
  | 'request_sent'
  | 'response_ready'
  | 'response_done'
  | 'timeout'
  | 'wake'
  | 'connection_lost'
  | 'connection_restored'
  | 'error'
  | 'recover'
  | 'pair_start'
  | 'pair_done';

const TRANSITIONS: Record<DeviceState, Partial<Record<StateTrigger, DeviceState>>> = {
  boot: {
    boot_done: 'welcome',
    error: 'error',
    pair_start: 'pairing',
  },
  welcome: {
    welcome_done: 'idle',
    error: 'error',
    pair_start: 'pairing',
  },
  pairing: {
    pair_done: 'idle',
    error: 'error',
    connection_lost: 'offline',
  },
  idle: {
    touch_start: 'touch',
    request_sent: 'thinking',
    timeout: 'sleeping',
    connection_lost: 'offline',
    error: 'error',
  },
  touch: {
    touch_end: 'idle',
    request_sent: 'thinking',
    timeout: 'idle',
    connection_lost: 'offline',
    error: 'error',
  },
  thinking: {
    response_ready: 'responding',
    // Cevap gelmezse cihaz "düşünüyor" ekranında asılı kalmasın.
    timeout: 'idle',
    connection_lost: 'offline',
    error: 'error',
  },
  responding: {
    response_done: 'idle',
    touch_start: 'touch',
    timeout: 'idle',
    connection_lost: 'offline',
    error: 'error',
  },
  sleeping: {
    wake: 'idle',
    touch_start: 'touch',
    request_sent: 'thinking',
    connection_lost: 'offline',
    error: 'error',
  },
  offline: {
    connection_restored: 'idle',
    // Çevrimdışıyken dokunmaya yine tepki verir: Elçin susmaz.
    touch_start: 'touch',
    error: 'error',
  },
  error: {
    recover: 'idle',
    connection_restored: 'idle',
    connection_lost: 'offline',
  },
};

/** Bu geçiş tanımlı mı. */
export function canTransition(from: DeviceState, trigger: StateTrigger): boolean {
  return TRANSITIONS[from]?.[trigger] !== undefined;
}

/** Geçişi uygular; tanımsızsa mevcut durumu korur. */
export function transition(from: DeviceState, trigger: StateTrigger): DeviceState {
  return TRANSITIONS[from]?.[trigger] ?? from;
}

/** Bir durumdan çıkılabilecek tüm tetikleyiciler — hata ayıklama ekranı için. */
export function triggersFrom(state: DeviceState): StateTrigger[] {
  return Object.keys(TRANSITIONS[state] ?? {}) as StateTrigger[];
}

export const STATE_LABEL: Record<DeviceState, string> = {
  boot: 'Açılıyor',
  welcome: 'Karşılıyor',
  pairing: 'Eşleşme',
  idle: 'Bekliyor',
  touch: 'Dokunuldu',
  thinking: 'Düşünüyor',
  responding: 'Cevaplıyor',
  sleeping: 'Uyuyor',
  offline: 'Çevrimdışı',
  error: 'Hata',
};
