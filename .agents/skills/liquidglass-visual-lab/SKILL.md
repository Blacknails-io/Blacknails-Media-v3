---
name: liquidglass-visual-lab
description: "Guide the Blacknails LiquidGlass visual laboratory workflow. Use when a frontend component uses @ybouane/liquidglass, WebGL glass/refraction, LiquidGlass density or transparency tuning, LiquidGlass lab calibration, copying an existing production component into client/src/lab, or promoting accepted LiquidGlass presets, surfaces, or theme values back into production."
---

# LiquidGlass Visual Lab

This skill owns the visual workflow for LiquidGlass components. It does not define domain logic, backend mappings, or general component architecture.

## Required Resource

- Read [liquidglass_lab_workflow.md](resources/liquidglass_lab_workflow.md) before creating, copying, tuning, or promoting any LiquidGlass component.
- Use `frontend-component-creation` for component folder shape, view/logic split, and production component contracts.
- Use `frontend-design-system` for reusable tokens, theme values, shared surfaces, and material boundaries.
- Use `test-automation` for Playwright screenshots, canvas checks, responsive measurements, and visual verification. Do not create automated component or E2E tests for lab-only visual iteration unless the user explicitly asks.
- For long remote visual iterations, add a text-only lab work status that Codex can toggle while editing and hide before handing the lab back.
- Prefer a reusable LiquidGlass workbench route with specimen slots over creating a full per-component lab shell.

## Core Rule

LiquidGlass never enters production without a lab pass.

1. New component with LiquidGlass: create it in `client/src/lab` first.
2. Existing production component receiving LiquidGlass: copy or derive it into `client/src/lab` first.
3. Lab work stays isolated: only edit the experiment folder and the minimum lab entry/routing needed to preview it.
4. Component without LiquidGlass: skip this skill unless the user explicitly asks for a visual experiment.
5. Accepted LiquidGlass work is promoted back as shared surface code, named presets, theme values, or a production component replacement.
