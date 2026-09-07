#pragma once

// Pin assignments. These mirror src/data/pins.ts in the studio — if you change
// one, change the other, or the pin map will describe a robot you do not have.

#define PIN_MIC_ADC        0   // ADC1_CH0, MAX9814 envelope
#define PIN_BATTERY_ADC    1   // ADC1_CH1, 2:1 divider
#define PIN_BUTTON         2   // strapping pin, tact switch to GND
#define PIN_LED_DATA       3   // WS2812B
#define PIN_SERVO_PAN      4
#define PIN_SERVO_TILT     5
#define PIN_I2S_BCLK       6
#define PIN_I2S_LRCLK      7
#define PIN_I2C_SDA        8
#define PIN_I2C_SCL        9   // strapping pin / BOOT — keep the pull-up
#define PIN_I2S_DIN        10

#define OLED_ADDRESS       0x3C
#define SERIAL_BAUD        115200

#define FIRMWARE_VERSION   "0.4.2"
#define BOARD_ID           "esp32-c3"
#define DEVICE_NAME        "mochi"
#define PROTOCOL_VERSION   1

// Servo travel limits, degrees. The studio clamps too, but the firmware is the
// thing that can actually strip a gearbox, so it clamps last.
#define PAN_MIN            30
#define PAN_MAX            150
#define TILT_MIN           55
#define TILT_MAX           125

#define HEARTBEAT_TIMEOUT_MS  8000   // studio pings every 2 s; miss 3 and drop
#define SENSOR_INTERVAL_MS    1000
