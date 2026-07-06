---
name: ai-media-processing
description: Rules for media analysis, EXIF metadata, sidecars, and Ollama integration. Use when building backend logic for media processing, face detection, or vision LLMs.
---

# AI & Media Processing

## Goal
To implement safe, asynchronous media processing pipelines (EXIF parsing, thumbnails, sidecar JSONs) and secure concurrency-controlled local Ollama LLM integrations.

## When to use this skill
- When writing backend media ingestion workers or background synchronization jobs.
- When writing modules that query Ollama vision (`huihui_ai/qwen3-vl-abliterated:4b-instruct`) or text (`qwen2.5:7b`) models.
- When implementing face detection, embedding vectors, or grouping/clustering logic.

## When NOT to use this skill
- For general frontend components or layouts.
- For basic database migrations not involving media metadata or AI features.

## Core Rules (Must Follow)
- **MUST** copy imported media to target folders using unique, hash-based filenames to prevent duplicate uploads.
- **MUST** generate lightweight, web-optimized thumbnails and sidecar JSONs to store extracted labels and descriptions.
- **MUST** acquire a VRAM concurrency lock prior to executing queries to local Ollama models.
- **MUST** implement defensive try-catch blocks and parsing fallbacks to prevent malformed LLM responses from crashing the server.
- **MUST** offload heavy clustering calculations (e.g., DBSCAN) to background worker threads to keep the main Node event loop free.

---

## Detailed Workflows & Examples
- **[AI Media Guidelines](./resources/guidelines.md)**: Rules for the media pipeline, Ollama model specifications, prompts, timeouts, and face detection.
- **[Defensive JSON Extraction Example](./examples/ollama-json-extraction-example.md)**: Walkthrough illustrating how to query local Ollama models and defensively extract JSON variables.
- **[Diagnostic script](./scripts/test_ollama_setup.js)**: Script to test model presence and network connectivity in the host environment.
