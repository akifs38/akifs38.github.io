# Firmware testleri — masaüstünde, Arduino olmadan.
#
# src/core altındaki her şey taşınabilir C++'tır; donanıma dokunan kod
# src/hw'de durur ve buraya karışmaz. Bu ayrım sayesinde dokunma zamanlaması,
# durum geçişleri, yüz çizimi ve OTA kararları ESP32 olmadan sınanabiliyor.
#
#   make         → testleri koş
#   make render  → yüzleri PGM olarak dök (tools/to_png.py ile PNG'ye çevrilir)
#   make arduino → donanım katmanını saplama Arduino başlıklarıyla derle

CXX      ?= g++
CXXFLAGS := -std=c++17 -Wall -Wextra -Wpedantic -Werror -O1 -g \
            -I../include -I. -fsanitize=address,undefined

CORE := $(wildcard ../src/core/*.cpp)
TESTS := main.cpp test_touch.cpp test_state.cpp test_protocol.cpp test_ota.cpp test_face.cpp

.PHONY: all clean render arduino

all: run_tests
	./run_tests

run_tests: $(TESTS) $(CORE)
	$(CXX) $(CXXFLAGS) -o $@ $^

render: render_faces
	./render_faces

render_faces: render_faces.cpp $(CORE)
	$(CXX) $(CXXFLAGS) -o $@ $^

# Donanım katmanı gerçek ESP32 araç zinciri olmadan derlenemez, ama kendi
# kodumuzdaki eksik include'lar ve yazım hataları asgari saplama başlıklarla
# yakalanabiliyor. 'WiFiClient was not declared' hatası tam olarak böyle bir
# hataydı ve ancak kullanıcının makinesinde ortaya çıkmıştı.
#
# Bu hedef gerçek kütüphane imzalarını DOĞRULAMAZ; yalnızca aptal hataları eler.
ARDUINO_SRC := $(wildcard ../arduino/Elcin/*.cpp)

arduino:
	@cp ../arduino/Elcin/Elcin.ino /tmp/elcin_ino_check.cpp
	$(CXX) -std=c++17 -Wall -Wextra -fsyntax-only \
	  -I../arduino/Elcin -Iarduino_stub \
	  $(ARDUINO_SRC) /tmp/elcin_ino_check.cpp
	@echo "  Arduino katmani: sozdizimi temiz"

clean:
	rm -f run_tests render_faces
	rm -rf out
