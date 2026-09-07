# Wire protocol

Newline-delimited JSON. One object per line, in both directions. Protocol
version 1.

Chosen over a binary format because ArduinoJson can emit it from a few hundred
bytes of stack, and because a human debugging at 3am can read the raw stream in
a serial monitor. The cost is bandwidth, which at 115200 baud and one frame per
second is not a constraint.

## Framing rules

- Exactly one JSON object per line, terminated by `\n`.
- Lines longer than 512 bytes are discarded by the firmware with an
  `error/line_too_long`.
- A line that is not valid protocol JSON is *not* an error. The studio shows it
  in the console as device text, so `Serial.printf` debugging keeps working.
- Any browser→device frame may carry `id`. If it does, the device answers with a
  frame carrying the same `id`.

## Browser → device

| `type` | Fields | Answer |
| --- | --- | --- |
| `ping` | `ts` | `pong` with the same `id` and `ts` |
| `status.get` | — | `status` |
| `servo.set` | `servo`, `angle`, `ms?` | `ack`, then `event/servo.moved` |
| `led.set` | `r`, `g`, `b`, `brightness?` | `ack` |
| `expression.set` | `value` | `ack`, then `event/expression.changed` |
| `sound.play` | `clip`, `volume?` | `ack` |
| `sound.stop` | — | `ack` |
| `sensor.subscribe` | `sensors[]`, `intervalMs` | `ack`, then `sensor` frames |
| `sys.reboot` | — | `ack`, then a boot log |
| `sys.info` | — | `status` |

Servo names are `head_pan` and `head_tilt`. Expressions are `idle`, `happy`,
`sad`, `angry`, `sleep`, `surprised`, `confused`, `love`, `thinking`.

Angles are clamped twice — once in the studio for feedback, once in the firmware
because that is the side that can strip a gearbox.

## Device → browser

| `type` | Fields |
| --- | --- |
| `pong` | `ts` |
| `status` | `device`, `status{firmware, board, uptimeS, freeHeap, cpuLoad?, tempC?, batteryPct?, batteryMv?, wifi?, peripherals?}` |
| `log` | `level` (`debug`\|`info`\|`warn`\|`error`), `msg`, `t?` |
| `sensor` | `values{id: number}`, `t?` |
| `ack` | `of` |
| `error` | `code`, `msg` |
| `event` | `event`, `data?` |

Known events: `ready`, `servo.moved`, `expression.changed`.

## Examples

```jsonc
// studio
{"type":"ping","ts":1757251200000,"id":41}
// device
{"type":"pong","id":41,"ts":1757251200000}

// studio
{"type":"servo.set","servo":"head_pan","angle":120,"id":42}
// device
{"type":"ack","id":42,"of":"servo.set"}
{"type":"event","event":"servo.moved","data":{"servo":"head_pan","angle":120}}

// device, unprompted
{"type":"sensor","t":88400,"values":{"battery":86.4,"tempC":39.1,"micLevel":12.8}}
```

## Errors

| `code` | Meaning |
| --- | --- |
| `parse` | The line was not valid JSON |
| `line_too_long` | Frame exceeded 512 bytes |
| `unknown_type` | This firmware version does not implement that frame |
| `no_servo` | `servo.set` named a servo the firmware does not have |

`unknown_type` is how version skew is handled: an older firmware rejects a newer
frame by name instead of ignoring it silently.

## Adding a frame type

1. Add the interface to `src/types/protocol.ts` and to the `Outbound`/`Inbound`
   union.
2. Add a constructor to `src/services/protocol/frames.ts`.
3. Handle it in `DeviceSession.handleFrame` if it is inbound.
4. Add it to `MockTransport.handle` and to `onFrame` in the firmware.
5. Add a row to the table above.

Steps 4 and 5 are not optional. A frame the simulator does not understand cannot
be developed against without hardware, and a frame that is not in this table
does not exist as far as the next person is concerned.
