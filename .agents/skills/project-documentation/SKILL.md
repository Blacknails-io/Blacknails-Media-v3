---
name: project-documentation
description: Ensures the project documentation is kept up to date. Use when you finish implementing a new feature, modifying an architecture component, or adding new APIs.
---

# Project Documentation Maintainer

## Goal
To guarantee that the codebase's central documentation accurately represents the implemented features, APIs, and architectural layers.

## When to use this skill
- Immediately after completing a production-bound feature, API route, backend worker, or database schema change.
- When refactoring core workflows or architecture.

## When NOT to use this skill
- For purely local experiments under `client/src/lab` (unless promoted to production).
- During initial research or exploration stages where no code is finalized.

## Core Rules (Must Follow)
- **MUST** keep the central **[FEATURES_AND_ARCHITECTURE.md](../../../docs/FEATURES_AND_ARCHITECTURE.md)** file updated with any production code changes.
- **NEVER** document temporary, non-promoted lab experiments in the central documentation.
- **MUST** document new API endpoints, payload contracts, database schema edits, and external infrastructure additions.

---

## Detailed Workflows & Examples
- **[Documentation Guidelines](./resources/guidelines.md)**: Rules on what to document, style conventions, and exceptions.
