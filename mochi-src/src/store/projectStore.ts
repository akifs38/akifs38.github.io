import { create } from 'zustand';
import type { AssemblyNode, PinAssignment, RobotComponent, RobotProject } from '@/types';
import { DEFAULT_PROJECT } from '@/data/project';

interface ProjectState {
  project: RobotProject;
  setProject(project: RobotProject): void;
  updatePins(pins: PinAssignment[]): void;
}

export const useProjectStore = create<ProjectState>()((set) => ({
  project: DEFAULT_PROJECT,
  setProject: (project) => set({ project }),
  updatePins: (pins) =>
    set((s) => ({
      project: {
        ...s.project,
        pins,
        meta: { ...s.project.meta, updatedAt: new Date().toISOString() },
      },
    })),
}));

/* ------------------------------- derived -------------------------------- */

export function buildAssemblyTree(components: RobotComponent[]): AssemblyNode[] {
  const byParent = new Map<string | null, RobotComponent[]>();
  for (const component of components) {
    const list = byParent.get(component.parent) ?? [];
    list.push(component);
    byParent.set(component.parent, list);
  }

  const walk = (parent: string | null, depth: number): AssemblyNode[] =>
    (byParent.get(parent) ?? []).map((component) => ({
      component,
      children: walk(component.id, depth + 1),
      depth,
    }));

  return walk(null, 0);
}

export function flattenTree(nodes: AssemblyNode[]): AssemblyNode[] {
  return nodes.flatMap((node) => [node, ...flattenTree(node.children)]);
}

export function findComponent(
  components: RobotComponent[],
  id: string | null,
): RobotComponent | null {
  if (!id) return null;
  return components.find((c) => c.id === id) ?? null;
}

export function descendantIds(components: RobotComponent[], rootId: string): string[] {
  const out: string[] = [];
  const stack = [rootId];
  while (stack.length) {
    const current = stack.pop()!;
    out.push(current);
    for (const child of components.filter((c) => c.parent === current)) stack.push(child.id);
  }
  return out;
}

export function ancestorIds(components: RobotComponent[], id: string): string[] {
  const out: string[] = [];
  let current = findComponent(components, id);
  while (current?.parent) {
    out.push(current.parent);
    current = findComponent(components, current.parent);
  }
  return out;
}
