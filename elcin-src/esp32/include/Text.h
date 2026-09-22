#pragma once

/**
 * OLED metin motoru — Türkçe destekli.
 *
 * Sorun şu: Adafruit GFX'in gömülü fontu ASCII'dir; "Gülçin" yazdırmaya
 * kalkınca ekranda "GÃ¼lÃ§in" çıkar, çünkü UTF-8'in iki baytı iki ayrı
 * karakter sanılır.
 *
 * Çözüm iki parçalı:
 *   1. UTF-8 çözülür, kod noktası elde edilir.
 *   2. Türkçe harf için ayrı bitmap TUTULMAZ; temel harf çizilir ve üstüne
 *      aksan bindirilir. 'ö' = 'o' + iki nokta, 'ş' = 's' + sedilla,
 *      'ı' = 'i' eksi nokta.
 *
 * İkinci madde yalnızca 120 bayt flash tasarrufu değil: 'o' ile 'ö'nün aynı
 * gövdeyi paylaşması, birini düzeltip diğerini unutma ihtimalini ortadan
 * kaldırıyor.
 */

#include <cstdint>

#include "Canvas.h"

namespace elcin {

enum class Align : uint8_t { Left, Center, Right };

/** Metnin kaplayacağı piksel genişliği (ölçek dahil). */
int16_t textWidth(const char* utf8, int16_t scale = 1);

/** Tek satır çizer; sol üst köşe (x, y). Çizilen genişliği döndürür. */
int16_t drawText(Canvas& canvas, int16_t x, int16_t y, const char* utf8,
                 Ink ink = Ink::White, int16_t scale = 1);

/** Ekran genişliğine göre hizalanmış tek satır. */
int16_t drawTextAligned(Canvas& canvas, int16_t y, const char* utf8, Align align,
                        Ink ink = Ink::White, int16_t scale = 1);

/**
 * Sözcük sarmalı ile çok satırlı metin. Çizilen satır sayısını döndürür.
 * `maxLines` 0 ise sınır yok.
 */
int16_t drawWrapped(Canvas& canvas, int16_t x, int16_t y, int16_t width,
                    const char* utf8, Ink ink = Ink::White, int16_t scale = 1,
                    int16_t maxLines = 0);

/** Satır yüksekliği (satır arası dahil). */
int16_t lineHeight(int16_t scale = 1);

/**
 * UTF-8 çözücü. `index` okunan bayt sayısı kadar ilerletilir. Geçersiz dizide
 * takılıp sonsuz döngüye girmez: bir bayt atlayıp devam eder.
 */
uint32_t decodeUtf8(const char* text, uint16_t& index);

}  // namespace elcin
