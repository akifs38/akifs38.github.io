import type { DeviceStatus, LogLevel } from './protocol';

/** Where the studio is getting its data from right now. */
export type SessionMode = 'live' | 'simulation';

export type ConnectionState =
  | 'disconnected'
  | 'requesting'
  | 'connecting'
  | 'handshaking'
  | 'connected'
  | 'error';

export type TransportId = 'serial' | 'mock' | 'wifi' | 'bluetooth';

export interface TransportCapabilities {
  /** False for transports that are declared but not implemented yet. */
  available: boolean;
  /** Reason shown to the user when unavailable. */
  unavailableReason?: string;
  supportsBinaryUpload: boolean;
  supportsReset: boolean;
}

export interface TransportDescriptor {
  id: TransportId;
  label: string;
  capabilities: TransportCapabilities;
}

export interface ConnectionInfo {
  transport: TransportId;
  /** e.g. "COM3" on Windows, "USB Serial Device" elsewhere. */
  portLabel: string;
  baudRate: number;
  usbVendorId?: number;
  usbProductId?: number;
  connectedAt?: number;
}

export type LogSource = 'device' | 'studio' | 'tx';

export interface LogEntry {
  id: number;
  /** Wall-clock ms on the host. */
  at: number;
  source: LogSource;
  level: LogLevel;
  text: string;
}

export interface SensorSample {
  at: number;
  values: Record<string, number>;
}

export interface DeviceSnapshot {
  state: ConnectionState;
  mode: SessionMode;
  connection: ConnectionInfo | null;
  status: DeviceStatus | null;
  /** Round-trip time of the last heartbeat, ms. */
  latencyMs: number | null;
  missedHeartbeats: number;
  lastError: string | null;
}
