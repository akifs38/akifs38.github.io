// ÜRETİLMİŞ DOSYA — elle düzenleme.
//
// Kaynak: esp32/src/core/AnimationEngine.cpp
// Yeniden üret: cd esp32 && python3 tools/make_ino.py
//
// Değişiklik yapman gereken yer yukarıdaki kaynak dosya; buradaki düzenleme
// bir sonraki üretimde kaybolur.

#include "AnimationEngine.h"

#include <cstring>

namespace elcin {
namespace {

/** Ruh hali geçişinin süresi (ms). Ani sıçrama Elçin'i makineleştiriyor. */
constexpr uint32_t kMoodBlendMs = 260;
/** Göz kırpmanın görünür süresi. */
constexpr uint32_t kBlinkMs = 110;
constexpr uint32_t kBlinkMinMs = 2600;
constexpr uint32_t kBlinkSpreadMs = 3900;
/** Animasyonun varsayılan süresi. */
constexpr uint32_t kDefaultAnimationMs = 2200;

}  // namespace

const char* animationName(Animation animation) {
  switch (animation) {
    case Animation::Idle:     return "idle";
    case Animation::Blink:    return "blink";
    case Animation::Smile:    return "smile";
    case Animation::Laugh:    return "laugh";
    case Animation::Sad:      return "sad";
    case Animation::Surprise: return "surprise";
    case Animation::Think:    return "think";
    case Animation::Talk:     return "talk";
    case Animation::Heart:    return "heart";
    case Animation::Sleep:    return "sleep";
    case Animation::Wake:     return "wake";
    case Animation::Loading:  return "loading";
    default:                  return "idle";
  }
}

Animation animationFromName(const char* name) {
  if (name == nullptr) return Animation::Idle;
  for (uint8_t i = 0; i < static_cast<uint8_t>(Animation::Count); ++i) {
    const auto animation = static_cast<Animation>(i);
    if (std::strcmp(name, animationName(animation)) == 0) return animation;
  }
  return Animation::Idle;
}

Animation animationForMood(Mood mood) {
  switch (mood) {
    case Mood::Happy:     return Animation::Smile;
    case Mood::Sad:       return Animation::Sad;
    case Mood::Curious:   return Animation::Blink;
    case Mood::Thinking:  return Animation::Think;
    case Mood::Surprised: return Animation::Surprise;
    case Mood::Excited:   return Animation::Laugh;
    case Mood::Sleepy:    return Animation::Sleep;
    case Mood::Talking:   return Animation::Talk;
    case Mood::Love:      return Animation::Heart;
    case Mood::Normal:
    default:              return Animation::Idle;
  }
}

bool moodForAnimation(Animation animation, Mood& out) {
  switch (animation) {
    case Animation::Smile:    out = Mood::Happy;     return true;
    case Animation::Laugh:    out = Mood::Excited;   return true;
    case Animation::Sad:      out = Mood::Sad;       return true;
    case Animation::Surprise: out = Mood::Surprised; return true;
    case Animation::Think:    out = Mood::Thinking;  return true;
    case Animation::Talk:     out = Mood::Talking;   return true;
    case Animation::Heart:    out = Mood::Love;      return true;
    case Animation::Sleep:    out = Mood::Sleepy;    return true;
    // blink / idle / wake / loading: ruh haliyle ilgili bir şey söylemezler.
    default:                                          return false;
  }
}

AnimationEngine::AnimationEngine()
    : target_(Mood::Normal),
      previous_(Mood::Normal),
      moodChangedAt_(0),
      animation_(Animation::Idle),
      animationStartedAt_(0),
      animationDurationMs_(0),
      nextBlinkAt_(kBlinkMinMs),
      blinkStartedAt_(0),
      blinking_(false),
      gazeX_(0),
      gazeY_(0),
      random_(0x2545F491u) {}

uint32_t AnimationEngine::blinkInterval(uint32_t now) const {
  // xorshift: kütüphanesiz, hızlı, göz kırpma dağıtmaya fazlasıyla yeterli.
  random_ ^= random_ << 13;
  random_ ^= random_ >> 17;
  random_ ^= random_ << 5;
  return now + kBlinkMinMs + (random_ % kBlinkSpreadMs);
}

void AnimationEngine::setMood(Mood mood, uint32_t now) {
  if (mood == target_) return;
  // Geçiş ortasında yeni bir ruh hali gelirse, o ana kadar ulaşılan yüzden
  // devam etmek yerine hedeften başlamak sıçrama üretirdi; önceki hedefi
  // kaynak alıyoruz.
  previous_ = target_;
  target_ = mood;
  moodChangedAt_ = now;
}

void AnimationEngine::play(Animation animation, uint32_t now, uint32_t durationMs) {
  // Animasyon bir ruh hali ima ediyorsa yüz de oraya kaysın.
  Mood implied;
  if (moodForAnimation(animation, implied)) setMood(implied, now);

  animation_ = animation;
  animationStartedAt_ = now;
  animationDurationMs_ = durationMs == 0 ? kDefaultAnimationMs : durationMs;

  // Uyku ve yükleniyor kendiliğinden bitmez; durum değişene kadar sürer.
  if (animation == Animation::Sleep || animation == Animation::Loading) {
    animationDurationMs_ = 0;
  }
}

bool AnimationEngine::isPlaying(uint32_t now) const {
  if (animation_ == Animation::Idle) return false;
  if (animationDurationMs_ == 0) return true;
  return (now - animationStartedAt_) < animationDurationMs_;
}

void AnimationEngine::setGaze(int16_t x, int16_t y) {
  gazeX_ = x;
  gazeY_ = y;
}

void AnimationEngine::render(Canvas& canvas, uint32_t now) {
  // Süresi dolan animasyon ruh haline geri düşer; yoksa Elçin sonsuza kadar
  // gülmeye devam eder.
  if (animation_ != Animation::Idle && animationDurationMs_ > 0 &&
      (now - animationStartedAt_) >= animationDurationMs_) {
    animation_ = Animation::Idle;
  }

  const uint32_t sinceMood = now - moodChangedAt_;
  const int16_t t = sinceMood >= kMoodBlendMs
                        ? 256
                        : static_cast<int16_t>((sinceMood * 256) / kMoodBlendMs);
  FaceShape face = blendFace(faceFor(previous_), faceFor(target_), t);

  FaceOverlay overlay;
  overlay.gazeX = gazeX_;
  overlay.gazeY = gazeY_;

  // Göz kırpma: uyurken ya da gözü zaten kapalı tutan animasyonlarda gereksiz.
  const bool eyesAlreadyClosed =
      animation_ == Animation::Sleep || target_ == Mood::Sleepy;

  if (!eyesAlreadyClosed) {
    if (!blinking_ && now >= nextBlinkAt_) {
      blinking_ = true;
      blinkStartedAt_ = now;
    }
    if (blinking_ && (now - blinkStartedAt_) >= kBlinkMs) {
      blinking_ = false;
      nextBlinkAt_ = blinkInterval(now);
    }
    overlay.eyesClosed = blinking_;
  }

  const uint32_t since = now - animationStartedAt_;

  switch (animation_) {
    case Animation::Blink:
      overlay.eyesClosed = true;
      break;

    case Animation::Laugh:
      // Zıplama: üçgen dalga, sinüs tablosuna gerek yok.
      overlay.bounceY = static_cast<int16_t>(((since / 90) % 2) == 0 ? -2 : 1);
      overlay.mouthOpen = ((since / 140) % 2) == 0;
      break;

    case Animation::Talk:
      overlay.mouthOpen = ((since / 180) % 2) == 0;
      break;

    case Animation::Heart:
      overlay.hearts = true;
      break;

    case Animation::Sleep:
      overlay.eyesClosed = true;
      overlay.zzz = true;
      // Nefes alıyormuş gibi çok yavaş inip kalkma.
      overlay.bounceY = static_cast<int16_t>(((since / 1400) % 2) == 0 ? 0 : 1);
      break;

    case Animation::Think:
    case Animation::Loading:
      overlay.thinkingDots = static_cast<int8_t>((since / 300) % 4);
      break;

    case Animation::Surprise:
      overlay.bounceY = since < 160 ? -3 : 0;
      break;

    case Animation::Wake:
      // Gözler aralanarak açılır: ilk 200 ms kapalı, sonra normal.
      overlay.eyesClosed = since < 200;
      break;

    case Animation::Idle:
    case Animation::Smile:
    case Animation::Sad:
    default:
      break;
  }

  drawFace(canvas, face, overlay);
}

}  // namespace elcin
