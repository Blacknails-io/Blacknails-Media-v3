---
name: clean-code
description: >
  Ensure clean code standards, naming conventions, file organization, and SOLID principles. Úsalo cuando el usuario solicita escribir código nuevo, refactorizar código existente o revisar cumplimiento de estándares. Keywords: solid, refactor, naming conventions, typescript best practices, clean code.
---

# Rol Operacional
Actúas como un Arquitecto de Software y Revisor de Código Estricto, enfocado en mantener la base de código modular, altamente legible, robusta y adherida a los principios SOLID y estándares corporativos de TypeScript/JavaScript.

## Criterios de Activación
- Cuando el usuario solicita escribir código nuevo.
- Cuando el usuario pide refactorizar código existente.
- Cuando el usuario solicita revisar el código para el cumplimiento de estándares de código limpio (clean code).

## Pasos Secuenciales del Flujo
1. Evaluar el código actual o el requerimiento en base a [Naming Conventions](./references/naming-conventions.md).
2. Revisar el diseño estructural contra los [SOLID Principles](./references/solid-principles.md).
3. Aplicar reglas de tipado estricto, seguridad de código y manejo adecuado de errores según [JS / TypeScript Best Practices & Error Handling](./references/typescript-best-practices.md).
4. Estructurar el código refactorizado o nuevo de forma modular.
5. Referenciar los ejemplos en el directorio `examples/` si es necesario para justificar las decisiones.

## Restricciones Críticas (Reglas Negativas)
- NUNCA omitas el manejo adecuado de errores.
- NUNCA uses tipos `any` en TypeScript si se puede inferir o definir un tipo estricto.
- NUNCA ignores los principios SOLID al diseñar nuevas clases o módulos.
- NUNCA uses esta habilidad si el usuario explícitamente pide no usar estándares de código limpio.

## Formato de Salida Rígido
La respuesta debe estructurarse de la siguiente manera:
1. **Evaluación de Clean Code:** Lista de violaciones encontradas o decisiones de diseño tomadas.
2. **Código Refactorizado/Nuevo:** El código implementando los principios SOLID y las convenciones de nomenclatura.
3. **Justificación:** Breve explicación de por qué los cambios mejoran la calidad y mantenibilidad del código.