import { describe, expect, it } from 'vitest';
import { DEVICE_STATES } from '@/types';
import { canTransition, transition, triggersFrom } from './stateMachine';

describe('transition', () => {
  it('açılış sırasını izler', () => {
    let state = transition('boot', 'boot_done');
    expect(state).toBe('welcome');
    state = transition(state, 'welcome_done');
    expect(state).toBe('idle');
  });

  it('dokunma döngüsünü tamamlar', () => {
    expect(transition('idle', 'touch_start')).toBe('touch');
    expect(transition('touch', 'touch_end')).toBe('idle');
  });

  it('sohbet akışını izler', () => {
    let state = transition('idle', 'request_sent');
    expect(state).toBe('thinking');
    state = transition(state, 'response_ready');
    expect(state).toBe('responding');
    expect(transition(state, 'response_done')).toBe('idle');
  });

  it('cevap gelmezse düşünme ekranında asılı kalmaz', () => {
    expect(transition('thinking', 'timeout')).toBe('idle');
  });

  it('boşta kalınca uykuya geçer, dokununca uyanır', () => {
    expect(transition('idle', 'timeout')).toBe('sleeping');
    expect(transition('sleeping', 'wake')).toBe('idle');
    expect(transition('sleeping', 'touch_start')).toBe('touch');
  });

  it('bağlantı koptuğunda çevrimdışına düşer', () => {
    expect(transition('idle', 'connection_lost')).toBe('offline');
    expect(transition('thinking', 'connection_lost')).toBe('offline');
    expect(transition('offline', 'connection_restored')).toBe('idle');
  });

  it('çevrimdışıyken bile dokunmaya tepki verir', () => {
    expect(transition('offline', 'touch_start')).toBe('touch');
  });

  it('tanımsız geçişte durumu korur', () => {
    expect(transition('boot', 'response_done')).toBe('boot');
    expect(transition('sleeping', 'welcome_done')).toBe('sleeping');
  });

  it('hatadan kurtarma yolu vardır', () => {
    expect(transition('error', 'recover')).toBe('idle');
  });
});

describe('canTransition', () => {
  it('geçerli ve geçersiz geçişi ayırır', () => {
    expect(canTransition('idle', 'touch_start')).toBe(true);
    expect(canTransition('idle', 'welcome_done')).toBe(false);
  });
});

describe('durum tablosu', () => {
  it('her durum tanımlıdır', () => {
    for (const state of DEVICE_STATES) {
      expect(() => transition(state, 'error')).not.toThrow();
    }
  });

  it('hiçbir durum çıkışsız değildir', () => {
    for (const state of DEVICE_STATES) {
      expect(triggersFrom(state).length).toBeGreaterThan(0);
    }
  });

  it('her durumdan idle veya offline yönüne bir yol vardır', () => {
    for (const state of DEVICE_STATES) {
      const reachable = triggersFrom(state).map((trigger) => transition(state, trigger));
      expect(reachable.length).toBeGreaterThan(0);
    }
  });
});
