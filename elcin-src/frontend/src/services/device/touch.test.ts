import { describe, expect, it } from 'vitest';
import { DEFAULT_TOUCH_CONFIG, TouchRecognizer } from './touch';

const { doubleTapWindowMs, longPressMs, veryLongPressMs, debounceMs } = DEFAULT_TOUCH_CONFIG;

describe('TouchRecognizer', () => {
  it('basma ve bırakma kenarlarını bildirir', () => {
    const touch = new TouchRecognizer();
    expect(touch.press(0)).toEqual(['touch_down']);
    expect(touch.release(100)).toEqual(['touch_up']);
  });

  it('tek dokunuşu pencere kapandıktan sonra üretir', () => {
    const touch = new TouchRecognizer();
    touch.press(0);
    touch.release(80);

    // Pencere daha açıkken tek dokunuş erken bildirilmemeli.
    expect(touch.tick(80 + doubleTapWindowMs - 10)).toEqual([]);
    expect(touch.tick(80 + doubleTapWindowMs + 10)).toEqual(['single_tap']);
  });

  it('tek dokunuşu yalnızca bir kez üretir', () => {
    const touch = new TouchRecognizer();
    touch.press(0);
    touch.release(80);
    touch.tick(1_000);
    expect(touch.tick(2_000)).toEqual([]);
  });

  it('çift dokunuşu tanır ve tek dokunuş üretmez', () => {
    const touch = new TouchRecognizer();
    touch.press(0);
    touch.release(60);
    touch.press(160);
    const events = touch.release(220);

    expect(events).toContain('double_tap');
    expect(touch.tick(5_000)).toEqual([]);
  });

  it('pencere dışındaki ikinci dokunuşu çift saymaz', () => {
    const touch = new TouchRecognizer();
    touch.press(0);
    touch.release(60);
    touch.tick(60 + doubleTapWindowMs + 10); // tek dokunuş burada çıkar
    touch.press(1_000);
    expect(touch.release(1_060)).not.toContain('double_tap');
  });

  it('uzun basışı basılıyken bildirir', () => {
    const touch = new TouchRecognizer();
    touch.press(0);
    expect(touch.tick(longPressMs - 50)).toEqual([]);
    expect(touch.tick(longPressMs + 10)).toEqual(['long_press']);
  });

  it('uzun basışı tekrar tekrar bildirmez', () => {
    const touch = new TouchRecognizer();
    touch.press(0);
    touch.tick(longPressMs + 10);
    expect(touch.tick(longPressMs + 200)).toEqual([]);
  });

  it('çok uzun basışı ayrı bir olay olarak verir', () => {
    const touch = new TouchRecognizer();
    touch.press(0);
    touch.tick(longPressMs + 10);
    expect(touch.tick(veryLongPressMs + 10)).toEqual(['very_long_press']);
  });

  it('uzun basıştan sonra tap üretmez', () => {
    const touch = new TouchRecognizer();
    touch.press(0);
    touch.tick(longPressMs + 10);
    expect(touch.release(longPressMs + 100)).toEqual(['touch_up']);
    expect(touch.tick(10_000)).toEqual([]);
  });

  it('titreşen sinyali tek dokunuş sayar', () => {
    const touch = new TouchRecognizer();
    expect(touch.press(0)).toEqual(['touch_down']);
    // Sensörün zıplaması: debounce penceresi içindeki kenarlar yutulur.
    expect(touch.release(debounceMs - 20)).toEqual([]);
    expect(touch.press(debounceMs - 10)).toEqual([]);
    expect(touch.release(200)).toEqual(['touch_up']);
  });

  it('basılmadan gelen bırakmayı yok sayar', () => {
    const touch = new TouchRecognizer();
    expect(touch.release(500)).toEqual([]);
  });

  it('çift basmayı yok sayar', () => {
    const touch = new TouchRecognizer();
    touch.press(0);
    expect(touch.press(500)).toEqual([]);
  });

  it('reset sonrası temiz başlar', () => {
    const touch = new TouchRecognizer();
    touch.press(0);
    touch.reset();
    expect(touch.isPressed).toBe(false);
    expect(touch.tick(10_000)).toEqual([]);
    expect(touch.press(10_000)).toEqual(['touch_down']);
  });

  it('isPressed basılı tutulduğu sürece doğrudur', () => {
    const touch = new TouchRecognizer();
    touch.press(0);
    expect(touch.isPressed).toBe(true);
    touch.release(100);
    expect(touch.isPressed).toBe(false);
  });
});
