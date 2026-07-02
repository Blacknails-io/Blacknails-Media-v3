/**
 * CircuitPattern — SVG procedural de trazado PCB estilo cyberpunk.
 * Genera un circuito electrónico con: grid de sustrato, trazas tipo trace,
 * pads de soldadura (vias) y encapsulados IC, con filtro glow neón.
 */

interface CircuitPatternProps {
  readonly color: string;          // Color neón principal (rgba o hex)
  readonly variant: 0 | 1 | 2;    // Variante de layout de circuito
}

// Trazados SVG path para cada variante de circuito (coordenadas en viewBox 380x210)
const TRACES: Record<0 | 1 | 2, string> = {
  0: `
    M 20 40 L 20 80 L 60 80 L 60 60 L 100 60
    M 100 60 L 140 60 L 140 40 L 200 40 L 200 80
    M 200 40 L 240 40 L 240 20
    M 200 80 L 240 80 L 240 120 L 200 120 L 200 160 L 260 160
    M 60 80 L 60 120 L 100 120 L 100 160 L 140 160 L 140 140
    M 140 160 L 180 160 L 180 140
    M 280 40 L 320 40 L 320 80 L 360 80
    M 280 100 L 320 100 L 320 140 L 280 140 L 280 180 L 340 180
    M 20 160 L 20 180 L 60 180
    M 360 120 L 360 160 L 320 160
  `,
  1: `
    M 40 20 L 40 60 L 80 60 L 80 40 L 140 40 L 140 20
    M 140 40 L 180 40 L 180 80 L 140 80 L 140 120 L 180 120
    M 180 80 L 220 80 L 220 40 L 260 40 L 260 20
    M 80 80 L 80 120 L 40 120 L 40 160 L 80 160 L 80 180
    M 220 120 L 260 120 L 260 160 L 220 160 L 220 180
    M 300 40 L 340 40 L 340 80 L 380 80
    M 300 80 L 300 120 L 340 120 L 340 160 L 300 160
    M 180 160 L 180 180 L 140 180
    M 260 180 L 300 180
  `,
  2: `
    M 20 60 L 60 60 L 60 40 L 100 40 L 100 20
    M 100 40 L 140 40 L 140 80 L 100 80 L 100 120 L 60 120
    M 60 120 L 60 160 L 100 160 L 100 180
    M 140 80 L 200 80 L 200 60 L 240 60 L 240 40 L 280 40
    M 200 80 L 200 120 L 240 120 L 240 160 L 200 160
    M 280 40 L 320 40 L 320 80 L 360 80 L 360 60
    M 320 80 L 320 120 L 280 120 L 280 160 L 320 160
    M 320 160 L 360 160 L 360 140
    M 200 160 L 160 160 L 160 180
    M 20 160 L 20 140 L 40 140
  `,
};

// Coordenadas [x, y] de pads de soldadura (vias) para cada variante
const PADS: Record<0 | 1 | 2, [number, number][]> = {
  0: [[60,80],[100,60],[200,40],[200,80],[60,120],[140,160],[200,160],[280,40],[320,80],[280,140]],
  1: [[80,60],[140,40],[180,80],[220,80],[80,120],[220,160],[300,80],[340,120],[180,160]],
  2: [[60,60],[100,40],[140,80],[200,80],[200,160],[320,80],[280,120],[320,160],[160,160]],
};

// Rectángulos IC [x, y, w, h] y número de pins por cada variante
const CHIPS: Record<0 | 1 | 2, [number, number, number, number][]> = {
  0: [[92,52,48,16],[190,152,48,16],[270,32,40,16]],
  1: [[130,32,50,16],[290,72,50,16],[170,112,50,16]],
  2: [[130,72,50,16],[190,52,50,16],[270,112,50,16]],
};

export const CircuitPattern = ({ color, variant }: CircuitPatternProps) => {
  const uid = `cp-${variant}`;

  return (
    <svg
      width="100%"
      height="100%"
      viewBox="0 0 380 210"
      preserveAspectRatio="xMidYMid slice"
      xmlns="http://www.w3.org/2000/svg"
      style={{ position: 'absolute', inset: 0, display: 'block' }}
      aria-hidden="true"
    >
      <defs>
        {/* Filtro glow neón para trazas y pads */}
        <filter id={`glow-${uid}`} x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="2.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

      {/* Grid de sustrato PCB más visible */}
        <pattern id={`grid-${uid}`} x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
          <path d="M 20 0 L 0 0 0 20" fill="none" stroke={color} strokeWidth="0.5" strokeOpacity="0.18" />
        </pattern>
      </defs>

      {/* ─── Sustrato del PCB ─── */}
      <rect width="100%" height="100%" fill={`url(#grid-${uid})`} />

      {/* ─── Encapsulados IC ─── */}
      {CHIPS[variant].map(([x, y, w, h], i) => (
        <g key={`chip-${i}`} filter={`url(#glow-${uid})`}>
          {/* Cuerpo del chip */}
          <rect x={x} y={y} width={w} height={h} rx="2"
            fill="none" stroke={color} strokeWidth="1.1" strokeOpacity="0.35" />
          {/* Línea divisoria interna del chip */}
          <line x1={x} y1={y + h / 2} x2={x + w} y2={y + h / 2}
            stroke={color} strokeWidth="0.4" strokeOpacity="0.2" />
          {/* Pins superiores */}
          {[0, 1, 2].map((pi) => (
            <line key={pi} x1={x + 10 + pi * 11} y1={y} x2={x + 10 + pi * 11} y2={y - 6}
              stroke={color} strokeWidth="1" strokeOpacity="0.45" />
          ))}
          {/* Pins inferiores */}
          {[0, 1, 2].map((pi) => (
            <line key={pi} x1={x + 10 + pi * 11} y1={y + h} x2={x + 10 + pi * 11} y2={y + h + 6}
              stroke={color} strokeWidth="1" strokeOpacity="0.45" />
          ))}
        </g>
      ))}

      {/* ─── Trazas PCB ─── */}
      <path
        d={TRACES[variant]}
        fill="none"
        stroke={color}
        strokeWidth="1.8"
        strokeOpacity="0.70"
        strokeLinecap="round"
        strokeLinejoin="round"
        filter={`url(#glow-${uid})`}
      />

      {/* ─── Pads de soldadura (vias) ─── */}
      {PADS[variant].map(([x, y], i) => (
        <g key={`pad-${i}`} filter={`url(#glow-${uid})`}>
          {/* Anillo exterior del pad */}
          <circle cx={x} cy={y} r="6" fill="none" stroke={color} strokeWidth="1.4" strokeOpacity="0.65" />
          {/* Core interior del pad */}
          <circle cx={x} cy={y} r="2.8" fill={color} fillOpacity="0.45" />
        </g>
      ))}
    </svg>
  );
};
