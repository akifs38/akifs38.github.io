import { describe, expect, it } from 'vitest';
import { MOODS, ANIMATIONS } from '@/types';
import { FACES, OVERLAYS, lerpFace, mouthPath } from './faceGeometry';

describe('FACES', () => {
  it('her ruh halinin bir yüzü vardır', () => {
    for (const mood of MOODS) {
      expect(FACES[mood]).toBeDefined();
      expect(FACES[mood].eye.width).toBeGreaterThan(0);
    }
  });

  it('üzgün yüzün ağzı aşağı kıvrılır, mutlu yüzünki yukarı', () => {
    expect(FACES.sad.mouth.curve).toBeLessThan(0);
    expect(FACES.happy.mouth.curve).toBeGreaterThan(0);
  });

  it('uykulu gözler neredeyse kapalıdır', () => {
    expect(FACES.sleepy.eye.height).toBeLessThan(FACES.normal.eye.height / 2);
  });

  it('sevgi hâlinde yanaklar en çok kızarır', () => {
    const others = MOODS.filter((mood) => mood !== 'love').map((mood) => FACES[mood].blush);
    expect(FACES.love.blush).toBeGreaterThan(Math.max(...others));
  });
});

describe('OVERLAYS', () => {
  it('her animasyonun bir karşılığı vardır', () => {
    for (const animation of ANIMATIONS) {
      expect(OVERLAYS[animation]).toBeDefined();
    }
  });

  it('uyku ve göz kırpma gözleri kapatır', () => {
    expect(OVERLAYS.sleep.eyesClosed).toBe(true);
    expect(OVERLAYS.blink.eyesClosed).toBe(true);
  });
});

describe('lerpFace', () => {
  it('t=0 kaynağı, t=1 hedefi verir', () => {
    expect(lerpFace(FACES.normal, FACES.happy, 0).mouth.curve).toBe(FACES.normal.mouth.curve);
    expect(lerpFace(FACES.normal, FACES.happy, 1).mouth.curve).toBe(FACES.happy.mouth.curve);
  });

  it('yarı yolda iki değerin ortasındadır', () => {
    const mid = lerpFace(FACES.sad, FACES.happy, 0.5);
    const expected = (FACES.sad.mouth.curve + FACES.happy.mouth.curve) / 2;
    expect(mid.mouth.curve).toBeCloseTo(expected);
  });
});

describe('mouthPath', () => {
  it('kapalı ağız tek yay üretir', () => {
    const path = mouthPath({ curve: 5, width: 20, open: 0, offsetY: 0 });
    expect(path.startsWith('M')).toBe(true);
    expect(path).not.toContain('Z');
  });

  it('açık ağız kapalı bir şekil üretir', () => {
    const path = mouthPath({ curve: 5, width: 20, open: 10, offsetY: 0 });
    expect(path.endsWith('Z')).toBe(true);
  });

  it('geometri sayısal kalır, NaN üretmez', () => {
    const path = mouthPath(FACES.surprised.mouth);
    expect(path).not.toContain('NaN');
  });
});
