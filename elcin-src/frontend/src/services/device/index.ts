import { config } from '@/config';
import { LiveDeviceTransport } from './liveTransport';
import { MockDeviceTransport } from './mockTransport';
import type { DeviceTransport } from './types';

export * from './types';
export { MockDeviceTransport } from './mockTransport';
export { LiveDeviceTransport, parseEvent } from './liveTransport';
export { transition, canTransition, STATE_LABEL } from './stateMachine';
export { TouchRecognizer, TOUCH_LABEL, DEFAULT_TOUCH_CONFIG } from './touch';

/**
 * Taşıma fabrikası. WebSocket adresi tanımlı değilse simülatör devreye girer,
 * yani gerçek cihaz olmadan da her ekran çalışır.
 */
export function createDeviceTransport(
  preference: 'mock' | 'live' = 'mock',
): DeviceTransport {
  if (preference === 'live' && config.api.wsUrl) {
    return new LiveDeviceTransport(config.device.defaultId, config.api.wsUrl);
  }
  return new MockDeviceTransport();
}
