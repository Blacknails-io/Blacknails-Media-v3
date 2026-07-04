# Blacknails Frontend Component Manual

This manual is the project language for creating frontend components. It explains where components live, how a folder is shaped, and how experimental UI becomes accepted production UI.

## Contents

- [1. Component Zones](#1-component-zones)
- [2. Destination Rules](#2-destination-rules)
- [3. Standard Component Folder](#3-standard-component-folder)
- [4. File Responsibilities](#4-file-responsibilities)
- [5. Class Naming](#5-class-naming)
- [6. Design-System Boundary](#6-design-system-boundary)
- [7. Lab To Presentation Promotion](#7-lab-to-presentation-promotion)
- [8. Open/Closed Rule](#8-openclosed-rule)
- [9. Verification Checklist](#9-verification-checklist)

## 1. Component Zones

Use three zones intentionally:

- `client/src/lab`: experimental playgrounds, hot-reload controls, visual calibration, and disposable prototypes.
- `client/src/components`: legacy or temporary UI while migration is in progress.
- `client/src/presentation`: stable accepted components that passed architecture and visual review.

Lab experiments are isolated. Lab-only work may touch the experiment folder and the minimum preview entry needed to open it, but it must not update production `presentation` code or central docs until accepted for promotion.

Do not leave duplicate production paths indefinitely. When a `presentation` component is imported by the app and verified, remove or archive the legacy path in a separate intentional step.

## 2. Destination Rules

Choose the destination before writing files:

- Domain-backed views go to `client/src/presentation/views/<domain>/<Component>`.
- Shared visual components go to `client/src/presentation/ui/<category>/<Component>`.
- Layout shells go to `client/src/presentation/layout/<Component>`.
- Theme tokens, material presets, and reusable visual recipes go to `client/src/presentation/themes/<theme-name>`.
- Experiments stay in `client/src/lab/<experiment>` until accepted.

Domain views must represent real backend concepts such as Auth, Asset, Worker, People, Import, or Admin. Shared UI does not need a backend entity because it is visual infrastructure.

## 3. Standard Component Folder

Use this shape for accepted React components:

```txt
ComponentName/
  ComponentName.tsx
  ComponentNameView.tsx
  useComponentNameLogic.ts
  ComponentName.module.css
  index.ts
```

Add `README.md` only when the component has non-obvious constraints, promotion notes, shader rules, accessibility contracts, or integration requirements. Avoid README files for simple components.

For shared UI without state, the logic hook can be omitted. For complex domain flows, move use-case orchestration into `client/src/application` and keep the hook as the presentation adapter.

## 4. File Responsibilities

`ComponentName.tsx` composes the component. It wires logic to view and selects shared surfaces, layout wrappers, or theme presets.

`ComponentNameView.tsx` defines markup, labels, accessibility attributes, callbacks, and generic class names. It must not fetch data, touch storage, create API clients, or know backend transport details.

`useComponentNameLogic.ts` owns local state, validation, event callbacks, and use-case orchestration. It may call application use cases, existing context providers, event adapters, or injected services. It must not hide HTTP details that belong in adapters.

`ComponentName.module.css` defines the local layout and role classes for the component. It should consume tokens and compose shared surface classes instead of hard-coding a full visual theme.

`index.ts` exports the public component API for the folder. Keep imports from other modules pointed at the folder entrypoint when practical.

## 5. Class Naming

Use class names that describe role, not material or theme.

Prefer:

- `.login-panel`
- `.panel-header`
- `.form-field`
- `.action-row`
- `.surface`

Avoid:

- `.glass-login-button`
- `.cyberpunk-card`
- `.blue-neon-panel`
- `.liquid-worker-box`

The component says what an element is. The theme or shared surface says how it looks.

The same rule applies to component-scoped CSS variables. Use role and token names such as `--surface-rgb-base`, `--panel-border`, or `--state-danger`; do not encode material names such as `--glass-base` or `--liquid-card-shadow` in component CSS. Material words may appear in theme folder/file names, shared surface implementation files, and external library types.

## 6. Design-System Boundary

Keep reusable visual effects out of domain views.

- Put WebGL/glass/acrylic/metal behavior in `presentation/ui/surfaces`.
- Put reusable presets and token values in `presentation/themes/<theme-name>/<material-name>`.
- Let views compose `LiquidGlassSurface`, `MetalPanel`, or future surfaces through props.
- Do not duplicate shader setup, canvas injection, material math, or theme color rules inside feature views.

When a visual experiment becomes useful in more than one place, promote it to shared UI or theme before spreading it across components.

## 7. Lab To Presentation Promotion

Use this path when an experiment becomes accepted:

1. Keep the playground in `client/src/lab` while values are still being tuned.
2. Extract the stable visual primitive into `presentation/ui` or `presentation/themes`.
3. Build the real domain view in `presentation/views`.
4. Import the accepted component from the app route or shell.
5. Verify build, responsive layout, no unexpected scrollbars, and the relevant visual state with Playwright screenshots or metrics.
6. Document the accepted rule only after promotion, and only if it changes architecture, theme policy, or a reusable workflow.

The lab can keep knobs and debug output. The production component should receive named presets or props.

## 8. Open/Closed Rule

Add behavior by extension whenever possible:

- New backend concept: add a new domain/application/adapter/presentation slice.
- New visual material: add a shared surface, not one-off CSS in every view.
- New theme: add tokens and presets, not rewrites of stable component structure.
- New workflow state: add a use case or logic hook path, not raw fetches in view files.

Stable views should survive theme and material changes with minimal edits.

## 9. Verification Checklist

Before calling a component finished:

- Run the project build or the smallest relevant static check.
- Use Playwright screenshots or bounding-box checks for visual components.
- Check desktop and mobile dimensions for fixed-format tools, cards, panels, and full-viewport pages.
- Confirm text fits inside buttons, fields, panels, and cards.
- Confirm full-viewport pages do not introduce accidental scrollbars.
- Add or update E2E tests when the component changes a user workflow.
