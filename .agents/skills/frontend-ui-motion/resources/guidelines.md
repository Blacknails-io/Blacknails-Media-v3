# Frontend UI, UX & Motion Guidelines

This skill defines rules, architectural patterns, and design details for development within the `/client` workspace of **Blacknails-Media-v3**.

## Design Philosophy

The application must feel premium, fluid, and visually stunning:
- **Color Palette**: Sleek dark mode by default. Use deep slate/zinc backgrounds (`#09090b`, `#18181b`), vibrant accents for actions/highlights (e.g. violet/indigo gradients), and muted colors for borders/metadata.
- **Typography**: Modern sans-serif (e.g. Inter, Outfit, or system default) with clear hierarchy and readable line-heights.
- **Glassmorphism**: Use backdrop filters (`backdrop-blur-md bg-zinc-900/60 border border-white/10`) for overlays, modals, and sticky navbars to create layers.

## Frameworks & Tooling

### React 19
- Prefer modern functional components with TypeScript.
- Use native React 19 hooks and paradigms where applicable (e.g., standard state management, async action handlers).
- Ensure strict typing for all component props and state.

### Tailwind CSS 4
- Use utility classes instead of inline styles.
- Leverage Tailwind 4 features (native CSS configurations, container queries, modern color variables).
- Maintain consistent padding/margin scales.

### Framer Motion & Atropos
- Use **Atropos** (`atropos/react`) for premium 3D parallax card effects on media items/assets in grid lists.
- Use **Framer Motion** for:
  - Slide-in panel layouts and modal overlays.
  - Lightbox image entry/exit zooms.
  - `layoutId` for smooth shared element transitions (e.g., clicking a grid item to expand it into a lightbox).
- Maintain spring animations (`type: "spring", stiffness: 300, damping: 30`) for physical, natural-feeling micro-interactions.

## Performance & UX Optimization

- **Virtualization & Lazy Loading**: Use virtualized grids for photo/video feeds if rendering thousands of items to avoid DOM bloat. Lazy-load thumbnails.
- **Media Containers**: Always specify aspect ratios (`aspect-square`, `aspect-video`) or dynamic tailwind aspect classes to avoid Layout Shift (CLS) as media loads.
- **Fallback states**: Provide skeleton loaders matching the exact dimensions of media items while they fetch.