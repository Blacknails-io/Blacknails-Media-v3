# Frontend Design System Guidelines

The frontend design system controls reusable visual decisions: tokens, themes, materials, surfaces, typography, borders, shadows, and visual variants. It must not define domain concepts or business flows.

## 1. Design System Boundary

Use this skill for visual rules that should apply across multiple views or components.

Belongs here:

- Theme tokens.
- Surface/material definitions.
- Glass, acrylic, metal, paper, or panel treatments.
- Typography scale and weight rules.
- Border radii, shadows, outlines, focus rings.
- Component role class naming.
- Cross-component density and spacing rules.

Does not belong here:

- Backend/domain entities.
- Use cases and adapters.
- API request flow.
- Feature-specific state machines.
- One-off decorative CSS hidden inside a single view.

## 2. Tokens First

Prefer theme tokens over hard-coded component colors or shadows.

Examples:

```css
:root[data-theme="realistic-cyber-glass"] {
  --surface-panel-bg: rgba(8, 14, 22, 0.38);
  --surface-panel-border: rgba(210, 244, 255, 0.34);
  --surface-panel-shadow: 0 26px 70px rgba(0, 0, 0, 0.42);
  --accent-primary: #74f4ff;
  --accent-danger: #ff4f86;
}
```

Components consume tokens:

```css
.login-panel {
  background: var(--surface-panel-bg);
  border-color: var(--surface-panel-border);
  box-shadow: var(--surface-panel-shadow);
}
```

## 2.1 Cyberpunk Material Direction

The accepted visual direction is cyberpunk with gloss, neon, LiquidGlass refraction, polished dark metal, acrylic depth, and cinematic reflected light.

- Treat the product as a futuristic terminal/control surface: LiquidGlass is the first-choice material for important, large, brand-bearing, navigational, content-framing, or operational command surfaces.
- Choose LiquidGlass by visual weight, surface scale, and functional importance. Do not encode a fixed list of specific components in the design-system rules.
- Use neon as environmental light, edge energy, focus signal, and brand accent. Do not reduce the theme to flat colored outlines.
- Use metal/acrylic for dense operational areas where LiquidGlass would hurt scanning or readability.
- Keep the gallery media color-true; cyberpunk surfaces should frame the media, not contaminate it.
- Prefer reusable material tokens and presets over one-off gradients in component CSS.

## 3. Generic Class Names

Class names describe component role, not material or theme.

Prefer:

- `.login-panel`
- `.login-button`
- `.surface`
- `.media-card`
- `.toolbar-button`

Avoid:

- `.glass-login-button`
- `.cyberpunk-card`
- `.blue-neon-panel`
- `.liquid-worker-box`

The theme decides whether `.surface` looks like glass, metal, dark acrylic, or clean light UI.

This applies to CSS custom properties in component modules as well. Prefer `--surface-rgb-edge`, `--panel-shadow`, `--state-danger`, and `--accent-primary`; avoid component-local variables such as `--glass-edge`, `--cyberpunk-shadow`, or `--liquid-card-bg`.

Material names are allowed in theme file/folder paths, shared technical wrappers, and external library types. For example, `presentation/themes/realistic-cyber-glass/glass/presets.ts` may contain LiquidGlass presets, while a login view should consume a named surface preset and keep its local CSS material-neutral.

## 4. Materials Are Shared UI

Reusable materials should be shared presentation components or theme classes, not embedded inside domain views.

Examples:

```txt
presentation/ui/surfaces/LiquidGlassSurface
presentation/ui/surfaces/AcrylicSurface
presentation/ui/surfaces/MetalPanel
presentation/themes/realistic-cyber-glass/glass/presets.ts
presentation/themes/clean-dark.css
```

Views should compose materials without owning their implementation.

## 5. Open/Closed Theming

Adding a new theme or material should not require rewriting stable views.

- Add a theme file for new token values.
- Add a shared surface for new material behavior.
- Add examples when a material has specific implementation constraints.
- Do not spread theme-specific CSS across many feature views.

## 6. LiquidGlass Rule

LiquidGlass is a material implementation, not a domain feature.

- Keep WebGL initialization inside a shared surface component.
- Keep per-theme material presets in theme/material configuration.
- Ensure sampled backgrounds are direct children of the LiquidGlass root when using `@ybouane/liquidglass`.
- Views should not know how the shader captures backgrounds or injects canvases.

## 7. Relationship to Other Skills

- Use `frontend-architecture` for domain/application/adapters/presentation boundaries.
- Use `frontend-design-system` for tokens, materials, themes, and visual reuse rules.
- Use `frontend-ui-motion` for implementation details of React layout, animation, and interaction.
- Use `ux-design-philosophy` for product-level experience and information hierarchy.
