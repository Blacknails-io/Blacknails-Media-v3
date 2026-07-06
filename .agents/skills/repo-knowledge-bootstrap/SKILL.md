---
name: repo-knowledge-bootstrap
description: Create or refresh a repo-local technical orientation map from source code, tests, package manifests, Docker/config files, environment examples, entrypoints, domain model signals, and external-service surfaces. Use when a repository lacks the minimum Codex-ready repo map, when installing Codex Evaluator into a repo, or before story work when existing documentation is missing, stale, or not trustworthy.
---

# Repo Knowledge Bootstrap

## Overview

Create a factual technical map that helps future Codex sessions orient
themselves inside a repository. Capture evidence, confidence, risks, and
unknowns; do not infer product intent or write confirmed functional
documentation.

## Workflow

1. Inspect repository structure, package manifests, config files, Docker files,
   tests, source folders, entrypoints, and environment examples.
2. Read `references/repo-map-contract.md` before writing `.codex/repo-map`.
3. Read `references/evidence-and-confidence.md` before classifying claims.
4. Read `references/domain-signal-detection.md` before identifying important
   model classes, enums, states, events, tables, DTOs, workers, constants, and
   external surfaces.
5. Generate or refresh `.codex/repo-map/`.
6. Tie important claims to repo-relative file-path evidence.
7. Mark uncertain behavior as `hypothesis` or `unknown`.
8. Never present functional intent as confirmed without human validation.

## Output Rules

- Write repo-map files under `.codex/repo-map/`.
- Include source-relative evidence paths.
- Separate `fact`, `hypothesis`, `risk`, and `unknown`.
- Keep functional documentation out of scope unless the user explicitly asks for
  it.
- Describe the architecture found; do not impose a desired architecture during
  bootstrap.

## Resources

- `references/repo-map-contract.md`: required map structure.
- `references/evidence-and-confidence.md`: claim classification rules.
- `references/domain-signal-detection.md`: signals that usually indicate
  important model concepts.
