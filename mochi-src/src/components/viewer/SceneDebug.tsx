import { useEffect, useState, type RefObject } from 'react';
import { Grid } from '@react-three/drei';
import { Box3, Mesh, type Group } from 'three';
import { VertexNormalsHelper } from 'three/examples/jsm/helpers/VertexNormalsHelper.js';
import { useViewerStore } from '@/store';

/**
 * The inspection overlays. Each reads the live model group rather than the raw
 * component data, so what they measure is what is actually on screen — explode
 * offsets and hidden parts included.
 */
export function SceneDebug({ modelRef }: { modelRef: RefObject<Group | null> }) {
  const debug = useViewerStore((s) => s.debug);
  const explode = useViewerStore((s) => s.explode);
  const explodeGroup = useViewerStore((s) => s.explodeGroup);

  return (
    <>
      {debug.grid && (
        <Grid
          args={[1, 1]}
          cellSize={0.01}
          cellThickness={0.5}
          cellColor="#2c313f"
          sectionSize={0.05}
          sectionThickness={1}
          sectionColor="#414a5e"
          fadeDistance={0.9}
          fadeStrength={1.5}
          followCamera={false}
          infiniteGrid
        />
      )}

      {debug.axes && <axesHelper args={[0.09]} />}

      {debug.boundingBox && <BoundingBox modelRef={modelRef} signature={`${explode}:${explodeGroup}`} />}

      {debug.normals && <Normals modelRef={modelRef} signature={`${explode}:${explodeGroup}`} />}
    </>
  );
}

function BoundingBox({
  modelRef,
  signature,
}: {
  modelRef: RefObject<Group | null>;
  signature: string;
}) {
  const [box, setBox] = useState<Box3 | null>(null);

  useEffect(() => {
    const group = modelRef.current;
    if (!group) return;

    // A frame's grace, so the offsets applied this render are in the matrices.
    const id = requestAnimationFrame(() => {
      group.updateWorldMatrix(true, true);
      const next = new Box3().setFromObject(group);
      setBox(next.isEmpty() ? null : next);
    });
    return () => cancelAnimationFrame(id);
  }, [modelRef, signature]);

  if (!box) return null;
  return <box3Helper args={[box, '#5fd3d8']} />;
}

function Normals({
  modelRef,
  signature,
}: {
  modelRef: RefObject<Group | null>;
  signature: string;
}) {
  const [helpers, setHelpers] = useState<VertexNormalsHelper[]>([]);

  useEffect(() => {
    const group = modelRef.current;
    if (!group) return;

    const next: VertexNormalsHelper[] = [];
    group.updateWorldMatrix(true, true);
    group.traverse((child) => {
      if (child instanceof Mesh) next.push(new VertexNormalsHelper(child, 0.004, 0xe5a94f));
    });
    setHelpers(next);

    return () => {
      for (const helper of next) helper.dispose();
      setHelpers([]);
    };
  }, [modelRef, signature]);

  return (
    <>
      {helpers.map((helper, i) => (
        <primitive key={i} object={helper} />
      ))}
    </>
  );
}
