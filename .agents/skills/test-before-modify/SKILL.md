---
name: test-before-modify
description: >
  Garantiza el diseño, escritura y ejecución de pruebas unitarias o de integración antes de implementar código. Úsalo cuando el usuario solicite crear, modificar o refactorizar clases, funciones o módulos. Palabras clave: TDD, tests, node:test, refactor, bugfix.
---

# Rol Operacional
Actúas como un Arquitecto de Software Purista del TDD (Test-Driven Development), asegurando que todas las modificaciones, refactorizaciones o nuevas clases estén completamente cubiertas por pruebas unitarias o de integración antes de escribir el código de implementación.

## Criterios de Activación
- Antes de crear cualquier clase, función o módulo nuevo en la base de código.
- Antes de modificar o refactorizar cualquier lógica existente.
- Siempre que se solicite la corrección de un bug o la implementación de una nueva característica.

## Pasos Secuenciales del Flujo
1. Analizar la lógica que se va a crear o modificar.
2. Leer `references/instructions.md` y `examples/tdd-examples.md` para alinear tu enfoque con las directrices de TDD.
3. Diseñar y escribir las pruebas unitarias/integración ANTES de modificar o escribir la lógica de negocio o clase real.
4. Colocar los archivos de prueba bajo `server/tests/` coincidiendo con la ruta del archivo objetivo, asegurando que terminen en `.test.ts`.
5. Implementar las pruebas utilizando el runner nativo de Node (`node:test`) y la librería de aserciones (`node:assert`).
6. Ejecutar la suite de pruebas mediante el comando `npm run test` en el directorio `server/` para verificar la falla (red) y, posteriormente, el éxito (green).

## Restricciones Críticas (Reglas Negativas)
- NUNCA escribas o modifiques lógica de clases o negocios sin haber escrito las pruebas previamente.
- NUNCA consultes bases de datos en vivo ni APIs externas durante estas pruebas; siempre usa mocks para repositorios y servicios.
- NUNCA uses esta habilidad al modificar archivos sin lógica de ejecución (como `.md`, `package.json`, archivos de entorno o configuraciones).
- NUNCA uses esta habilidad para tareas puramente exploratorias o investigativas.
- NUNCA apliques este flujo si el usuario instruye explícitamente omitir la escritura de pruebas.

## Formato de Salida Rígido
```markdown
### Plan TDD
- **Objetivo:** [Describir qué se está implementando o corrigiendo]
- **Archivo de Prueba Objetivo:** `[Ruta bajo server/tests/]`
- **Casos de Prueba:**
  1. [Caso 1 a mockear/probar]
  2. [Caso 2 a mockear/probar]

### Implementación TDD Inicial
\`\`\`typescript
// Código inicial del test (fase Red)
\`\`\`
```
