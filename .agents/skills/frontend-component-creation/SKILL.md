---
name: frontend-component-creation
description: "Create, migrate, or promote Blacknails frontend components using the project component language. Use when adding React components, moving experiments from client/src/lab into client/src/presentation, splitting view and logic, choosing a component folder, defining CSS module class names, composing shared UI surfaces, or preparing a component for app integration."
---

# Frontend Component Creation

This skill defines the repeatable workflow for building frontend components in Blacknails without rediscovering folder shape, naming, architecture, or promotion rules.

## Required Resource

- Read [component_manual.md](resources/component_manual.md) before creating, moving, or promoting component files.
- Use this skill together with `frontend-architecture` for domain/application boundaries.
- Use this skill together with `frontend-design-system` for tokens, materials, surfaces, and theme decisions.
- If a component uses LiquidGlass, use `liquidglass-visual-lab` for the visual laboratory workflow before production changes.
- Use this skill together with `frontend-ui-motion` when implementation includes React UI polish, layout, animation, or interaction.
- Use `test-automation` when the component affects user-visible workflows or needs screenshot verification.

## Workflow

1. Classify the component destination: lab experiment, domain view, shared UI, layout, or theme/material.
2. Create the folder shape defined in the manual.
3. Keep structure in the view file, orchestration in the logic hook or application use case, and visual material implementation in shared UI/theme files.
4. Verify with the smallest useful checks: build for static validity, Playwright or screenshots for visual behavior, and E2E tests for real workflows.
5. Update central documentation only when the component changes architecture, public workflow, design-system policy, or accepted visual system rules.
