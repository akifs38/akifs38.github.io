#include "tiny_test.h"

void testTouch();
void testState();
void testProtocol();
void testOta();
void testCanvas();
void testFace();
void testAnimation();
void testAnimationMood();
void testText();
void testBoot();

int main() {
  std::printf("\n\033[1mElçin firmware testleri\033[0m\n");
  testTouch();
  testState();
  testProtocol();
  testOta();
  testCanvas();
  testFace();
  testAnimation();
  testAnimationMood();
  testText();
  testBoot();
  return tiny::summary();
}
