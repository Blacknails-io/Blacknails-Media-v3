---
name: security-privacy
description: Project security guidelines for SQLite, path validation, and sessions. Use when writing database queries, handling file paths, or implementing security policies.
---

# Security & Privacy Guidelines

## Goal
To enforce secure coding standards across the backend to prevent path traversal, SQL injection, command injection, and session hijacking vulnerabilities.

## When to use this skill
- When writing database queries or prepared statements.
- When creating endpoints that read, stream, write, or delete local filesystem files.
- When executing system command binaries (e.g., `ffmpeg`, `exiftool`).
- When implementing auth cookies, authentication, or session management.

## When NOT to use this skill
- For purely frontend layout styling or visual transitions.

## Core Rules (Must Follow)
- **NEVER** accept raw file paths directly from user HTTP queries.
- **MUST** validate resolved file paths using an `isPathSafe` check to ensure the target path strictly resides within the authorized base directories.
- **MUST** use parameterized queries or bound values for all SQLite database operations to prevent SQL Injection.
- **NEVER** concatenate user inputs directly into SQL command strings.
- **NEVER** use `child_process.exec(commandString)` with user-supplied arguments; **MUST** use `child_process.execFile` or `child_process.spawn` passing arguments as string arrays.
- **MUST** configure authentication cookies with `HttpOnly`, `Secure` (production), and `SameSite` flags.

---

## Detailed Workflows & Examples
- **[Security Guidelines](./resources/guidelines.md)**: Rules for path validation, SQLite prepared statements, safe child processes, and cookie configurations.
- **[Path Traversal Prevention Example](./examples/safe-path-helper.md)**: Safe path resolver implementation and Express controller usage.
- **[Command Injection Prevention Example](./examples/safe-command-execution.md)**: Secure child process executions using `execFile` and `spawn` with arguments.
