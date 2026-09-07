/** Board abstraction — everything board-specific lives behind this. */

export type PinFunction =
  | 'gpio'
  | 'pwm'
  | 'adc'
  | 'i2c-sda'
  | 'i2c-scl'
  | 'spi'
  | 'uart-tx'
  | 'uart-rx'
  | 'usb'
  | 'strapping'
  | 'power'
  | 'ground';

export type PinDirection = 'input' | 'output' | 'bidirectional' | 'none';

export type PinUsage = 'free' | 'used' | 'reserved';

export interface PinDefinition {
  /** GPIO number, or -1 for power/ground pads. */
  gpio: number;
  label: string;
  /** Everything this pin is physically capable of. */
  capabilities: PinFunction[];
  /** Pins the chip needs for boot/flash/USB and that should not be reassigned. */
  reserved?: boolean;
  reservedReason?: string;
  note?: string;
}

export interface PinAssignment {
  gpio: number;
  componentId: string;
  direction: PinDirection;
  function: PinFunction;
  label: string;
}

export interface BoardCapabilities {
  wifi: boolean;
  bluetooth: 'none' | 'ble' | 'classic+ble';
  usbSerialJtag: boolean;
  otaCapable: boolean;
}

export interface BoardDefinition {
  id: string;
  name: string;
  vendor: string;
  architecture: string;
  flashBytes: number;
  sramBytes: number;
  clockMhz: number;
  defaultBaud: number;
  logicVoltage: number;
  pins: PinDefinition[];
  capabilities: BoardCapabilities;
}

/**
 * A BoardAdapter turns a BoardDefinition into behaviour. Adding ESP32-S3 or
 * RP2040 later means adding an adapter, not editing the UI.
 */
export interface BoardAdapter {
  readonly definition: BoardDefinition;
  /** Validates a pin assignment set before it is committed. */
  validateAssignments(assignments: PinAssignment[]): BoardValidationIssue[];
  /** Whether a firmware binary looks plausible for this board. */
  validateFirmware(file: { name: string; size: number }): BoardValidationIssue[];
  /** Serial port filters passed to navigator.serial.requestPort(). */
  serialFilters(): SerialPortFilter[];
}

export interface BoardValidationIssue {
  severity: 'error' | 'warning';
  message: string;
  gpio?: number;
}
