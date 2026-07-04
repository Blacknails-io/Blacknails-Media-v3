# Realistic Cyber Glass Theme

Theme workspace for the current cinematic glass direction.

Use this for reusable tokens and material presets such as:

- `glass/` material presets for LiquidGlass-backed surfaces
- `glass/palette.ts` color presets for the current cyberpunk tribes and semantic token values
- acrylic panel values
- dark metal panel values
- cyan and magenta environmental light accents
- focus rings, shadows, and density rules

The theme should support realistic futuristic UI without turning every operational panel into neon decoration.

Component CSS that consumes this theme must stay material-neutral. Prefer names such as `loginPanel`, `panelContent`, `stateTokenCard`, and `surface-rgb-edge`; keep material-specific words in this theme folder or in shared implementation wrappers.
