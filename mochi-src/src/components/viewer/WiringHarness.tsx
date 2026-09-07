import { useMemo } from 'react';
import { Line } from '@react-three/drei';
import { Vector3 } from 'three';
import type { RobotComponent, Vec3 } from '@/types';
import { useProjectStore, useSelectionStore, useViewerStore } from '@/store';
import { componentsById, explodeOffset } from './explode';

/**
 * One run per GPIO-bearing part, from the part back to the main board. These
 * are drawn from `electrical.gpio` rather than authored separately, so a pin
 * reassignment shows up here without anyone redrawing a harness.
 */

const CATEGORY_COLOR: Record<string, string> = {
  actuator: '#e5a94f',
  sensor: '#5fd3d8',
  display: '#f2a2b0',
  audio: '#b86b78',
  interface: '#3d878b',
  power: '#ef5f5f',
};

export function WiringHarness() {
  const components = useProjectStore((s) => s.project.components);
  const explode = useViewerStore((s) => s.explode);
  const explodeGroup = useViewerStore((s) => s.explodeGroup);
  const selectedId = useSelectionStore((s) => s.selectedId);
  const hiddenIds = useSelectionStore((s) => s.hiddenIds);

  const runs = useMemo(() => {
    const byId = componentsById(components);

    /**
     * World position = the chain of local positions and explode offsets summed
     * up to the root. No part authors a rotation or scale, so a sum is exact;
     * a rotated part would need a full matrix walk here.
     */
    const worldPosition = (component: RobotComponent): Vector3 => {
      const out = new Vector3();
      let current: RobotComponent | undefined = component;
      while (current) {
        const [px, py, pz] = current.position;
        const [ox, oy, oz] = explodeOffset(current, explode, explodeGroup, byId);
        out.add(new Vector3(px + ox, py + oy, pz + oz));
        current = current.parent ? byId.get(current.parent) : undefined;
      }
      return out;
    };

    const board = components.find((c) => c.id === 'pcb_main');
    if (!board) return [];
    const boardAt = worldPosition(board);

    const isHidden = (component: RobotComponent): boolean => {
      let current: RobotComponent | undefined = component;
      while (current) {
        if (hiddenIds.has(current.id)) return true;
        current = current.parent ? byId.get(current.parent) : undefined;
      }
      return false;
    };

    return components
      .filter((c) => c.electrical?.gpio?.length && c.id !== 'pcb_main' && !isHidden(c))
      .map((component) => {
        const end = worldPosition(component);
        // A slack midpoint, lifted off the straight run so overlapping wires
        // stay tellable apart and the bundle reads like a loom, not a diagram.
        const mid = boardAt
          .clone()
          .lerp(end, 0.5)
          .add(new Vector3(0, 0.006, 0.004));

        const points: Vec3[] = [];
        for (let i = 0; i <= 16; i += 1) {
          const t = i / 16;
          const a = boardAt.clone().lerp(mid, t);
          const b = mid.clone().lerp(end, t);
          const p = a.lerp(b, t);
          points.push([p.x, p.y, p.z]);
        }

        return {
          id: component.id,
          points,
          color: CATEGORY_COLOR[component.category] ?? '#6c7488',
        };
      });
  }, [components, explode, explodeGroup, hiddenIds]);

  return (
    <group>
      {runs.map((run) => (
        <Line
          key={run.id}
          points={run.points}
          color={run.color}
          lineWidth={run.id === selectedId ? 2.4 : 1.2}
          transparent
          opacity={selectedId && run.id !== selectedId ? 0.35 : 0.9}
        />
      ))}
    </group>
  );
}
