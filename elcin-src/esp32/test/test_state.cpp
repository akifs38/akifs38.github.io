#include "tiny_test.h"
#include "DeviceState.h"

using namespace elcin;

void testState() {
  SUITE("DeviceState");

  // Açılış sırası
  State state = transition(State::Boot, Trigger::BootDone);
  CHECK(state == State::Welcome);
  state = transition(state, Trigger::WelcomeDone);
  CHECK(state == State::Idle);

  // Dokunma döngüsü
  CHECK(transition(State::Idle, Trigger::TouchStart) == State::Touch);
  CHECK(transition(State::Touch, Trigger::TouchEnd) == State::Idle);

  // Sohbet akışı
  state = transition(State::Idle, Trigger::RequestSent);
  CHECK(state == State::Thinking);
  state = transition(state, Trigger::ResponseReady);
  CHECK(state == State::Responding);
  CHECK(transition(state, Trigger::ResponseDone) == State::Idle);

  // Cevap gelmezse düşünme ekranında asılı kalmaz
  CHECK(transition(State::Thinking, Trigger::Timeout) == State::Idle);

  // Uyku ve uyanma
  CHECK(transition(State::Idle, Trigger::Timeout) == State::Sleeping);
  CHECK(transition(State::Sleeping, Trigger::Wake) == State::Idle);
  CHECK(transition(State::Sleeping, Trigger::TouchStart) == State::Touch);

  // Bağlantı
  CHECK(transition(State::Idle, Trigger::ConnectionLost) == State::Offline);
  CHECK(transition(State::Thinking, Trigger::ConnectionLost) == State::Offline);
  CHECK(transition(State::Offline, Trigger::ConnectionRestored) == State::Idle);

  // Çevrimdışıyken bile dokunmaya tepki verir
  CHECK(transition(State::Offline, Trigger::TouchStart) == State::Touch);

  // Tanımsız geçiş durumu korur
  CHECK(transition(State::Boot, Trigger::ResponseDone) == State::Boot);
  CHECK(transition(State::Sleeping, Trigger::WelcomeDone) == State::Sleeping);

  // Hatadan kurtulma
  CHECK(transition(State::Error, Trigger::Recover) == State::Idle);

  // Eşleşme
  CHECK(transition(State::Boot, Trigger::PairStart) == State::Pairing);
  CHECK(transition(State::Pairing, Trigger::PairDone) == State::Idle);

  CHECK(canTransition(State::Idle, Trigger::TouchStart));
  CHECK(!canTransition(State::Idle, Trigger::WelcomeDone));

  // Hiçbir durum çıkışsız olmamalı: cihaz bir ekranda kilitlenmesin.
  for (uint8_t i = 0; i < static_cast<uint8_t>(State::Count); ++i) {
    const auto from = static_cast<State>(i);
    bool hasExit = false;
    for (uint8_t t = 0; t < static_cast<uint8_t>(Trigger::Count); ++t) {
      if (canTransition(from, static_cast<Trigger>(t))) { hasExit = true; break; }
    }
    CHECK(hasExit);
  }

  // Protokol adları küçük harf, günlük adları büyük harf.
  CHECK_STR(stateWireName(State::Idle), "idle");
  CHECK_STR(stateWireName(State::Responding), "responding");
  CHECK_STR(stateName(State::Idle), "IDLE");
}
