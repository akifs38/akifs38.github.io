#include "FaceEngine.h"

#include <cstring>

namespace elcin {
namespace {

// Yüz yerleşimi. Gözler ekranın üst yarısında, ağız altında; Elçin'in yüzü
// 128×64'ün tamamına yayılır, ortada küçük bir kutuya sıkışmaz.
constexpr int16_t kEyeLeftX = 44;
constexpr int16_t kEyeRightX = 84;
constexpr int16_t kEyeY = 26;
constexpr int16_t kMouthY = 48;
constexpr int16_t kMouthCenterX = 64;

int16_t mix(int16_t a, int16_t b, int16_t t) {
  return static_cast<int16_t>(a + ((b - a) * t) / 256);
}

/**
 * Uyku baloncukları.
 *
 * Metin motoru yerine elle çiziliyor: iki 'z' için font çağırmak, yazı
 * yerleşimini yüz çizimine bağlardı. Üç farklı boyda 'z' yükseklik hissi verir.
 */
void drawSleepZ(Canvas& canvas) {
  const int16_t sizes[3] = {3, 4, 6};
  const int16_t xs[3] = {100, 107, 115};
  const int16_t ys[3] = {20, 12, 2};

  for (int16_t i = 0; i < 3; ++i) {
    const int16_t s = sizes[i];
    const int16_t x = xs[i];
    const int16_t y = ys[i];
    canvas.hLine(x, y, s, Ink::White);
    canvas.line(static_cast<int16_t>(x + s - 1), y, x, static_cast<int16_t>(y + s - 1),
                Ink::White);
    canvas.hLine(x, static_cast<int16_t>(y + s - 1), s, Ink::White);
  }
}

}  // namespace

const char* moodName(Mood mood) {
  switch (mood) {
    case Mood::Normal:    return "normal";
    case Mood::Happy:     return "happy";
    case Mood::Sad:       return "sad";
    case Mood::Curious:   return "curious";
    case Mood::Thinking:  return "thinking";
    case Mood::Surprised: return "surprised";
    case Mood::Excited:   return "excited";
    case Mood::Sleepy:    return "sleepy";
    case Mood::Talking:   return "talking";
    case Mood::Love:      return "love";
    default:              return "normal";
  }
}

Mood moodFromName(const char* name) {
  if (name == nullptr) return Mood::Normal;
  for (uint8_t i = 0; i < static_cast<uint8_t>(Mood::Count); ++i) {
    const auto mood = static_cast<Mood>(i);
    if (std::strcmp(name, moodName(mood)) == 0) return mood;
  }
  return Mood::Normal;
}

FaceShape faceFor(Mood mood) {
  switch (mood) {
    case Mood::Happy:
      return {{20, 18, 8, 0, 0, false}, {6, 34, 0, 1}, true};
    case Mood::Excited:
      return {{22, 26, 10, 0, 0, false}, {8, 38, 10, 2}, true};
    case Mood::Sad:
      return {{20, 18, 8, 3, 4, true}, {-6, 26, 0, 4}, false};      // üzgün: iç uçlar yukarı
    case Mood::Curious:
      return {{21, 25, 9, 0, 3, true}, {1, 16, 4, 1}, false};       // meraklı: kaşlar kalkık
    case Mood::Thinking:
      return {{18, 15, 7, -2, -3, true}, {0, 14, 0, 2}, false};     // düşünceli: hafif çatık
    case Mood::Surprised:
      return {{26, 28, 12, 0, 5, true}, {0, 22, 18, 2}, false};     // şaşkın: kaşlar havada, ağız açık
    case Mood::Sleepy:
      return {{22, 4, 2, 3, 0, false}, {2, 14, 4, 3}, true};
    case Mood::Talking:
      return {{20, 22, 9, 0, 0, false}, {4, 28, 9, 1}, false};
    case Mood::Love:
      return {{22, 20, 10, 0, 0, false}, {6, 28, 0, 1}, true};
    case Mood::Normal:
    default:
      return {{20, 24, 9, 0, 0, false}, {3, 26, 0, 0}, false};
  }
}

FaceShape blendFace(const FaceShape& from, const FaceShape& to, int16_t t) {
  if (t <= 0) return from;
  if (t >= 256) return to;

  FaceShape out{};
  out.eye.width = mix(from.eye.width, to.eye.width, t);
  out.eye.height = mix(from.eye.height, to.eye.height, t);
  out.eye.radius = mix(from.eye.radius, to.eye.radius, t);
  out.eye.offsetY = mix(from.eye.offsetY, to.eye.offsetY, t);
  out.eye.browTilt = mix(from.eye.browTilt, to.eye.browTilt, t);
  // Kaş ve yanak ikili: yarı yolda hedefe geçerler, yoksa yarım kaş çizilir.
  out.eye.brow = t > 128 ? to.eye.brow : from.eye.brow;
  out.mouth.curve = mix(from.mouth.curve, to.mouth.curve, t);
  out.mouth.width = mix(from.mouth.width, to.mouth.width, t);
  out.mouth.open = mix(from.mouth.open, to.mouth.open, t);
  out.mouth.offsetY = mix(from.mouth.offsetY, to.mouth.offsetY, t);
  out.blush = t > 128 ? to.blush : from.blush;
  return out;
}

void drawFace(Canvas& canvas, const FaceShape& face, const FaceOverlay& overlay) {
  const int16_t dy = static_cast<int16_t>(overlay.bounceY + overlay.gazeY);
  const int16_t dx = overlay.gazeX;

  const int16_t eyeH = overlay.eyesClosed ? 3 : face.eye.height;
  const int16_t eyeY = static_cast<int16_t>(kEyeY + face.eye.offsetY + dy);

  // Gözler
  for (int16_t i = 0; i < 2; ++i) {
    const int16_t cx = static_cast<int16_t>((i == 0 ? kEyeLeftX : kEyeRightX) + dx);
    const int16_t x = static_cast<int16_t>(cx - face.eye.width / 2);
    const int16_t y = static_cast<int16_t>(eyeY - eyeH / 2);
    int16_t radius = face.eye.radius;
    if (radius > eyeH / 2) radius = static_cast<int16_t>(eyeH / 2);
    canvas.fillRoundRect(x, y, face.eye.width, eyeH, radius, Ink::White);

    // Göz parıltısı: küçük bir delik, bakışa canlılık veriyor.
    if (!overlay.eyesClosed && eyeH > 10) {
      canvas.fillRect(static_cast<int16_t>(cx + 3), static_cast<int16_t>(eyeY - 5), 3, 3,
                      Ink::Black);
    }
  }

  /*
    Kaşlar.

    İşaret kuralı: browTilt > 0 → İÇ uç yukarı (endişeli, meraklı, şaşkın),
    browTilt < 0 → iç uç aşağı (çatık, düşünceli). Bu kural ilk yazımda ters
    kurulmuştu ve "meraklı" Elçin ekranda kızgın görünüyordu — 1 bit ekranda
    ifadeyi taşıyan başlıca şey kaş açısı olduğu için fark hemen belli oluyor.
  */
  if (face.eye.brow) {
    const int16_t browY = static_cast<int16_t>(eyeY - eyeH / 2 - 7);
    const int16_t half = static_cast<int16_t>(face.eye.width / 2 + 1);
    const int16_t tilt = face.eye.browTilt;

    for (int16_t i = 0; i < 2; ++i) {
      const int16_t cx = static_cast<int16_t>((i == 0 ? kEyeLeftX : kEyeRightX) + dx);
      // Sol gözün iç ucu sağda, sağ gözünki solda: aynalama burada.
      const int16_t innerX = static_cast<int16_t>(i == 0 ? cx + half : cx - half);
      const int16_t outerX = static_cast<int16_t>(i == 0 ? cx - half : cx + half);

      for (int16_t thickness = 0; thickness < 2; ++thickness) {
        canvas.line(outerX, static_cast<int16_t>(browY + tilt + thickness), innerX,
                    static_cast<int16_t>(browY - tilt + thickness), Ink::White);
      }
    }
  }

  // Ağız
  const int16_t mouthY = static_cast<int16_t>(kMouthY + face.mouth.offsetY + dy);
  const int16_t half = static_cast<int16_t>(face.mouth.width / 2);
  const int16_t left = static_cast<int16_t>(kMouthCenterX - half);
  const int16_t right = static_cast<int16_t>(kMouthCenterX + half);
  const int16_t open = overlay.mouthOpen && face.mouth.open < 8
                           ? 8
                           : face.mouth.open;

  if (open <= 1) {
    canvas.quadCurve(left, mouthY, kMouthCenterX,
                     static_cast<int16_t>(mouthY + face.mouth.curve * 2), right, mouthY,
                     Ink::White, 2);
  } else {
    // Açık ağız: üst yay + alt yay arasını doldur. Satır satır tarama, kapalı
    // şekli poligon kırpmadan doldurmanın en ucuz yolu.
    const int16_t bottom = static_cast<int16_t>(mouthY + open);
    for (int16_t y = mouthY; y <= bottom; ++y) {
      // Elips kesiti: w = half * sqrt(1 - (dy/open)^2).
      //
      // Karekök şart: oranı doğrudan kullanmak (w ~ 1 - t^2) uçları sivriltip
      // ağzı baklava dilimine çeviriyordu. Tamsayı karekök, FPU'su olmayan
      // C3'te de ucuz.
      const int32_t dyr = static_cast<int32_t>(y - mouthY) * 2 - open;
      const int32_t squared = 65536 - (dyr * dyr * 65536) / (static_cast<int32_t>(open) * open);
      if (squared <= 0) continue;

      int32_t root = 256;
      for (int8_t iteration = 0; iteration < 6; ++iteration) {
        root = (root + squared / root) / 2;  // Newton
      }

      int16_t w = static_cast<int16_t>((half * root) / 256);
      if (w < 1) w = 1;
      canvas.hLine(static_cast<int16_t>(kMouthCenterX - w), y, static_cast<int16_t>(w * 2),
                   Ink::White);
    }
  }

  /*
    Yanaklar bilinçli olarak çizilmiyor.

    Web'deki allık, yüzün dairesel gövdesi üstünde durduğu için yanak okunuyor.
    OLED'de gövde yok — siyah boşlukta duran iki çizgi allık değil, ekranda
    unutulmuş iki çizgi gibi görünüyordu. `blush` alanı yapıda kalıyor: 3D
    avatar ya da renkli ekran geldiğinde karşılığı var.
  */
  (void)face.blush;

  // Kalpler
  if (overlay.hearts) {
    const int16_t spots[2][2] = {{14, 14}, {110, 10}};
    for (const auto& spot : spots) {
      const int16_t x = spot[0];
      const int16_t y = spot[1];
      canvas.fillCircle(static_cast<int16_t>(x - 2), y, 2, Ink::White);
      canvas.fillCircle(static_cast<int16_t>(x + 2), y, 2, Ink::White);
      // Uç: iki daireden aşağı daralan üçgen.
      for (int16_t i = 0; i < 5; ++i) {
        canvas.hLine(static_cast<int16_t>(x - 4 + i), static_cast<int16_t>(y + 1 + i),
                     static_cast<int16_t>(9 - 2 * i), Ink::White);
      }
    }
  }

  // Uyku baloncukları
  if (overlay.zzz) {
    drawSleepZ(canvas);
  }

  // Düşünme noktaları
  if (overlay.thinkingDots >= 0) {
    for (int16_t i = 0; i < 3; ++i) {
      const int16_t x = static_cast<int16_t>(104 + i * 8);
      if (i < overlay.thinkingDots) canvas.fillCircle(x, 10, 2, Ink::White);
      else canvas.circle(x, 10, 2, Ink::White);
    }
  }
}

void drawMood(Canvas& canvas, Mood mood, const FaceOverlay& overlay) {
  drawFace(canvas, faceFor(mood), overlay);
}

}  // namespace elcin
