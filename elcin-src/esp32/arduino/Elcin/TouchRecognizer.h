#pragma once

// ÜRETİLMİŞ DOSYA — elle düzenleme.
//
// Kaynak: esp32/include/TouchRecognizer.h
// Yeniden üret: cd esp32 && python3 tools/make_ino.py
//
// Değişiklik yapman gereken yer yukarıdaki kaynak dosya; buradaki düzenleme
// bir sonraki üretimde kaybolur.

/**
 * Dokunma tanıyıcı.
 *
 * Web tarafındaki TouchRecognizer'ın birebir karşılığı — ve zaten oradaki
 * sınıf bu gün için öyle yazılmıştı: kendi saatini okumaz, `now` dışarıdan
 * verilir, hiçbir zamanlayıcı kurmaz.
 *
 * Bunun firmware'deki bedeli sıfır, kazancı büyük:
 *   - `delay()` yok. Ana döngü hiçbir yerde bloke olmaz, dolayısıyla dokunma
 *     beklerken ekran donmaz, WebSocket kopmaz, watchdog aç kalmaz.
 *   - Masaüstünde test edilebilir. Saati ilerletmek sadece sayı vermek demek;
 *     700 ms'lik uzun basışı sınamak için 700 ms beklemek gerekmiyor.
 *
 * Sıralama: basıldığında TouchDown, bırakıldığında TouchUp üretilir. Tek/çift
 * dokunuş kararı ise ikinci dokunuş penceresi kapandıktan sonra verilir —
 * tek ile çift ancak beklenerek ayrılır.
 */

#include <cstdint>

namespace elcin {

enum class Gesture : uint8_t {
  None,
  TouchDown,
  TouchUp,
  SingleTap,
  DoubleTap,
  LongPress,
  VeryLongPress,
};

const char* gestureName(Gesture gesture);

struct TouchConfig {
  uint32_t debounceMs;
  uint32_t doubleTapWindowMs;
  uint32_t longPressMs;
  uint32_t veryLongPressMs;
};

TouchConfig defaultTouchConfig();

/**
 * Tek bir çağrıda en çok iki olay çıkabilir (ör. TouchUp + DoubleTap), bu
 * yüzden dinamik ayırma yerine sabit boyutlu küçük bir sonuç kullanılıyor:
 * heap yok, sürpriz yok.
 */
struct GestureBatch {
  Gesture items[2];
  uint8_t count;

  GestureBatch() : items{Gesture::None, Gesture::None}, count(0) {}
  void push(Gesture gesture) {
    if (count < 2) items[count++] = gesture;
  }
  bool contains(Gesture gesture) const {
    for (uint8_t i = 0; i < count; ++i)
      if (items[i] == gesture) return true;
    return false;
  }
};

class TouchRecognizer {
 public:
  explicit TouchRecognizer(TouchConfig config = defaultTouchConfig());

  /** Sensör sinyalinin yükselen kenarı. */
  GestureBatch press(uint32_t now);
  /** Sensör sinyalinin düşen kenarı. */
  GestureBatch release(uint32_t now);
  /** Ana döngüden sürekli çağrılır; hiçbir şey beklemez. */
  GestureBatch tick(uint32_t now);

  void reset();
  bool isPressed() const { return pressed_; }

 private:
  TouchConfig config_;
  bool pressed_;
  uint32_t pressedAt_;
  bool pendingTap_;
  uint32_t lastReleaseAt_;
  bool hasLastRelease_;
  /**
   * Son kenarın zamanı. `hasEdge_` olmadan ilk dokunuş debounce'a takılırdı:
   * millis() açılışta 0'dan başlar ve "0 - 0 < 35" doğru çıkar. (Web tarafında
   * bu tam olarak böyle bir hataya yol açmıştı.)
   */
  uint32_t lastEdgeAt_;
  bool hasEdge_;
  bool longFired_;
  bool veryLongFired_;
};

}  // namespace elcin
