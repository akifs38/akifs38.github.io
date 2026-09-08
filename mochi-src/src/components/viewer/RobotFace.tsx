import { useRef } from 'react';
import { RoundedBoxGeometry } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import type { Mesh, Plane } from 'three';

/**
 * The eyes, drawn on the OLED's front face.
 *
 * This is the part doing its actual job — the display exists to show a face —
 * not invented hardware. The blink is model idle, though: it says nothing about
 * a connected device, and expression state from the protocol replaces it once
 * the control screen can drive it.
 */

const EYE_COLOR = '#dff6ff';
/** Screen half-depth plus a hair, so the eyes sit on the glass, not in it. */
const EYE_Z = 0.0014;

export function RobotFace({ clippingPlanes }: { clippingPlanes: Plane[] }) {
  const left = useRef<Mesh>(null);
  const right = useRef<Mesh>(null);

  const elapsed = useRef(0);
  const nextBlink = useRef(2.5);
  /** Seconds into the current blink, or -1 when the eyes are simply open. */
  const blink = useRef(-1);

  const stillPreferred =
    typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

  useFrame((_, delta) => {
    if (stillPreferred) return;

    elapsed.current += delta;
    if (blink.current < 0 && elapsed.current >= nextBlink.current) blink.current = 0;

    let open = 1;
    if (blink.current >= 0) {
      blink.current += delta;
      const duration = 0.14;
      if (blink.current >= duration) {
        blink.current = -1;
        // Irregular spacing; a metronome blink reads as a screensaver.
        nextBlink.current = elapsed.current + 2 + Math.random() * 4;
      } else {
        open = Math.max(0.06, Math.abs(Math.cos(Math.PI * (blink.current / duration))));
      }
    }

    if (left.current) left.current.scale.y = open;
    if (right.current) right.current.scale.y = open;
  });

  return (
    <group position={[0, 0, EYE_Z]}>
      {([-0.0078, 0.0078] as const).map((x, i) => (
        <mesh key={x} ref={i === 0 ? left : right} position={[x, 0, 0]}>
          <RoundedBoxGeometry args={[0.008, 0.0116, 0.0008]} radius={0.0031} smoothness={4} />
          <meshBasicMaterial color={EYE_COLOR} toneMapped={false} clippingPlanes={clippingPlanes} />
        </mesh>
      ))}
    </group>
  );
}
