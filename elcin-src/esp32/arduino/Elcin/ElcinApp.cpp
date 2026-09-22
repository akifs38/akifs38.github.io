// ÜRETİLMİŞ DOSYA — elle düzenleme.
//
// Kaynak: esp32/src/app/ElcinApp.cpp
// Yeniden üret: cd esp32 && python3 tools/make_ino.py
//
// Değişiklik yapman gereken yer yukarıdaki kaynak dosya; buradaki düzenleme
// bir sonraki üretimde kaybolur.

/**
 * Elçin — uygulama katmanı.
 *
 * Burası firmware'in orkestrasyonu. Giriş noktasından (setup/loop) ayrı
 * tutuluyor, çünkü Elçin iki farklı kabukla derleniyor: PlatformIO'da
 * src/main.cpp, Arduino IDE'de Elcin.ino. İkisi de yalnızca bu dosyadaki
 * appSetup/appLoop çağırıyor; böylece iş mantığı tek nüsha kalıyor.
 *
 * Ana döngü hiçbir yerde beklemez. `delay()` yalnızca watchdog'a nefes
 * aldırmak için 1 ms olarak geçer; animasyon, dokunma, ağ ve ekran hepsi
 * millis() tabanlı zamanlayıcılarla sırayla ilerler. Bir iş uzarsa diğerleri
 * gecikir ama durmaz.
 *
 * Sorumluluk dağılımı:
 *   src/core  → taşınabilir beyin (durum, dokunma, yüz, animasyon, protokol)
 *   src/hw    → donanım (ekran, sensör, Wi-Fi, OTA, NVS)
 *   burası    → ikisini birbirine bağlayan ince kablo
 */

#include <Arduino.h>
#include <cstring>
#include <esp_task_wdt.h>

#include "AnimationEngine.h"
#include "BootSequence.h"
#include "Canvas.h"
#include "DeviceState.h"
#include "ElcinConfig.h"
#include "FaceEngine.h"
#include "Protocol.h"
#include "Text.h"
#include "Display.h"
#include "Net.h"
#include "Ota.h"
#include "Settings.h"
#include "TouchInput.h"
#include "ElcinApp.h"

using namespace elcin;

