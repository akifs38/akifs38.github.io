import type { BoardDefinition, PinDefinition } from '@/types';

/**
 * ESP32-C3 pin table. Reserved pins are the ones the chip itself needs
 * (SPI flash, USB Serial/JTAG, UART0) — the pin map refuses to hand those out.
 * Strapping pins are *not* reserved: they are usable, but the UI warns because
 * their level is sampled at reset.
 */
const pins: PinDefinition[] = [
  { gpio: 0, label: 'GPIO0', capabilities: ['gpio', 'adc', 'pwm'], note: 'ADC1_CH0 · 32 kHz crystal input' },
  { gpio: 1, label: 'GPIO1', capabilities: ['gpio', 'adc', 'pwm'], note: 'ADC1_CH1' },
  {
    gpio: 2,
    label: 'GPIO2',
    capabilities: ['gpio', 'adc', 'pwm', 'strapping'],
    note: 'Strapping pin — must read HIGH at reset. Safe for a button wired to GND.',
  },
  { gpio: 3, label: 'GPIO3', capabilities: ['gpio', 'adc', 'pwm'], note: 'ADC1_CH3' },
  { gpio: 4, label: 'GPIO4', capabilities: ['gpio', 'adc', 'pwm', 'i2c-sda', 'spi'], note: 'ADC1_CH4 · JTAG MTMS' },
  { gpio: 5, label: 'GPIO5', capabilities: ['gpio', 'adc', 'pwm', 'i2c-scl', 'spi'], note: 'ADC2 — unreliable while Wi-Fi is on' },
  { gpio: 6, label: 'GPIO6', capabilities: ['gpio', 'pwm', 'spi'], note: 'JTAG MTCK' },
  { gpio: 7, label: 'GPIO7', capabilities: ['gpio', 'pwm', 'spi'], note: 'JTAG MTDO' },
  {
    gpio: 8,
    label: 'GPIO8',
    capabilities: ['gpio', 'pwm', 'i2c-sda', 'strapping'],
    note: 'Strapping pin · onboard LED on many dev boards',
  },
  {
    gpio: 9,
    label: 'GPIO9',
    capabilities: ['gpio', 'pwm', 'i2c-scl', 'strapping'],
    note: 'Strapping pin · BOOT button. Holding it LOW at reset enters download mode.',
  },
  { gpio: 10, label: 'GPIO10', capabilities: ['gpio', 'pwm', 'spi'] },
  { gpio: 11, label: 'GPIO11', capabilities: ['power'], reserved: true, reservedReason: 'VDD_SPI' },
  { gpio: 12, label: 'GPIO12', capabilities: ['spi'], reserved: true, reservedReason: 'SPI flash' },
  { gpio: 13, label: 'GPIO13', capabilities: ['spi'], reserved: true, reservedReason: 'SPI flash' },
  { gpio: 14, label: 'GPIO14', capabilities: ['spi'], reserved: true, reservedReason: 'SPI flash' },
  { gpio: 15, label: 'GPIO15', capabilities: ['spi'], reserved: true, reservedReason: 'SPI flash' },
  { gpio: 16, label: 'GPIO16', capabilities: ['spi'], reserved: true, reservedReason: 'SPI flash' },
  { gpio: 17, label: 'GPIO17', capabilities: ['spi'], reserved: true, reservedReason: 'SPI flash' },
  { gpio: 18, label: 'GPIO18', capabilities: ['usb'], reserved: true, reservedReason: 'USB D− (Serial/JTAG)' },
  { gpio: 19, label: 'GPIO19', capabilities: ['usb'], reserved: true, reservedReason: 'USB D+ (Serial/JTAG)' },
  { gpio: 20, label: 'GPIO20', capabilities: ['uart-rx', 'gpio'], reserved: true, reservedReason: 'UART0 RX' },
  { gpio: 21, label: 'GPIO21', capabilities: ['uart-tx', 'gpio'], reserved: true, reservedReason: 'UART0 TX' },
];

export const ESP32C3: BoardDefinition = {
  id: 'esp32-c3',
  name: 'ESP32-C3',
  vendor: 'Espressif',
  architecture: 'RISC-V 32-bit single core',
  flashBytes: 4 * 1024 * 1024,
  sramBytes: 400 * 1024,
  clockMhz: 160,
  defaultBaud: 115200,
  logicVoltage: 3.3,
  pins,
  capabilities: {
    wifi: true,
    bluetooth: 'ble',
    usbSerialJtag: true,
    otaCapable: true,
  },
};
