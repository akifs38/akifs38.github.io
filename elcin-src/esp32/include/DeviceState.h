#pragma once

/**
 * Cihaz durum makinesi.
 *
 * Tablo web tarafındaki src/services/device/stateMachine.ts ile birebir aynı.
 * İki uçta aynı kurallar geçerli olmasa, "web Elçin gülüyor ama cihaz
 * uyuyor" gibi açıklanamayan farklar çıkar.
 *
 * Arduino'ya bağımlı değildir: masaüstünde derlenip test edilir.
 */

#include <cstdint>

namespace elcin {

enum class State : uint8_t {
  Boot,
  Welcome,
  Pairing,
  Idle,
  Touch,
  Thinking,
  Responding,
  Sleeping,
  Offline,
  Error,
  Count,
};

enum class Trigger : uint8_t {
  BootDone,
  WelcomeDone,
  TouchStart,
  TouchEnd,
  RequestSent,
  ResponseReady,
  ResponseDone,
  Timeout,
  Wake,
  ConnectionLost,
  ConnectionRestored,
  Error,
  Recover,
  PairStart,
  PairDone,
  Count,
};

/** Geçiş tanımlı mı. */
bool canTransition(State from, Trigger trigger);

/** Geçişi uygular; tanımsızsa mevcut durumu korur. */
State transition(State from, Trigger trigger);

/** Ekranda ve seri günlükte görünen ad (BÜYÜK HARF). */
const char* stateName(State state);

/**
 * Protokolde kullanılan ad (küçük harf).
 *
 * Günlük adından ayrı tutuluyor: web tarafı 'idle' bekliyor, seri çıktıda ise
 * 'IDLE' göz taramasını kolaylaştırıyor. İkisini tek fonksiyona bağlamak,
 * günlüğü güzelleştirmek isteyen birinin protokolü kırmasına yol açardı.
 */
const char* stateWireName(State state);

/** Durum kalıcı mı, yoksa süresi dolunca kendiliğinden mi dönmeli. */
bool isTransient(State state);

/** Geçici durumun ne kadar süreceği (ms); kalıcıysa 0. */
uint32_t stateDuration(State state);

}  // namespace elcin
