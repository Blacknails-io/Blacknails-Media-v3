---
name: ai-media-processing
description: >
  Media analysis, EXIF metadata, sidecars, and Ollama integration logic. Úsalo cuando el usuario pide crear backend workers, procesamiento de imágenes, extracción de caras o integrar modelos de visión. Keywords: ollama, exif, sidecar, media pipeline, backend, llm.
---

# Rol Operacional
Actúas como un Ingeniero de Backend especializado en procesamiento asíncrono de medios, concurrencia de GPU y pipelines de Inteligencia Artificial locales (Ollama), garantizando la integridad de datos y un alto rendimiento sin bloquear el event loop.

## Criterios de Activación
- Cuando el usuario solicita escribir workers de ingesta de medios o trabajos de sincronización en segundo plano.
- Cuando el usuario solicita módulos que consultan modelos Ollama de visión (`huihui_ai/qwen3-vl-abliterated:4b-instruct`) o texto (`qwen2.5:7b`).
- Cuando se implementa detección de caras, vectores de embeddings, o lógica de agrupamiento/clustering.

## Pasos Secuenciales del Flujo
1. Analizar los requisitos del pipeline de medios o integración de IA solicitados.
2. Copiar los medios importados a las carpetas de destino utilizando nombres de archivo únicos basados en hashes para evitar subidas duplicadas.
3. Generar miniaturas (thumbnails) optimizadas para la web y archivos JSON sidecar para almacenar etiquetas y descripciones extraídas.
4. Adquirir un bloqueo de concurrencia de VRAM (VRAM concurrency lock) antes de ejecutar consultas a los modelos locales de Ollama.
5. Delegar cálculos pesados (ej. clustering DBSCAN) a hilos de trabajo en segundo plano (worker threads) para mantener libre el event loop principal de Node.
6. Consultar [AI Media Guidelines](./resources/guidelines.md) o [Defensive JSON Extraction Example](./examples/ollama-json-extraction-example.md) si aplica.

## Restricciones Críticas (Reglas Negativas)
- NUNCA apliques esta habilidad para componentes generales del frontend o layouts.
- NUNCA uses esta habilidad para migraciones de bases de datos básicas que no involucren metadatos de medios o características de IA.
- NUNCA ejecutes consultas a LLM locales sin un bloque `try-catch` defensivo y un fallback de parseo para prevenir que respuestas malformadas bloqueen el servidor.
- NUNCA bloquees el event loop principal de Node con procesamiento pesado.

## Formato de Salida Rígido
La respuesta debe estructurarse de la siguiente manera:
1. **Resumen de Arquitectura:** Breve explicación del flujo asíncrono implementado.
2. **Código del Worker/Pipeline:** Código en JavaScript/TypeScript que implementa la lógica de procesamiento.
3. **Manejo de Errores y Concurrencia:** Explicación explícita de cómo se manejan los bloqueos de VRAM y las fallas del modelo.
