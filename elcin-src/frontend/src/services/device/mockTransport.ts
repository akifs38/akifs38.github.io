import { config } from '@/config';
import type {
  AnimationName,
  DeviceCommand,
  DeviceEvent,
  DeviceState,
  DeviceStatus,
  Mood,
  TouchGesture,
} from '@/types';
import { transition } from './stateMachine';
import { TouchRecognizer } from './touch';
import type { DeviceEventHandler, SimulatedDeviceTransport, TransportStatus, Unsubscribe } from './types';

/**
 * Simüle edilmiş ESP32.
 *
 * Masada gerçek cihaz yokken de uygulamanın tamamı çalışsın diye var — ve
 * kasıtlı olarak "sahte veri üreten bir stub" değil, küçük bir cihaz taklidi:
 * kendi durum makinesini işletir, heartbeat gönderir, dokunma kenarlarını
 * gerçek tanıyıcıdan geçirir, boşta kalınca uyur. Böylece gerçek firmware
 * bağlandığında UI'ın karşılaştığı olay akışı değişmez.
 */
export class MockDeviceTransport implements SimulatedDeviceTransport {
  readonly id = config.device.defaultId;
  readonly simulated = true as const;

  private handlers = new Set<DeviceEventHandler>();
  private loop: ReturnType<typeof setInterval> | null = null;
  private heartbeat: ReturnType<typeof setInterval> | null = null;
  private touch = new TouchRecognizer();
  private transportStatus: TransportStatus = 'closed';

  private state: DeviceState = 'boot';
  private mood: Mood = 'normal';
  private animation: AnimationName = 'idle';
  private online = true;
  private bootAt = Date.now();
  private lastInteractionAt = Date.now();
  /** Geçici durumların (touch/responding) ne zaman biteceği. */
  private stateExpiresAt: number | null = null;

  get status(): TransportStatus {
    return this.transportStatus;
  }

  connect(): void {
    if (this.loop) return;
    this.transportStatus = 'connecting';
    this.bootAt = Date.now();
    this.state = 'boot';
    this.touch.reset();

    // Açılış sekansı: boot → welcome → idle. Gerçek cihazda da böyle.
    this.log('Cihaz açılıyor');
    window.setTimeout(() => {
      this.setState(transition(this.state, 'boot_done'));
      this.log('Wi-Fi bağlandı');
    }, 600);
    window.setTimeout(() => {
      this.setState(transition(this.state, 'welcome_done'));
      this.transportStatus = 'connected';
      this.emit({ type: 'device_event', event: 'connection', online: true, at: now() });
      this.log('WebSocket bağlandı');
      // Gerçek cihaz da bağlanır bağlanmaz kendini tanıtır; ilk heartbeat
      // için bir aralık beklemek ekranı gereksiz yere boş bırakıyordu.
      this.sendHeartbeat();
    }, 1_600);

    // Ana döngü: bloke etmeyen tick. Firmware'deki loop()'un karşılığı.
    this.loop = setInterval(() => this.tick(), 100);
    this.heartbeat = setInterval(() => this.sendHeartbeat(), config.device.heartbeatMs);
  }

  disconnect(): void {
    if (this.loop) clearInterval(this.loop);
    if (this.heartbeat) clearInterval(this.heartbeat);
    this.loop = null;
    this.heartbeat = null;
    this.transportStatus = 'closed';
    this.handlers.clear();
  }

  on(handler: DeviceEventHandler): Unsubscribe {
    this.handlers.add(handler);
    return () => this.handlers.delete(handler);
  }

  send(command: DeviceCommand): void {
    if (!this.online) {
      this.log('Komut alınamadı: cihaz çevrimdışı');
      return;
    }
    this.lastInteractionAt = Date.now();

    switch (command.command) {
      case 'animation':
        this.animation = command.animation;
        this.setState('responding', config.device.touchTimeoutMs);
        this.log(`Animasyon: ${command.animation}`);
        break;
      case 'mood':
        this.mood = command.mood;
        this.log(`Ruh hali: ${command.mood}`);
        break;
      case 'state':
        this.setState(command.state);
        this.log(`Durum: ${command.state}`);
        break;
      case 'message':
        this.setState('responding', config.device.touchTimeoutMs);
        this.log(`Ekranda: ${command.text.slice(0, 40)}`);
        break;
      case 'reboot':
        this.log('Yeniden başlatılıyor…');
        this.disconnect();
        window.setTimeout(() => this.connect(), 900);
        break;
      case 'ota':
        this.log(`OTA başlatıldı: ${command.version}`);
        break;
      default:
        break;
    }
  }

