import { useMemo } from 'react';
import { Plane, Vector3 } from 'three';
import { useViewerStore } from '@/store';

/** The robot's half-extent, so a normalised -1..1 cut spans the whole body. */
const HALF_EXTENT = 0.075;
/** The body's centre height — a Y cut should sweep the robot, not the floor. */
const Y_CENTRE = 0.058;

const AXIS_NORMAL: Record<'x' | 'y' | 'z', Vector3> = {
  x: new Vector3(1, 0, 0),
  y: new Vector3(0, 1, 0),
  z: new Vector3(0, 0, 1),
};

/**
 * The section plane as three.js wants it: a normal and a signed distance from
 * the origin. Everything on the normal's positive side is clipped away, so
 * flipping the cut is a sign change on both, not a second plane.
 */
export function useClippingPlanes(): Plane[] {
  const section = useViewerStore((s) => s.section);

  return useMemo(() => {
    if (!section.enabled) return [];

    const { axis, flip } = section;
    const sign = flip ? -1 : 1;
    const centre = axis === 'y' ? Y_CENTRE : 0;
    const cut = centre + section[axis] * HALF_EXTENT;

    const normal = AXIS_NORMAL[axis].clone().multiplyScalar(sign);
    return [new Plane(normal, -cut * sign)];
  }, [section]);
}
