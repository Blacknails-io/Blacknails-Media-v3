---
name: bug-regression-testing
description: Reglas obligatorias para la corrección de bugs y regresiones. Úsala siempre que arregles un error en el código.
---

# Bug Regression Testing Philosophy

## 1. Test-Driven Bug Fixing
- Cada vez que identifiques y corrijas un bug (ya sea en el Backend o en el Frontend), estás obligado a escribir un test automático que reproduzca el bug original ANTES de aplicar la solución, o inmediatamente DESPUÉS de aplicarla.
- El test debe **fallar** sin tu corrección, y **pasar** con tu corrección.
- Esto aplica tanto a tests unitarios (`Vitest`/`Jest`) como de integración (`Playwright`/`Supertest`).

## 2. No Fix without a Test
- Está **prohibido** dar por cerrado un bug o dar la tarea por finalizada sin haber aportado su correspondiente prueba automatizada en el directorio `__tests__` o `tests/` correspondiente.

## 3. Aislamiento y Mocks
- Los tests de backend deben usar una base de datos en memoria o aislada (como `:memory:` en SQLite) para evitar contaminar la base de datos de desarrollo.
- Los tests deben ser repetibles y deterministas.
