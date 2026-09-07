import type { ConnectionInfo, TransportCapabilities } from '@/types';
import { TransportEmitter, type Transport } from './Transport';

interface MockState {
  bootedAt: number;
  expression: string;
  servos: Record<string, number>;
  led: { r: number; g: number; b: number };
  batteryPct: number;
}

const BOOT_SEQUENCE: Array<{ delay: number; line: string }> = [
  { delay: 120, line: 'ESP-ROM:esp32c3-api1-20210207' },
  { delay: 90, line: 'Mochi firmware 0.4.2 (esp32-c3)' },
  { delay: 110, line: '{"type":"log","level":"info","msg":"I2C bus up, SH1106 found at 0x3C","t":142}' },
  { delay: 80, line: '{"type":"log","level":"info","msg":"I2S amplifier ready","t":221}' },
  { delay: 100, line: '{"type":"log","level":"info","msg":"Servos centred: pan 90, tilt 90","t":318}' },
  { delay: 130, line: '{"type":"log","level":"warn","msg":"No Wi-Fi credentials stored, staying offline","t":446}' },
  { delay: 70, line: '{"type":"event","event":"ready"}' },
];

/**
 * A simulated ESP32-C3 that speaks the real wire protocol over an in-memory
 * pipe. It exists so the studio is fully usable without hardware — and because
 * a protocol you can only test against a physical board is a protocol nobody
 * tests. Everything it reports is generated locally and the UI labels it
 * SIMULATION throughout.
 */
export class MockTransport extends TransportEmitter implements Transport {
  readonly id = 'mock' as const;
  readonly label = 'Simulated device';
  readonly capabilities: TransportCapabilities = {
    available: true,
    supportsBinaryUpload: false,
    supportsReset: true,
  };

  private open = false;
  private timers: ReturnType<typeof setTimeout>[] = [];
  private telemetry: ReturnType<typeof setInterval> | null = null;
  private state: MockState = {
    bootedAt: Date.now(),
    expression: 'idle',
    servos: { head_pan: 90, head_tilt: 90 },
    led: { r: 242, g: 162, b: 176 },
    batteryPct: 87,
  };

  isOpen(): boolean {
    return this.open;
  }

  async connect(): Promise<ConnectionInfo> {
    this.open = true;
    this.state.bootedAt = Date.now();

    const info: ConnectionInfo = {
      transport: 'mock',
      portLabel: 'Simulated ESP32-C3',
      baudRate: 115200,
      connectedAt: Date.now(),
    };
    this.emit('open', info);

    let elapsed = 0;
    for (const step of BOOT_SEQUENCE) {
      elapsed += step.delay;
      this.schedule(() => this.emit('line', step.line), elapsed);
    }

    this.telemetry = setInterval(() => this.pushSensors(), 1000);
    return info;
  }

  async send(payload: string): Promise<void> {
    if (!this.open) throw new Error('Simulated device is not connected.');
    for (const line of payload.split('\n')) {
      const trimmed = line.trim();
      if (trimmed) this.schedule(() => this.handle(trimmed), 12 + Math.random() * 18);
    }
  }

  async disconnect(): Promise<void> {
    this.open = false;
    for (const timer of this.timers) clearTimeout(timer);
    this.timers = [];
    if (this.telemetry) clearInterval(this.telemetry);
    this.telemetry = null;
    this.emit('close', 'Simulation stopped.');
  }

  /* ------------------------------ internals ----------------------------- */

  private schedule(fn: () => void, ms: number): void {
    const timer = setTimeout(() => {
      this.timers = this.timers.filter((t) => t !== timer);
      if (this.open) fn();
    }, ms);
    this.timers.push(timer);
  }

  private reply(frame: object): void {
    this.emit('line', JSON.stringify(frame));
  }

  private uptimeS(): number {
    return Math.floor((Date.now() - this.state.bootedAt) / 1000);
  }

