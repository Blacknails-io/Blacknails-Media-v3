import React from 'react';
import Atropos from 'atropos/react';
import { motion } from 'framer-motion';
import 'atropos/atropos.css';

/**
 * EJEMPLO: Componente Interactivo de Tarjeta de Media
 * 
 * Capa: client/src/components/ o similar
 * Tecnologías: React + Tailwind CSS + Atropos + Framer Motion (con transiciones físicas/spring).
 * 
 * Este archivo sirve de referencia para ver cómo integrar efectos parallax 3D (Atropos)
 * con animaciones de entrada, escalado por hover y transiciones fluidas de layout (Framer Motion).
 */

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

export const InteractiveMediaCard = ({
  asset,
  isSelected = false,
  onClick
}: InteractiveMediaCardProps) => {

  // Configuración de la física del resorte (Spring) recomendada en la guía
  const springTransition = {
    type: 'spring' as const,
    stiffness: 300,
    damping: 30
  };

  const handleCardClick = () => {
    if (onClick) onClick(asset);
  };

  return (
    // 1. Framer Motion Wrapper: Controla la animación de entrada de la tarjeta
    // y proporciona soporte para transiciones compartidas de layout (layoutId).
    <motion.div
      layoutId={`card-container-${asset.id}`}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={springTransition}
      className="relative cursor-pointer w-full aspect-square overflow-visible"
      onClick={handleCardClick}
      whileHover={{ scale: 1.02 }} // Micro-interacción física de Framer Motion
      whileTap={{ scale: 0.98 }}
    >
      {/* 2. Parallax 3D (Atropos): Crea capas visuales que flotan dinámicamente con el ratón */}
      <Atropos
        className="w-full h-full rounded-2xl overflow-hidden"
        activeOffset={15}
        shadow={true}
        highlight={true}
      >
        <div 
          className={`relative w-full h-full bg-zinc-900 border transition-all duration-300 ${
            isSelected ? 'border-violet-500 shadow-md shadow-violet-500/20' : 'border-white/10'
          }`}
        >
          {/* Capa -2 (Fondo de Imagen): Desplazamiento sutil hacia atrás para profundidad */}
          <img
            src={asset.imageUrl}
            alt={asset.title}
            className="absolute inset-0 w-full h-full object-cover select-none"
            data-atropos-offset="-2"
          />

          {/* Capa 0: Gradiente protector de contraste */}
          <div 
            className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none"
            data-atropos-offset="0"
          />

          {/* Capa 3: Insignias de metadatos flotantes */}
          <div 
            className="absolute top-3 right-3 px-2.5 py-1 rounded-md bg-zinc-900/80 backdrop-blur-md border border-white/10 text-xs font-mono text-zinc-300"
            data-atropos-offset="3"
          >
            {asset.type}
          </div>

          {/* Capa 5: Título de la imagen desplazado hacia el frente */}
          <div 
            className="absolute bottom-4 left-4 right-4 text-left pointer-events-none"
            data-atropos-offset="5"
          >
            <h3 className="text-sm font-semibold text-white truncate drop-shadow-md">
              {asset.title}
            </h3>
          </div>
        </div>
      </Atropos>
    </motion.div>
  );
};
