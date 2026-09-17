import type { DeviceCommand, DeviceEvent, TouchGesture } from '@/types';

export type DeviceEventHandler = (event: DeviceEvent) => void;
export type Unsubscribe = () => void;

export type TransportStatus = 'connecting' | 'connected' | 'reconnecting' | 'closed';

/**
 * Cihaz taşıma katmanı.
 *
 * Arayüz, karşı tarafta simüle edilmiş bir ESP32 mi yoksa gerçek bir
 * WebSocket mi olduğunu bilmez. PHASE 8'de `LiveDeviceTransport` devreye
 * girdiğinde tek satır UI değişmeyecek.
 */
export interface DeviceTransport {
  readonly id: string;
  readonly simulated: boolean;
  connect(): void;
  disconnect(): void;
  send(command: DeviceCommand): void;
  on(handler: DeviceEventHandler): Unsubscribe;
  readonly status: TransportStatus;
}

/** Yalnızca simülatörde bulunan, geliştirici panelinin kullandığı yetenekler. */
export interface SimulatedDeviceTransport extends DeviceTransport {
  readonly simulated: true;
  /** Dokunma sensörünün yükselen/düşen kenarını taklit eder. */
  pressTouch(): void;
  releaseTouch(): void;
  /** Kenarları beklemeden doğrudan bir hareket üretir. */
  emitGesture(gesture: TouchGesture): void;
  /** Bağlantıyı koparıp geri getirir. */
  setOnline(online: boolean): void;
  log(message: string): void;
}

export function isSimulated(
  transport: DeviceTransport,
): transport is SimulatedDeviceTransport {
  return transport.simulated;
}
