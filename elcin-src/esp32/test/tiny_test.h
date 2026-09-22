#pragma once

/**
 * Minik test koşucusu.
 *
 * Firmware testleri için ayrı bir bağımlılık çekmek istemedim: gtest indirmek
 * gerekmeden, herhangi bir makinede `make` ile koşsun. Yaptığı iş bir sayaç
 * ve birkaç makrodan ibaret.
 */

#include <cstdio>
#include <cstring>
#include <cstdint>

namespace tiny {

inline int& passed() { static int value = 0; return value; }
inline int& failed() { static int value = 0; return value; }
inline const char*& suite() { static const char* value = ""; return value; }

inline void report(bool ok, const char* expression, const char* file, int line) {
  if (ok) {
    ++passed();
    return;
  }
  ++failed();
  std::printf("  \033[31mFAIL\033[0m %s\n        %s:%d  %s\n", suite(), file, line, expression);
}

inline int summary() {
  std::printf("\n  %d gecti, %d kaldi\n", passed(), failed());
  return failed() == 0 ? 0 : 1;
}

}  // namespace tiny

#define SUITE(name) \
  tiny::suite() = name; \
  std::printf("\n\033[1m%s\033[0m\n", name)

#define CHECK(expr) tiny::report((expr), #expr, __FILE__, __LINE__)

#define CHECK_EQ(a, b)                                                     \
  do {                                                                     \
    const auto lhs__ = (a);                                                \
    const auto rhs__ = (b);                                                \
    const bool ok__ = (lhs__ == rhs__);                                    \
    if (!ok__) {                                                           \
      std::printf("        beklenen: %lld, gelen: %lld\n",                 \
                  static_cast<long long>(rhs__),                           \
                  static_cast<long long>(lhs__));                          \
    }                                                                      \
    tiny::report(ok__, #a " == " #b, __FILE__, __LINE__);                  \
  } while (0)

#define CHECK_STR(a, b)                                                    \
  do {                                                                     \
    const bool ok__ = (std::strcmp((a), (b)) == 0);                        \
    if (!ok__) std::printf("        beklenen: \"%s\"\n        gelen:    \"%s\"\n", (b), (a)); \
    tiny::report(ok__, #a " == " #b, __FILE__, __LINE__);                  \
  } while (0)
