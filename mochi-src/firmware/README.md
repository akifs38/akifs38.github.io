# Mochi firmware

Reference ESP32-C3 firmware. Speaks the protocol in
[`../docs/protocol.md`](../docs/protocol.md), which is the same protocol the
studio's simulator implements.

## Requirements

- Arduino IDE 2.x or arduino-cli, with the Espressif ESP32 core (3.x)
- Libraries: **ArduinoJson** v7, **ESP32Servo**

## Board settings

| Setting | Value |
| --- | --- |
| Board | ESP32C3 Dev Module |
| USB CDC On Boot | Enabled |
| Flash Size | 4 MB |
| Upload Speed | 921600 |

`USB CDC On Boot` matters. Without it the native USB Serial/JTAG port stays
silent and the studio will connect to a port that never answers.

## Flashing

```bash
arduino-cli compile --fqbn esp32:esp32:esp32c3:cdc_on_boot=cdc mochi
arduino-cli upload  --fqbn esp32:esp32:esp32c3:cdc_on_boot=cdc -p COM3 mochi
```

If the board does not appear, hold **BOOT**, tap **RESET**, release **BOOT** to
force download mode.

## Wiring

Pins are defined in `mochi/RobotConfig.h` and mirror `src/data/pins.ts`. Change
one and change the other, or the studio's pin map will describe a robot you do
not have.

Two things worth knowing before wiring:

- **GPIO9 is the BOOT pin.** It is used here as I²C SCL, which works because the
  bus pull-up keeps it high at reset. Holding it low during reset puts the chip
  in download mode instead of running your firmware.
- **The servos need their own 5 V.** Two SG90s stalling together pull well over
  an amp; running them off the board's regulator will brown out the MCU
  mid-command. Share ground, not the rail.

## Verifying without the studio

Open any serial monitor at 115200 with line ending set to newline and send:

```
{"type":"ping","ts":0,"id":1}
```

You should get `{"type":"pong","id":1,"ts":0}` back. If you get nothing, check
`USB CDC On Boot`. If you get `{"type":"error","code":"parse",...}`, your monitor
is sending CR only.
