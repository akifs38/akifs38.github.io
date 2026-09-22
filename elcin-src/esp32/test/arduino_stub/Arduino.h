#pragma once
/*
  ASGARİ ARDUINO SAPLAMASI — yalnızca derleme denetimi için.

  Bu başlıklar gerçek Arduino kütüphaneleri DEĞİL. Amaçları tek: donanım
  katmanındaki kendi kodumuzu masaüstünde sözdizimi kontrolünden geçirmek.
  Eksik include, yazım hatası, yanlış değişken adı, yanlış argüman sayısı
  burada yakalanır.

  YAKALAMADIKLARI: gerçek kütüphane imzalarının buradakilerle aynı olup
  olmadığı. Bu yüzden burada geçmek "cihazda derlenir" demek değildir;
  yalnızca "aptal hata kalmadı" demektir.
*/
#include <cstdint>
#include <cstdio>
#include <cstring>
#include <string>

#define HIGH 1
#define LOW 0
#define INPUT 0
#define OUTPUT 1
#define ESP_IDF_VERSION_MAJOR 5

unsigned long millis();
void delay(unsigned long ms);
void pinMode(uint8_t pin, uint8_t mode);
int digitalRead(uint8_t pin);

class Stream {
 public:
  int available();
  size_t readBytes(uint8_t* buffer, size_t length);
};

class String {
 public:
  String();
  String(const char* s);
  const char* c_str() const;
  unsigned length() const;
  bool isEmpty() const;
  int indexOf(char c) const;
  int indexOf(char c, int from) const;
  int indexOf(const String& s) const;
  String substring(int from) const;
  String substring(int from, int to) const;
  long toInt() const;
  bool equalsIgnoreCase(const char* other) const;
  bool startsWith(const char* prefix) const;
  char operator[](int i) const;
  String operator+(const String& other) const;
  String operator+(const char* other) const;
};
String operator+(const char* lhs, const String& rhs);

class SerialClass {
 public:
  void begin(unsigned long baud);
  void println(const char* text);
  void printf(const char* fmt, ...);
};
extern SerialClass Serial;

class EspClass {
 public:
  void restart();
  uint32_t getFreeSketchSpace();
};
extern EspClass ESP;

class TwoWire {
 public:
  void begin(int sda, int scl);
  void setClock(uint32_t hz);
};
extern TwoWire Wire;
