# LiquidGlassSurface

Target home for the reusable LiquidGlass material.

This component will own the `@ybouane/liquidglass` WebGL initialization, refs, config serialization, and cleanup. Views should compose it without knowing shader or canvas details.

The surface exports compatibility preset names, but theme-owned material values live under:

```txt
presentation/themes/<theme-name>/glass/presets.ts
```

Expected files:

```txt
LiquidGlassSurface.tsx
LiquidGlassSurface.module.css
liquidGlassPresets.ts  # compatibility re-export from the active theme
index.ts
```

CSS inside consuming components should use role names such as `panel`, `content`, and `state`; the material name belongs to this shared wrapper or to the theme path.
