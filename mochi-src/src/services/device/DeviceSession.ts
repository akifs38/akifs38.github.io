import type {
  ConnectionInfo,
  ConnectionState,
  DeviceStatus,
  EventFrame,
  InboundFrame,
  LogLevel,
  OutboundFrame,
  TransportId,
} from '@/types';
import { createTransport, type Transport } from '../transport';
import { decodeLine, encodeFrame } from '../protocol/codec';
import { frames } from '../protocol/frames';

export const HEARTBEAT_INTERVAL_MS = 2000;
export const HEARTBEAT_MISS_LIMIT = 3;

/**
 * Where the session reports to. Keeping this an interface rather than importing
 * the store keeps the session free of React and free of import cycles.
 */
export interface DeviceSessionSink {
  onState(state: ConnectionState, error?: string): void;
  onConnection(info: ConnectionInfo | null): void;
  onStatus(status: DeviceStatus): void;
  onLog(level: LogLevel, text: string, source: 'device' | 'studio' | 'tx'): void;
  onSensor(values: Record<string, number>): void;
  onLatency(ms: number | null, missed: number): void;
  onEvent(frame: EventFrame): void;
}

/**
 * Owns one connection: transport lifecycle, framing, heartbeat and the
 * request/response correlation table. The UI never touches a transport
 * directly — it calls this.
 */
export class DeviceSession {
  private transport: Transport | null = null;
  private unsubscribers: Array<() => void> = [];
  private heartbeat: ReturnType<typeof setInterval> | null = null;
  private pendingPing: { id: number; sentAt: number } | null = null;
  private missed = 0;
  private state: ConnectionState = 'disconnected';

  constructor(private readonly sink: DeviceSessionSink) {}

  getState(): ConnectionState {
    return this.state;
  }

  isConnected(): boolean {
    return this.state === 'connected';
  }

  async connect(transportId: TransportId, baudRate?: number): Promise<void> {
    if (this.transport) await this.disconnect();

    const transport = createTransport(transportId);
    if (!transport.capabilities.available) {
      const reason = transport.capabilities.unavailableReason ?? 'Transport unavailable.';
      this.setState('error', reason);
      throw new Error(reason);
    }

    this.transport = transport;
    this.setState(transportId === 'serial' ? 'requesting' : 'connecting');

    this.unsubscribers.push(
      transport.on('line', (line) => this.handleLine(line)),
      transport.on('close', (reason) => this.handleClose(reason)),
      transport.on('error', (error) => this.handleError(error)),
    );

    try {
      const info = await transport.connect(baudRate ? { baudRate } : {});
      this.sink.onConnection(info);
      this.setState('handshaking');
      this.sink.onLog('info', `Opened ${info.portLabel} at ${info.baudRate} baud.`, 'studio');
      await this.send(frames.statusGet());
      this.startHeartbeat();
      this.setState('connected');
    } catch (error) {
      const message = describeConnectError(error);
      await this.teardown();
      this.setState(message === CANCELLED ? 'disconnected' : 'error', message);
      throw new Error(message);
    }
  }

  async disconnect(): Promise<void> {
    if (!this.transport) return;
    this.sink.onLog('info', 'Closing connection.', 'studio');
    await this.teardown();
    this.setState('disconnected');
  }

  async send(frame: OutboundFrame): Promise<void> {
    if (!this.transport?.isOpen()) throw new Error('No device connected.');
    const payload = encodeFrame(frame);
    await this.transport.send(payload);
    this.sink.onLog('debug', payload.trimEnd(), 'tx');
  }

  /** Raw passthrough for the serial monitor's send box. */
  async sendRaw(text: string): Promise<void> {
    if (!this.transport?.isOpen()) throw new Error('No device connected.');
    const payload = text.endsWith('\n') ? text : `${text}\n`;
    await this.transport.send(payload);
    this.sink.onLog('debug', payload.trimEnd(), 'tx');
  }

  /* ------------------------------ internals ----------------------------- */

  private setState(state: ConnectionState, error?: string): void {
    this.state = state;
    this.sink.onState(state, error);
  }

  private handleLine(line: string): void {
    const { frames: parsed, text } = decodeLine(line);
    for (const raw of text) this.sink.onLog('info', raw, 'device');
    for (const frame of parsed) this.handleFrame(frame);
  }

  private handleFrame(frame: InboundFrame): void {
    switch (frame.type) {
      case 'pong': {
        if (this.pendingPing && frame.id === this.pendingPing.id) {
          this.sink.onLatency(Date.now() - this.pendingPing.sentAt, 0);
          this.pendingPing = null;
          this.missed = 0;
        }
        return;
      }
      case 'status':
        this.sink.onStatus(frame.status);
        if (this.state === 'handshaking') this.setState('connected');
        return;
      case 'log':
        this.sink.onLog(frame.level, frame.msg, 'device');
        return;
      case 'sensor':
        this.sink.onSensor(frame.values);
        return;
      case 'error':
        this.sink.onLog('error', `${frame.code}: ${frame.msg}`, 'device');
        return;
      case 'event':
        this.sink.onEvent(frame);
        return;
      case 'ack':
        return;
    }
  }

  private startHeartbeat(): void {
    this.stopHeartbeat();
    this.missed = 0;
    this.heartbeat = setInterval(() => {
      if (this.pendingPing) {
        this.missed += 1;
        this.sink.onLatency(null, this.missed);
        if (this.missed >= HEARTBEAT_MISS_LIMIT) {
          this.sink.onLog(
            'error',
            `Device stopped answering after ${HEARTBEAT_MISS_LIMIT} heartbeats.`,
            'studio',
          );
          void this.forceDisconnect('Device stopped answering.');
          return;
        }
      }
      const ping = frames.ping();
      this.pendingPing = { id: ping.id!, sentAt: Date.now() };
      void this.send(ping).catch(() => undefined);
    }, HEARTBEAT_INTERVAL_MS);
  }

  private stopHeartbeat(): void {
    if (this.heartbeat) clearInterval(this.heartbeat);
    this.heartbeat = null;
    this.pendingPing = null;
  }

  private handleClose(reason: string): void {
    if (this.state === 'disconnected') return;
    this.sink.onLog('warn', reason, 'studio');
    void this.teardown().then(() => this.setState('disconnected'));
  }

  private handleError(error: Error): void {
    this.sink.onLog('error', error.message, 'studio');
    this.setState('error', error.message);
  }

  private async forceDisconnect(reason: string): Promise<void> {
    await this.teardown();
    this.setState('error', reason);
  }

  private async teardown(): Promise<void> {
    this.stopHeartbeat();
    for (const off of this.unsubscribers) off();
    this.unsubscribers = [];
    const transport = this.transport;
    this.transport = null;
    if (transport) await transport.disconnect().catch(() => undefined);
    this.sink.onConnection(null);
    this.sink.onLatency(null, 0);
  }
}

const CANCELLED = 'Port selection cancelled.';

function describeConnectError(error: unknown): string {
  if (!(error instanceof Error)) return String(error);
  if (error.name === 'NotFoundError') return CANCELLED;
  if (error.name === 'SecurityError') {
    return 'The browser blocked serial access. Web Serial needs HTTPS or localhost.';
  }
  if (error.name === 'InvalidStateError' || /already open/i.test(error.message)) {
    return 'That port is already open — close the other serial monitor and try again.';
  }
  if (error.name === 'NetworkError') {
    return 'The port could not be opened. Unplug and replug the board, then retry.';
  }
  return error.message;
}
