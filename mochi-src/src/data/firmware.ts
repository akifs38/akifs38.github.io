import type { FirmwareRelease } from '@/types';

/**
 * Release history for the reference firmware. Real builds get appended here (or
 * loaded from IndexedDB) once the firmware manager lands in Phase 8.
 */
export const FIRMWARE_RELEASES: FirmwareRelease[] = [
  {
    version: '0.4.2',
    board: 'esp32-c3',
    size: 734212,
    date: '2026-08-19',
    notes: 'Heartbeat now answers within one loop tick instead of waiting on the servo update.',
    features: ['ndjson-protocol', 'heartbeat', 'servo', 'oled', 'i2s-audio', 'ws2812'],
    installed: true,
  },
  {
    version: '0.4.0',
    board: 'esp32-c3',
    size: 731004,
    date: '2026-08-02',
    notes: 'Expression engine with blink and gaze idle behaviour.',
    features: ['ndjson-protocol', 'servo', 'oled', 'i2s-audio', 'ws2812'],
  },
  {
    version: '0.3.0',
    board: 'esp32-c3',
    size: 688340,
    date: '2026-07-14',
    notes: 'I²S audio path and volume control.',
    features: ['json-protocol', 'servo', 'oled', 'i2s-audio'],
  },
  {
    version: '0.2.0',
    board: 'esp32-c3',
    size: 512880,
    date: '2026-06-28',
    notes: 'Two-axis head control over the serial command parser.',
    features: ['json-protocol', 'servo', 'oled'],
  },
];
