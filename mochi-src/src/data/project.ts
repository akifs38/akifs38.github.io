import type { RobotProject } from '@/types';
import { MOCHI_COMPONENTS } from './components';
import { MOCHI_PIN_ASSIGNMENTS } from './pins';
import { FIRMWARE_RELEASES } from './firmware';
import { MODEL_MAPPING } from './modelMapping';

export const DEFAULT_PROJECT: RobotProject = {
  meta: {
    name: 'Mochi Robot',
    slug: 'mochi-robot',
    board: 'esp32-c3',
    version: '0.1.0',
    createdAt: '2026-06-01T09:00:00.000Z',
    updatedAt: new Date().toISOString(),
    description: 'ESP32-C3 desktop companion. Two-axis head, OLED face, I²S voice.',
  },
  components: MOCHI_COMPONENTS,
  pins: MOCHI_PIN_ASSIGNMENTS,
  firmware: FIRMWARE_RELEASES,
  modelMapping: MODEL_MAPPING,
};
