#pragma once

// ÜRETİLMİŞ DOSYA — elle düzenleme.
//
// Kaynak: esp32/include/Protocol.h
// Yeniden üret: cd esp32 && python3 tools/make_ino.py
//
// Değişiklik yapman gereken yer yukarıdaki kaynak dosya; buradaki düzenleme
// bir sonraki üretimde kaybolur.

/**
 * WebSocket protokolü.
 *
 * Web tarafındaki types/index.ts ile aynı sözleşme. Kodlama/çözme burada
 * ArduinoJson'a bağlı DEĞİL: gelen mesaj birkaç alanlık düz bir yapı, onun
 * için bir JSON ağacı kurup yığında ~1 kB harcamak gereksiz. Ayrıca bu
 * sayede masaüstünde test edilebiliyor.
 *
 * Gelen bozuk mesaj sessizce düşer — kötü bir paket yüzünden Elçin'in
 * ekranına hata basılmaz.
 */

#include <cstdint>

#include "AnimationEngine.h"
#include "DeviceState.h"
#include "FaceEngine.h"
#include "TouchRecognizer.h"

namespace elcin {

enum class CommandKind : uint8_t {
  None,
  Animation,
  Mood,
  SetState,
  Message,
  Reboot,
  Ota,
};

struct Command {
  CommandKind kind = CommandKind::None;
  Animation animation = Animation::Idle;
  Mood mood = Mood::Normal;
  State state = State::Idle;
  /** `message` ve `ota` için metin yükü (ekran satırı / sürüm). */
  char text[96] = {0};
};

/** Gelen JSON'u komuta çevirir. Tanınmayan mesajda kind = None. */
Command parseCommand(const char* json);

struct HeartbeatFields {
  const char* deviceId;
  const char* firmware;
  State state;
  Mood mood;
  int32_t wifiRssi;
  uint32_t uptimeSeconds;
  bool online;
};

/**
 * Giden mesajları üretir. Hepsi çağıranın verdiği tampona yazar ve yazılan
 * uzunluğu döndürür; firmware'de dinamik string yok.
 */
uint16_t encodeHeartbeat(char* out, uint16_t capacity, const HeartbeatFields& fields);
uint16_t encodeTouch(char* out, uint16_t capacity, const char* deviceId, Gesture gesture);
uint16_t encodeState(char* out, uint16_t capacity, const char* deviceId, State state);
uint16_t encodeLog(char* out, uint16_t capacity, const char* deviceId, const char* level,
                   const char* message);

/** JSON string değerini kaçış karakterleriyle yazar. */
uint16_t appendEscaped(char* out, uint16_t capacity, uint16_t at, const char* value);

}  // namespace elcin
