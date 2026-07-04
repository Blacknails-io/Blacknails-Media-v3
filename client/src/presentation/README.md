# Frontend Presentation Workspace

This directory is the production-ready frontend structure for components that have passed design and architecture review.

Legacy or experimental UI can remain temporarily in `client/src/components`. Once a component is accepted, it should move here and the app should import the stable version from this tree.

## Boundaries

- `views/`: domain-backed screens and view components.
- `ui/`: shared visual infrastructure that has no backend/domain meaning by itself.
- `themes/`: reusable theme tokens, visual materials, and CSS variables.
- `layout/`: app shells and navigation structure when extracted.

## Acceptance Rules

A component can live here when:

- Its role maps either to a backend/domain concept or to shared visual infrastructure.
- Its view and logic boundaries are clear.
- It uses generic class names that describe role, not visual material.
- It consumes theme/material tokens instead of hard-coded visual decisions where practical.
- It has a narrow verification path: build, focused E2E, screenshot, or unit test depending on risk.

## Recommended Component Shape

```txt
views/<domain>/<Component>/
  <Component>View.tsx
  use<Component>Logic.ts
  <Component>.module.css
  index.ts
```

Shared UI follows the same idea but without domain logic:

```txt
ui/surfaces/LiquidGlassSurface/
  LiquidGlassSurface.tsx
  LiquidGlassSurface.module.css
  liquidGlassPresets.ts
  index.ts
```

## Migration Rule

Do not duplicate components forever. During a redesign, a legacy component may stay in `client/src/components` while the stable replacement is built here. When the replacement passes verification, update imports and remove or archive the legacy component.
