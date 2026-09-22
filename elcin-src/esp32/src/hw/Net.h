#pragma once

/**
 * Ağ katmanı: Wi-Fi + WebSocket.
 *
 * Cihaz ile tarayıcı doğrudan konuşmaz; ikisi de backend'e bağlanır, backend
 * olayları iki yöne kopyalar. Bu sınıf cihaz ucudur.
 *
 * Hiçbir çağrısı bloke etmez. `loop()` her turda çağrılır, bağlantı yoksa
 * üstel geri çekilme ile yeniden dener — kopan bağlantıya saniyede bir
 * asılmak hem sunucuyu hem pili yorar.
 */

#include <Arduino.h>
#include <WebSocketsClient.h>

#include "ElcinConfig.h"
#include "Protocol.h"
#include "Settings.h"

namespace elcin {

/** Sunucudan komut geldiğinde çağrılır. */
using CommandHandler = void (*)(const Command&);

class Net {
 public:
  void begin(Settings* settings, CommandHandler onCommand);
  void loop(uint32_t now);

  bool wifiConnected() const;
  bool socketConnected() const { return socketConnected_; }
  int32_t rssi() const;

  void sendTouch(Gesture gesture);
  void sendState(State state);
  void sendLog(const char* level, const char* message);
  void sendHeartbeat(State state, Mood mood, uint32_t uptimeSeconds);

  /** Eşleşme kodu — ilk kurulumda ekranda gösterilir. */
  const char* pairingCode() const { return pairingCode_; }
  void generatePairingCode();

 private:
  void connectWifi();
  void connectSocket();
  void send(const char* payload, uint16_t length);
  static void onSocketEvent(WStype_t type, uint8_t* payload, size_t length);

  Settings* settings_ = nullptr;
  WebSocketsClient socket_;
  bool socketConnected_ = false;
  bool socketStarted_ = false;

  uint32_t lastWifiAttempt_ = 0;
  uint8_t wifiAttempt_ = 0;
  char pairingCode_[ELCIN_PAIRING_DIGITS + 1] = {0};
};

/** Tek örnek: olay geri çağrısı C tarzı olduğu için global erişim gerekiyor. */
extern Net* gNet;
extern CommandHandler gCommandHandler;

}  // namespace elcin
