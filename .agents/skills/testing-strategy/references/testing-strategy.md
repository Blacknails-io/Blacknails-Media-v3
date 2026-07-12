# Testing Strategy & Pyramid (Blacknails Media)

Esta guía define la estrategia formal de pruebas para el proyecto Blacknails Media, basada en los principios de Clean Architecture (Arquitectura Hexagonal). Garantiza que cada tipo de prueba se ejecuta en la capa adecuada, maximizando la velocidad de ejecución y minimizando el acoplamiento.

## 1. Business Tests (Backend)

Los Business Tests prueban el Core de la aplicación (Dominio y Casos de Uso) sin ninguna interferencia del marco de transporte HTTP.

- **Qué prueban**: Lógica pura de negocio, UseCases, Repositories, Workers.
- **Qué NO prueban**: Endpoints, Controladores Express, Códigos de estado HTTP (200, 400).
- **Formato obligatorio**: BDD (Behavior-Driven Development). Los comentarios `// GIVEN`, `// WHEN`, y `// THEN` deben ser explícitos en el código del test.
- **Regla de Orot**: Estos tests NUNCA deben romperse si el proyecto migra de Express a GraphQL, a gRPC, o a un CLI, porque el protocolo de red no se está evaluando.
- **Herramientas**: `node:test`, aserciones directas contra los UseCases, Bases de Datos en memoria (ej. SQLite en `:memory:`) y un sistema de ficheros de prueba volátil.

## 2. Contract Testing (Frontend ↔ Backend)

El Contract Testing asegura que el esquema de datos que el Frontend asume recibir es exactamente el mismo que el Backend emite.

- **Qué prueban**: La forma, nombres de atributos (ej. `title` vs `name`) y tipos de los payloads JSON intercambiados.
- **Propósito**: Prevenir que un cambio interno en los adaptadores HTTP del Backend rompa silenciosamente la aplicación del cliente.
- **Enfoque Práctico**: Se recomienda utilizar pactos o tests de integración muy delgados en los adaptadores REST, los cuales verifican puramente la serialización/deserialización de JSON y los códigos HTTP.

## 3. Frontend Integration / E2E Tests

Los tests E2E simulan la experiencia real del usuario abriendo un navegador e interactuando con la UI, conectados a un backend predecible.

- **Qué prueban**: Estados de React, experiencia de usuario, UI condicional, y flujos completos de cliente.
- **Qué entorno requieren**: NUNCA deben ejecutarse contra el backend de producción. Requieren arrancar el cliente contra el **Mock Server** (`mock-server.ts`).
- **El Mock Server**: 
  - Levanta una base de datos efímera y una infraestructura de ficheros aislada (`.mock-library/`).
  - Sustituye servicios lentos o de terceros (como Ollama) por "Mock Services" que devuelven resultados estáticos de inmediato.
  - Proporciona un entorno predecible e idempotente donde los scripts de test pueden inyectar archivos (`fixtures`) y asegurar la visualización en UI de forma instantánea.
- **Herramientas**: Playwright, Cypress o Testing Library.

## Flujo de Trabajo (Workflow) del Agente

1. **Cuando el usuario pida testear una regla de negocio**: Escribe un Business Test instanciando directamente el `UseCase`. Usa estrictamente el bloque `// GIVEN`, `// WHEN`, `// THEN`.
2. **Cuando el usuario introduzca un cambio de API**: Revisa que los DTOs y la documentación sigan cumpliendo el contrato del frontend.
3. **Cuando el usuario quiera probar un flujo visual**: Indica que el entorno adecuado es levantar el `mock-server.ts` y que el test debe ser escrito como un E2E en Playwright desde el Frontend. Nunca mezcles la orquestación del servidor mock dentro del código de los Business Tests del backend.
