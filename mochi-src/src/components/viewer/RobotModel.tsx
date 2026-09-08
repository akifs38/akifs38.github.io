import { useMemo, type JSX } from 'react';
import { RoundedBoxGeometry } from '@react-three/drei';
import type { Plane } from 'three';
import type { AssemblyNode, PlaceholderShape, RobotComponent, Vec3 } from '@/types';
import { buildAssemblyTree, useProjectStore, useSelectionStore, useViewerStore } from '@/store';
import { RobotFace } from './RobotFace';
import { componentsById, explodeOffset } from './explode';

/**
 * The assembly, drawn from the same component list the tree and the inspector
 * read. Nesting mirrors the parent chain, so a parent's transform — and its
 * explode offset — carries its children exactly as glTF node parenting will
 * once assets/robot.glb replaces these primitives.
 */

const SELECTED = '#f2a2b0';
const HOVERED = '#5fd3d8';

export function RobotModel({ clippingPlanes }: { clippingPlanes: Plane[] }) {
  const components = useProjectStore((s) => s.project.components);
  const tree = useMemo(() => buildAssemblyTree(components), [components]);
  const byId = useMemo(() => componentsById(components), [components]);

  return (
    <group>
      {tree.map((node) => (
        <PartNode key={node.component.id} node={node} byId={byId} clippingPlanes={clippingPlanes} />
      ))}
    </group>
  );
}

function PartNode({
  node,
  byId,
  clippingPlanes,
}: {
  node: AssemblyNode;
  byId: Map<string, RobotComponent>;
  clippingPlanes: Plane[];
}) {
  const { component, children } = node;

  const explode = useViewerStore((s) => s.explode);
  const explodeGroup = useViewerStore((s) => s.explodeGroup);
  const wiringVisible = useViewerStore((s) => s.wiringVisible);

  // Read the raw sets rather than isVisible(): a hidden part takes its subtree
  // with it, but an isolated selection must still keep its ancestors mounted,
  // because those groups are what position it.
  const hidden = useSelectionStore((s) => s.hiddenIds.has(component.id));
  const isolatedIds = useSelectionStore((s) => s.isolatedIds);

  if (hidden) return null;
  if (component.category === 'wiring' && !wiringVisible) return null;

  const [px, py, pz] = component.position;
  const [ox, oy, oz] = explodeOffset(component, explode, explodeGroup, byId);
  const isolatedOut = isolatedIds.size > 0 && !isolatedIds.has(component.id);

  return (
    <group
      position={[px + ox, py + oy, pz + oz]}
      rotation={component.rotation ?? [0, 0, 0]}
      scale={component.scale ?? [1, 1, 1]}
    >
      {component.placeholder && !isolatedOut && (
        <>
          <PartMesh
            component={component}
            shape={component.placeholder}
            clippingPlanes={clippingPlanes}
          />
          {component.category === 'display' && <RobotFace clippingPlanes={clippingPlanes} />}
        </>
      )}

      {children.map((child) => (
        <PartNode
          key={child.component.id}
          node={child}
          byId={byId}
          clippingPlanes={clippingPlanes}
        />
      ))}
    </group>
  );
}

function PartMesh({
  component,
  shape,
  clippingPlanes,
}: {
  component: RobotComponent;
  shape: PlaceholderShape;
  clippingPlanes: Plane[];
}) {
  const selectedId = useSelectionStore((s) => s.selectedId);
  const hoveredId = useSelectionStore((s) => s.hoveredId);
  const select = useSelectionStore((s) => s.select);
  const hover = useSelectionStore((s) => s.hover);

  const ghostMode = useViewerStore((s) => s.ghostMode);
  const wireframe = useViewerStore((s) => s.debug.wireframe);

  const selected = selectedId === component.id;
  const hovered = hoveredId === component.id;

  // Ghost mode is about seeing past the outer shells, so only shells fade.
  const ghosted = ghostMode && component.isShell === true;
  const notInstalled = component.status === 'not-installed';
  const transparent = ghosted || notInstalled;
  // A rounded shell is an extrusion and the two body halves overlap, so a
  // ghosted pixel stacks several surfaces. The per-surface figure stays low so
  // the electronics underneath actually come through.
  const opacity = ghosted ? 0.13 : notInstalled ? 0.3 : 1;

  const emissive = selected ? SELECTED : hovered ? HOVERED : '#000000';
  const emissiveIntensity = selected ? 0.55 : hovered ? 0.3 : 0;

  // A sphere is authored as three radii, which three only does through scale.
  const meshScale: Vec3 | undefined = shape.kind === 'sphere' ? shape.size : undefined;

  return (
    <mesh
      scale={meshScale}
      castShadow={!transparent}
      receiveShadow={!transparent}
      onClick={(e) => {
        e.stopPropagation();
        select(component.id);
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        hover(component.id);
      }}
      onPointerOut={() => hover(null)}
    >
      <PartGeometry shape={shape} />
      <meshStandardMaterial
        // Flipping `transparent` on a live material leaves three's cached
        // program set up for an opaque draw, so ghost mode did nothing to the
        // shells. Keying on it builds a fresh material instead.
        key={transparent ? 'blended' : 'opaque'}
        color={shape.color}
        roughness={component.isShell ? 0.75 : 0.45}
        metalness={component.isShell ? 0.02 : 0.35}
        emissive={emissive}
        emissiveIntensity={emissiveIntensity}
        transparent={transparent}
        opacity={opacity}
        depthWrite={!transparent}
        wireframe={wireframe}
        clippingPlanes={clippingPlanes}
        clipShadows
      />
    </mesh>
  );
}

/**
 * Placeholder primitives. `size` is read per kind, matching how the parts are
 * authored in components.ts: extents for a box, radii plus height for a
 * cylinder, a single radius for a sphere.
 */
function PartGeometry({ shape }: { shape: PlaceholderShape }): JSX.Element {
  const [a, b, c] = shape.size;

  switch (shape.kind) {
    case 'box':
      return <boxGeometry args={[a, b, c]} />;
    case 'roundedBox':
      // Printed shells have a fillet, and a hard-edged box reads as a crate.
      return (
        <RoundedBoxGeometry
          args={[a, b, c]}
          radius={shape.radius ?? Math.min(a, b, c) * 0.12}
          smoothness={5}
        />
      );
    case 'sphere':
      // Unit sphere; the mesh scale above turns it into the authored ellipsoid.
      return <sphereGeometry args={[1, 48, 32]} />;
    case 'cylinder':
      return <cylinderGeometry args={[a, b, c, 40]} />;
    case 'capsule':
      return <capsuleGeometry args={[a, b, 8, 24]} />;
    case 'plane':
      return <planeGeometry args={[a, b]} />;
  }
}
