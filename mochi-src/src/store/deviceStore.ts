import { create } from 'zustand';
import type {
  ConnectionInfo,
  ConnectionState,
  DeviceSnapshot,
  DeviceStatus,
  Expression,
  LogEntry,
  LogLevel,
  LogSource,
  OutboundFrame,
  SensorSample,
  SessionMode,
  TransportId,
} from '@/types';
import { DeviceSession } from '@/services/device/DeviceSession';
import { frames } from '@/services/protocol/frames';
import { toast } from './toastStore';

const LOG_CAPACITY = 4000;
const SENSOR_WINDOW_MS = 60_000;

interface DeviceState extends DeviceSnapshot {
  logs: LogEntry[];
  sensors: SensorSample[];
  /** Local echo of the last commands sent, so simulation can animate. */
  actuators: {
    servos: Record<string, number>;
    led: { r: number; g: number; b: number };
    expression: Expression;
  };

  connect(transport: TransportId, baudRate?: number): Promise<void>;
  disconnect(): Promise<void>;
  send(frame: OutboundFrame): Promise<void>;
  sendRaw(text: string): Promise<void>;
  requestStatus(): Promise<void>;
  clearLogs(): void;
  appendLog(level: LogLevel, text: string, source?: LogSource): void;
}

let logId = 0;
function makeLog(level: LogLevel, text: string, source: LogSource): LogEntry {
  return { id: ++logId, at: Date.now(), level, text, source };
}

export const useDeviceStore = create<DeviceState>()((set, get) => {
  const session = new DeviceSession({
    onState(state: ConnectionState, error?: string) {
      set({ state, lastError: error ?? null });
      if (state === 'error' && error) toast.error('Connection failed', error);
    },
    onConnection(connection: ConnectionInfo | null) {
      set({
        connection,
        mode: connection?.transport === 'mock' ? 'simulation' : ('live' as SessionMode),
      });
    },
    onStatus(status: DeviceStatus) {
      set({ status });
    },
    onLog(level, text, source) {
      const entry = makeLog(level, text, source);
      set((s) => {
        const logs = s.logs.length >= LOG_CAPACITY ? s.logs.slice(-LOG_CAPACITY + 1) : s.logs;
        return { logs: [...logs, entry] };
      });
    },
    onSensor(values) {
      const sample: SensorSample = { at: Date.now(), values };
      set((s) => ({
        sensors: [...s.sensors, sample].filter((x) => sample.at - x.at <= SENSOR_WINDOW_MS),
      }));
    },
    onLatency(latencyMs, missedHeartbeats) {
      set({ latencyMs, missedHeartbeats });
    },
    onEvent(frame) {
      if (frame.event === 'servo.moved' && frame.data) {
        const servo = String(frame.data['servo'] ?? '');
        const angle = Number(frame.data['angle'] ?? 0);
        if (servo) {
          set((s) => ({ actuators: { ...s.actuators, servos: { ...s.actuators.servos, [servo]: angle } } }));
        }
      }
      if (frame.event === 'expression.changed' && frame.data) {
        const value = frame.data['value'] as Expression | undefined;
        if (value) set((s) => ({ actuators: { ...s.actuators, expression: value } }));
      }
      if (frame.event === 'ready') {
        toast.ok('Device ready', 'Firmware finished booting.');
      }
    },
  });

  return {
    state: 'disconnected',
    mode: 'simulation',
    connection: null,
    status: null,
    latencyMs: null,
    missedHeartbeats: 0,
    lastError: null,
    logs: [],
    sensors: [],
    actuators: {
      servos: { head_pan: 90, head_tilt: 90 },
      led: { r: 242, g: 162, b: 176 },
      expression: 'idle',
    },

    async connect(transport, baudRate) {
      await session.connect(transport, baudRate);
      const label = get().connection?.portLabel ?? transport;
      toast.ok(transport === 'mock' ? 'Simulation started' : 'Device connected', label);
    },

    async disconnect() {
      await session.disconnect();
      toast.info('Disconnected');
    },

    async send(frame) {
      await session.send(frame);
      // Optimistic local echo keeps the 3D robot responsive at 60 fps instead of
      // waiting a round trip; the device event corrects it if they disagree.
      if (frame.type === 'servo.set') {
        set((s) => ({
          actuators: { ...s.actuators, servos: { ...s.actuators.servos, [frame.servo]: frame.angle } },
        }));
      }
      if (frame.type === 'led.set') {
        set((s) => ({ actuators: { ...s.actuators, led: { r: frame.r, g: frame.g, b: frame.b } } }));
      }
      if (frame.type === 'expression.set') {
        set((s) => ({ actuators: { ...s.actuators, expression: frame.value } }));
      }
    },

    async sendRaw(text) {
      await session.sendRaw(text);
    },

    async requestStatus() {
      await session.send(frames.statusGet());
    },

    clearLogs() {
      set({ logs: [] });
    },

    appendLog(level, text, source = 'studio') {
      set((s) => ({ logs: [...s.logs, makeLog(level, text, source)] }));
    },
  };
});

/** Selector helpers used across the UI. */
export const selectIsConnected = (s: DeviceState) => s.state === 'connected';
export const selectIsBusy = (s: DeviceState) =>
  s.state === 'connecting' || s.state === 'requesting' || s.state === 'handshaking';
