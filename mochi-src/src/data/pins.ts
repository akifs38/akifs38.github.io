import type { PinAssignment } from '@/types';

/** Reference wiring for the Mochi build. Editable from the Electronics page. */
export const MOCHI_PIN_ASSIGNMENTS: PinAssignment[] = [
  { gpio: 0, componentId: 'microphone', direction: 'input', function: 'adc', label: 'Mic envelope' },
  { gpio: 1, componentId: 'battery', direction: 'input', function: 'adc', label: 'Battery sense' },
  { gpio: 2, componentId: 'button_top', direction: 'input', function: 'gpio', label: 'Top button' },
  { gpio: 3, componentId: 'rgb_led', direction: 'output', function: 'gpio', label: 'WS2812 data' },
  { gpio: 4, componentId: 'servo_head_pan', direction: 'output', function: 'pwm', label: 'Pan PWM' },
  { gpio: 5, componentId: 'servo_head_tilt', direction: 'output', function: 'pwm', label: 'Tilt PWM' },
  { gpio: 6, componentId: 'speaker', direction: 'output', function: 'gpio', label: 'I²S BCLK' },
  { gpio: 7, componentId: 'speaker', direction: 'output', function: 'gpio', label: 'I²S LRCLK' },
  { gpio: 8, componentId: 'display_oled', direction: 'bidirectional', function: 'i2c-sda', label: 'I²C SDA' },
  { gpio: 9, componentId: 'display_oled', direction: 'output', function: 'i2c-scl', label: 'I²C SCL' },
  { gpio: 10, componentId: 'speaker', direction: 'output', function: 'gpio', label: 'I²S DIN' },
];
