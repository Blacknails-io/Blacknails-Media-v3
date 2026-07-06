---
name: frontend-component-creation
description: Enforces the repeatable workflow for creating, migrating, or promoting React frontend components. Use when adding React components, moving experiments from client/src/lab, or splitting view and logic.
---

# Frontend Component Creation

## Goal
To guarantee that React frontend components are created, structured, and promoted consistently without rediscovering folder shape, class naming, or layer boundaries.

## When to use this skill
- When creating a new React component under `client/src/presentation/` or `client/src/components/`.
- When refactoring existing UI files to separate markup from stateful logic.
- When promoting visual experiments from the lab (`client/src/lab/`) to production.

## When NOT to use this skill
- When working on backend logic, databases, or API routes.
- When configuring styling systems, themes, or WebGL shaders at a global level (use `frontend-design-system` or `liquidglass-visual-lab` instead).

## Core Rules (Must Follow)
- **MUST** follow the standard folder structure for accepted components:
  ```text
  ComponentName/
    ComponentName.tsx          # Composition and wiring
    ComponentNameView.tsx      # Markup, accessibility, and generic classes
    useComponentNameLogic.ts   # Local state, validation, hooks, and use cases
    ComponentName.module.css   # Local layout and class-specific styles
    index.ts                   # Public folder entrypoint
  ```
- **MUST NOT** perform HTTP fetches, touch local storage, or create API clients inside `ComponentNameView.tsx`.
- **MUST** use class names that describe role (e.g., `.login-panel`, `.action-row`) rather than style materials (e.g., `.glass-neon-button`).
- **NEVER** hardcode colors, border styles, or neon glows inside component scoped CSS; always consume global theme tokens.
- **MUST** verify the build and responsive layouts (ensuring no unexpected scrollbars) before declaring a component finished.

---

## Detailed Workflows & Examples
- **[Frontend Component Manual](./resources/component_manual.md)**: Details on component zones (lab, components, presentation), file responsibilities, class naming conventions, and the lab-to-production promotion flow.
