import type { TransportDescriptor, TransportId } from '@/types';
import type { Transport } from './Transport';
import { MockTransport } from './MockTransport';
import { SerialTransport } from './SerialTransport';
import { WifiTransport } from './WifiTransport';

export { isWebSerialSupported } from './SerialTransport';
export type { Transport } from './Transport';

const factories: Record<TransportId, () => Transport> = {
  serial: () => new SerialTransport(),
  mock: () => new MockTransport(),
  wifi: () => new WifiTransport(),
  bluetooth: () => {
    throw new Error('Bluetooth transport is not implemented.');
  },
};

export function createTransport(id: TransportId): Transport {
  const factory = factories[id];
  if (!factory) throw new Error(`Unknown transport "${id}".`);
  return factory();
}

/** Used by the connect menu to show what is and is not usable right now. */
export function listTransports(): TransportDescriptor[] {
  return (['serial', 'mock', 'wifi'] as const).map((id) => {
    const transport = createTransport(id);
    return { id, label: transport.label, capabilities: transport.capabilities };
  });
}
