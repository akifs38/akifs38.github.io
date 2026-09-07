import { Suspense, useRef, type RefObject } from 'react';
import { Canvas } from '@react-three/fiber';
import { ContactShadows, Stats } from '@react-three/drei';
import type { Group } from 'three';
import { useSelectionStore, useViewerStore } from '@/store';
import { CameraRig } from './CameraRig';
import { RobotModel } from './RobotModel';
import { SceneDebug } from './SceneDebug';
import { WiringHarness } from './WiringHarness';
import { useClippingPlanes } from './section';

/**
 * The 3D stage. Lighting is authored in-scene rather than pulled from an HDRI:
 * the studio ships to GitHub Pages with no CDN to lean on, and three lights
 * read the shells well enough that an environment map is not worth the fetch.
 */
export function RobotViewer({ className }: { className?: string }) {
  const container = useRef<HTMLDivElement>(null);
  const showStats = useViewerStore((s) => s.debug.stats);

  return (
    <div ref={container} className={className}>
      <Canvas
        dpr={[1, 2]}
        shadows
        camera={{ fov: 38, near: 0.01, far: 12, position: [0.19, 0.19, 0.23] }}
        // Section cuts are per-material, which three only honours with local
        // clipping switched on.
        onCreated={({ gl }) => {
          gl.localClippingEnabled = true;
        }}
      >
        <Scene />
      </Canvas>

      {/*
        stats.js positions itself fixed to the viewport, so .mochi-stats pins it
        back inside this container. The cast is safe: the ref is on the div
        wrapping this, so it is set before Stats can mount.
      */}
      {showStats && (
        <Stats parent={container as RefObject<HTMLElement>} className="mochi-stats" />
      )}
    </div>
  );
}

function Scene() {
  const modelRef = useRef<Group>(null);
  const clippingPlanes = useClippingPlanes();

  const wiringVisible = useViewerStore((s) => s.wiringVisible);
  const select = useSelectionStore((s) => s.select);

  return (
    <>
      <color attach="background" args={['#15171e']} />

      <ambientLight intensity={0.55} />
      <directionalLight
        position={[0.22, 0.34, 0.26]}
        intensity={2.4}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-near={0.01}
        shadow-camera-far={1.2}
        shadow-camera-left={-0.14}
        shadow-camera-right={0.14}
        shadow-camera-top={0.2}
        shadow-camera-bottom={-0.05}
        shadow-bias={-0.0006}
      />
      {/* Cool fill from the opposite side so the shadowed half is not dead. */}
      <directionalLight position={[-0.28, 0.14, -0.2]} intensity={0.7} color="#8fb4d8" />
      {/* Warm rim, picking the silhouette off the background. */}
      <directionalLight position={[0, 0.1, -0.34]} intensity={0.5} color="#f2a2b0" />

      {/* A click that reaches the floor is a click on nothing — drop selection. */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.0005, 0]}
        onClick={() => select(null)}
      >
        <planeGeometry args={[3, 3]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>

      <ContactShadows
        position={[0, 0.0002, 0]}
        scale={0.34}
        blur={2.4}
        far={0.12}
        opacity={0.5}
        color="#000000"
      />

      <Suspense fallback={null}>
        <group ref={modelRef}>
          <RobotModel clippingPlanes={clippingPlanes} />
        </group>
        {wiringVisible && <WiringHarness />}
      </Suspense>

      <SceneDebug modelRef={modelRef} />
      <CameraRig modelRef={modelRef} />
    </>
  );
}
