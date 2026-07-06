---
name: ux-design-philosophy
description: Design guidelines for Blacknails-Media-v3. Use this whenever designing UI components, mockups, or interaction flows.
---

# UX Design Philosophy

## Goal
To enforce a media-first, cyberpunk aesthetic control terminal UI that remains invisible and places the photos and videos as the absolute protagonists.

## When to use this skill
- Whenever proposing UI mockups, layout flows, or interaction details.
- When designing UI structures, sidebars, toolbars, or grids.

## When NOT to use this skill
- For code-level implementation details (such as CSS tokens or React syntax).

## Core Rules (Must Follow)
- **NEVER** treat the UI as a generic dashboard (no "Projects", "Teams", or "Workspaces" exist).
- **NEVER** implement a live upload button; media ingestion is asynchronous and monitors a local `library/import/` folder in the background.
- **MUST** preserve the application's left **Sidebar shell** containing "Gallery", "Event Logs", "Users", and "Workers" tabs. Do not remove or hide it under the guise of "minimalism".
- **MUST** provide an **Interaction Flow** and **Component Rationale** for every mockup or UI change proposal.
- **MUST** keep the gallery "media-first": the cyberpunk frames must not globally tint or distract from the photos/videos.
- **MUST** use spring animations, reflective highlights, and controlled neon accents for micro-interactions; avoid random glitch animations.
