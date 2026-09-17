import type { TouchGesture } from '@/types';

/**
 * Dokunma tanıyıcı.
 *
 * Bu sınıf bilerek saf (pure) yazıldı: kendi zamanını okumaz, `now` dışarıdan
 * verilir ve hiçbir zamanlayıcı kurmaz. Sebebi çift yönlü:
 *   - Tarayıcıda test edilebilir (saat ilerletmek sadece sayı vermek demek).
 *   - Aynı mantık ESP32 firmware'ine `millis()` ile birebir taşınabilir;
 *     `delay()` ile ana döngüyü bloke eden bir tasarıma hiç yaklaşılmaz.
 *
 * Sıralama: basıldığında TOUCH_DOWN, bırakıldığında TOUCH_UP üretilir; tap
 * kararı ise ikinci dokunuş penceresi kapandıktan sonra verilir, çünkü tek
 * dokunuşla çift dokunuş ancak beklenerek ayrılabilir.
 */

export interface TouchConfig {
  /** Bu süreden kısa sinyaller titreşim (bounce) sayılır. */
  debounceMs: number;
  /** İkinci dokunuşun çift sayılması için üst sınır. */
  doubleTapWindowMs: number;
  /** Uzun basış eşiği. */
  longPressMs: number;
  /** Çok uzun basış eşiği — özel ekranı açar. */
  veryLongPressMs: number;
}

export const DEFAULT_TOUCH_CONFIG: TouchConfig = {
  debounceMs: 35,
  doubleTapWindowMs: 320,
  longPressMs: 700,
  veryLongPressMs: 2_200,
};

export class TouchRecognizer {
  private pressedAt: number | null = null;
  private lastReleaseAt: number | null = null;
  private pendingTap = false;
  /** Son kenarın zamanı. -Infinity: ilk dokunuş debounce'a takılmasın diye. */
  private lastEdgeAt = -Infinity;
  private longFired = false;
  private veryLongFired = false;

  private readonly config: TouchConfig;

  constructor(config: TouchConfig = DEFAULT_TOUCH_CONFIG) {
    this.config = config;
  }

  /** Sensör sinyalinin yükselen kenarı. */
  press(now: number): TouchGesture[] {
    // Titreşim bastırma: çok hızlı gelen kenar gerçek bir dokunuş değildir.
    if (now - this.lastEdgeAt < this.config.debounceMs) return [];
    if (this.pressedAt !== null) return [];

    this.lastEdgeAt = now;
    this.pressedAt = now;
    this.longFired = false;
    this.veryLongFired = false;
    return ['touch_down'];
  }

  /** Sensör sinyalinin düşen kenarı. */
  release(now: number): TouchGesture[] {
    if (this.pressedAt === null) return [];
    if (now - this.lastEdgeAt < this.config.debounceMs) return [];

    this.lastEdgeAt = now;
    this.pressedAt = null;

    const events: TouchGesture[] = ['touch_up'];

    // Uzun basışlar zaten basılı tutulurken bildirildi; bırakışta tap üretilmez.
    if (this.longFired || this.veryLongFired) {
      this.pendingTap = false;
      this.lastReleaseAt = null;
      return events;
    }

    const since = this.lastReleaseAt === null ? Infinity : now - this.lastReleaseAt;
    if (this.pendingTap && since <= this.config.doubleTapWindowMs) {
      this.pendingTap = false;
      this.lastReleaseAt = null;
      events.push('double_tap');
      return events;
    }

    this.pendingTap = true;
    this.lastReleaseAt = now;
    return events;
  }

  /**
   * Ana döngüden sürekli çağrılır (non-blocking).
   *
   * İki iş yapar: basılı tutma eşiklerini geçince uzun basışı bildirir, ve
   * çift dokunma penceresi kapanınca bekleyen tek dokunuşu serbest bırakır.
   */
  tick(now: number): TouchGesture[] {
    const events: TouchGesture[] = [];

    if (this.pressedAt !== null) {
      const held = now - this.pressedAt;
      if (!this.veryLongFired && held >= this.config.veryLongPressMs) {
        this.veryLongFired = true;
        events.push('very_long_press');
      } else if (!this.longFired && held >= this.config.longPressMs) {
        this.longFired = true;
        events.push('long_press');
      }
    }

    if (
      this.pendingTap &&
      this.lastReleaseAt !== null &&
      now - this.lastReleaseAt > this.config.doubleTapWindowMs
    ) {
      this.pendingTap = false;
      this.lastReleaseAt = null;
      events.push('single_tap');
    }

    return events;
  }

  /** Cihaz yeniden başladığında ya da durum sıfırlandığında. */
  reset(): void {
    this.pressedAt = null;
    this.lastReleaseAt = null;
    this.pendingTap = false;
    this.longFired = false;
    this.veryLongFired = false;
    this.lastEdgeAt = -Infinity;
  }

  get isPressed(): boolean {
    return this.pressedAt !== null;
  }
}

/** Her dokunuşun Elçin'de karşılığı olan tepki. */
export const TOUCH_LABEL: Record<TouchGesture, string> = {
  touch_down: 'Dokunuldu',
  touch_up: 'Bırakıldı',
  single_tap: 'Tek dokunuş',
  double_tap: 'Çift dokunuş',
  long_press: 'Uzun basış',
  very_long_press: 'Çok uzun basış',
};
