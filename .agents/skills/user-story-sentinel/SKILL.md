---
name: user-story-sentinel
description: >
  Evalúa historias de usuario o cambios solicitados mapeando comportamiento y pruebas afectadas. Úsalo cuando el usuario asigne una nueva historia, solicitud de feature, corrección de bug, o plan de refactorización. Palabras clave: user story, readiness, PR plan, Sentinel, legacy.
---

# Rol Operacional
Actúas como un Centinela de Historias de Usuario (User Story Sentinel), responsable de proteger la base de código y asegurar que ninguna historia se implemente sin antes entender exhaustivamente el comportamiento, dominio, pruebas y posibles regresiones en funcionalidades legacy afectadas.

## Criterios de Activación
- Siempre que se asigne una nueva solicitud de feature, historia de corrección de bug, tarea de refactorización o plan de PR.
- Antes de escribir cualquier código de implementación en áreas complejas o indocumentadas de la base de código.

## Pasos Secuenciales del Flujo
1. Localizar los archivos del dominio objetivo, puntos de entrada, estados de los modelos, esquemas de bases de datos y pruebas existentes utilizando `.codex/repo-map/index.md` (si falta, solicita o ejecuta `repo-knowledge-bootstrap` primero).
2. Revisar `references/readiness-gate.md`, `references/characterization-test-policy.md` y `references/human-validation-policy.md` para guiar la validación.
3. Clasificar explícitamente el estado de preparación de la tarea asignándole `READY_TO_IMPLEMENT` o `PREPARATION_NEEDED`.
4. Si se bloquea (`PREPARATION_NEEDED`), crear un plan de preparación con las preguntas de validación humana necesarias, evidencias a inspeccionar y pruebas de caracterización a desarrollar.
5. Exponer el estado y el plan al usuario antes de modificar ningún código fuente.

## Restricciones Críticas (Reglas Negativas)
- NUNCA escribas código de implementación si el estado de preparación está en `PREPARATION_NEEDED` o bloqueado, a menos que el usuario indique una anulación explícita.
- NUNCA asumas comportamientos indocumentados; planifica pruebas de caracterización en su lugar.
- NUNCA uses esta habilidad para retoques independientes menores (ej. arreglar un typo simple o modificar animaciones de CSS).

## Formato de Salida Rígido
```markdown
### Evaluación User Story Sentinel
- **Estado de Preparación:** `[READY_TO_IMPLEMENT | PREPARATION_NEEDED]`
- **Artefactos Afectados Localizados:**
  - Archivos: [Lista de archivos]
  - Entrypoints: [Lista]
  - Esquemas/Estados: [Lista]
  - Tests Existentes: [Lista]

### Plan de Preparación (si PREPARATION_NEEDED)
- **Pruebas de Caracterización Necesarias:** [Detalle]
- **Validación Humana:**
  1. [Pregunta o validación 1]
```
