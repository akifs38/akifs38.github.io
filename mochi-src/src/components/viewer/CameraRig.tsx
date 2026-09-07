import { useEffect, useRef, type ComponentRef, type RefObject } from 'react';
import { OrbitControls } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import { Box3, MathUtils, Vector3, type Group, type PerspectiveCamera } from 'three';
import type { CameraPreset } from '@/types';
import { useSelectionStore, useViewerStore } from '@/store';

/**
 * Framing is measured, not guessed: the camera sits back far enough to hold the
 * model's actual bounding box, so an exploded assembly stays in shot instead of
 * bursting past the edges. The moment the user drags, the rig stops steering —
 * a view that fights the mouse is worse than one that is slightly off.
 */

/** Unit directions the camera sits along for each named view. */
const PRESET_DIRECTION: Record<CameraPreset, [number, number, number]> = {
  front: [0, 0.12, 1],
  back: [0, 0.12, -1],
  left: [-1, 0.12, 0],
  right: [1, 0.12, 0],
  top: [0, 1, 0.001],
  bottom: [0, -1, 0.001],
  iso: [0.72, 0.5, 0.86],
};

/** Breathing room around the bounding box, as a multiple of the fitted distance. */
const MARGIN = 1.35;

export function CameraRig({ modelRef }: { modelRef: RefObject<Group | null> }) {
  const controls = useRef<ComponentRef<typeof OrbitControls>>(null);
  const camera = useThree((s) => s.camera) as PerspectiveCamera;
  const viewport = useThree((s) => s.size);

  const cameraPreset = useViewerStore((s) => s.cameraPreset);
  const fitRequest = useViewerStore((s) => s.fitRequest);
  const explode = useViewerStore((s) => s.explode);
  const explodeGroup = useViewerStore((s) => s.explodeGroup);
  const hiddenIds = useSelectionStore((s) => s.hiddenIds);

  /** True once the user has orbited: their framing wins until they ask for ours. */
  const manual = useRef(false);
  /** Set when the thing being framed changed and the goal needs recomputing. */
  const stale = useRef(true);

  const goal = useRef(new Vector3());
  const focus = useRef(new Vector3());
  const box = useRef(new Box3());
  const extent = useRef(new Vector3());

  // Asking for a preset or a fit is asking for the framed view back.
  useEffect(() => {
    manual.current = false;
    stale.current = true;
  }, [cameraPreset, fitRequest]);

  // The model changed shape, so the framing that held it no longer does.
  useEffect(() => {
    stale.current = true;
  }, [explode, explodeGroup, hiddenIds, viewport.width, viewport.height]);

  useFrame((_, delta) => {
    if (manual.current) return;

    const group = modelRef.current;
    if (!group) return;

    if (stale.current) {
      group.updateWorldMatrix(true, true);
      box.current.setFromObject(group);
      if (box.current.isEmpty()) return;

      box.current.getCenter(focus.current);
      box.current.getSize(extent.current);

      // Fit the box's largest span in both axes and take the looser of the two,
      // so a wide assembly is framed by width and a tall one by height.
      const span = Math.max(extent.current.x, extent.current.y, extent.current.z);
      const fov = camera.fov * MathUtils.DEG2RAD;
      const byHeight = span / (2 * Math.tan(fov / 2));
      const byWidth = byHeight / camera.aspect;
      const distance = Math.max(byHeight, byWidth) * MARGIN;

      const [dx, dy, dz] = PRESET_DIRECTION[cameraPreset];
      goal.current
        .set(dx, dy, dz)
        .normalize()
        .multiplyScalar(distance)
        .add(focus.current);

      stale.current = false;
    }

    // Framerate-independent easing: the same approach at 30 fps and 144 fps.
    const t = 1 - Math.pow(0.002, delta);
    camera.position.lerp(goal.current, t);
    controls.current?.target.lerp(focus.current, t);
    controls.current?.update();
  });

  return (
    <OrbitControls
      ref={controls}
      enablePan
      enableDamping
      dampingFactor={0.08}
      minDistance={0.05}
      maxDistance={2}
      makeDefault
      // A drag is the user taking over; stop steering mid-gesture.
      onStart={() => {
        manual.current = true;
      }}
    />
  );
}
