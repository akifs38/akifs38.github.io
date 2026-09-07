/**
 * Logical component id -> glTF node name.
 *
 * The exporter decides node names; this file is the only place that has to
 * change when they do. Anything unmapped falls back to the component's
 * `modelNode` field, so a well-named export needs no entries here at all.
 */
export const MODEL_MAPPING: Record<string, string> = {
  // Example of the shape this takes once a real Blender export arrives:
  // head_shell: 'Object_001',
  // pcb_main: 'Object_024',
};

export function resolveModelNode(componentId: string, fallback: string): string {
  return MODEL_MAPPING[componentId] ?? fallback;
}
