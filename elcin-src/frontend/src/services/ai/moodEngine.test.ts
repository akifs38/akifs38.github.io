import { describe, expect, it } from 'vitest';
import { animationForMood, blendMood, clamp01, coerceMood, inferMood } from './moodEngine';

describe('inferMood', () => {
  it('üzgün ifadeyi yakalar', () => {
    const result = inferMood('Bugün çok yorgunum, moralim bozuk.');
    expect(result.mood).toBe('sad');
    expect(result.intensity).toBeGreaterThan(0.5);
  });

  it('sevgi ifadesini üzüntüden ayırır', () => {
    expect(inferMood('Seni seviyorum ❤').mood).toBe('love');
  });

  it('heyecanı mutluluktan ayırır', () => {
    expect(inferMood('İnanmıyorum, sonunda başardım!').mood).toBe('excited');
  });

  it('sinyalsiz soruyu meraklı sayar', () => {
    expect(inferMood('Yarın hava nasıl olacak?').mood).toBe('curious');
  });

  it('sinyalsiz düz cümleyi normal bırakır', () => {
    expect(inferMood('Markete gittim.').mood).toBe('normal');
  });

  it('ünlem yoğunluğu şiddeti artırır ama ruh halini değiştirmez', () => {
    const calm = inferMood('mutluyum');
    const loud = inferMood('mutluyum!!!');
    expect(loud.mood).toBe(calm.mood);
    expect(loud.intensity).toBeGreaterThan(calm.intensity);
  });

  it('yoğunluk her zaman 0–1 aralığında kalır', () => {
    const extreme = inferMood('HARİKA MUHTEŞEM ÇOK MUTLUYUM BAŞARDIM!!!!!!!!!!');
    expect(extreme.intensity).toBeLessThanOrEqual(1);
    expect(extreme.intensity).toBeGreaterThanOrEqual(0);
  });
});

describe('blendMood', () => {
  it('aynı ruh hali sürerse yoğunluğu pekiştirir', () => {
    const blended = blendMood('happy', { mood: 'happy', intensity: 0.5, reason: 'x' });
    expect(blended.intensity).toBeCloseTo(0.6);
  });

  it('zayıf sinyal güçlü önceki ruh halini devirmez', () => {
    const blended = blendMood('love', { mood: 'normal', intensity: 0.3, reason: 'x' });
    expect(blended.mood).toBe('love');
  });

  it('güçlü sinyal ruh halini değiştirir', () => {
    const blended = blendMood('happy', { mood: 'sad', intensity: 0.9, reason: 'x' });
    expect(blended.mood).toBe('sad');
  });
});

describe('coerceMood', () => {
  it('geçerli değeri geçirir', () => {
    expect(coerceMood('excited')).toBe('excited');
  });

  it('çöp değeri yedeğe düşürür', () => {
    expect(coerceMood('kahve')).toBe('normal');
    expect(coerceMood(undefined, 'happy')).toBe('happy');
    expect(coerceMood(42)).toBe('normal');
  });
});

describe('animationForMood', () => {
  it('her ruh haline bir animasyon karşılık gelir', () => {
    expect(animationForMood('love')).toBe('heart');
    expect(animationForMood('sleepy')).toBe('sleep');
  });
});

describe('clamp01', () => {
  it('aralık dışını kırpar', () => {
    expect(clamp01(-3)).toBe(0);
    expect(clamp01(9)).toBe(1);
    expect(clamp01(Number.NaN)).toBe(0);
  });
});
