# Technical Specification: Prosumer UI Layout (PhotoPrism Style)

This document outlines the technical approach to implementing the new "Prosumer" UI for Blacknails-Media-v3. Shifting away from an extreme minimalist design, this layout embraces a data-dense yet clean architecture reminiscent of PhotoPrism, providing deep access to metadata, AI tags, and administrative options without overwhelming the user.

## 1. Architectural Philosophy
- **Data-Dense but Clean:** Information hierarchy relies on opacity and font weight (e.g., `text-zinc-400` for secondary data) rather than just size.
- **Persistent Context:** The administrative sidebar is a core part of the layout, never completely removed, ensuring quick access to tools like "Event Logs" and "Workers".
- **Media as Protagonist:** Neutral backgrounds (pure whites/light grays in light mode, deep slate/blacks in dark mode) ensure photographs are not tinted by UI elements.
- **Fluidity:** Framer Motion is used for subtle, physical-feeling spring animations rather than abrupt UI changes.

## 2. Layout Architecture

The overall layout is built on a responsive, flexible shell that accommodates a left navigation sidebar and a full-width central media grid. Deep metadata inspection happens in the asset viewer/modal so the grid keeps the density required by the prosumer gallery mockup.

```mermaid
graph TD
    subgraph App Shell
        direction LR
        Sidebar[Left Sidebar<br>w-64 | flex-col | border-r]
        MainContainer[Main Content Area<br>flex-1 | flex-col]
        Sidebar --> MainContainer
        
        subgraph Main Area
            direction TB
            TopBar[Top Bar / Header<br>Search | Filters | View Options]
            ContentRow[Content Row<br>flex-1 | flex-row | overflow-hidden]
            TopBar --> ContentRow
            
            subgraph Content Body
                direction LR
                Grid[Full-Width Media Grid<br>grid | overflow-y-auto | flex-1]
            end
            Viewer[Asset Viewer Modal<br>Metadata | AI Tags | Review Actions]
            Grid -.->|Open Item| Viewer
        end
    end
```

## 3. Tailwind CSS 4 Implementation Specs

### 3.1. Application Shell
The root application wrapper ensures a full-viewport, non-scrolling foundation where only specific panels scroll.
```css
/* Core Shell Classes */
.app-shell {
  @apply h-screen w-full flex bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 overflow-hidden;
}
```

### 3.2. Left Sidebar (Navigation & Admin)
The sidebar holds the core navigation ("Gallery", "Event Logs", "Users", "Workers"). It uses a translucent glassmorphism effect to maintain a high-end feel while indicating context.
```css
.sidebar {
  @apply w-16 md:w-64 flex-shrink-0 flex flex-col border-r border-zinc-200 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-950/80 backdrop-blur-md transition-all duration-300;
}
.sidebar-item {
  @apply flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800/50 transition-colors;
}
```

### 3.3. Top Bar & Filters
A persistent header for contextual actions, advanced search, and filter toggles.
```css
.topbar {
  @apply h-16 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between px-6 bg-white/90 dark:bg-zinc-950/90 backdrop-blur-md sticky top-0 z-10;
}
```

### 3.4. Media Grid & Prosumer Cards
The photo grid uses CSS grid with auto-fill to seamlessly adapt to the container width. The cards themselves must handle dense data gracefully (e.g., overlaying small badges for AI tags or EXIF summaries on hover).
```css
.media-grid {
  @apply grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-4 p-6 overflow-y-auto flex-1;
}
.media-card {
  @apply relative aspect-square rounded-xl overflow-hidden bg-zinc-100 dark:bg-zinc-900 shadow-sm ring-1 ring-zinc-900/5 dark:ring-white/10;
}
.media-card-overlay {
  @apply absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3;
}
```

### 3.5. Asset Viewer Modal (Metadata & AI)
Opening a media item launches the viewer/modal for EXIF data, AI-generated descriptions, tags, review controls, and face-related context. The gallery must not reserve a fixed right-side inspector column; that space belongs to the media wall.
```css
.asset-viewer-modal {
  @apply fixed inset-0 z-50 flex bg-black/80 backdrop-blur-md;
}
.asset-viewer-metadata {
  @apply w-full max-w-sm overflow-y-auto border-l border-white/10 bg-zinc-950/90 p-5;
}
.metadata-label {
  @apply text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-500 mt-4 mb-1;
}
.metadata-value {
  @apply text-sm text-zinc-900 dark:text-zinc-200;
}
```

## 4. Framer Motion Interactions

To ensure the UI feels dynamic but not chaotic, we use physics-based spring animations for micro-interactions.

### 4.1. Media Card Hover
Instead of simple CSS scaling, use Framer Motion for a spring-loaded zoom and overlay reveal.
```jsx
<motion.div
  whileHover={{ scale: 1.02 }}
  transition={{ type: "spring", stiffness: 300, damping: 20 }}
  className="media-card group"
>
  <motion.img 
    src={media.src} 
    className="w-full h-full object-cover"
  />
  <div className="media-card-overlay">
    {/* Dense Data: AI Tags, Date, Format */}
    <span className="text-white text-xs font-medium">{media.date}</span>
  </div>
</motion.div>
```

### 4.2. Asset Viewer Reveal
When opening media, the grid remains stable behind the overlay while the viewer/modal animates in with a spring.
```jsx
<motion.div
  role="dialog"
  initial={{ opacity: 0, scale: 0.98 }}
  animate={{ opacity: 1, scale: 1 }}
  exit={{ opacity: 0, scale: 0.98 }}
  transition={{ type: "spring", bounce: 0, duration: 0.28 }}
  className="asset-viewer-modal"
>
  {/* Media Preview + Metadata Content */}
</motion.div>
```

## 5. Data Density vs. Cleanliness Strategies

To achieve the "PhotoPrism" style data density without clutter:

1. **Progressive Disclosure:** 
   - *Grid View:* Show only the image. On hover, reveal minimal badges (e.g., "RAW", "4K", Date, AI-Face-Count).
   - *Asset Viewer:* Show exhaustive data (Camera Model, ISO, Aperture, detailed AI scene descriptions, exact file paths) in the modal opened from a card.
2. **Visual Hierarchy via Opacity:** Use `text-zinc-500` or `opacity-60` for less important labels, keeping the value (the data itself) prominent.
3. **Pill Badges for AI Tags:** Represent AI classifications as compact pills with neutral background colors (e.g., `bg-zinc-100 dark:bg-zinc-800 text-xs rounded-full px-2 py-1`) to keep them visually distinct but unobtrusive.
4. **Iconography:** Use crisp, line-based monochrome icons (e.g., Lucide Icons) to represent metadata fields instead of repetitive text labels (e.g., an aperture icon next to "f/2.8" instead of "Aperture: f/2.8").
