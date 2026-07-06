---
name: server-architecture
description: Ensures backend code follows Hexagonal Architecture. Use when designing, creating, or modifying backend APIs, controllers, use cases, or SQLite database repositories.
---

# Server Hexagonal Architecture

## Goal
To enforce and preserve backend layers and boundaries, ensuring that domain entities and use cases are isolated from transport protocol definitions (Express) and database adapters (SQLite).

## When to use this skill
- When creating or modifying backend APIs, use cases, ports, or repository adapters in `server/src/`.
- When writing database queries or configuring HTTP routes.

## When NOT to use this skill
- When working on the frontend client codebase (`client/src/`).
- During general devops container orchestration tasks.

## Core Rules (Must Follow)
- **NEVER** import infrastructure dependencies, frameworks, database drivers, or filesystem modules (`express`, `better-sqlite3`, `fs`, `http`) into the `domain/` directory.
- **NEVER** import Express request or response objects (`Request`, `Response`) into `application/use_cases/`.
- **MUST** isolate application execution boundaries using explicit Driving Ports (`ports/in/`) and Driven Ports (`ports/out/`).
- **MUST** map raw database rows back to pure Domain Entity models in the outbound database adapters before returning them to the application layer.

---

## Detailed Workflows & Examples
- **[Hexagonal Guidelines](./resources/architecture_guidelines.md)**: Rules for the Domain, Application, and Adapters layers.
- **[Hexagonal Scaffold Example](./examples/hexagonal-scaffold-example.md)**: Complete code walkthrough implementing User registration using domain, ports, use cases, and controllers.
