import type {
  BoardAdapter,
  BoardDefinition,
  BoardValidationIssue,
  PinAssignment,
} from '@/types';
import { ESP32C3 } from '@/data/esp32c3';

const ESP_MAGIC = 0xe9;

export class ESP32C3Adapter implements BoardAdapter {
  readonly definition: BoardDefinition = ESP32C3;

  validateAssignments(assignments: PinAssignment[]): BoardValidationIssue[] {
    const issues: BoardValidationIssue[] = [];
    const seen = new Map<number, PinAssignment[]>();

    for (const assignment of assignments) {
      const pin = this.definition.pins.find((p) => p.gpio === assignment.gpio);

      if (!pin) {
        issues.push({
          severity: 'error',
          gpio: assignment.gpio,
          message: `GPIO${assignment.gpio} does not exist on ${this.definition.name}.`,
        });
        continue;
      }

      if (pin.reserved) {
        issues.push({
          severity: 'error',
          gpio: pin.gpio,
          message: `${pin.label} is taken by ${pin.reservedReason}. Pick another pin.`,
        });
      }

      if (pin.capabilities.includes('strapping')) {
        issues.push({
          severity: 'warning',
          gpio: pin.gpio,
          message: `${pin.label} is a strapping pin. Its level at reset decides the boot mode — keep it idle-high.`,
        });
      }

      if (assignment.function === 'pwm' && !pin.capabilities.includes('pwm')) {
        issues.push({
          severity: 'error',
          gpio: pin.gpio,
          message: `${pin.label} cannot output PWM.`,
        });
      }

      if (assignment.function === 'adc' && !pin.capabilities.includes('adc')) {
        issues.push({
          severity: 'error',
          gpio: pin.gpio,
          message: `${pin.label} has no ADC channel.`,
        });
      }

      if (assignment.gpio === 5 && assignment.function === 'adc') {
        issues.push({
          severity: 'warning',
          gpio: 5,
          message: 'GPIO5 is on ADC2, which the radio takes over. Readings stall while Wi-Fi is up.',
        });
      }

      const list = seen.get(assignment.gpio) ?? [];
      list.push(assignment);
      seen.set(assignment.gpio, list);
    }

    for (const [gpio, list] of seen) {
      if (list.length > 1) {
        const owners = [...new Set(list.map((a) => a.componentId))];
        if (owners.length > 1) {
          issues.push({
            severity: 'error',
            gpio,
            message: `GPIO${gpio} is claimed by ${owners.join(' and ')}.`,
          });
        }
      }
    }

    return issues;
  }

  validateFirmware(file: { name: string; size: number }): BoardValidationIssue[] {
    const issues: BoardValidationIssue[] = [];
    if (!file.name.toLowerCase().endsWith('.bin')) {
      issues.push({ severity: 'error', message: 'Firmware must be a .bin image.' });
    }
    if (file.size < 64 * 1024) {
      issues.push({ severity: 'error', message: 'Image is too small to be a valid application.' });
    }
    if (file.size > this.definition.flashBytes) {
      issues.push({
        severity: 'error',
        message: `Image is larger than the ${Math.round(this.definition.flashBytes / 1024 / 1024)} MB flash.`,
      });
    }
    return issues;
  }

  /** The first byte of an ESP application image. Checked before any upload. */
  static hasEspMagicByte(bytes: Uint8Array): boolean {
    return bytes.length > 0 && bytes[0] === ESP_MAGIC;
  }

  serialFilters(): SerialPortFilter[] {
    // Espressif's USB Serial/JTAG plus the two common USB-UART bridges.
    return [
      { usbVendorId: 0x303a },
      { usbVendorId: 0x10c4 },
      { usbVendorId: 0x1a86 },
    ];
  }
}

export const esp32c3Adapter = new ESP32C3Adapter();
