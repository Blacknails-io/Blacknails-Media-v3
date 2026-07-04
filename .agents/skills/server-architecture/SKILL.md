---
name: server-architecture
description: "Ensures backend code follows Hexagonal Architecture. Use when designing, creating, or modifying backend APIs, controllers, use cases, or SQLite database repositories."
---

# Server Architecture

This skill ensures that all backend code follows Hexagonal Architecture principles.

## When to use this skill

- Use when designing, writing, or refactoring code involving Hexagonal Architecture.
- Use when creating domain models, defining ports, or implementing adapters.

## How to use it

- Follow the architecture conventions defined in resources: [architecture_guidelines.md](resources/architecture_guidelines.md)
- **Scaffold de Referencia (Ejemplo Completo)**: Explora la carpeta [examples/hexagonal_scaffold/](examples/hexagonal_scaffold/) para ver cómo se estructura un flujo completo de registro de usuario:
  - **Dominio**: [User.ts](examples/hexagonal_scaffold/domain/User.ts) (Lógica de negocio pura sin dependencias).
  - **Puerto In**: [IRegisterUseCase.ts](examples/hexagonal_scaffold/application/ports/in/IRegisterUseCase.ts) (Caso de uso).
  - **Puerto Out**: [IUserRepository.ts](examples/hexagonal_scaffold/application/ports/out/IUserRepository.ts) (Base de datos).
  - **Caso de Uso**: [RegisterUseCase.ts](examples/hexagonal_scaffold/application/use_cases/RegisterUseCase.ts) (Orquestador de negocio).
  - **Adaptador In**: [UserController.ts](examples/hexagonal_scaffold/adapters/in/http/UserController.ts) (HTTP Controller).
  - **Adaptador Out**: [SqliteUserRepository.ts](examples/hexagonal_scaffold/adapters/out/database/SqliteUserRepository.ts) (SQLite).

