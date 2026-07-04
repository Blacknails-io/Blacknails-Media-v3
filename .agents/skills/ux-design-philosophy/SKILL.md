---
name: ux-design-philosophy
description: Design guidelines for Blacknails-Media-v3. Use this whenever designing UI components, interactions, or mockups.
---

# UX Design Philosophy for Blacknails-Media-v3

## 1. Product Vision (The "What")
Nuestra idea de interfaz y experiencia de usuario toma como base funcional herramientas de gestión avanzadas como **PhotoPrism**, enfocándose en un uso *Prosumer* que da acceso profundo a los datos y metadatos.
- **It is NOT a generic dashboard.** There are no "Projects", "Teams", or "Workspaces".
- **It is NOT a cloud upload service.** There is no "Upload" button. Media ingestion happens asynchronously in the background via a Hexagonal Architecture backend that monitors a local `library/import` folder.
- **Focus:** The UI must be invisible. The photos and videos are the absolute protagonist.

## 2. Interaction & Rationale Rules (The "Why" and "How")
Whenever you design a mockup or propose a UI change, you MUST provide:
1. **Interaction Flow:** Explain exactly how the user gets to this state and what happens next (e.g., "Hovering over the card triggers a 0.2s Framer Motion scale-up").
2. **Component Rationale:** Justify every element. 
3. **MANDATORY LAYOUT RETENTION:** Do NOT delete or hide the application's core navigation. The app HAS a left Sidebar that contains administrative tabs: "Gallery", "Event Logs", "Users", and "Workers". "Minimalist" means styling this sidebar elegantly and cleanly (e.g., translucent glassmorphism, subtle monochrome icons), NOT removing it. The admin tools are critical.
4. **Mockups vs Specs:** Image generators struggle with exact UI layouts. Use `generate_image` ONLY for aesthetic mood boards or general lighting/color references. For the actual UI structure, you MUST rely on text-based layout descriptions, Markdown tables, or Mermaid diagrams specifying where the Sidebar, Toolbar, and Grid are positioned.

## 3. Aesthetic Guidelines
- **Cyberpunk Visual Direction:** The product aesthetic is cyberpunk, built from gloss, neon, polished dark metal, glass, reflections, and cinematic city-light contrast. It should feel premium and physical, not flat or generic.
- **Terminal Surface Model:** Treat the web UI like a futuristic terminal/control surface. LiquidGlass belongs on important, large, brand-bearing, navigational, content-framing, or operational command surfaces. Decide by visual weight, scale, and function rather than by a fixed component list.
- **LiquidGlass-First Moments:** When a surface is meant to carry the cyberpunk/gloss/neon feeling, create and tune that feeling through the LiquidGlass laboratory workflow before production. Do not fake the main material with a simple gradient.
- **Media Respect:** The gallery remains media-first. Cyberpunk chrome and command surfaces may be expressive, but photo/video colors should not be globally tinted or distracted.
- **Typography:** Modern, highly legible sans-serif. Information hierarchy should be established through weight, opacity, light, and material contrast, not just size.
- **Micro-interactions:** Use smooth, physical-feeling spring animations (Framer Motion), reflective highlights, and controlled neon energy. Avoid random glitch noise or unreadable flashing.
