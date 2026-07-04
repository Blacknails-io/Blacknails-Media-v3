---
name: ai-media-processing
description: "Rules for media analysis, EXIF metadata, sidecars, and Ollama integration. Use when building backend logic for media processing, face detection, or vision LLMs."
---

# AI & Media Processing Guidelines

This skill provides guidelines and procedures for this specific domain.

## When to use this skill

Refer to the description field above. This skill is meant to be activated when dealing with tasks related to ai media processing.

## How to use it

- Follow the detailed rules, configurations, and architecture conventions defined in the resources: [guidelines.md](resources/guidelines.md)
- **Ejemplo de consulta a Ollama**: Consulta [ollama_json_extraction.ts](examples/ollama_json_extraction.ts) para ver cómo implementar control de concurrencia y parseo defensivo de JSON con Ollama.
- **Script de Diagnóstico**: Ejecuta [test_ollama_setup.js](scripts/test_ollama_setup.js) para verificar la conectividad de red con Ollama y la presencia de los modelos configurados en tu entorno local.

