# Example: Realistic Cyber Glass Theme

This example captures the current visual direction being explored for Blacknails-Media-v3. It is an example, not a universal requirement for all future themes.

## Intent

Create a realistic cyberpunk interface, closer to a cinematic physical environment than to flat decoration.

The theme should feel like:

- LiquidGlass refraction as the primary signature material for high-impact surfaces.
- Gloss, neon, real glass, acrylic, polished dark metal, and reflected city light.
- Cyan/magenta/electric accents as environmental light, edge energy, and brand signal.
- Rich backgrounds or media surfaces that give glass something to refract.
- Premium motion and controlled cyberpunk energy, not random glitch noise.

## Material Rules

- Use LiquidGlass as the first-choice material for high-weight terminal surfaces: important, large, brand-bearing, navigational, content-framing, or operational command surfaces.
- Do not hard-code a permanent list of specific components for LiquidGlass. Re-evaluate by visual weight, scale, and function as the product changes.
- Use dark acrylic or metal surfaces for dense operational panels where readability matters.
- Keep gallery media visually dominant; UI should frame media without tinting everything.
- Avoid global purple/blue gradients as the only background material.

## Suggested Token Families

```txt
--surface-glass-*
--surface-acrylic-*
--surface-metal-*
--accent-cyan-*
--accent-magenta-*
--text-primary
--text-secondary
--focus-ring
--shadow-floating
--border-subtle
```

## Calibration Notes

For `@ybouane/liquidglass`, the background sampled by the shader must be a direct child inside the LiquidGlass root. A plain root CSS background will not be captured.

Use playground-derived presets as material tokens/configuration, not as ad hoc CSS patched into a domain view.
