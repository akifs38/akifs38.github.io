/**
 * PlatformIO giriş noktası.
 *
 * Kasten boş: uygulamanın tamamı src/app/ElcinApp.cpp içinde, çünkü aynı kod
 * Arduino IDE tarafında Elcin.ino ile de derleniyor. Buraya mantık eklemek,
 * iki kabuğun birbirinden ayrı düşmesi demek.
 */

#include <Arduino.h>

#include "app/ElcinApp.h"

void setup() { elcin::appSetup(); }

void loop() { elcin::appLoop(); }
