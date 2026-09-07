import type { ConnectionInfo, TransportCapabilities, TransportId } from '@/types';

export interface TransportEvents {
  /** One complete line of device output, newline stripped. */
  line: (line: string) => void;
  /** Transport-level state change. */
  open: (info: ConnectionInfo) => void;
  close: (reason: string) => void;
  error: (error: Error) => void;
}

export type TransportEventName = keyof TransportEvents;

export interface ConnectOptions {
  baudRate?: number;
}

/**
 * Everything above this interface is transport-agnostic. Adding Wi-Fi or BLE
 * later means writing one class, not touching the device session or the UI.
 */
export interface Transport {
  readonly id: TransportId;
  readonly label: string;
  readonly capabilities: TransportCapabilities;
  isOpen(): boolean;
  connect(options?: ConnectOptions): Promise<ConnectionInfo>;
  disconnect(): Promise<void>;
  send(payload: string): Promise<void>;
  on<E extends TransportEventName>(event: E, handler: TransportEvents[E]): () => void;
}

/** Minimal typed emitter shared by the transport implementations. */
export class TransportEmitter {
  private handlers: { [K in TransportEventName]: Set<TransportEvents[K]> } = {
    line: new Set(),
    open: new Set(),
    close: new Set(),
    error: new Set(),
  };

  on<E extends TransportEventName>(event: E, handler: TransportEvents[E]): () => void {
    this.handlers[event].add(handler as never);
    return () => {
      this.handlers[event].delete(handler as never);
    };
  }

  protected emit<E extends TransportEventName>(
    event: E,
    ...args: Parameters<TransportEvents[E]>
  ): void {
    for (const handler of this.handlers[event]) {
      (handler as (...a: unknown[]) => void)(...args);
    }
  }

  protected clearHandlers(): void {
    for (const set of Object.values(this.handlers)) set.clear();
  }
}
