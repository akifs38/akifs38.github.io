// ÜRETİLMİŞ DOSYA — elle düzenleme.
//
// Kaynak: esp32/src/hw/Net.cpp
// Yeniden üret: cd esp32 && python3 tools/make_ino.py
//
// Değişiklik yapman gereken yer yukarıdaki kaynak dosya; buradaki düzenleme
// bir sonraki üretimde kaybolur.

#include "Net.h"

#include <WiFi.h>
#include <esp_random.h>

#include "ElcinConfig.h"

namespace elcin {

Net* gNet = nullptr;
CommandHandler gCommandHandler = nullptr;

namespace {

/** Giden mesajlar için tek tampon: firmware'de dinamik string istemiyoruz. */
char gOutBuffer[384];

/** "wss://host:443/ws" → host, port, yol. */
bool splitUrl(const String& url, String& host, uint16_t& port, String& path, bool& secure) {
  secure = url.startsWith("wss://");
  const int schemeEnd = url.indexOf("://");
  if (schemeEnd < 0) return false;

  String rest = url.substring(schemeEnd + 3);
  const int slash = rest.indexOf('/');
  path = slash >= 0 ? rest.substring(slash) : "/";
  String authority = slash >= 0 ? rest.substring(0, slash) : rest;

  const int colon = authority.indexOf(':');
  if (colon >= 0) {
    host = authority.substring(0, colon);
    port = static_cast<uint16_t>(authority.substring(colon + 1).toInt());
  } else {
    host = authority;
    port = secure ? 443 : 80;
  }
  return host.length() > 0;
}

}  // namespace

void Net::begin(Settings* settings, CommandHandler onCommand) {
  settings_ = settings;
  gNet = this;
  gCommandHandler = onCommand;

  WiFi.mode(WIFI_STA);
  // Modem uykusunu kapatmak WebSocket gecikmesini ~200 ms'den ~20 ms'ye
  // düşürüyor; Elçin masada prize bağlı duruyor, pil derdi yok.
  WiFi.setSleep(false);

  if (settings_->hasWifi()) connectWifi();
}

void Net::connectWifi() {
  const String ssid = settings_->wifiSsid();
  if (ssid.isEmpty()) return;
  // begin() bloke etmez; sonucu wifiConnected() ile yokluyoruz.
  WiFi.begin(ssid.c_str(), settings_->wifiPassword().c_str());
}

bool Net::wifiConnected() const { return WiFi.status() == WL_CONNECTED; }

int32_t Net::rssi() const { return wifiConnected() ? WiFi.RSSI() : -127; }

void Net::connectSocket() {
  const String url = settings_->websocketUrl();
  if (url.isEmpty()) return;

  String host, path;
  uint16_t port = 0;
  bool secure = false;
  if (!splitUrl(url, host, port, path, secure)) return;

  // Cihaz kimliği ve anahtarı sorgu dizesinde: sunucu bağlantıyı burada
  // doğrular, böylece yetkisiz bir cihaz olay akışına giremez.
  String full = path + "?device=" + settings_->deviceId() +
                "&token=" + settings_->deviceToken();

  if (secure) socket_.beginSSL(host.c_str(), port, full.c_str());
  else socket_.begin(host.c_str(), port, full.c_str());

  socket_.onEvent(onSocketEvent);
  // Kütüphanenin kendi yeniden deneme aralığı; bizimkiyle çakışmasın diye
  // uzun tutuluyor.
  socket_.setReconnectInterval(5000);
  socket_.enableHeartbeat(15000, 3000, 2);
  socketStarted_ = true;
}

void Net::loop(uint32_t now) {
  if (socketStarted_) socket_.loop();

  if (!wifiConnected()) {
    socketConnected_ = false;

    // Üstel geri çekilme: sırayla 1, 2, 4, 8, 16 sn.
    const uint32_t wait = ELCIN_RECONNECT_BACKOFF_MS[
        wifiAttempt_ < ELCIN_RECONNECT_STEPS ? wifiAttempt_ : ELCIN_RECONNECT_STEPS - 1];

    if (now - lastWifiAttempt_ >= wait) {
      lastWifiAttempt_ = now;
      if (wifiAttempt_ < ELCIN_RECONNECT_STEPS) ++wifiAttempt_;
      connectWifi();
    }
    return;
  }

  wifiAttempt_ = 0;
  if (!socketStarted_) connectSocket();
}

void Net::send(const char* payload, uint16_t length) {
  if (!socketConnected_ || length == 0) return;
  socket_.sendTXT(payload, length);
}

void Net::sendTouch(Gesture gesture) {
  const uint16_t length = encodeTouch(gOutBuffer, sizeof(gOutBuffer),
                                      settings_->deviceId().c_str(), gesture);
  send(gOutBuffer, length);
}

void Net::sendState(State state) {
  const uint16_t length = encodeState(gOutBuffer, sizeof(gOutBuffer),
                                      settings_->deviceId().c_str(), state);
  send(gOutBuffer, length);
}

void Net::sendLog(const char* level, const char* message) {
  const uint16_t length = encodeLog(gOutBuffer, sizeof(gOutBuffer),
                                    settings_->deviceId().c_str(), level, message);
  send(gOutBuffer, length);
}

void Net::sendHeartbeat(State state, Mood mood, uint32_t uptimeSeconds) {
  HeartbeatFields fields{};
  const String id = settings_->deviceId();
  fields.deviceId = id.c_str();
  fields.firmware = ELCIN_FIRMWARE_VERSION;
  fields.state = state;
  fields.mood = mood;
  fields.wifiRssi = rssi();
  fields.uptimeSeconds = uptimeSeconds;
  fields.online = true;

  const uint16_t length = encodeHeartbeat(gOutBuffer, sizeof(gOutBuffer), fields);
  send(gOutBuffer, length);
}

void Net::generatePairingCode() {
  // Donanım RNG: esp_random() gerçek entropi verir, rand() tohumsuz her
  // açılışta aynı kodu üretirdi.
  uint32_t value = esp_random() % 1000000u;
  for (int8_t i = ELCIN_PAIRING_DIGITS - 1; i >= 0; --i) {
    pairingCode_[i] = static_cast<char>('0' + (value % 10));
    value /= 10;
  }
  pairingCode_[ELCIN_PAIRING_DIGITS] = '\0';
}

void Net::onSocketEvent(WStype_t type, uint8_t* payload, size_t length) {
  if (gNet == nullptr) return;

  switch (type) {
    case WStype_CONNECTED:
      gNet->socketConnected_ = true;
      break;

    case WStype_DISCONNECTED:
      gNet->socketConnected_ = false;
      break;

    case WStype_TEXT: {
      // Tamponu sonlandır: kütüphane sonlandırılmış veri garantilemiyor.
      static char inBuffer[512];
      const size_t copy = length < sizeof(inBuffer) - 1 ? length : sizeof(inBuffer) - 1;
      memcpy(inBuffer, payload, copy);
      inBuffer[copy] = '\0';

      const Command command = parseCommand(inBuffer);
      // Tanınmayan mesaj sessizce düşer; kötü bir paket ekrana hata basmaz.
      if (command.kind != CommandKind::None && gCommandHandler != nullptr) {
        gCommandHandler(command);
      }
      break;
    }

    default:
      break;
  }
}

}  // namespace elcin
