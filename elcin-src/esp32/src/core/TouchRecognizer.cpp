#include "TouchRecognizer.h"

#include "ElcinConfig.h"

namespace elcin {

TouchConfig defaultTouchConfig() {
  return TouchConfig{
      ELCIN_TOUCH_DEBOUNCE_MS,
      ELCIN_TOUCH_DOUBLE_TAP_MS,
      ELCIN_TOUCH_LONG_PRESS_MS,
      ELCIN_TOUCH_VERY_LONG_MS,
  };
}

const char* gestureName(Gesture gesture) {
  switch (gesture) {
    case Gesture::TouchDown:     return "touch_down";
    case Gesture::TouchUp:       return "touch_up";
    case Gesture::SingleTap:     return "single_tap";
    case Gesture::DoubleTap:     return "double_tap";
    case Gesture::LongPress:     return "long_press";
    case Gesture::VeryLongPress: return "very_long_press";
    default:                     return "none";
  }
}

TouchRecognizer::TouchRecognizer(TouchConfig config)
    : config_(config),
      pressed_(false),
      pressedAt_(0),
      pendingTap_(false),
      lastReleaseAt_(0),
      hasLastRelease_(false),
      lastEdgeAt_(0),
      hasEdge_(false),
      longFired_(false),
      veryLongFired_(false) {}

GestureBatch TouchRecognizer::press(uint32_t now) {
  GestureBatch out;

  // Titreşim bastırma: çok hızlı gelen kenar gerçek bir dokunuş değildir.
  if (hasEdge_ && (now - lastEdgeAt_) < config_.debounceMs) return out;
  if (pressed_) return out;

  lastEdgeAt_ = now;
  hasEdge_ = true;
  pressed_ = true;
  pressedAt_ = now;
  longFired_ = false;
  veryLongFired_ = false;

  out.push(Gesture::TouchDown);
  return out;
}

GestureBatch TouchRecognizer::release(uint32_t now) {
  GestureBatch out;
  if (!pressed_) return out;
  if (hasEdge_ && (now - lastEdgeAt_) < config_.debounceMs) return out;

  lastEdgeAt_ = now;
  hasEdge_ = true;
  pressed_ = false;
  out.push(Gesture::TouchUp);

  // Uzun basışlar zaten basılı tutulurken bildirildi; bırakışta tap üretilmez.
  if (longFired_ || veryLongFired_) {
    pendingTap_ = false;
    hasLastRelease_ = false;
    return out;
  }

  const bool withinWindow =
      hasLastRelease_ && (now - lastReleaseAt_) <= config_.doubleTapWindowMs;

  if (pendingTap_ && withinWindow) {
    pendingTap_ = false;
    hasLastRelease_ = false;
    out.push(Gesture::DoubleTap);
    return out;
  }

  pendingTap_ = true;
  lastReleaseAt_ = now;
  hasLastRelease_ = true;
  return out;
}

GestureBatch TouchRecognizer::tick(uint32_t now) {
  GestureBatch out;

  if (pressed_) {
    const uint32_t held = now - pressedAt_;
    if (!veryLongFired_ && held >= config_.veryLongPressMs) {
      veryLongFired_ = true;
      out.push(Gesture::VeryLongPress);
    } else if (!longFired_ && held >= config_.longPressMs) {
      longFired_ = true;
      out.push(Gesture::LongPress);
    }
  }

  if (pendingTap_ && hasLastRelease_ &&
      (now - lastReleaseAt_) > config_.doubleTapWindowMs) {
    pendingTap_ = false;
    hasLastRelease_ = false;
    out.push(Gesture::SingleTap);
  }

  return out;
}

void TouchRecognizer::reset() {
  pressed_ = false;
  pressedAt_ = 0;
  pendingTap_ = false;
  lastReleaseAt_ = 0;
  hasLastRelease_ = false;
  lastEdgeAt_ = 0;
  hasEdge_ = false;
  longFired_ = false;
  veryLongFired_ = false;
}

}  // namespace elcin
