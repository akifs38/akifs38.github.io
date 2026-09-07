# 3D assets

## The contract

The application never loads a mesh by name. It loads *components*, each of which
declares a `modelNode`, and a mapping table resolves that to whatever the
exporter actually produced.

```
RobotComponent.modelNode  ──▶  MODEL_MAPPING[id]  ──▶  glTF node name
                                   (optional)
```

If the export uses the same names as `modelNode`, the mapping table stays empty.
If Blender emits `Object_024`, one line in `src/data/modelMapping.ts` fixes it:

```ts
export const MODEL_MAPPING: Record<string, string> = {
  pcb_main: 'Object_024',
};
```

Nothing else changes — not selection, not the tree, not explode, not the
inspector.

## Until there is a model

Every component carries an optional `placeholder` (`box`, `sphere`, `cylinder`,
`capsule` or `plane`, plus a size and colour). Phase 2 generates primitives from
these. They are positioned by the same `position` field the real model will use,
so the assembly reads correctly before any modelling is done.

## Exporting

- **Format**: glTF 2.0 binary (`.glb`), placed at `public/assets/robot.glb`.
- **Units**: metres. The robot is roughly 0.12 m tall.
- **Origin**: at the base, on the floor plane. +Y up, robot facing +Z.
- **Hierarchy**: mirror the component tree — `RobotRoot / Head / Head_Shell` and
  so on. Parent transforms are what make head rotation work.
- **Naming**: match the `modelNode` values, or map them.
- **Materials**: one material per visually distinct part. Shells want a separate
  material from electronics so Ghost mode can make them transparent.
- **Triangles**: aim under 150 k for the whole robot. Above that, Phase 14's LOD
  work stops being optional.

## Compression

Draco and KTX2 are wired in Phase 14. Both need their decoders served from
`public/` — a `.glb` that references a decoder the app does not host will fail to
load with a network error rather than a useful message, so add the decoders in
the same commit as the compressed asset.

## Checklist before dropping a model in

1. Does it open in a glTF validator without errors?
2. Is every `modelNode` in `components.ts` present, or mapped?
3. Is the origin at the floor and the scale in metres?
4. Are the shells separate objects from what they enclose?