namespace {

Settings gSettings;
Display gDisplay;
TouchInput gTouch;
Net gNetwork;
AnimationEngine gAnimation;
Canvas gCanvas;

State gState = State::Boot;
uint32_t gStateSince = 0;
uint32_t gBootStartedAt = 0;
uint32_t gLastFrameAt = 0;
uint32_t gLastHeartbeatAt = 0;
uint32_t gLastInteractionAt = 0;
bool gFirstBoot = false;
bool gHealthyConfirmed = false;

/** Ekranda gösterilen geçici mesaj (sunucudan gelen "message" komutu). */
char gScreenMessage[96] = {0};
uint32_t gScreenMessageUntil = 0;

/*
  Yerel cevaplar.

  Elçin'in buluta bağlı olmadan da söyleyecek sözü var. Tek bir cümleyi
  tekrarlamak onu bir düğmeye çeviriyordu; sırayla dönen birkaç varyant
  canlı tutuyor.
*/
const char* kTapLines[] = {
    "Buradayım {{USER}}.",
    "Efendim?",
    "Buradayım.",
    "Seni duyuyorum.",
};
const char* kLongPressLines[] = {
    "Bir şey mi oldu?",
    "Anlat bakalım.",
    "Dinliyorum.",
};
uint8_t gTapLine = 0;
uint8_t gLongLine = 0;

/*
  Bağlantı kopma mesajı.

  Bu cümle YALNIZCA bağlanacak bir sunucu tanımlıyken ve bağlantı koptuğunda,
  bir kez gösterilir.

  Önceden her dokunuşta gösteriliyordu ve "Buradayım."ın üstüne yazıyordu:
  Gülçin Elçin'e dokunuyor, Elçin ona internetten şikâyet ediyordu. Üstelik
  sunucu hiç tanımlı değilken bile — olmayan bir şeyin yokluğundan. Elçin'in
  ağ altyapısı hakkında konuşması gereken tek an, gerçekten bir şey
  kaybettiği andır.
*/
const char* kConnectionLost = "Bağlantım koptu. Ama buradayım.";
bool gWasOnline = false;

/** Tanışma sekansının tekrar oynatılması (çok uzun basış). */
bool gIntroPlaying = false;
uint32_t gIntroStartedAt = 0;

/** "{{USER}}" yer tutucusunu kullanıcının adıyla doldurur. */
void fillUserName(const char* templ, char* out, size_t capacity) {
  const String name = gSettings.userName();
  size_t at = 0;
  for (const char* p = templ; *p != '\0' && at < capacity - 1;) {
    if (strncmp(p, "{{USER}}", 8) == 0) {
      for (const char* n = name.c_str(); *n != '\0' && at < capacity - 1; ++n) {
        out[at++] = *n;
      }
      p += 8;
      continue;
    }
    out[at++] = *p++;
  }
  out[at] = '\0';
}

void setState(State next, uint32_t now) {
  if (next == gState) return;
  gState = next;
  gStateSince = now;
  gNetwork.sendState(next);
}

void fire(Trigger trigger, uint32_t now) {
  const State next = transition(gState, trigger);
  if (next != gState) setState(next, now);
}

/** Geçici bir mesajı ekrana koyar; süresi dolunca yüz geri gelir. */
void showMessage(const char* text, uint32_t now, uint32_t durationMs = 4000) {
  strncpy(gScreenMessage, text, sizeof(gScreenMessage) - 1);
  gScreenMessage[sizeof(gScreenMessage) - 1] = '\0';
  gScreenMessageUntil = now + durationMs;
}

/**
 * Dokunma davranışları (17. madde).
 *
 * Elçin'in cihazdaki tepkisi, web arayüzündeki tepkisiyle aynı: tek dokunuş
 * selam, çift dokunuş kahkaha, uzun basış merak, çok uzun basış sevgi.
 */
void handleGesture(Gesture gesture, uint32_t now) {
  gLastInteractionAt = now;
  // Sensör getirirken tek teşhis yolu bu: cihaz sessiz kalırsa sorunun
  // pinde mi tanıyıcıda mı olduğunu seri çıktı söylüyor.
  Serial.printf("[elcin] dokunma: %s\n", gestureName(gesture));
  gNetwork.sendTouch(gesture);

  switch (gesture) {
    case Gesture::TouchDown:
      fire(Trigger::TouchStart, now);
      break;

    case Gesture::SingleTap: {
      gAnimation.play(Animation::Smile, now);
      char line[64];
      const uint8_t count = sizeof(kTapLines) / sizeof(kTapLines[0]);
      fillUserName(kTapLines[gTapLine], line, sizeof(line));
      gTapLine = static_cast<uint8_t>((gTapLine + 1) % count);
      showMessage(line, now, 2500);
      break;
    }

    case Gesture::DoubleTap:
      gAnimation.play(Animation::Laugh, now);
      break;

    case Gesture::LongPress:
      // Eşleşme ekranındayken uzun basış elle çıkış: kod işe yaramıyorsa
      // kullanıcı Elçin'i beklemeye mahkûm olmasın.
      if (gState == State::Pairing) {
        fire(Trigger::PairDone, now);
        showMessage("Eşleşmeyi atladım.", now, 2500);
        break;
      }
      gAnimation.play(Animation::Think, now);
      showMessage(kLongPressLines[gLongLine], now, 3000);
      gLongLine = static_cast<uint8_t>(
          (gLongLine + 1) % (sizeof(kLongPressLines) / sizeof(kLongPressLines[0])));
      break;

    case Gesture::VeryLongPress:
      // Tanışma sekansını yeniden oynat (17. maddedeki "özel ekran").
      //
      // İlk açılış bayrağı NVS'te duruyor ve flash'lar arasında siliniyor;
      // bir kez oynadıktan sonra bir daha görünmüyordu. Oysa bu, Elçin'in
      // Gülçin'e kendini tanıttığı an — istendiğinde tekrar izlenebilmeli.
      gIntroPlaying = true;
      gIntroStartedAt = now;
      break;

    default:
      break;
  }

}

void handleCommand(const Command& command) {
  const uint32_t now = millis();
  gLastInteractionAt = now;

  switch (command.kind) {
    case CommandKind::Animation:
      gAnimation.play(command.animation, now);
      fire(Trigger::ResponseReady, now);
      break;

    case CommandKind::Mood:
      gAnimation.setMood(command.mood, now);
      break;

    case CommandKind::SetState:
      setState(command.state, now);
      if (command.state == State::Thinking) gAnimation.play(Animation::Think, now, 0);
      break;

    case CommandKind::Message:
      showMessage(command.text, now, 6000);
      gAnimation.play(Animation::Talk, now, 6000);
      break;

    case CommandKind::Reboot:
      gNetwork.sendLog("info", "yeniden baslatiliyor");
      delay(50);  // mesajın gitmesi için; yeniden başlatmadan hemen önce
      ESP.restart();
      break;

    case CommandKind::Ota: {
      const OtaDecision decision = Ota::apply(gSettings, String(command.text));
      gNetwork.sendLog("info", otaDecisionName(decision));
      break;
    }

    default:
      break;
  }
}

/** Eşleşme ekranı (51. madde). */
void drawPairing(Canvas& canvas) {
  canvas.clear();
  drawTextAligned(canvas, 4, "ELÇİN", Align::Center, Ink::White, 2);
  drawTextAligned(canvas, 28, "PAIRING", Align::Center);
  drawTextAligned(canvas, 44, gNetwork.pairingCode(), Align::Center, Ink::White, 2);
}

/** Çevrimdışı rozeti: sağ üstte küçük bir çizgi. */
void drawOfflineBadge(Canvas& canvas) {
  canvas.fillRect(120, 2, 6, 2, Ink::White);
}

}  // namespace

