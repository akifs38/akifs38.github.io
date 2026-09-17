#include "DeviceState.h"

#include "ElcinConfig.h"

namespace elcin {
namespace {

constexpr auto kStates = static_cast<uint8_t>(State::Count);
constexpr auto kTriggers = static_cast<uint8_t>(Trigger::Count);

/** Tanımsız geçişi işaretleyen değer. */
constexpr State kNone = State::Count;

/**
 * Geçiş tablosu.
 *
 * Dizi olarak tutulması bilinçli: sabit boyutlu, flash'ta duran, dallanmasız
 * bir arama. Bir switch yığını hem büyür hem de tabloyu tek bakışta okumayı
 * imkânsızlaştırırdı.
 */
struct Table {
  State cell[kStates][kTriggers];

  constexpr Table() : cell{} {
    for (uint8_t s = 0; s < kStates; ++s)
      for (uint8_t t = 0; t < kTriggers; ++t) cell[s][t] = kNone;

    auto set = [this](State from, Trigger trigger, State to) {
      cell[static_cast<uint8_t>(from)][static_cast<uint8_t>(trigger)] = to;
    };

    set(State::Boot, Trigger::BootDone, State::Welcome);
    set(State::Boot, Trigger::Error, State::Error);
    set(State::Boot, Trigger::PairStart, State::Pairing);

    set(State::Welcome, Trigger::WelcomeDone, State::Idle);
    set(State::Welcome, Trigger::Error, State::Error);
    set(State::Welcome, Trigger::PairStart, State::Pairing);

    set(State::Pairing, Trigger::PairDone, State::Idle);
    set(State::Pairing, Trigger::Error, State::Error);
    set(State::Pairing, Trigger::ConnectionLost, State::Offline);

    set(State::Idle, Trigger::TouchStart, State::Touch);
    set(State::Idle, Trigger::RequestSent, State::Thinking);
    set(State::Idle, Trigger::Timeout, State::Sleeping);
    set(State::Idle, Trigger::ConnectionLost, State::Offline);
    set(State::Idle, Trigger::Error, State::Error);

    set(State::Touch, Trigger::TouchEnd, State::Idle);
    set(State::Touch, Trigger::RequestSent, State::Thinking);
    set(State::Touch, Trigger::Timeout, State::Idle);
    set(State::Touch, Trigger::ConnectionLost, State::Offline);
    set(State::Touch, Trigger::Error, State::Error);

    set(State::Thinking, Trigger::ResponseReady, State::Responding);
    // Cevap gelmezse ekranda asılı kalmasın.
    set(State::Thinking, Trigger::Timeout, State::Idle);
    set(State::Thinking, Trigger::ConnectionLost, State::Offline);
    set(State::Thinking, Trigger::Error, State::Error);

    set(State::Responding, Trigger::ResponseDone, State::Idle);
    set(State::Responding, Trigger::TouchStart, State::Touch);
    set(State::Responding, Trigger::Timeout, State::Idle);
    set(State::Responding, Trigger::ConnectionLost, State::Offline);
    set(State::Responding, Trigger::Error, State::Error);

    set(State::Sleeping, Trigger::Wake, State::Idle);
    set(State::Sleeping, Trigger::TouchStart, State::Touch);
    set(State::Sleeping, Trigger::RequestSent, State::Thinking);
    set(State::Sleeping, Trigger::ConnectionLost, State::Offline);
    set(State::Sleeping, Trigger::Error, State::Error);

    set(State::Offline, Trigger::ConnectionRestored, State::Idle);
    // Çevrimdışıyken bile dokunmaya tepki verir: Elçin susmaz.
    set(State::Offline, Trigger::TouchStart, State::Touch);
    set(State::Offline, Trigger::Error, State::Error);

    set(State::Error, Trigger::Recover, State::Idle);
    set(State::Error, Trigger::ConnectionRestored, State::Idle);
    set(State::Error, Trigger::ConnectionLost, State::Offline);
  }
};

constexpr Table kTable{};

}  // namespace

bool canTransition(State from, Trigger trigger) {
  if (from >= State::Count || trigger >= Trigger::Count) return false;
  return kTable.cell[static_cast<uint8_t>(from)][static_cast<uint8_t>(trigger)] != kNone;
}

State transition(State from, Trigger trigger) {
  if (!canTransition(from, trigger)) return from;
  return kTable.cell[static_cast<uint8_t>(from)][static_cast<uint8_t>(trigger)];
}

const char* stateName(State state) {
  switch (state) {
    case State::Boot:       return "BOOT";
    case State::Welcome:    return "WELCOME";
    case State::Pairing:    return "PAIRING";
    case State::Idle:       return "IDLE";
    case State::Touch:      return "TOUCH";
    case State::Thinking:   return "THINKING";
    case State::Responding: return "RESPONDING";
    case State::Sleeping:   return "SLEEPING";
    case State::Offline:    return "OFFLINE";
    case State::Error:      return "ERROR";
    default:                return "?";
  }
}

const char* stateWireName(State state) {
  switch (state) {
    case State::Boot:       return "boot";
    case State::Welcome:    return "welcome";
    case State::Pairing:    return "pairing";
    case State::Idle:       return "idle";
    case State::Touch:      return "touch";
    case State::Thinking:   return "thinking";
    case State::Responding: return "responding";
    case State::Sleeping:   return "sleeping";
    case State::Offline:    return "offline";
    case State::Error:      return "error";
    default:                return "idle";
  }
}

bool isTransient(State state) {
  return state == State::Touch || state == State::Responding || state == State::Thinking;
}

uint32_t stateDuration(State state) {
  switch (state) {
    case State::Touch:      return ELCIN_TOUCH_REACTION_MS;
    case State::Responding: return ELCIN_TOUCH_REACTION_MS;
    case State::Thinking:   return ELCIN_THINKING_TIMEOUT_MS;
    default:                return 0;
  }
}

}  // namespace elcin
