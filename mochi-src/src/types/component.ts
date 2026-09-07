/** Logical model of everything the robot is made of. */

export type ComponentCategory =
  | 'structure'
  | 'actuator'
  | 'sensor'
  | 'display'
  | 'audio'
  | 'compute'
  | 'power'
  | 'interface'
  | 'wiring';

export type ComponentStatus = 'ok' | 'warning' | 'error' | 'unknown' | 'not-installed';

export type Vec3 = readonly [number, number, number];

/** Electrical facts. Absent for purely mechanical parts. */
export interface ElectricalSpec {
  /** GPIO numbers this part occupies on the board. */
  gpio?: number[];
  /** Nominal supply voltage in volts. */
  voltage?: number;
  /** Typical current draw in milliamps. */
  currentMa?: number;
  protocol?: 'gpio' | 'pwm' | 'i2c' | 'spi' | 'uart' | 'adc' | 'i2s' | 'analog' | 'power';
  /** I2C/SPI address when relevant, e.g. "0x3C". */
  address?: string;
}

/** Physical / catalogue facts shown in the part inspector. */
export interface PartSpec {
  partNumber?: string;
  material?: string;
  /** Grams. */
  weightG?: number;
  vendor?: string;
  quantity?: number;
}

export interface RobotComponent {
  id: string;
  name: string;
  category: ComponentCategory;
  description?: string;
  /** Parent component id; null for the assembly root. */
  parent: string | null;
  /**
   * Logical node key. Resolved to a real glTF node name through modelMapping,
   * so renaming nodes in Blender never touches application code.
   */
  modelNode: string;
  /** Local transform used by the placeholder model and as an explode origin. */
  position: Vec3;
  rotation?: Vec3;
  scale?: Vec3;
  /** Direction the part travels in exploded view (unit-ish vector). */
  explosionVector: Vec3;
  /** Multiplier on the global explode distance. */
  explosionDistance?: number;
  electrical?: ElectricalSpec;
  part?: PartSpec;
  status: ComponentStatus;
  /** Marks parts that Ghost mode makes transparent (outer shells). */
  isShell?: boolean;
  /** Placeholder geometry hint until the real GLB lands. */
  placeholder?: PlaceholderShape;
}

export interface PlaceholderShape {
  kind: 'box' | 'sphere' | 'cylinder' | 'capsule' | 'plane';
  size: Vec3;
  color: string;
}

export interface AssemblyNode {
  component: RobotComponent;
  children: AssemblyNode[];
  depth: number;
}