void elcin::appSetup() {
  Serial.begin(ELCIN_SERIAL_BAUD);

  gSettings.begin();
  gFirstBoot = gSettings.isFirstBoot();

  // Bir önceki OTA kendini doğrulayamadıysa buradan eski imaja dönülür.
  Ota::checkRollback(gSettings);

  if (!gDisplay.begin()) {
    // Ekran yoksa cihaz yine de çalışsın: seri günlük ve ağ ayakta kalır.
    Serial.println("[elcin] OLED bulunamadi");
  }

  gTouch.begin();
  gNetwork.begin(&gSettings, handleCommand);

  if (!gSettings.isPaired()) gNetwork.generatePairingCode();

  /*
    Watchdog: ana döngü takılırsa cihaz kendini kurtarsın.

    API arduino-esp32 3.x (ESP-IDF 5) ile değişti ve zamanlayıcı orada zaten
    kurulu geliyor; init çağrısı INVALID_STATE döndürüyor. Doğrusu yeniden
    yapılandırmak.
  */
#if ESP_IDF_VERSION_MAJOR >= 5
  const esp_task_wdt_config_t wdtConfig = {
      .timeout_ms = ELCIN_WATCHDOG_S * 1000,
      .idle_core_mask = 0,
      .trigger_panic = true,
  };
  esp_task_wdt_reconfigure(&wdtConfig);
#else
  esp_task_wdt_init(ELCIN_WATCHDOG_S, true);
#endif
  esp_task_wdt_add(nullptr);

  gBootStartedAt = millis();
  gLastInteractionAt = gBootStartedAt;
  Serial.printf("[elcin] v%s acildi\n", ELCIN_FIRMWARE_VERSION);
  // Sensörün boştaki seviyesi: aktif-yüksek modülde 0, aktif-düşük modülde 1
  // beklenir. Ters okuyorsa ELCIN_TOUCH_ACTIVE_HIGH degistirilmeli.
  Serial.printf("[elcin] dokunma pini GPIO%u, bostaki seviye %d\n",
                ELCIN_TOUCH_PIN, digitalRead(ELCIN_TOUCH_PIN));
}

