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
#include "hw/Display.h"
#include "hw/Net.h"
#include "hw/Ota.h"
#include "hw/Settings.h"
#include "hw/TouchInput.h"
#include "app/ElcinApp.h"

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

/** Çevrimdışıyken dokunuşa verilecek yerel cevaplar (21. madde). */
const char* kOfflineLines[] = {
    "Şu an internete ulaşamıyorum.",
    "Ama buradayım.",
    "Bağlantımızı tekrar kurmaya çalışıyorum.",
};
uint8_t gOfflineLine = 0;
bool gWasOnline = false;

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
  gNetwork.sendTouch(gesture);

  switch (gesture) {
    case Gesture::TouchDown:
      fire(Trigger::TouchStart, now);
      break;

    case Gesture::SingleTap:
      gAnimation.play(Animation::Smile, now);
      showMessage("Buradayım.", now, 2500);
      break;

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
      showMessage("Bir şey mi oldu?", now, 3000);
      break;

    case Gesture::VeryLongPress:
      gAnimation.play(Animation::Heart, now, 5000);
      showMessage("Zor zamanlarında yanındayım.", now, 5000);
      break;

    default:
      break;
  }

  // Çevrimdışıyken Elçin susmaz: sırayla yerel cümlelerini söyler.
  if (!gNetwork.socketConnected() &&
      (gesture == Gesture::SingleTap || gesture == Gesture::DoubleTap)) {
    showMessage(kOfflineLines[gOfflineLine], now, 3000);
    gOfflineLine = static_cast<uint8_t>((gOfflineLine + 1) %
                                        (sizeof(kOfflineLines) / sizeof(kOfflineLines[0])));
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
    } else {
      fire(Trigger::ConnectionLost, now);
    }
  }

  // Ekranı sabit aralıkla tazele: her turda basmak I2C'yi boşuna doyurur.
  if (now - gLastFrameAt < ELCIN_FRAME_INTERVAL_MS) {
    delay(1);  // boşta beklerken CPU'yu bırak
    return;
  }
  gLastFrameAt = now;

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

  if (!online) drawOfflineBadge(gCanvas);
  gDisplay.push(gCanvas);
}
