import { config } from '@/config';
import type { DeviceCommand, DeviceEvent } from '@/types';
import type { DeviceEventHandler, DeviceTransport, TransportStatus, Unsubscribe } from './types';

/**
 * Gerçek WebSocket taşıması.
 *
 * Cihaz ile tarayıcı doğrudan konuşmaz; ikisi de backend'e bağlanır, backend
 * olayları iki yöne kopyalar. Bu sınıf tarayıcı ucudur.
 *
 * Yeniden bağlanma üstel geri çekilme ile yapılır: kopan bağlantıya saniyede
 * bir asılmak hem cihazı hem sunucuyu yorar.
 */
export class LiveDeviceTransport implements DeviceTransport {
  readonly simulated = false as const;

  private socket: WebSocket | null = null;
  private handlers = new Set<DeviceEventHandler>();
  private attempt = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private closedByUs = false;
  private transportStatus: TransportStatus = 'closed';

  readonly id: string;
  private readonly url: string;

  constructor(id: string, url: string) {
    this.id = id;
    this.url = url;
  }

  get status(): TransportStatus {
    return this.transportStatus;
  }

  connect(): void {
    this.closedByUs = false;
    this.open();
  }

  disconnect(): void {
    this.closedByUs = true;
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.reconnectTimer = null;
    this.socket?.close();
    this.socket = null;
    this.transportStatus = 'closed';
    this.handlers.clear();
  }

  send(command: DeviceCommand): void {
    if (this.socket?.readyState !== WebSocket.OPEN) return;
    this.socket.send(JSON.stringify({ ...command, device_id: this.id }));
  }

  on(handler: DeviceEventHandler): Unsubscribe {
    this.handlers.add(handler);
    return () => this.handlers.delete(handler);
  }

  private open(): void {
    this.transportStatus = this.attempt === 0 ? 'connecting' : 'reconnecting';
    const socket = new WebSocket(`${this.url}?device=${encodeURIComponent(this.id)}`);
    this.socket = socket;

    socket.addEventListener('open', () => {
      this.attempt = 0;
      this.transportStatus = 'connected';
      this.emit({ type: 'device_event', event: 'connection', online: true, at: nowIso() });
    });

    socket.addEventListener('message', (message) => {
      const event = parseEvent(message.data);
      if (event) this.emit(event);
    });

    socket.addEventListener('close', () => {
      this.transportStatus = 'closed';
      this.emit({ type: 'device_event', event: 'connection', online: false, at: nowIso() });
      if (!this.closedByUs) this.scheduleReconnect();
    });

    // 'error' sonrası her zaman 'close' gelir; yeniden bağlanmayı orada
    // planlamak iki kez denemeyi önler.
    socket.addEventListener('error', () => {
      this.transportStatus = 'reconnecting';
    });
  }

  private scheduleReconnect(): void {
    const steps = config.device.reconnectBackoffMs;
    const wait = steps[Math.min(this.attempt, steps.length - 1)] ?? 16_000;
    this.attempt += 1;
    this.transportStatus = 'reconnecting';
    this.reconnectTimer = setTimeout(() => this.open(), wait);
  }

  private emit(event: DeviceEvent): void {
    for (const handler of this.handlers) handler(event);
  }
}

/**
 * Gelen mesajı olaya çevirir.
 *
 * Bozuk veya tanınmayan mesaj sessizce düşer: kötü bir paket yüzünden
 * kullanıcının ekranına hata basmayız.
 */
export function parseEvent(raw: unknown): DeviceEvent | null {
  if (typeof raw !== 'string') return null;

  let data: Record<string, unknown>;
  try {
    data = JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return null;
  }

  if (data.type !== 'device_event') return null;
  const at = typeof data.at === 'string' ? data.at : nowIso();

  switch (data.event) {
    case 'touch':
      return typeof data.touch === 'string'
        ? ({ type: 'device_event', event: 'touch', touch: data.touch, at } as DeviceEvent)
        : null;
    case 'state':
      return typeof data.state === 'string'
        ? ({ type: 'device_event', event: 'state', state: data.state, at } as DeviceEvent)
        : null;
    case 'heartbeat':
      return data.status && typeof data.status === 'object'
        ? ({ type: 'device_event', event: 'heartbeat', status: data.status, at } as DeviceEvent)
        : null;
    case 'log':
      return typeof data.message === 'string'
        ? ({
            type: 'device_event',
            event: 'log',
            level: typeof data.level === 'string' ? data.level : 'info',
            message: data.message,
            at,
          } as DeviceEvent)
        : null;
    case 'connection':
      return { type: 'device_event', event: 'connection', online: Boolean(data.online), at };
    default:
      return null;
  }
}

function nowIso(): string {
  return new Date().toISOString();
}