void elcin::appLoop() {
  const uint32_t now = millis();
  esp_task_wdt_reset();

  gNetwork.loop(now);

  // Dokunma her turda okunur; hiçbir şey beklemez.
  const GestureBatch gestures = gTouch.poll(now);
  for (uint8_t i = 0; i < gestures.count; ++i) handleGesture(gestures.items[i], now);

  // Bağlantı değişimi: koptuğunda ve geri geldiğinde Elçin bunu söyler.
  const bool online = gNetwork.socketConnected();
  if (online != gWasOnline) {
    gWasOnline = online;
    if (online) {
      fire(Trigger::ConnectionRestored, now);
      showMessage("Tekrar bağlandım!", now, 3000);
      gAnimation.play(Animation::Smile, now);

      // İlk sağlıklı bağlantı, bekleyen OTA'yı kalıcı kılar.
      if (!gHealthyConfirmed) {
        gHealthyConfirmed = true;
        Ota::confirmHealthy(gSettings);
      }
    } else if (gSettings.hasCloud()) {
      // Yalnızca bağlanacak bir sunucu varken haber ver.
      fire(Trigger::ConnectionLost, now);
      showMessage(kConnectionLost, now, 2500);
    }
  }

  // Ekranı sabit aralıkla tazele: her turda basmak I2C'yi boşuna doyurur.
  if (now - gLastFrameAt < ELCIN_FRAME_INTERVAL_MS) {
    delay(1);  // boşta beklerken CPU'yu bırak
    return;
  }
  gLastFrameAt = now;

  // Tanışma tekrarı: her şeyin önünde oynar.
  if (gIntroPlaying) {
    if (BootSequence::render(gCanvas, now - gIntroStartedAt, true,
                             gSettings.userName().c_str())) {
      gDisplay.push(gCanvas);
      return;
    }
    gIntroPlaying = false;
  }

  // Açılış sekansı bitene kadar başka hiçbir şey çizilmez.
  if (gState == State::Boot || gState == State::Welcome) {
    const uint32_t elapsed = now - gBootStartedAt;
    if (BootSequence::render(gCanvas, elapsed, gFirstBoot, gSettings.userName().c_str())) {
      gDisplay.push(gCanvas);
      return;
    }
    if (gFirstBoot) gSettings.markBooted();

    /*
      Geçişi elle atamak yerine tablodan sürüyoruz: aksi halde WELCOME durumu
      hiç girilmez ve tablo gerçeği anlatmayan bir belge hâline gelir.

      Eşleşmeye yalnızca eşleşilecek bir sunucu varken giriyoruz. Bulut adresi
      tanımlı değilken eşleşme ekranı göstermek Elçin'i çıkışı olmayan bir
      numaranın başında bırakıyordu — oysa çevrimdışı çalışabilmesi tasarımın
      temel şartı.
    */
    if (gSettings.isPaired() || !gSettings.hasCloud()) {
      fire(Trigger::BootDone, now);     // Boot → Welcome
      fire(Trigger::WelcomeDone, now);  // Welcome → Idle
    } else {
      fire(Trigger::PairStart, now);    // Boot → Pairing
    }
  }

  if (gState == State::Pairing) {
    // Sunucu eşleşmeyi onayladığında anahtar NVS'e yazılır ve buradan çıkılır.
    if (gSettings.isPaired()) {
      fire(Trigger::PairDone, now);
      showMessage("Eşleştik!", now, 3000);
    } else if (now - gStateSince >= ELCIN_PAIRING_TTL_MS) {
      // Sunucu cevap vermediyse Elçin numaranın başında beklemeye devam
      // etmez: yüzüne döner ve çevrimdışı yaşar. Bağlantı kurulduğunda
      // eşleşme yeniden denenebilir.
      fire(Trigger::PairDone, now);
    } else {
      drawPairing(gCanvas);
      gDisplay.push(gCanvas);
      return;
    }
  }

  // Geçici durumların süresi dolduğunda kendiliğinden geri dönülür.
  if (isTransient(gState) && (now - gStateSince) >= stateDuration(gState)) {
    fire(Trigger::Timeout, now);
  }

  // Uzun sessizlikten sonra uyku.
  if (gState == State::Idle && (now - gLastInteractionAt) > ELCIN_SLEEP_TIMEOUT_MS) {
    fire(Trigger::Timeout, now);
    gAnimation.play(Animation::Sleep, now);
  }

  // Heartbeat (52. madde).
  if (now - gLastHeartbeatAt >= ELCIN_HEARTBEAT_MS) {
    gLastHeartbeatAt = now;
    gNetwork.sendHeartbeat(gState, gAnimation.mood(), now / 1000);
  }

  // Çizim: mesaj varsa metin, yoksa yüz.
  gCanvas.clear();
  if (gScreenMessage[0] != '\0' && now < gScreenMessageUntil) {
    drawWrapped(gCanvas, 6, 14, 116, gScreenMessage, Ink::White, 1, 4);
  } else {
    gScreenMessage[0] = '\0';
    gAnimation.render(gCanvas, now);
  }

  // Rozet yalnızca bağlanacak bir sunucu varken anlamlı; yoksa ekranda
  // sürekli duran açıklanamayan bir çizgi oluyordu.
  if (!online && gSettings.hasCloud()) drawOfflineBadge(gCanvas);
  gDisplay.push(gCanvas);
}
