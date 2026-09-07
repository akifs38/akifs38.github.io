import type { ConnectionInfo, TransportCapabilities } from '@/types';
import { splitLines } from '../protocol/codec';
import { TransportEmitter, type ConnectOptions, type Transport } from './Transport';

export function isWebSerialSupported(): boolean {
  return typeof navigator !== 'undefined' && 'serial' in navigator;
}

/**
 * Web Serial. Real hardware only — Chrome and Edge on desktop, over HTTPS or
 * localhost. There is no fallback path: if the API is missing the studio says
 * so rather than pretending to connect.
 */
export class SerialTransport extends TransportEmitter implements Transport {
  readonly id = 'serial' as const;
  readonly label = 'USB serial';

  private port: SerialPort | null = null;
  private reader: ReadableStreamDefaultReader<string> | null = null;
  private writer: WritableStreamDefaultWriter<string> | null = null;
  private closers: Array<() => Promise<void>> = [];
  private buffer = '';
  private closing = false;

  get capabilities(): TransportCapabilities {
    const supported = isWebSerialSupported();
    return {
      available: supported,
      unavailableReason: supported
        ? undefined
        : 'This browser has no Web Serial API. Use Chrome or Edge on desktop.',
      supportsBinaryUpload: true,
      supportsReset: true,
    };
  }

  isOpen(): boolean {
    return this.port !== null && !this.closing;
  }

  async connect(options: ConnectOptions = {}): Promise<ConnectionInfo> {
    if (!isWebSerialSupported()) {
      throw new Error('This browser has no Web Serial API. Use Chrome or Edge on desktop.');
    }
    const baudRate = options.baudRate ?? 115200;

    const port = await navigator.serial.requestPort();
    await port.open({ baudRate, dataBits: 8, stopBits: 1, parity: 'none', bufferSize: 4096 });

    this.port = port;
    this.closing = false;
    this.buffer = '';

    // TextDecoderStream declares its sink as BufferSource; the serial source emits
    // Uint8Array, which satisfies it at runtime but not structurally.
    const decoder = new TextDecoderStream();
    const decoderSink = decoder.writable as unknown as WritableStream<Uint8Array>;
    const readableClosed = port.readable!.pipeTo(decoderSink).catch(() => undefined);
    this.reader = decoder.readable.getReader();
    this.closers.push(async () => {
      await readableClosed;
    });

    const encoder = new TextEncoderStream();
    // Web Serial types the sink as BufferSource; TextEncoderStream emits Uint8Array,
    // which is a BufferSource but not structurally assignable in the other direction.
    const sink = port.writable as unknown as WritableStream<Uint8Array>;
    const writableClosed = encoder.readable.pipeTo(sink).catch(() => undefined);
    this.writer = encoder.writable.getWriter();
    this.closers.push(async () => {
      await writableClosed;
    });

    const usb = port.getInfo();
    const info: ConnectionInfo = {
      transport: 'serial',
      portLabel: describePort(usb),
      baudRate,
      usbVendorId: usb.usbVendorId,
      usbProductId: usb.usbProductId,
      connectedAt: Date.now(),
    };

    void this.readLoop();
    this.emit('open', info);
    return info;
  }

  private async readLoop(): Promise<void> {
    const reader = this.reader;
    if (!reader) return;
    try {
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        if (!value) continue;
        this.buffer += value;
        const { lines, rest } = splitLines(this.buffer);
        this.buffer = rest;
        for (const line of lines) this.emit('line', line);
      }
    } catch (error) {
      if (!this.closing) {
        this.emit('error', error instanceof Error ? error : new Error(String(error)));
      }
    } finally {
      if (!this.closing) await this.disconnect();
    }
  }

  async send(payload: string): Promise<void> {
    if (!this.writer) throw new Error('Serial port is not open.');
    await this.writer.write(payload);
  }

  async disconnect(): Promise<void> {
    if (this.closing) return;
    this.closing = true;

    try {
      await this.reader?.cancel();
    } catch {
      /* the stream may already be torn down */
    }
    try {
      this.reader?.releaseLock();
    } catch {
      /* already released */
    }
    try {
      await this.writer?.close();
    } catch {
      /* already closed */
    }

    for (const close of this.closers) await close();
    this.closers = [];

    try {
      await this.port?.close();
    } catch {
      /* already closed */
    }

    this.reader = null;
    this.writer = null;
    this.port = null;
    this.emit('close', 'Port closed.');
  }
}

function describePort(info: SerialPortInfo): string {
  if (info.usbVendorId === undefined) return 'Serial port';
  const vid = info.usbVendorId.toString(16).padStart(4, '0');
  const pid = (info.usbProductId ?? 0).toString(16).padStart(4, '0');
  if (info.usbVendorId === 0x303a) return `Espressif USB ${vid}:${pid}`;
  return `USB ${vid}:${pid}`;
}
