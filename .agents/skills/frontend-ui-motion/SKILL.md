---
name: frontend-ui-motion
description: Guidelines for React 19, Tailwind CSS 4, Framer Motion, and Atropos UI components. Use when creating or modifying the web user interface, building React components, applying CSS styles, or implementing UI animations.
---

# Frontend UI, UX & Motion Guidelines

## Goal
To implement premium, fluid, and visually stunning interactive interfaces and animations in the React client utilizing Framer Motion physics and Atropos 3D parallax effects.

## When to use this skill
- When creating or modifying React component layout animations, lightboxes, and page transitions.
- When applying interactive visual hover states, micro-interactions, or spring animations.
- When configuring visual layouts using Tailwind CSS 4 utility classes.

## When NOT to use this skill
- When working on the backend codebase (`server/src/`).
- For general API adapter configurations or routing logic that do not involve user interface styling or animations.

## Core Rules (Must Follow)
- **MUST** use spring-based physics (`type: "spring", stiffness: 300, damping: 30`) in Framer Motion for natural-feeling interactive transitions.
- **MUST** enforce aspect ratios (`aspect-square`, `aspect-video`) on media containers to prevent Layout Shift (CLS).
- **MUST** use Skeletons as fallback loading states matching the exact dimensions of target visual cards.
- **MUST** use accessible locators (`page.getByRole`) in E2E tests, avoiding CSS classes that depend on layouts.
- **MUST** disable transitions/animations in testing environments during visual regression testing.

---

## Detailed Workflows & Examples
- **[UI Motion Guidelines](./resources/guidelines.md)**: Rules for React 19, Tailwind CSS 4, Framer Motion configurations, and layout virtualization.
- **[Interactive Media Card Example](./examples/interactive-card-examples.md)**: React TypeScript implementation of an interactive 3D parallax media card.
