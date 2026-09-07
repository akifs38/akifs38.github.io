import type { Expression, OutboundFrame } from '@/types';

let nextId = 1;
export function allocateFrameId(): number {
  nextId = nextId >= 0xffff ? 1 : nextId + 1;
  return nextId;
}

/** Typed constructors so callers never hand-build a frame object. */
export const frames = {
  ping(): OutboundFrame {
    return { type: 'ping', ts: Date.now(), id: allocateFrameId() };
  },
  statusGet(): OutboundFrame {
    return { type: 'status.get', id: allocateFrameId() };
  },
  servo(servo: string, angle: number, ms?: number): OutboundFrame {
    return { type: 'servo.set', servo, angle: Math.round(angle), ms, id: allocateFrameId() };
  },
  led(r: number, g: number, b: number, brightness?: number): OutboundFrame {
    return { type: 'led.set', r, g, b, brightness, id: allocateFrameId() };
  },
  expression(value: Expression): OutboundFrame {
    return { type: 'expression.set', value, id: allocateFrameId() };
  },
  soundPlay(clip: string, volume?: number): OutboundFrame {
    return { type: 'sound.play', clip, volume, id: allocateFrameId() };
  },
  soundStop(): OutboundFrame {
    return { type: 'sound.stop', id: allocateFrameId() };
  },
  subscribe(sensors: string[], intervalMs: number): OutboundFrame {
    return { type: 'sensor.subscribe', sensors, intervalMs, id: allocateFrameId() };
  },
  reboot(): OutboundFrame {
    return { type: 'sys.reboot', id: allocateFrameId() };
  },
};
