---
name: visual-lab
description: Guide the Blacknails Visual Lab workflow. Use when modifying lab core structures, defining new LabStyles/LabSpecimens, tuning CSS variables/colors using the __theme_sync endpoint, or verifying visual variants.
---

# Visual Lab Guidelines

## Goal
To manage visual styling configurations and interactively calibrate UI theme variables, color palettes, and component variants inside the local development Visual Lab.

## When to use this skill
- When editing core files or types under `client/src/lab/`.
- When creating or modifying visual specimens in `client/src/lab/specimens/`.
- When calibrating theme CSS variables or colors using the `__theme_sync` synchronization engine.

## When NOT to use this skill
- For backend-only data tasks.
- For typical frontend production views that do not involve lab calibration or theme Synchronization.

## Core Rules (Must Follow)
- **MUST** register all new specimens under the `LabSpecimen` interface contract and map them in **[main.tsx](../../../client/src/main.tsx)**.
- **NEVER** expose debug sliders, color knobs, or mock configuration variables inside production code; keep them strictly within `client/src/lab/`.
- **MUST** trigger specific specimens by supplying their `id` as the `?lab=<specimen-id>` query parameter (e.g. `?lab=logo`, `?lab=login`).
- **MUST** deploy verified theme modifications to the disk codebase using the lab's `__theme_sync` post-deployment protocol.

---

## Detailed Workflows & Examples
- **[Visual Lab Manual](./resources/visual_lab_workflow.md)**: Breakdown of lab components, types, specimens, style definitions, and the theme sync flow.
