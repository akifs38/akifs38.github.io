# Firmware testleri — masaüstünde, Arduino olmadan.
#
# src/core altındaki her şey taşınabilir C++'tır; donanıma dokunan kod
# src/hw'de durur ve buraya karışmaz. Bu ayrım sayesinde dokunma zamanlaması,
# durum geçişleri, yüz çizimi ve OTA kararları ESP32 olmadan sınanabiliyor.
#
#   make        → testleri koş
#   make render → yüzleri PGM olarak dök (tools/to_png.py ile PNG'ye çevrilir)

CXX      ?= g++
CXXFLAGS := -std=c++17 -Wall -Wextra -Wpedantic -Werror -O1 -g \
            -I../include -I. -fsanitize=address,undefined

CORE := $(wildcard ../src/core/*.cpp)
TESTS := main.cpp test_touch.cpp test_state.cpp test_protocol.cpp test_ota.cpp test_face.cpp

.PHONY: all clean render

all: run_tests
	./run_tests

run_tests: $(TESTS) $(CORE)
	$(CXX) $(CXXFLAGS) -o $@ $^

render: render_faces
	./render_faces

render_faces: render_faces.cpp $(CORE)
	$(CXX) $(CXXFLAGS) -o $@ $^

clean:
	rm -f run_tests render_faces
	rm -rf out
