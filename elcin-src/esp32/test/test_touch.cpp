#include "tiny_test.h"
#include "TouchRecognizer.h"

using namespace elcin;

/*
  Dokunma testleri, web tarafındaki touch.test.ts ile aynı senaryoları koşar.
  İki uçtaki tanıyıcının aynı davranması, "web'de çift dokunuş çalışıyor ama
  cihazda çalışmıyor" tipi farkların tek panzehiri.
*/
void testTouch() {
  SUITE("TouchRecognizer");
  const auto cfg = defaultTouchConfig();

  {  // kenarlar bildirilir
    TouchRecognizer touch;
    auto down = touch.press(0);
    CHECK_EQ(down.count, 1);
    CHECK(down.contains(Gesture::TouchDown));
    auto up = touch.release(100);
    CHECK(up.contains(Gesture::TouchUp));
  }

  {  // millis() 0'dan başlar; ilk dokunuş debounce'a takılmamalı
    TouchRecognizer touch;
    CHECK(touch.press(0).contains(Gesture::TouchDown));
  }

  {  // tek dokunuş pencere kapanınca çıkar
    TouchRecognizer touch;
    touch.press(0);
    touch.release(80);
    CHECK_EQ(touch.tick(80 + cfg.doubleTapWindowMs - 10).count, 0);
    CHECK(touch.tick(80 + cfg.doubleTapWindowMs + 10).contains(Gesture::SingleTap));
  }

  {  // tek dokunuş yalnızca bir kez
    TouchRecognizer touch;
    touch.press(0);
    touch.release(80);
    touch.tick(1000);
    CHECK_EQ(touch.tick(2000).count, 0);
  }

  {  // çift dokunuş; ardından tek dokunuş üretilmez
    TouchRecognizer touch;
    touch.press(0);
    touch.release(60);
    touch.press(160);
    auto events = touch.release(220);
    CHECK(events.contains(Gesture::DoubleTap));
    CHECK_EQ(touch.tick(5000).count, 0);
  }

  {  // pencere dışındaki ikinci dokunuş çift sayılmaz
    TouchRecognizer touch;
    touch.press(0);
    touch.release(60);
    touch.tick(60 + cfg.doubleTapWindowMs + 10);
    touch.press(1000);
    CHECK(!touch.release(1060).contains(Gesture::DoubleTap));
  }

  {  // uzun basış basılıyken bildirilir, tekrarlanmaz
    TouchRecognizer touch;
    touch.press(0);
    CHECK_EQ(touch.tick(cfg.longPressMs - 50).count, 0);
    CHECK(touch.tick(cfg.longPressMs + 10).contains(Gesture::LongPress));
    CHECK_EQ(touch.tick(cfg.longPressMs + 200).count, 0);
  }

  {  // çok uzun basış ayrı olay
    TouchRecognizer touch;
    touch.press(0);
    touch.tick(cfg.longPressMs + 10);
    CHECK(touch.tick(cfg.veryLongPressMs + 10).contains(Gesture::VeryLongPress));
  }

  {  // uzun basıştan sonra tap yok
    TouchRecognizer touch;
    touch.press(0);
    touch.tick(cfg.longPressMs + 10);
    auto up = touch.release(cfg.longPressMs + 100);
    CHECK_EQ(up.count, 1);
    CHECK(up.contains(Gesture::TouchUp));
    CHECK_EQ(touch.tick(10000).count, 0);
  }

  {  // titreşen sensör tek dokunuş sayılır
    TouchRecognizer touch;
    CHECK(touch.press(0).contains(Gesture::TouchDown));
    CHECK_EQ(touch.release(cfg.debounceMs - 20).count, 0);
    CHECK_EQ(touch.press(cfg.debounceMs - 10).count, 0);
    CHECK(touch.release(200).contains(Gesture::TouchUp));
  }

  {  // basılmadan gelen bırakma ve çift basma yok sayılır
    TouchRecognizer touch;
    CHECK_EQ(touch.release(500).count, 0);
    touch.press(600);
    CHECK_EQ(touch.press(900).count, 0);
  }

  {  // reset sonrası temiz başlangıç
    TouchRecognizer touch;
    touch.press(0);
    touch.reset();
    CHECK(!touch.isPressed());
    CHECK_EQ(touch.tick(10000).count, 0);
    CHECK(touch.press(10000).contains(Gesture::TouchDown));
  }

  {  // isPressed doğru izlenir
    TouchRecognizer touch;
    touch.press(0);
    CHECK(touch.isPressed());
    touch.release(100);
    CHECK(!touch.isPressed());
  }
}
