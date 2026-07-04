---
name: security-privacy
description: "Project security guidelines for SQLite, path validation, and sessions. Use when writing database queries, handling file paths, or implementing security policies."
---

# Security & Privacy Guidelines

This skill provides guidelines and procedures for this specific domain.

## When to use this skill

Refer to the description field above. This skill is meant to be activated when dealing with tasks related to security privacy.

## How to use it

- Follow the detailed rules, configurations, and architecture conventions defined in the resources: [guidelines.md](resources/guidelines.md)
- **Ejemplo de Validación de Rutas (Path Traversal)**: Consulta [safe_path_helper.ts](examples/safe_path_helper.ts) para ver cómo implementar validación estricta de rutas con `isPathSafe`.
- **Ejemplo de Ejecución Segura de Comandos (Command Injection)**: Consulta [safe_command_execution.ts](examples/safe_command_execution.ts) para ver cómo ejecutar comandos usando `child_process.execFile` o `spawn` de forma segura.

