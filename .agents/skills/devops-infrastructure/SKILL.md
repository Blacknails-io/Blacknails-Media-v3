---
name: devops-infrastructure
description: Instructions for Docker Compose, GPU integration, and builds. Use when configuring infrastructure, updating containers, or troubleshooting local GPU setups.
---

# DevOps & Infrastructure Guidelines

## Goal
To manage the project container orchestration (Docker Compose), system networking, volume persistence, and local host GPU/Ollama ROCm acceleration integrations.

## When to use this skill
- When updating service specifications or environment configurations in Docker files.
- When mapping volumes or configuring folder mounting directories.
- When troubleshooting networking bridges between the Node backend container and Ollama local hosting.

## When NOT to use this skill
- For frontend visual changes or backend use case development.

## Core Rules (Must Follow)
- **MUST** configure service specifications and networking using **[docker-compose.yml](../../../docker-compose.yml)**.
- **MUST** define healthcheck curls (`http://localhost:3000/health`) on the backend API container, which builds from **[Dockerfile](../../../server/Dockerfile)**.
- **MUST** map database files (`blacknails.db`) into persistent, non-transient volume directories (e.g., `./data` -> `/home/node/app/data`).
- **NEVER** map persistent state files into staging directories like `./library/import`.
- **MUST** run the Node backend on the external `ai_network` to communicate with the host's AMD GPU ROCm accelerated Ollama container (`http://ollama-rocm:11434` or `http://host.docker.internal:11434`).
