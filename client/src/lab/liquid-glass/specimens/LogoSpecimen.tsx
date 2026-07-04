import styles from '../LiquidGlassLab.module.css';

export type LogoMode = 'lockup' | 'badge' | 'monogram';
export type LogoPaletteName = 'blackChrome' | 'graphiteCyan' | 'oxbloodChrome';

interface LogoSpecimenProps {
  mode: LogoMode;
  paletteName: LogoPaletteName;
}

export function LogoSpecimen({ mode, paletteName }: LogoSpecimenProps) {
  const showText = mode !== 'monogram';
  const compact = mode !== 'lockup';

  return (
    <div className={styles.logoSpecimen} data-mode={mode} data-palette={paletteName}>
      <svg className={styles.logoSymbol} viewBox="0 0 260 240" role="img" aria-label="Blacknails">
        <defs>
          <linearGradient id="logo-specimen-edge" x1="24" y1="18" x2="232" y2="218" gradientUnits="userSpaceOnUse">
            <stop stopColor="var(--logo-primary)" />
            <stop offset="0.52" stopColor="var(--logo-tertiary)" />
            <stop offset="1" stopColor="var(--logo-hot)" />
          </linearGradient>
          <linearGradient id="logo-specimen-prism" x1="58" y1="38" x2="212" y2="182" gradientUnits="userSpaceOnUse">
            <stop stopColor="#ffffff" stopOpacity="0.26" />
            <stop offset="0.34" stopColor="var(--logo-primary)" stopOpacity="0.18" />
            <stop offset="0.66" stopColor="var(--logo-hot)" stopOpacity="0.14" />
            <stop offset="1" stopColor="#ffffff" stopOpacity="0.22" />
          </linearGradient>
          <linearGradient id="logo-specimen-shine" x1="52" y1="24" x2="196" y2="204" gradientUnits="userSpaceOnUse">
            <stop stopColor="#ffffff" stopOpacity="0.86" />
            <stop offset="0.44" stopColor="#ffffff" stopOpacity="0.1" />
            <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
          </linearGradient>
          <filter id="logo-specimen-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3.2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <path className={styles.logoShield} d="M130 8 219 43 239 76 238 151 176 197 130 230 84 197 22 151 21 76 41 43Z" />
        <path className={styles.logoShieldInner} d="M130 24 204 52 222 82 220 142 169 180 130 209 91 180 40 142 38 82 56 52Z" />
        <path className={styles.logoPrism} d="M130 38 193 62 207 86 205 135 162 168 130 190 98 168 55 135 53 86 67 62Z" />

        <g className={styles.logoDepthPanels}>
          <path d="M52 86 70 68 88 74 76 105 55 121Z" />
          <path d="M172 74 191 68 208 86 205 121 184 105Z" />
          <path d="M67 136 96 128 86 159 61 151Z" />
          <path d="M193 136 164 128 174 159 199 151Z" />
          <path d="M99 174 130 191 161 174 130 210Z" />
          <path d="M104 67 130 42 156 67 144 93 130 104 116 93Z" />
        </g>

        <g className={styles.logoShieldFacets}>
          <path d="M41 43 56 52 38 82 21 76Z" />
          <path d="M219 43 204 52 222 82 239 76Z" />
          <path d="M21 76 38 82 40 142 22 151Z" />
          <path d="M239 76 222 82 220 142 238 151Z" />
          <path d="M22 151 40 142 91 180 84 197Z" />
          <path d="M238 151 220 142 169 180 176 197Z" />
          <path d="M84 197 91 180 130 209 130 230Z" />
          <path d="M176 197 169 180 130 209 130 230Z" />
          <path d="M56 52 67 62 53 86 38 82Z" />
          <path d="M204 52 193 62 207 86 222 82Z" />
          <path d="M53 86 55 135 40 142 38 82Z" />
          <path d="M207 86 205 135 220 142 222 82Z" />
        </g>

        <g className={styles.logoOuterRails}>
          <path d="M41 43 21 76 22 151 84 197 130 230" />
          <path d="M219 43 239 76 238 151 176 197 130 230" />
          <path d="M56 52 38 82 40 142 91 180 130 209" />
          <path d="M204 52 222 82 220 142 169 180 130 209" />
          <path d="M22 84H12v56h10M238 84h10v56h-10" />
          <path d="M49 68H30M211 68h19M64 175 47 187M196 175l17 12" />
        </g>

        <g className={styles.logoColorShards}>
          <path d="M63 88 76 76 87 82 74 109Z" />
          <path d="M94 64 113 57 107 83 89 92Z" />
          <path d="M123 46 143 47 137 68 119 69Z" />
          <path d="M153 58 173 65 168 91 150 83Z" />
          <path d="M184 76 197 88 186 110 174 91Z" />
          <path d="M75 143 103 132 94 154 72 161Z" />
          <path d="M118 116 130 108 143 116 138 145 121 145Z" />
          <path d="M158 132 186 143 188 161 166 154Z" />
          <path d="M103 177 119 186 113 202 94 188Z" />
          <path d="M157 177 141 186 147 202 166 188Z" />
        </g>

        <g className={styles.logoCircuitLayer} filter="url(#logo-specimen-glow)">
          <path className={styles.logoCircuit} d="M130 190V132M130 132l-28-28V70M130 132l30-30V70" />
          <path className={styles.logoCircuitHot} d="M116 184v-39L81 110V82M144 184v-39l36-36V82" />
          <path className={styles.logoCircuit} d="M65 136h32l15 15M195 136h-32l-15 15" />
          <path className={styles.logoCircuitSoft} d="M92 205v-22l-16-16v-18H58M168 205v-22l17-16v-18h19" />
          <path className={styles.logoCircuitSoft} d="M102 66H80v25l20 19M158 66h23v25l-21 19" />
          <path className={styles.logoCircuitSoft} d="M61 103h21l13-13M199 103h-22l-13-13" />
          <path className={styles.logoCircuitHot} d="M130 73v31l-14 14M130 73v31l15 15" />
          <circle className={styles.logoNode} cx="130" cy="189" r="4" />
          <circle className={styles.logoNode} cx="82" cy="82" r="4" />
          <circle className={styles.logoNodeHot} cx="180" cy="82" r="4" />
          <circle className={styles.logoCircuitPin} cx="58" cy="149" r="2.4" />
          <circle className={styles.logoCircuitPin} cx="204" cy="149" r="2.4" />
          <circle className={styles.logoCircuitPin} cx="101" cy="66" r="2.2" />
          <circle className={styles.logoCircuitPin} cx="159" cy="66" r="2.2" />
          <circle className={styles.logoCircuitPinHot} cx="116" cy="118" r="2.6" />
          <circle className={styles.logoCircuitPinHot} cx="145" cy="119" r="2.6" />
        </g>

        <g className={styles.logoRimNodes}>
          <circle cx="45" cy="83" r="2.2" />
          <circle cx="215" cy="83" r="2.2" />
          <circle cx="42" cy="138" r="1.8" />
          <circle cx="218" cy="138" r="1.8" />
          <circle cx="91" cy="181" r="2" />
          <circle cx="169" cy="181" r="2" />
          <circle cx="130" cy="207" r="2.3" />
        </g>

        <g className={styles.logoFist} filter="url(#logo-specimen-glow)">
          <path className={styles.logoFinger} d="M72 113 68 93 66 70 68 49 77 31 91 24 106 26 116 40 118 64 115 88 111 113 95 117 81 116Z" />
          <path className={styles.logoFinger} d="M103 114 99 86 99 56 102 33 113 15 128 10 144 13 155 32 158 58 154 88 150 114 134 119 117 118Z" />
          <path className={styles.logoFinger} d="M141 114 138 91 138 67 141 47 151 29 166 27 179 34 187 51 188 74 184 96 180 117 166 122 152 120Z" />
          <path className={styles.logoFinger} d="M176 118 174 95 175 72 185 55 199 56 211 64 217 80 215 99 207 124 193 130 181 126Z" />
          <path className={styles.logoThumb} d="M59 78 45 86 35 98 39 116 48 130 67 132 86 126 101 102 89 84 74 75Z" />
          <path className={styles.logoPalm} d="M84 112 108 99 132 97 154 100 181 118 177 142 171 168 145 191H112L84 171 69 139 72 124Z" />
          <path className={styles.logoWrist} d="M92 166 112 191 109 220H84L73 178Z" />
          <path className={styles.logoWrist} d="M166 166 146 191 152 220H176L187 178Z" />

          <g className={styles.logoFingerSegments}>
            <path d="M71 53 86 47 111 48" />
            <path d="M68 73 86 70 116 70" />
            <path d="M70 94 88 93 113 91" />
            <path d="M103 36 121 31 153 35" />
            <path d="M100 58 124 55 157 59" />
            <path d="M101 85 125 84 153 86" />
            <path d="M143 50 160 45 185 53" />
            <path d="M140 70 160 68 187 74" />
            <path d="M141 94 160 95 183 97" />
            <path d="M178 74 194 70 214 82" />
            <path d="M176 97 193 98 212 101" />
          </g>

          <g className={styles.logoKnuckleCaps}>
            <path d="M77 31 91 24 106 26 116 40 111 48 86 47 70 54Z" />
            <path d="M113 15 128 10 144 13 155 32 153 36 122 31 103 36Z" />
            <path d="M151 29 166 27 179 34 187 51 185 53 160 45 143 50Z" />
            <path d="M185 55 199 56 211 64 217 80 214 82 194 70 178 74Z" />
          </g>

          <g className={styles.logoPalmPanels}>
            <path d="M87 124 109 107 119 134 108 155 81 160 70 138Z" />
            <path d="M119 106 134 101 148 107 143 148 128 156 112 147Z" />
            <path d="M150 108 176 122 171 148 154 162 139 148Z" />
            <path d="M110 158 128 150 147 158 143 181 118 181Z" />
            <path d="M83 170 112 191 109 220 96 201Z" />
            <path d="M176 171 146 191 152 220 166 200Z" />
          </g>

          <g className={styles.logoJointRings}>
            <circle cx="58" cy="104" r="9" />
            <circle cx="78" cy="124" r="6" />
            <circle cx="178" cy="124" r="5.5" />
          </g>

          <g className={styles.logoSignalCuts}>
            <path d="M84 64 95 59 105 61" />
            <path d="M82 82 97 79 108 80" />
            <path d="M116 46 131 43 145 46" />
            <path d="M115 72 132 70 149 72" />
            <path d="M154 61 166 59 177 64" />
            <path d="M153 83 167 83 181 88" />
            <path d="M189 84 199 85 209 92" />
            <path d="M78 116 92 112 101 103" />
            <path d="M159 103 174 113 181 125" />
          </g>
        </g>

        <g className={styles.logoFacets}>
          <path d="M80 38 97 34 111 50 89 57Z" />
          <path d="M113 24 139 22 150 39 109 44Z" />
          <path d="M151 39 171 43 179 57 144 56Z" />
          <path d="M187 65 205 74 208 88 181 86Z" />
          <path d="M70 58 88 57 78 75 66 72Z" />
          <path d="M101 61 116 65 111 88 96 82Z" />
          <path d="M124 38 151 38 144 55 118 56Z" />
          <path d="M144 67 184 70 177 92 151 86Z" />
          <path d="M43 101 57 88 69 112 50 121Z" />
          <path d="M87 125 118 106 109 151 79 159Z" />
          <path d="M112 108 130 101 143 107 137 149 119 149Z" />
          <path d="M145 108 174 124 165 160 136 151Z" />
          <path d="M91 164 116 181 111 191 83 170Z" />
          <path d="M145 181 170 164 176 171 145 191Z" />
          <path d="M76 180 95 199 89 214 73 178Z" />
          <path d="M184 180 165 199 171 214 187 178Z" />
        </g>

        <g className={styles.logoNails}>
          <path d="M76 49 84 36 102 34 111 48 102 58 82 61 73 56Z" />
          <path d="M114 36 123 22 143 21 152 36 140 49 121 51 111 45Z" />
          <path d="M151 50 160 39 176 42 181 56 170 67 154 64 147 58Z" />
          <path d="M187 72 195 64 209 69 212 81 202 91 189 88 183 81Z" />
        </g>

        <g className={styles.logoNailShine}>
          <path d="M84 39 101 37 107 46" />
          <path d="M124 25 142 24 148 34" />
          <path d="M161 42 175 45 178 54" />
          <path d="M196 67 207 71 210 79" />
        </g>

        <g className={styles.logoPlateLines}>
          <path d="M41 96 56 80 80 83" />
          <path d="M45 124 73 124 89 103" />
          <path d="M72 142 98 133 119 107" />
          <path d="M65 156 89 166 113 153" />
          <path d="M95 189 110 193 122 181" />
          <path d="M116 217 130 228 144 217" />
          <path d="M188 121 207 102 213 80" />
          <path d="M171 145 191 135 207 118" />
          <path d="M149 153 172 166 195 156" />
          <path d="M139 181 151 193 166 189" />
        </g>

        <g className={styles.logoMicroCuts}>
          <path d="M52 74h14M47 88h9M48 108h13M52 151h12M72 176h12" />
          <path d="M208 74h-14M213 88h-9M212 108h-13M208 151h-12M188 176h-12" />
          <path d="M111 34l9-3M139 32l10 4M95 199l12 8M165 199l-12 8" />
          <path d="M102 91l12 9M158 91l-12 9M117 165h26M122 174h16" />
        </g>

        <g className={styles.logoCircuitInlay} filter="url(#logo-specimen-glow)">
          <path d="M130 178v-18l-12-12M130 178v-18l13-12" />
          <path d="M92 146h18l9-10M168 146h-19l-9-10" />
          <path d="M82 120h18l12-14M178 120h-18l-12-14" />
          <circle cx="130" cy="159" r="2.4" />
          <circle cx="118" cy="148" r="2.1" />
          <circle cx="143" cy="148" r="2.1" />
        </g>

        <path className={styles.logoEdgeLine} d="M130 8 219 43 239 76 238 151 176 197 130 230 84 197 22 151 21 76 41 43Z" />
        <path className={styles.logoFacetEdges} d="M56 52 38 82M204 52 222 82M40 142 91 180M220 142 169 180M91 180 130 209 169 180M67 62 130 38 193 62M55 135 98 168 130 190 162 168 205 135" />
        <path className={styles.logoShine} d="M57 60C93 25 151 13 207 57M75 134c47-30 93-31 136-7M86 31 55 126M143 17l-26 152M204 60l-57 122M51 87c25-13 48-18 68-17M156 71c23-3 44 2 61 14M94 180c23 14 48 15 74 1" />
      </svg>

      {showText && (
        <div className={styles.logoWordmark} data-compact={compact ? 'true' : undefined}>
          <span>BLACKNAILS</span>
        </div>
      )}
    </div>
  );
}
