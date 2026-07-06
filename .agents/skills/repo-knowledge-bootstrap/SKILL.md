---
name: repo-knowledge-bootstrap
description: Create or refresh a repo-local technical orientation map from source code, package manifests, Docker files, and entrypoints. Use when a repository lacks the minimum Codex-ready repo map, or when existing documentation is missing, stale, or not trustworthy.
---

# Repo Knowledge Bootstrap

## Goal
To construct or refresh a factual, evidence-backed technical map (`.codex/repo-map/`) to help future development sessions quickly orient themselves inside the repository.

## When to use this skill
- When a repository is missing the `.codex/repo-map/` directory.
- Before starting a major user story or feature implementation if existing documentation is stale or untrustworthy.

## When NOT to use this skill
- If a trustworthy, up-to-date `.codex/repo-map/` already exists in the repository.
- During typical coding, refactoring, or testing tasks.

## Core Rules (Must Follow)
- **MUST** write all repo-map files under `.codex/repo-map/`.
- **MUST** tie every technical claim or architectural rule to concrete, relative file-path evidence.
- **MUST** separate claims clearly into categories: `fact`, `hypothesis`, `risk`, and `unknown`.
- **NEVER** present functional intent as confirmed without explicit human validation.
- **NEVER** impose or enforce a desired architecture during the bootstrap phase; document the architecture *actually* found in the code.

---

## Detailed Workflows & Examples
- **[Repo Map Contract](./references/repo-map-contract.md)**: Required structure and format for the map files.
- **[Evidence and Confidence Guideline](./references/evidence-and-confidence.md)**: Rules for categorizing claims and evaluating confidence.
- **[Domain Signal Detection](./references/domain-signal-detection.md)**: How to locate key entities, models, ports, and services in the codebase.
