import type { ConnectionInfo, TransportCapabilities } from '@/types';
import { TransportEmitter, type Transport } from './Transport';

/**
 * Declared, not implemented. It exists so the transport registry and the
 * connection UI already have a second entry to render, and so the eventual
 * WebSocket implementation slots in without a refactor. It refuses to connect
 * rather than pretending — see docs/architecture.md, "No fake functionality".
 */
export class WifiTransport extends TransportEmitter implements Transport {
  readonly id = 'wifi' as const;
  readonly label = 'Wi-Fi (WebSocket)';
  readonly capabilities: TransportCapabilities = {
    available: false,
    unavailableReason: 'Wi-Fi transport arrives with the OTA work in Phase 8.',
    supportsBinaryUpload: true,
    supportsReset: false,
  };

  isOpen(): boolean {
    return false;
  }

  async connect(): Promise<ConnectionInfo> {
    throw new Error(this.capabilities.unavailableReason);
  }

  async send(): Promise<void> {
    throw new Error(this.capabilities.unavailableReason);
  }

  async disconnect(): Promise<void> {
    /* nothing to tear down */
  }
}
