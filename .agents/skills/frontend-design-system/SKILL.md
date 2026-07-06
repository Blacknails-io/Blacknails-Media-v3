---
name: frontend-design-system
description: Ensures frontend visual styling follows a unified, reusable tokens and theming system. Use when defining visual tokens, themes, typography, glass/metal effects, CSS class naming, or spacing rules.
---

# Frontend Design System

## Goal
To enforce a consistent, reusable design-system token structure, separating generic HTML role structures from their visual themes, materials, and cyberpunk finishes.

## When to use this skill
- Whenever creating or editing CSS style sheets or theme configurations.
- When selecting visual styling variables (colors, borders, shadows, spacing, font sizes).
- When implementing cyberpunk-specific visual treatments (neon highlights, glass refractions, dark metal surfaces).

## When NOT to use this skill
- When defining application workflow states, routes, or API data fetching logic.
- When editing backend code or Docker/devops configurations.

## Core Rules (Must Follow)
- **MUST** define CSS variables (colors, borders, outlines, shadows) inside global theme tokens; **NEVER** write hardcoded values in local component styles.
- **MUST** name class selectors based on role (e.g., `.login-panel`, `.surface`) rather than material name (e.g., `.glass-login-panel`, `.cyber-border`).
- **NEVER** embed WebGL shader setups, material math, or canvas manipulations inside feature views; delegate these to shared UI wrappers (e.g., `LiquidGlassSurface`).
- **MUST** preserve the true colors of gallery photo and video media; cyberpunk visual treatments must frame the media, not globally tint or distract from it.

---

## Detailed Workflows & Examples
- **[Design System Guidelines](./resources/guidelines.md)**: Details on tokens, visual cyberpunk guidelines, generic class naming rules, shared material components, and open/closed theming boundaries.
