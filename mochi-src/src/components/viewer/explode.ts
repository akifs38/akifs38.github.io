import type { ComponentCategory, ExplodeGroup, RobotComponent, Vec3 } from '@/types';

/**
 * Exploded-view maths. Every part carries the direction it travels and a
 * multiplier; this turns those, plus the global 0..1 slider, into a local
 * offset. Offsets compose down the hierarchy exactly like the transforms do —
 * lifting the head carries everything mounted in it.
 */

const ELECTRONIC_CATEGORIES: ComponentCategory[] = [
  'compute',
  'power',
  'sensor',
  'display',
  'audio',
  'interface',
  'wiring',
];

/** Explode groups that are a subtree rather than a category filter. */
const GROUP_ROOT: Partial<Record<ExplodeGroup, string>> = {
  head: 'head',
  body: 'body',
  base: 'base',
};

export function isInExplodeGroup(
  component: RobotComponent,
  group: ExplodeGroup,
  byId: Map<string, RobotComponent>,
): boolean {
  if (group === 'all') return true;
  if (group === 'electronics') return ELECTRONIC_CATEGORIES.includes(component.category);

  const root = GROUP_ROOT[group];
  if (!root) return true;

  let current: RobotComponent | undefined = component;
  while (current) {
    if (current.id === root) return true;
    current = current.parent ? byId.get(current.parent) : undefined;
  }
  return false;
}

/**
 * Metres of travel at explode = 1 and distance = 1. The robot is ~0.12 m tall,
 * so this pulls parts clear of each other without throwing them off screen.
 */
export const EXPLODE_SCALE = 0.055;

export function explodeOffset(
  component: RobotComponent,
  amount: number,
  group: ExplodeGroup,
  byId: Map<string, RobotComponent>,
): Vec3 {
  if (amount <= 0 || !isInExplodeGroup(component, group, byId)) return [0, 0, 0];

  const [x, y, z] = component.explosionVector;
  const distance = (component.explosionDistance ?? 1) * amount * EXPLODE_SCALE;
  return [x * distance, y * distance, z * distance];
}

export function componentsById(components: RobotComponent[]): Map<string, RobotComponent> {
  return new Map(components.map((c) => [c.id, c]));
}
