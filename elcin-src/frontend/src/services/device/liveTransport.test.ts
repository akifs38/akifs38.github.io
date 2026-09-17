import { describe, expect, it } from 'vitest';
import { parseEvent } from './liveTransport';

describe('parseEvent', () => {
  it('dokunma olayını okur', () => {
    const event = parseEvent(
      JSON.stringify({ type: 'device_event', event: 'touch', touch: 'double_tap', at: '2026-01-01T00:00:00Z' }),
    );
    expect(event).toEqual({
      type: 'device_event',
      event: 'touch',
      touch: 'double_tap',
      at: '2026-01-01T00:00:00Z',
    });
  });

  it('heartbeat olayını okur', () => {
    const event = parseEvent(
      JSON.stringify({ type: 'device_event', event: 'heartbeat', status: { deviceId: 'elcin-001' } }),
    );
    expect(event?.event).toBe('heartbeat');
  });

  it('zaman damgası yoksa kendisi üretir', () => {
    const event = parseEvent(JSON.stringify({ type: 'device_event', event: 'connection', online: true }));
    expect(event?.at).toBeTruthy();
  });

  it('bozuk JSON düşürülür, hata fırlatmaz', () => {
    expect(() => parseEvent('{bozuk')).not.toThrow();
    expect(parseEvent('{bozuk')).toBeNull();
  });

  it('yabancı mesaj türünü yok sayar', () => {
    expect(parseEvent(JSON.stringify({ type: 'chat', text: 'merhaba' }))).toBeNull();
  });

  it('eksik alanlı olayı kabul etmez', () => {
    expect(parseEvent(JSON.stringify({ type: 'device_event', event: 'touch' }))).toBeNull();
    expect(parseEvent(JSON.stringify({ type: 'device_event', event: 'log' }))).toBeNull();
  });

  it('string olmayan girdiyi reddeder', () => {
    expect(parseEvent(42)).toBeNull();
    expect(parseEvent(null)).toBeNull();
  });

  it('bilinmeyen olay adını yok sayar', () => {
    expect(parseEvent(JSON.stringify({ type: 'device_event', event: 'dans' }))).toBeNull();
  });
});
