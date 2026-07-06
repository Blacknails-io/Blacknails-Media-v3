# Interactive Media Card Example

This example demonstrates how to integrate Atropos 3D parallax effects, Tailwind 4, and Framer Motion spring physics inside a React 19 visual component.

---

## React Component Reference

```tsx
import React from 'react';
import Atropos from 'atropos/react';
import { motion } from 'framer-motion';
import 'atropos/atropos.css';

interface MediaAsset {
  id: string;
  title: string;
  imageUrl: string;
  type: 'IMAGE' | 'VIDEO';
}

interface InteractiveMediaCardProps {
  readonly asset: MediaAsset;
  readonly isSelected?: boolean;
  readonly onClick?: (asset: MediaAsset) => void;
}

export const InteractiveMediaCard: React.FC<InteractiveMediaCardProps> = ({
  asset,
  isSelected = false,
  onClick
}) => {
  // Spring transition physics configuration (Natural feel)
  const springTransition = {
    type: 'spring' as const,
    stiffness: 300,
    damping: 30
  };

  const handleCardClick = () => {
    if (onClick) onClick(asset);
  };

  return (
    // 1. Framer Motion: Entry transition & shared element layoutId
    <motion.div
      layoutId={`card-container-${asset.id}`}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={springTransition}
      className="relative cursor-pointer w-full aspect-square overflow-visible"
      onClick={handleCardClick}
      whileHover={{ scale: 1.02 }} // Physical micro-interaction
      whileTap={{ scale: 0.98 }}
    >
      {/* 2. Atropos 3D Parallax: Dynamic floating layers */}
      <Atropos
        className="w-full h-full rounded-xl overflow-hidden shadow-lg border border-zinc-800"
        shadow={false}
        activeOffset={40}
        rotateTouch={true}
      >
        {/* Layer 1: Background thumbnail */}
        <div className="absolute inset-0 w-full h-full bg-cover bg-center" style={{ backgroundImage: `url(${asset.imageUrl})` }} data-atropos-opacity="0.9;1" />

        {/* Layer 2: Cyber Glass Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/70 via-transparent to-transparent pointer-events-none" />

        {/* Layer 3: Text & metadata (Floats outwards) */}
        <div 
          className="absolute bottom-4 left-4 right-4 flex flex-col justify-end text-zinc-100"
          data-atropos-offset="8"
        >
          <span className="text-xs uppercase font-mono tracking-widest text-violet-400">
            {asset.type}
          </span>
          <h3 className="text-sm font-semibold truncate mt-1">
            {asset.title}
          </h3>
        </div>
      </Atropos>
    </motion.div>
  );
};
```
