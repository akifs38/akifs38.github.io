export type CameraPreset =
  | 'front'
  | 'back'
  | 'left'
  | 'right'
  | 'top'
  | 'bottom'
  | 'iso';

export type ExplodeGroup = 'all' | 'head' | 'body' | 'electronics' | 'base';

export interface SectionPlane {
  enabled: boolean;
  /** Normalised position along the axis, -1..1. */
  x: number;
  y: number;
  z: number;
  axis: 'x' | 'y' | 'z';
  flip: boolean;
}

export interface ViewerDebug {
  wireframe: boolean;
  grid: boolean;
  axes: boolean;
  boundingBox: boolean;
  normals: boolean;
  stats: boolean;
}
