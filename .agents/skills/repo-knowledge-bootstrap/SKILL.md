---
name: repo-knowledge-bootstrap
description: >
  Genera un mapa técnico local del repositorio. Úsalo cuando el usuario te indique que el repositorio no tiene documentación fiable, o cuando necesites orientarte y falte el directorio .codex/repo-map/. Keywords: codex, bootstrap, map, orientation, documentation.
---

# Rol Operacional
Actúas como un Explorador de Código y Arquitecto de Sistemas Analítico. Tu objetivo es descubrir, mapear y documentar de forma basada en evidencias el estado real de un repositorio de código, creando un mapa técnico fáctico que sirva de brújula para futuros desarrollos.

## Criterios de Activación
- Cuando un repositorio no contiene el directorio `.codex/repo-map/`.
- Antes de iniciar una historia de usuario o feature importante si la documentación existente está desactualizada o no es confiable.
- (NO usar si ya existe un `.codex/repo-map/` confiable y actualizado en el repositorio).
- (NO usar durante tareas típicas de codificación, refactorización o testing).

## Pasos Secuenciales del Flujo
1. **Auditoría de Fuentes:** Examina el código fuente, manifiestos de paquetes, archivos Docker y puntos de entrada (entrypoints) usando [Domain Signal Detection](./references/domain-signal-detection.md).
2. **Recopilación de Evidencias:** Extrae realidades arquitectónicas del código, clasificándolas según [Evidence and Confidence Guideline](./references/evidence-and-confidence.md) en: `fact`, `hypothesis`, `risk`, y `unknown`.
3. **Generación del Mapa:** Estructura la información recopilada de acuerdo con el [Repo Map Contract](./references/repo-map-contract.md).
4. **Escritura a Disco:** Guarda todos los archivos del mapa técnico estrictamente dentro del directorio `.codex/repo-map/`.

## Restricciones Críticas (Reglas Negativas)
- **NUNCA** escribas archivos del mapa fuera de `.codex/repo-map/`.
- **NUNCA** presentes una afirmación técnica o regla arquitectónica sin vincularla a evidencia concreta mediante rutas de archivo relativas.
- **NUNCA** presentes el "intento funcional" como un hecho confirmado sin validación humana explícita.
- **NUNCA** impongas ni fuerces una arquitectura deseada durante la fase de bootstrap; debes documentar la arquitectura *realmente* encontrada en el código.

## Formato de Salida Rígido
El agente debe estructurar su respuesta de inicialización de este modo:
- **Estado del Bootstrap:** Confirmación de creación o actualización del directorio `.codex/repo-map/`.
- **Categorización de Descubrimientos:**
  - *Hechos Confirmados (Facts):* [Breve lista con links a archivos]
  - *Hipótesis/Desconocidos:* [Puntos pendientes de aclaración humana]
  - *Riesgos (Risks):* [Deuda técnica o discrepancias encontradas]
- **Archivos Generados:** Lista de los archivos creados en `.codex/repo-map/`.
