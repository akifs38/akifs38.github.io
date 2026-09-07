import type { InboundFrame, OutboundFrame } from '@/types';

/** Encodes one frame as an NDJSON line, newline included. */
export function encodeFrame(frame: OutboundFrame): string {
  return `${JSON.stringify(frame)}\n`;
}

export interface DecodeResult {
  /** Frames that parsed as protocol JSON. */
  frames: InboundFrame[];
  /** Lines that were not protocol JSON — plain printf() output, boot ROM noise. */
  text: string[];
}

const KNOWN_TYPES = new Set([
  'pong',
  'status',
  'log',
  'sensor',
  'ack',
  'error',
  'event',
]);

/**
 * A serial line is either a protocol frame or ordinary firmware output. Both are
 * useful, so neither is thrown away: unparsable lines surface in the monitor as
 * device text instead of being silently dropped.
 */
export function decodeLine(line: string): DecodeResult {
  const trimmed = line.trim();
  if (!trimmed) return { frames: [], text: [] };

  if (!trimmed.startsWith('{')) {
    return { frames: [], text: [trimmed] };
  }

  try {
    const parsed: unknown = JSON.parse(trimmed);
    if (
      typeof parsed === 'object' &&
      parsed !== null &&
      'type' in parsed &&
      typeof (parsed as { type: unknown }).type === 'string' &&
      KNOWN_TYPES.has((parsed as { type: string }).type)
    ) {
      return { frames: [parsed as InboundFrame], text: [] };
    }
    return { frames: [], text: [trimmed] };
  } catch {
    return { frames: [], text: [trimmed] };
  }
}

/** Splits an incoming chunk into complete lines, returning the trailing partial. */
export function splitLines(buffer: string): { lines: string[]; rest: string } {
  const parts = buffer.split(/\r?\n/);
  const rest = parts.pop() ?? '';
  return { lines: parts, rest };
}
