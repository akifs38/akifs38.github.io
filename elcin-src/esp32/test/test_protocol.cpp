#include "tiny_test.h"
#include "Protocol.h"

using namespace elcin;

void testProtocol() {
  SUITE("Protocol");

  {  // animasyon komutu
    auto command = parseCommand(
        "{\"type\":\"device_command\",\"command\":\"animation\",\"animation\":\"laugh\"}");
    CHECK(command.kind == CommandKind::Animation);
    CHECK(command.animation == Animation::Laugh);
  }

  {  // ruh hali komutu
    auto command = parseCommand(
        "{\"type\":\"device_command\",\"command\":\"mood\",\"mood\":\"love\"}");
    CHECK(command.kind == CommandKind::Mood);
    CHECK(command.mood == Mood::Love);
  }

  {  // durum komutu
    auto command = parseCommand(
        "{\"type\":\"device_command\",\"command\":\"state\",\"state\":\"sleeping\"}");
    CHECK(command.kind == CommandKind::SetState);
    CHECK(command.state == State::Sleeping);
  }

  {  // mesaj komutu, Türkçe metin bozulmadan taşınır
    auto command = parseCommand(
        "{\"type\":\"device_command\",\"command\":\"message\",\"text\":\"Merhaba Gülçin\"}");
    CHECK(command.kind == CommandKind::Message);
    CHECK_STR(command.text, "Merhaba Gülçin");
  }

  {  // OTA komutu
    auto command = parseCommand(
        "{\"type\":\"device_command\",\"command\":\"ota\",\"version\":\"1.1.0\"}");
    CHECK(command.kind == CommandKind::Ota);
    CHECK_STR(command.text, "1.1.0");
  }

  {  // yabancı ve bozuk mesajlar sessizce düşer
    CHECK(parseCommand("{\"type\":\"chat\",\"text\":\"merhaba\"}").kind == CommandKind::None);
    CHECK(parseCommand("{bozuk").kind == CommandKind::None);
    CHECK(parseCommand("").kind == CommandKind::None);
    CHECK(parseCommand(nullptr).kind == CommandKind::None);
    CHECK(parseCommand("{\"type\":\"device_command\"}").kind == CommandKind::None);
  }

  {  // tanınmayan animasyon adı güvenli değere düşer
    auto command = parseCommand(
        "{\"type\":\"device_command\",\"command\":\"animation\",\"animation\":\"dans\"}");
    CHECK(command.kind == CommandKind::Animation);
    CHECK(command.animation == Animation::Idle);
  }

  {  // tanınmayan durum komutu tümden reddedilir
    auto command = parseCommand(
        "{\"type\":\"device_command\",\"command\":\"state\",\"state\":\"dans\"}");
    CHECK(command.kind == CommandKind::None);
  }

  {  // heartbeat kodlaması
    char buffer[320];
    HeartbeatFields fields{"elcin-001", "1.0.0", State::Idle, Mood::Happy, -54, 1234, true};
    const uint16_t length = encodeHeartbeat(buffer, sizeof(buffer), fields);
    CHECK(length > 0);
    CHECK(std::strstr(buffer, "\"event\":\"heartbeat\"") != nullptr);
    CHECK(std::strstr(buffer, "\"deviceId\":\"elcin-001\"") != nullptr);
    CHECK(std::strstr(buffer, "\"state\":\"idle\"") != nullptr);
    CHECK(std::strstr(buffer, "\"mood\":\"happy\"") != nullptr);
    CHECK(std::strstr(buffer, "\"wifiRssi\":-54") != nullptr);
    CHECK(std::strstr(buffer, "\"uptime\":1234") != nullptr);
  }

  {  // dokunma ve durum olayları
    char buffer[160];
    encodeTouch(buffer, sizeof(buffer), "elcin-001", Gesture::DoubleTap);
    CHECK(std::strstr(buffer, "\"touch\":\"double_tap\"") != nullptr);

    encodeState(buffer, sizeof(buffer), "elcin-001", State::Thinking);
    CHECK(std::strstr(buffer, "\"state\":\"thinking\"") != nullptr);
  }

  {  // günlük metnindeki tırnak kaçırılır, yoksa sunucudaki JSON kırılır
    char buffer[200];
    encodeLog(buffer, sizeof(buffer), "elcin-001", "warn", "cevap \"bos\" geldi");
    CHECK(std::strstr(buffer, "\\\"bos\\\"") != nullptr);
  }

  {  // tampon taşması: kısa tamponda bile sonlandırılmış metin üretilir
    char small[40];
    HeartbeatFields fields{"elcin-001", "1.0.0", State::Idle, Mood::Happy, -54, 1234, true};
    const uint16_t length = encodeHeartbeat(small, sizeof(small), fields);
    CHECK(length < sizeof(small));
    CHECK_EQ(small[length], '\0');
  }
}
