#include "Protocol.h"

#include <cstring>

namespace elcin {
namespace {

/**
 * Düz JSON alan okuyucu.
 *
 * Tam bir ayrıştırıcı değil ve olmaya da çalışmıyor: protokoldeki mesajlar
 * tek seviyeli, sabit alanlı. `"key":"value"` ya da `"key":value` arar.
 * Beklediğimiz şekle uymayan bir mesaj zaten reddedilecek.
 */
bool readString(const char* json, const char* key, char* out, uint16_t capacity) {
  char needle[32];
  uint16_t at = 0;
  needle[at++] = '"';
  for (const char* p = key; *p && at < sizeof(needle) - 3; ++p) needle[at++] = *p;
  needle[at++] = '"';
  needle[at] = '\0';

  /*
    Anahtarı ararken "anahtar mı değer mi" ayrımı şart.

    {"command":"animation","animation":"laugh"} mesajında "animation" metni iki
    kez geçer: önce `command` alanının DEĞERİ olarak, sonra gerçek anahtar
    olarak. İlk eşleşmeyi almak, komutun sessizce düşmesine yol açıyordu.
    Bu yüzden eşleşmenin ardından ':' gelmesini şart koşup aramaya devam
    ediyoruz.
  */
  const char* cursor = nullptr;
  const char* search = json;
  const uint16_t needleLength = static_cast<uint16_t>(std::strlen(needle));

  while (true) {
    const char* found = std::strstr(search, needle);
    if (found == nullptr) return false;

    const char* after = found + needleLength;
    while (*after == ' ' || *after == '\t') ++after;

    if (*after == ':') {
      ++after;
      while (*after == ' ' || *after == '\t') ++after;
      if (*after != '"') return false;
      cursor = after + 1;
      break;
    }
    search = found + 1;
  }

  uint16_t written = 0;
  while (*cursor != '\0' && *cursor != '"' && written < capacity - 1) {
    if (*cursor == '\\' && *(cursor + 1) != '\0') {
      ++cursor;
      switch (*cursor) {
        case 'n': out[written++] = '\n'; break;
        case 't': out[written++] = '\t'; break;
        default:  out[written++] = *cursor; break;
      }
      ++cursor;
      continue;
    }
    out[written++] = *cursor++;
  }
  out[written] = '\0';
  return true;
}

uint16_t appendRaw(char* out, uint16_t capacity, uint16_t at, const char* text) {
  while (*text != '\0' && at < capacity - 1) out[at++] = *text++;
  return at;
}

uint16_t appendNumber(char* out, uint16_t capacity, uint16_t at, int32_t value) {
  if (value < 0) {
    if (at < capacity - 1) out[at++] = '-';
    value = -value;
  }
  char digits[12];
  uint8_t count = 0;
  do {
    digits[count++] = static_cast<char>('0' + (value % 10));
    value /= 10;
  } while (value != 0 && count < sizeof(digits));

  while (count > 0 && at < capacity - 1) out[at++] = digits[--count];
  return at;
}

}  // namespace

uint16_t appendEscaped(char* out, uint16_t capacity, uint16_t at, const char* value) {
  while (*value != '\0' && at < capacity - 2) {
    const char c = *value++;
    // Kaçırılmayan bir tırnak, sunucudaki ayrıştırıcıyı kırar; cihazın
    // ürettiği metin (ör. günlük satırı) her zaman güvenilir değil.
    if (c == '"' || c == '\\') {
      out[at++] = '\\';
      out[at++] = c;
    } else if (c == '\n') {
      out[at++] = '\\';
      out[at++] = 'n';
    } else if (static_cast<unsigned char>(c) < 0x20) {
      continue;  // kontrol karakterleri düşer
    } else {
      out[at++] = c;
    }
  }
  return at;
}

Command parseCommand(const char* json) {
  Command command;
  if (json == nullptr) return command;

  char type[32];
  if (!readString(json, "type", type, sizeof(type))) return command;
  if (std::strcmp(type, "device_command") != 0) return command;

  char name[32];
  if (!readString(json, "command", name, sizeof(name))) return command;

  if (std::strcmp(name, "animation") == 0) {
    char value[32];
    if (!readString(json, "animation", value, sizeof(value))) return command;
    command.kind = CommandKind::Animation;
    command.animation = animationFromName(value);
  } else if (std::strcmp(name, "mood") == 0) {
    char value[32];
    if (!readString(json, "mood", value, sizeof(value))) return command;
    command.kind = CommandKind::Mood;
    command.mood = moodFromName(value);
  } else if (std::strcmp(name, "state") == 0) {
    char value[32];
    if (!readString(json, "state", value, sizeof(value))) return command;
    command.kind = CommandKind::SetState;
    if (std::strcmp(value, "idle") == 0) command.state = State::Idle;
    else if (std::strcmp(value, "thinking") == 0) command.state = State::Thinking;
    else if (std::strcmp(value, "responding") == 0) command.state = State::Responding;
    else if (std::strcmp(value, "sleeping") == 0) command.state = State::Sleeping;
    else if (std::strcmp(value, "error") == 0) command.state = State::Error;
    else command.kind = CommandKind::None;
  } else if (std::strcmp(name, "message") == 0) {
    if (!readString(json, "text", command.text, sizeof(command.text))) return command;
    command.kind = CommandKind::Message;
  } else if (std::strcmp(name, "reboot") == 0) {
    command.kind = CommandKind::Reboot;
  } else if (std::strcmp(name, "ota") == 0) {
    if (!readString(json, "version", command.text, sizeof(command.text))) return command;
    command.kind = CommandKind::Ota;
  }

  return command;
}

uint16_t encodeHeartbeat(char* out, uint16_t capacity, const HeartbeatFields& fields) {
  uint16_t at = 0;
  at = appendRaw(out, capacity, at, "{\"type\":\"device_event\",\"event\":\"heartbeat\",\"status\":{");
  at = appendRaw(out, capacity, at, "\"deviceId\":\"");
  at = appendEscaped(out, capacity, at, fields.deviceId);
  at = appendRaw(out, capacity, at, "\",\"online\":");
  at = appendRaw(out, capacity, at, fields.online ? "true" : "false");
  at = appendRaw(out, capacity, at, ",\"state\":\"");
  at = appendRaw(out, capacity, at, stateWireName(fields.state));
  at = appendRaw(out, capacity, at, "\",\"mood\":\"");
  at = appendRaw(out, capacity, at, moodName(fields.mood));
  at = appendRaw(out, capacity, at, "\",\"firmware\":\"");
  at = appendEscaped(out, capacity, at, fields.firmware);
  at = appendRaw(out, capacity, at, "\",\"wifiRssi\":");
  at = appendNumber(out, capacity, at, fields.wifiRssi);
  at = appendRaw(out, capacity, at, ",\"uptime\":");
  at = appendNumber(out, capacity, at, static_cast<int32_t>(fields.uptimeSeconds));
  at = appendRaw(out, capacity, at, "}}");
  out[at] = '\0';
  return at;
}

uint16_t encodeTouch(char* out, uint16_t capacity, const char* deviceId, Gesture gesture) {
  uint16_t at = 0;
  at = appendRaw(out, capacity, at, "{\"type\":\"device_event\",\"event\":\"touch\",\"touch\":\"");
  at = appendRaw(out, capacity, at, gestureName(gesture));
  at = appendRaw(out, capacity, at, "\",\"device_id\":\"");
  at = appendEscaped(out, capacity, at, deviceId);
  at = appendRaw(out, capacity, at, "\"}");
  out[at] = '\0';
  return at;
}

uint16_t encodeState(char* out, uint16_t capacity, const char* deviceId, State state) {
  uint16_t at = 0;
  at = appendRaw(out, capacity, at, "{\"type\":\"device_event\",\"event\":\"state\",\"state\":\"");
  at = appendRaw(out, capacity, at, stateWireName(state));
  at = appendRaw(out, capacity, at, "\",\"device_id\":\"");
  at = appendEscaped(out, capacity, at, deviceId);
  at = appendRaw(out, capacity, at, "\"}");
  out[at] = '\0';
  return at;
}

uint16_t encodeLog(char* out, uint16_t capacity, const char* deviceId, const char* level,
                   const char* message) {
  uint16_t at = 0;
  at = appendRaw(out, capacity, at, "{\"type\":\"device_event\",\"event\":\"log\",\"level\":\"");
  at = appendRaw(out, capacity, at, level);
  at = appendRaw(out, capacity, at, "\",\"message\":\"");
  at = appendEscaped(out, capacity, at, message);
  at = appendRaw(out, capacity, at, "\",\"device_id\":\"");
  at = appendEscaped(out, capacity, at, deviceId);
  at = appendRaw(out, capacity, at, "\"}");
  out[at] = '\0';
  return at;
}

}  // namespace elcin
