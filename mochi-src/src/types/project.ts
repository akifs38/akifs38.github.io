import type { RobotComponent } from './component';
import type { PinAssignment } from './board';

export interface ProjectMeta {
  name: string;
  slug: string;
  board: string;
  version: string;
  createdAt: string;
  updatedAt: string;
  description?: string;
}

export interface FirmwareRelease {
  version: string;
  board: string;
  /** Bytes. */
  size: number;
  date: string;
  notes?: string;
  features: string[];
  /** SHA-256 of the .bin, when known. */
  sha256?: string;
  /** True for the build currently reported by the device. */
  installed?: boolean;
}

export interface RobotProject {
  meta: ProjectMeta;
  components: RobotComponent[];
  pins: PinAssignment[];
  firmware: FirmwareRelease[];
  /** Logical component id -> glTF node name. */
  modelMapping: Record<string, string>;
}
