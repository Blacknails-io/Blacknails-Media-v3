# LiquidGlass Laboratory Workflow

This manual defines how Blacknails handles LiquidGlass visual work. LiquidGlass is treated as a calibrated material, not as ordinary component CSS.

## Contents

- [1. Boundary](#1-boundary)
- [1.1 Cyberpunk Terminal Material Intent](#11-cyberpunk-terminal-material-intent)
- [2. Gate Decision](#2-gate-decision)
- [3. New Component Workflow](#3-new-component-workflow)
- [4. Existing Production Component Workflow](#4-existing-production-component-workflow)
- [5. Lab Isolation Rule](#5-lab-isolation-rule)
- [6. Lab Implementation Rules](#6-lab-implementation-rules)
- [6.1 Agent Work Status](#61-agent-work-status)
- [6.2 Reusable Workbench And Specimens](#62-reusable-workbench-and-specimens)
- [7. Promotion Rules](#7-promotion-rules)
- [8. Visual Parameters](#8-visual-parameters)
- [9. Verification](#9-verification)
- [9.1 Lab vs Acceptance Testing](#91-lab-vs-acceptance-testing)
- [10. Do Not](#10-do-not)

## 1. Boundary

This skill owns LiquidGlass visual calibration:

- WebGL refraction and canvas placement.
- Material density, transparency, edge highlight, chromatic aberration, fresnel, shadow, and brightness.
- Background relationship and sampled visual context.
- Lab controls, debug JSON, and accepted preset promotion.

It does not own backend domain projection, API adapters, business rules, or the generic view/logic split.

## 1.1 Cyberpunk Terminal Material Intent

Blacknails uses LiquidGlass as the primary material for signature cyberpunk terminal surfaces: gloss, neon, refraction, depth, reflective light, and dense transparent surfaces.

- Treat the web UI like a futuristic terminal/control surface.
- Create the cyberpunk feeling through calibrated LiquidGlass whenever a surface is important, large, brand-bearing, navigational, content-framing, or operationally central.
- Decide by visual weight, scale, and function. Do not maintain a fixed list of component names in this rule.
- Combine LiquidGlass with neon edge light, chromatic/refraction behavior, and dark polished-metal context.
- Keep non-LiquidGlass materials as supporting surfaces for readability and dense workflows.
- Do not replace LiquidGlass calibration with a simple CSS gradient when the request asks for the cyberpunk/gloss/glass feeling.

## 2. Gate Decision

Use this decision rule before editing files:

- If the requested component uses LiquidGlass, it must pass through `client/src/lab` first.
- If the requested component does not use LiquidGlass, create or modify it directly in the correct production destination.
- If the user asks to test whether LiquidGlass works for a component, treat it as LiquidGlass and start in the lab.
- If LiquidGlass is removed from a component, the lab gate no longer applies after removal is complete.

## 3. New Component Workflow

For a new component that uses LiquidGlass:

1. Create the first implementation under `client/src/lab/<component-or-experiment>`.
2. Build with realistic dimensions, real visual background assumptions, and temporary controls for LiquidGlass parameters.
3. Keep debug sliders, toggles, JSON output, screenshots, and mock data in the lab only.
4. Iterate visually until the user accepts the effect.
5. Promote accepted values into `presentation/ui`, `presentation/themes`, or the final domain view.

Do not create the production `presentation` component first and then tune LiquidGlass inside it.

## 4. Existing Production Component Workflow

For an existing production component that will receive LiquidGlass:

1. Copy or derive the production component into `client/src/lab/<component-or-experiment>`.
2. Preserve the public contract: props, callbacks, visible states, sizing expectations, and core behavior.
3. Replace live API calls with stable mock data or injected fixtures in the lab.
4. Tune LiquidGlass in the lab until accepted.
5. Replace the production implementation only after the visual behavior is verified.

The production component remains the source of truth for behavior. The lab copy is the visual workshop.

## 5. Lab Isolation Rule

Laboratory work is not accepted production work yet.

Allowed for a lab experiment:

- Files under `client/src/lab/<experiment>`.
- A lab-local `README.md` when useful for temporary usage notes.
- The smallest preview entry needed to open the lab in the browser, such as a query-param route or lab registry.

Do not update these for lab-only work:

- `docs/FEATURES_AND_ARCHITECTURE.md`.
- Production `client/src/presentation` components, themes, or shared UI.
- Backend/domain/application/adapters files.
- Central architecture docs.

Only update production and central docs after the user accepts the experiment for promotion or the work changes a real architecture rule.

## 6. Lab Implementation Rules

A LiquidGlass lab can include controls that production must not keep:

- Sliders and toggles for LiquidGlass config.
- Preset selectors.
- Debug JSON export.
- Temporary backgrounds.
- Canvas and bounding-box diagnostics.
- Mock states for loading, empty, error, hover, active, and disabled variants.

When using `@ybouane/liquidglass`, ensure sampled backgrounds are positioned so the shader can capture them correctly. Backgrounds that must refract should be direct children in the LiquidGlass rendering context when the library requires it.

## 6.1 Agent Work Status

For remote collaborative visual work, a lab may include a temporary text-only work status overlay so the user knows Codex is editing the experiment.

- Keep the status lab-only and inactive by default.
- Prefer a simple state file under `client/public/demo` or lab-local state that can be toggled without changing production code.
- Render only text, without blocking pointer events or adding production navigation.
- Codex should set the status active before longer visual edits and set it inactive before returning control to the user.
- Do not promote the status overlay with the accepted component unless the user explicitly asks for that product behavior.

## 6.2 Reusable Workbench And Specimens

Prefer one reusable LiquidGlass workbench for shared lab infrastructure. The workbench owns the background scene, LiquidGlass controls, config export, status overlay, responsive shell, and canvas verification surface. Component-specific experiments should plug into a specimen slot instead of duplicating the whole lab shell.

- Use a stable base route such as `?lab=liquidglass` for the Calibration specimen workbench.
- Use query params such as `?lab=liquidglass&specimen=logo` for component specimens.
- Use a scalable non-editable selector, such as a dropdown, for specimen selection instead of a growing row of buttons.
- Keep specimen code small and lab-local while it is still being tuned.
- Add a new full lab only when the experiment needs materially different infrastructure, not merely different children inside the surface.
- Keep legacy per-component lab URLs as aliases when useful, but route them through the reusable workbench.

## 7. Promotion Rules

Promote only accepted decisions:

- Shared material behavior goes to `client/src/presentation/ui/surfaces/LiquidGlassSurface` or a sibling shared surface.
- Named LiquidGlass presets go to a theme/material preset file such as `client/src/presentation/themes/<theme-name>/glass/presets.ts`, not inside one domain view.
- Domain view structure goes to `client/src/presentation/views/<domain>/<Component>`.
- Debug controls stay in `client/src/lab`.

After promotion, the production component should consume named presets, props, and theme tokens. It should not carry raw playground UI.

Component CSS must remain material-neutral after promotion. Use role names such as `panel`, `content`, `surface`, `state`, and `accent`; keep `glass` in the theme/material folder, shared LiquidGlass implementation files, and external library types.

## 8. Visual Parameters

Treat these as calibrated material variables:

- `blurAmount`
- `refraction`
- `chromAberration`
- `edgeHighlight`
- `specular`
- `fresnel`
- `cornerRadius`
- `zRadius`
- `brightness`
- `saturation`
- `shadowOpacity`
- `floating`
- `button`
- `bevelMode`

When the library does not expose a visual parameter directly, change it through a local shared surface, theme adapter, or controlled fork/patch. Do not hide one-off shader edits inside a domain view.

## 9. Verification

During lab iteration:

- Verify desktop and mobile screenshots.
- Check that the LiquidGlass canvas renders and is not blank.
- Check the component does not introduce accidental scrollbars.
- Check text contrast and readability over the surface.
- Check the effect against the intended background, not a placeholder only.
- Check hover, focus, disabled, loading, and error states when the component supports them.
- Use Playwright scripts, screenshots, computed-style probes, and canvas checks as visual inspection tools.

Keep screenshots or metrics in `client/artifacts` when useful for review.

## 9.1 Lab vs Acceptance Testing

Lab work is collaborative visual calibration. Do not create automated component, unit, or E2E tests for lab-only visual iterations unless the user explicitly asks for them.

Create automated tests when one of these is true:

- The user accepts the lab result and asks to promote it to production.
- The work changes a production component, shared surface, theme, route, or contract.
- The task fixes a concrete production bug or regression.

When promoting accepted LiquidGlass work, add tests for the production behavior and key visual invariants that can be asserted reliably. Keep subjective taste decisions in review screenshots and accepted presets, not brittle visual tests.

Before promotion or replacement, repeat the visual verification above against the production route and add the appropriate automated coverage.

## 10. Do Not

- Do not tune LiquidGlass directly in production files.
- Do not put lab sliders or debug JSON in production components.
- Do not add automated tests for lab-only visual exploration unless explicitly requested.
- Do not update central project documentation for lab-only experiments.
- Do not duplicate WebGL setup across domain views.
- Do not make LiquidGlass a backend/domain concept.
- Do not force non-LiquidGlass components through the lab.