  private handle(line: string): void {
    let frame: { type?: string; id?: number; [k: string]: unknown };
    try {
      frame = JSON.parse(line) as typeof frame;
    } catch {
      this.reply({ type: 'error', code: 'parse', msg: 'Expected one JSON object per line.' });
      return;
    }

    switch (frame.type) {
      case 'ping':
        this.reply({ type: 'pong', id: frame.id, ts: frame.ts ?? Date.now() });
        return;

      case 'status.get':
        this.reply(this.statusFrame(frame.id));
        return;

      case 'servo.set': {
        const servo = String(frame.servo ?? '');
        const angle = Number(frame.angle ?? 90);
        if (!(servo in this.state.servos)) {
          this.reply({ type: 'error', id: frame.id, code: 'no_servo', msg: `Unknown servo "${servo}".` });
          return;
        }
        this.state.servos[servo] = clamp(angle, 0, 180);
        this.reply({ type: 'ack', id: frame.id, of: 'servo.set' });
        this.reply({
          type: 'event',
          event: 'servo.moved',
          data: { servo, angle: this.state.servos[servo] },
        });
        return;
      }

      case 'led.set':
        this.state.led = {
          r: clamp(Number(frame.r ?? 0), 0, 255),
          g: clamp(Number(frame.g ?? 0), 0, 255),
          b: clamp(Number(frame.b ?? 0), 0, 255),
        };
        this.reply({ type: 'ack', id: frame.id, of: 'led.set' });
        return;

      case 'expression.set':
        this.state.expression = String(frame.value ?? 'idle');
        this.reply({ type: 'ack', id: frame.id, of: 'expression.set' });
        this.reply({
          type: 'event',
          event: 'expression.changed',
          data: { value: this.state.expression },
        });
        return;

      case 'sound.play':
      case 'sound.stop':
        this.reply({ type: 'ack', id: frame.id, of: frame.type });
        return;

      case 'sensor.subscribe':
        this.reply({ type: 'ack', id: frame.id, of: 'sensor.subscribe' });
        return;

      case 'sys.reboot':
        this.reply({ type: 'ack', id: frame.id, of: 'sys.reboot' });
        this.schedule(() => {
          this.state.bootedAt = Date.now();
          this.emit('line', 'ESP-ROM:esp32c3-api1-20210207');
          this.emit('line', '{"type":"event","event":"ready"}');
        }, 400);
        return;

      case 'sys.info':
        this.reply(this.statusFrame(frame.id));
        return;

      default:
        this.reply({
          type: 'error',
          id: frame.id,
          code: 'unknown_type',
          msg: `Firmware 0.4.2 does not handle "${String(frame.type)}".`,
        });
    }
  }

  private statusFrame(id?: number) {
    return {
      type: 'status',
      id,
      device: 'mochi',
      status: {
        firmware: '0.4.2',
        board: 'esp32-c3',
        uptimeS: this.uptimeS(),
        freeHeap: 212_000 + Math.floor(Math.random() * 6000),
        cpuLoad: round(14 + Math.random() * 9, 1),
        tempC: round(38 + Math.sin(Date.now() / 30000) * 2.5, 1),
        batteryPct: Math.round(this.state.batteryPct),
        batteryMv: Math.round(3300 + this.state.batteryPct * 8),
        wifi: { connected: false },
        peripherals: {
          display: 'ok',
          servo_head_pan: 'ok',
          servo_head_tilt: 'ok',
          speaker: 'ok',
          microphone: 'ok',
          battery: 'ok',
          wifi: 'absent',
        },
      },
    };
  }

  private pushSensors(): void {
    this.state.batteryPct = Math.max(4, this.state.batteryPct - 0.01);
    const t = Date.now() / 1000;
    this.reply({
      type: 'sensor',
      t: this.uptimeS() * 1000,
      values: {
        battery: round(this.state.batteryPct, 1),
        tempC: round(38 + Math.sin(t / 30) * 2.5, 1),
        micLevel: round(8 + Math.abs(Math.sin(t * 1.7)) * 26 + Math.random() * 5, 1),
        heapKb: round((212_000 + Math.random() * 6000) / 1024, 1),
      },
    });
  }
}

function clamp(value: number, min: number, max: number): number {
  return Number.isFinite(value) ? Math.min(max, Math.max(min, value)) : min;
}

function round(value: number, digits: number): number {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}
