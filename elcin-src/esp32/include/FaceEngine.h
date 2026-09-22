#pragma once

/**
 * OLED yüz motoru.
 *
 * Web'deki faceGeometry.ts'in karşılığı: aynı ifadeler, aynı oranlar, ama
 * 128×64 tek renkli ekrana göre yeniden ölçeklenmiş. Web'de Elçin gülerken
 * cihazda da aynı yüzü görmek, iki Elçin'in tek Elçin gibi hissettirmesinin
 * temel şartı.
 *
 * Yüz sayılarla tanımlı, bitmap olarak değil. Bunun sebebi yer değil ifade:
 * iki yüz arasında ara değer alınabildiği için Elçin bir ifadeden diğerine
 * kayarak geçiyor, kare atlayarak değil.
 */

#include <cstdint>

#include "Canvas.h"

namespace elcin {

enum class Mood : uint8_t {
  Normal,
  Happy,
  Sad,
  Curious,
  Thinking,
  Surprised,
  Excited,
  Sleepy,
  Talking,
  Love,
  Count,
};

const char* moodName(Mood mood);
/** Sunucudan gelen metni Mood'a çevirir; tanınmayan değer Normal olur. */
Mood moodFromName(const char* name);

struct EyeShape {
  int16_t width;
  int16_t height;
  int16_t radius;
  int16_t offsetY;
  /** Kaş eğimi: +yukarı dış uç, -aşağı dış uç. 0 = kaş yok. */
  int16_t browTilt;
  bool brow;
};

struct MouthShape {
  /** Yay yüksekliği: + gülümseme, - üzgün, 0 düz. */
  int16_t curve;
  int16_t width;
  /** Açıklık; 0'dan büyükse ağız dolu çizilir. */
  int16_t open;
  int16_t offsetY;
};

struct FaceShape {
  EyeShape eye;
  MouthShape mouth;
  /** Yanak işareti görünsün mü (OLED'de allık yok, küçük çizgiler var). */
  bool blush;
};

/** Ruh haline karşılık gelen yüz. */
FaceShape faceFor(Mood mood);

/** İki yüz arasında ara değer; t 0..256 (sabit nokta, FPU yok). */
FaceShape blendFace(const FaceShape& from, const FaceShape& to, int16_t t);

/** Yüzü çizerken uygulanan anlık etkiler. */
struct FaceOverlay {
  /** Gözler kapalı (göz kırpma / uyku). */
  bool eyesClosed = false;
  /** Ağız konuşma karesinde. */
  bool mouthOpen = false;
  /** Kalpler. */
  bool hearts = false;
  /** Uyku baloncukları. */
  bool zzz = false;
  /** Düşünme noktaları; 0..3 kaç tanesinin yandığı. */
  int8_t thinkingDots = -1;
  /** Bakış kayması (piksel). */
  int16_t gazeX = 0;
  int16_t gazeY = 0;
  /** Tüm yüzün dikey kayması — zıplama. */
  int16_t bounceY = 0;
};

/** Yüzü tampona çizer. Tamponu temizlemez; arka planı çağıran hazırlar. */
void drawFace(Canvas& canvas, const FaceShape& face, const FaceOverlay& overlay);

/** Kısayol: ruh halinden doğrudan çiz. */
void drawMood(Canvas& canvas, Mood mood, const FaceOverlay& overlay = FaceOverlay{});

}  // namespace elcin
