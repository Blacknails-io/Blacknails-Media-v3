# LiquidGlass Lab

Interactive laboratory for tuning `@ybouane/liquidglass` presets with hot reload.

Open it at:

```txt
http://127.0.0.1:5179/?lab=liquidglass
```

Specimens:

```txt
http://127.0.0.1:5179/?lab=liquidglass&specimen=calibration
http://127.0.0.1:5179/?lab=liquidglass&specimen=login
http://127.0.0.1:5179/?lab=liquidglass&specimen=logo
```

The default lab entry opens `Calibration`. The old `?lab=liquidglass-logo` URL is kept as an alias for the logo specimen, and old `specimen=glass`/`specimen=surface` links fall back to `Calibration`.

Do not create component-specific lab routes or folders. New LiquidGlass candidates are added as specimens inside this workbench so controls, calibration, presets, and promotion rules stay in one place.

The `Calibration` specimen is lab-only and non-promotable. It exists to compare typography, semantic state colors, and media-neutral swatches over LiquidGlass. Promote accepted token names, color values, and material presets only; do not promote the specimen layout, sample text, or demo cards.

The lab keeps WebGL parameters in React state and serializes them into the LiquidGlass `data-config` attribute. Use the sliders/toggles to tune the effect visually, then copy the JSON config and promote it to a stable material preset under `client/src/presentation/themes/<theme>/glass/`.

Accepted material presets and palette tokens are owned by `client/src/presentation/themes/realistic-cyber-glass/glass/`. The lab consumes those theme modules so future components can share the same surface presets, surface palettes, and tribe color tokens.

When `Floating` is disabled, the preview surface remounts and returns to its initial centered position so calibration resumes from a clean reference.

This directory is experimental. Finished components and accepted presets move to `client/src/presentation`.
