/**
 * Wire protocol between browser and device.
 *
 * Framing: newline-delimited JSON (NDJSON). One object per line, no nesting of
 * frames. Chosen over a binary protocol because an ESP32-C3 can emit it with
 * ArduinoJson in a few hundred bytes of stack, and because a human can read the
 * raw stream in the serial monitor while debugging.
 *
 * Every browser->device frame may carry `id`. If it does, the device must answer
 * with a frame carrying the same `id` (ack | error | a typed reply).
 */

export type Expression =
  | 'idle'
  | 'happy'
  | 'sad'
  | 'angry'
  | 'sleep'
  | 'surprised'
  | 'confused'
  | 'love'
  | 'thinking';

export const EXPRESSIONS: Expression[] = [
  'idle',
  'happy',
  'sad',
  'angry',
  'sleep',
  'surprised',
  'confused',
  'love',
  'thinking',
];

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

/* ------------------------------- outbound ------------------------------- */

interface FrameBase {
  id?: number;
}

export interface PingFrame extends FrameBase {
  type: 'ping';
  ts: number;
}
export interface StatusRequestFrame extends FrameBase {
  type: 'status.get';
}
export interface ServoSetFrame extends FrameBase {
  type: 'servo.set';
  /** Servo channel id, e.g. "head_pan". */
  servo: string;
  /** Degrees. */
  angle: number;
  /** Optional travel time in ms. */
  ms?: number;
}
export interface LedSetFrame extends FrameBase {
  type: 'led.set';
  r: number;
  g: number;
  b: number;
  /** 0..255, defaults to current brightness. */
  brightness?: number;
}
export interface ExpressionSetFrame extends FrameBase {
  type: 'expression.set';
  value: Expression;
}
export interface SoundFrame extends FrameBase {
  type: 'sound.play' | 'sound.stop';
  clip?: string;
  volume?: number;
}
export interface SensorSubscribeFrame extends FrameBase {
  type: 'sensor.subscribe';
  /** Sensor ids, or ["*"] for all. */
  sensors: string[];
  /** Push interval in ms. */
  intervalMs: number;
}
export interface SystemFrame extends FrameBase {
  type: 'sys.reboot' | 'sys.info';
}

export type OutboundFrame =
  | PingFrame
  | StatusRequestFrame
  | ServoSetFrame
  | LedSetFrame
  | ExpressionSetFrame
  | SoundFrame
  | SensorSubscribeFrame
  | SystemFrame;

/* ------------------------------- inbound -------------------------------- */

export interface PongFrame extends FrameBase {
  type: 'pong';
  ts: number;
}

export interface DeviceStatus {
  firmware: string;
  board: string;
  uptimeS: number;
  freeHeap: number;
  cpuLoad?: number;
  tempC?: number;
  batteryPct?: number;
  batteryMv?: number;
  wifi?: { connected: boolean; ssid?: string; rssi?: number; ip?: string };
  peripherals?: Record<string, 'ok' | 'warning' | 'error' | 'absent'>;
}

export interface StatusFrame extends FrameBase {
  type: 'status';
  device: string;
  status: DeviceStatus;
}

export interface LogFrame extends FrameBase {
  type: 'log';
  level: LogLevel;
  msg: string;
  /** Device-side milliseconds since boot. */
  t?: number;
}

export interface SensorFrame extends FrameBase {
  type: 'sensor';
  /** sensor id -> value */
  values: Record<string, number>;
  t?: number;
}

export interface AckFrame extends FrameBase {
  type: 'ack';
  of: string;
}

export interface ErrorFrame extends FrameBase {
  type: 'error';
  code: string;
  msg: string;
}

export interface EventFrame extends FrameBase {
  type: 'event';
  event: string;
  data?: Record<string, unknown>;
}

export type InboundFrame =
  | PongFrame
  | StatusFrame
  | LogFrame
  | SensorFrame
  | AckFrame
  | ErrorFrame
  | EventFrame;

export type AnyFrame = InboundFrame | OutboundFrame;

/** Protocol revision. Bumped when frame shapes change incompatibly. */
export const PROTOCOL_VERSION = 1;
