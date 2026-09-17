import { create } from 'zustand';
import { config } from '@/config';
import type {
  AnimationName,
  DeviceCommand,
  DeviceState,
  DeviceStatus,
  Mood,
  TouchGesture,
} from '@/types';
import {
  createDeviceTransport,
  isSimulated,
  type DeviceTransport,
  type TransportStatus,
} from '@/services/device';
import { useActivity } from './activityStore';
import { useElcin } from './elcinStore';
import { useSettings } from './settingsStore';

/**
 * Cihaz durumu.
 *
 * Bu store taşıma katmanının üstünde durur: gelen olayları uygulama diline
 * çevirir (dokunma → aktivite + Elçin'in yüzü), giden komutları taşımaya
 * verir. Simülatör mü gerçek cihaz mı olduğunu yalnızca burası bilir.
 */

/** Dokunma hareketlerinin Elçin'deki karşılığı — 17. maddedeki davranışlar. */
const TOUCH_REACTION: Partial<Record<TouchGesture, { mood: Mood; animation: AnimationName; say: string }>> = {
  single_tap: { mood: 'happy', animation: 'smile', say: 'Buradayım {{USER}}.' },
  double_tap: { mood: 'excited', animation: 'laugh', say: 'Hehe, gıdıklandım!' },
  long_press: { mood: 'curious', animation: 'think', say: 'Bir şey mi oldu?' },
  very_long_press: { mood: 'love', animation: 'heart', say: 'Buradayım. Hep buradayım. ❤️' },
};

interface DeviceStore {
  transport: DeviceTransport | null;
  transportStatus: TransportStatus;
  status: DeviceStatus | null;
  state: DeviceState;
  online: boolean;
  /** Cihazdan gelen son tepki — ana sayfada baloncuk olarak görünür. */
  lastReaction: { text: string; at: string } | null;
  lastTouch: { gesture: TouchGesture; at: string } | null;

  start(mode?: 'mock' | 'live'): void;
  stop(): void;
  send(command: DeviceCommand): void;
  /** Geliştirici paneli: dokunmayı taklit et. */
  simulate(gesture: TouchGesture): void;
  setSimulatedOnline(online: boolean): void;
}

export const useDevice = create<DeviceStore>((set, get) => ({
  transport: null,
  transportStatus: 'closed',
  status: null,
  state: 'boot',
  online: false,
  lastReaction: null,
  lastTouch: null,

  start: (mode = 'mock') => {
    get().stop();

    const transport = createDeviceTransport(mode);
    const activity = useActivity.getState();
    const elcin = useElcin.getState();

    transport.on((event) => {
      switch (event.event) {
        case 'heartbeat':
          set({ status: event.status, online: event.status.online, state: event.status.state });
          break;

        case 'state':
          set({ state: event.state });
          if (event.state === 'sleeping') activity.push('sleep', 'Uykuya geçti');
          break;

        case 'connection':
          set({ online: event.online, transportStatus: transport.status });
          activity.push('device', event.online ? 'Cihaz bağlandı' : 'Cihaz bağlantısı koptu');
          activity.pushLog(event.online ? 'info' : 'warn', event.online ? 'Bağlantı kuruldu' : 'Bağlantı koptu');
          break;

        case 'log':
          activity.pushLog(event.level, event.message);
          break;

        case 'touch': {
          set({ lastTouch: { gesture: event.touch, at: event.at } });
          const reaction = TOUCH_REACTION[event.touch];
          if (!reaction) break;

          // Cihazdaki dokunuş web'deki avatarı da aynı anda değiştirir.
          elcin.setMood({ mood: reaction.mood, intensity: 0.75, reason: 'Sana dokunuldu' });
          elcin.play(reaction.animation);
          const userName = useSettings.getState().userName;
          set({
            lastReaction: { text: reaction.say.replace(/\{\{USER\}\}/g, userName), at: event.at },
          });
          activity.push('touch', "Elçin'e dokunuldu", labelFor(event.touch));
          break;
        }

        default:
          break;
      }
    });

    transport.connect();
    set({ transport, transportStatus: transport.status });
  },

  stop: () => {
    const { transport } = get();
    transport?.disconnect();
    set({ transport: null, transportStatus: 'closed', status: null, online: false });
  },

  send: (command) => {
    const { transport } = get();
    if (!transport) return;
    transport.send(command);

    // Komut cihaza giderken web avatarı da anında tepki verir; iki tarafın
    // senkron görünmesi bekleme süresine takılmamalı.
    if (command.command === 'animation') useElcin.getState().play(command.animation);
    if (command.command === 'mood') {
      useElcin.getState().setMood({
        mood: command.mood,
        intensity: 0.7,
        reason: 'Web üzerinden ayarlandı',
      });
    }
  },

  simulate: (gesture) => {
    const { transport } = get();
    if (transport && isSimulated(transport)) transport.emitGesture(gesture);
  },

  setSimulatedOnline: (online) => {
    const { transport } = get();
    if (transport && isSimulated(transport)) transport.setOnline(online);
  },
}));

function labelFor(gesture: TouchGesture): string {
  const labels: Record<TouchGesture, string> = {
    touch_down: 'Dokunuldu',
    touch_up: 'Bırakıldı',
    single_tap: 'Tek dokunuş',
    double_tap: 'Çift dokunuş',
    long_press: 'Uzun basış',
    very_long_press: 'Çok uzun basış',
  };
  return labels[gesture];
}

/** Sinyal gücünü 0–4 çubuğa çevirir. */
export function signalBars(rssi: number): number {
  if (rssi >= -55) return 4;
  if (rssi >= -65) return 3;
  if (rssi >= -75) return 2;
  if (rssi >= -85) return 1;
  return 0;
}

export const DEVICE_DEFAULT_ID = config.device.defaultId;
