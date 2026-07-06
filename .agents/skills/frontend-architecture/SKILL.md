---
name: frontend-architecture
description: Ensures frontend code follows domain-first architecture aligned with the backend. Use when designing, creating, or refactoring frontend domain entities, use cases, API adapters, views, or themes.
---

# Frontend Domain Architecture

## Goal
To enforce separation of concerns in the frontend client, preventing visual UI components from directly performing API requests or encoding backend transport logic.

## When to use this skill
- When creating or refactoring frontend code directories in `client/src/`.
- When designing views, custom hooks, controllers, or API adapters.

## When NOT to use this skill
- When working on the backend codebase (`server/src/`).
- For purely aesthetic styling (CSS) or animations without logical code transitions.

## Core Rules (Must Follow)
- **MUST** isolate API requests and browser APIs under the `adapters/` or `services/` directory.
- **MUST** keep visual React components under `presentation/` or `components/` generic, accepting domain data through props.
- **MUST** separate UI layout (Views) from execution logic (Custom Hooks/Use Cases/Controllers).
- **NEVER** let visual components execute raw fetch requests or handle network states directly.
- **MUST** consume theme variables/tokens in CSS classes instead of hardcoding cyberpunk/neon values.
- **MUST** implement a dual-update state strategy for real-time views: fetch the baseline state using HTTP GET on view mount, and progressively apply state changes reactively by subscribing to backend events via `BackendEventsController`.

---

## Detailed Workflows & Examples
- **[Frontend Architecture Guidelines](./resources/architecture_guidelines.md)**: Conceptual layers, directory mappings (views, UI, themes), and relationships with other frontend skills.