  /* ------------------------------------------------ simülasyon yetenekleri */

  pressTouch(): void {
    if (!this.online && this.state !== 'offline') this.setState('offline');
    this.dispatchGestures(this.touch.press(Date.now()));
  }

  releaseTouch(): void {
    this.dispatchGestures(this.touch.release(Date.now()));
  }

  /** Kenarları beklemeden hareket üretir — geliştirici panelindeki butonlar. */
  emitGesture(gesture: TouchGesture): void {
    this.dispatchGestures([gesture]);
  }

  setOnline(online: boolean): void {
    if (this.online === online) return;
    this.online = online;

    if (online) {
      this.setState(transition(this.state, 'connection_restored'));
      this.transportStatus = 'connected';
      this.log('Bağlantı geri geldi');
    } else {
      this.setState(transition(this.state, 'connection_lost'));
      this.transportStatus = 'reconnecting';
      this.log('Bağlantı koptu');
    }
    this.emit({ type: 'device_event', event: 'connection', online, at: now() });
  }

  log(message: string): void {
    this.emit({ type: 'device_event', event: 'log', level: 'info', message, at: now() });
  }

  /* ------------------------------------------------------------- dahili */

  private tick(): void {
    const stamp = Date.now();
    this.dispatchGestures(this.touch.tick(stamp));

    // Geçici durumların süresi dolduğunda kendiliğinden idle'a dönülür.
    if (this.stateExpiresAt !== null && stamp >= this.stateExpiresAt) {
      this.stateExpiresAt = null;
      this.setState(transition(this.state, 'timeout'));
    }

    // Uzun süre etkileşim yoksa Elçin uyur.
    if (
      this.state === 'idle' &&
      this.online &&
      stamp - this.lastInteractionAt > config.device.sleepTimeoutMs
    ) {
      this.setState('sleeping');
      this.animation = 'sleep';
      this.mood = 'sleepy';
      this.log('Uykuya geçti');
    }
  }

  private dispatchGestures(gestures: TouchGesture[]): void {
    for (const gesture of gestures) {
      this.lastInteractionAt = Date.now();
      this.emit({ type: 'device_event', event: 'touch', touch: gesture, at: now() });

      if (gesture === 'touch_down') {
        this.setState(transition(this.state, 'touch_start'), config.device.touchTimeoutMs);
      }
    }
  }

  private setState(state: DeviceState, ttl?: number): void {
    if (this.state === state && ttl === undefined) return;
    this.state = state;
    this.stateExpiresAt = ttl ? Date.now() + ttl : null;
    this.emit({ type: 'device_event', event: 'state', state, at: now() });
  }

  private sendHeartbeat(): void {
    if (!this.online) return;
    this.emit({ type: 'device_event', event: 'heartbeat', status: this.snapshot(), at: now() });
  }

  private snapshot(): DeviceStatus {
    return {
      deviceId: this.id,
      name: 'Elçin',
      online: this.online,
      state: this.state,
      mood: this.mood,
      animation: this.animation,
      firmware: config.device.firmware,
      // Gerçekçi bir dalgalanma: sabit bir sayı sahte görünür.
      wifiRssi: -48 - Math.round(Math.random() * 14),
      ssid: 'Ev-Wi-Fi',
      uptime: Math.floor((Date.now() - this.bootAt) / 1_000),
      lastSeen: now(),
      peripherals: {
        wifi: this.online,
        oled: true,
        touch: true,
        cloud: this.online,
      },
    };
  }

  private emit(event: DeviceEvent): void {
    for (const handler of this.handlers) handler(event);
  }
}

function now(): string {
  return new Date().toISOString();
}
