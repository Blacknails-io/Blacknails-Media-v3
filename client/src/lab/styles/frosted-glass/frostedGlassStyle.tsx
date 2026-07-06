import type { LabStyle, LabPalette, LabStyleWrapperProps } from '../../core/types.js';
import { FrostedGlassSurface } from '../../../presentation/ui/surfaces/FrostedGlassSurface/index.js';
import labStyles from '../../core/VisualLab.module.css';
import { palettePresets, surfacePalettes, type PalettePreset } from '../../../presentation/themes/realistic-cyber-glass/glass/palette.js';

export interface FrostedGlassPaletteData {
  blurAmount: number;
  refraction: number;
}

const palettes: LabPalette<PalettePreset>[] = Object.entries(palettePresets).map(([id, preset]) => ({
  id,
  name: preset.label,
  swatchA: surfacePalettes[preset.paletteName].surfaceBase,
  swatchB: preset.text.primary,
  data: preset
}));

const FrostedGlassWrapper = ({ panelClassName, contentClassName, children }: LabStyleWrapperProps<any, PalettePreset>) => {
  return (
    <FrostedGlassSurface
      className={labStyles.previewStage}
      backgroundClassName={labStyles.previewBackdrop}
      panelClassName={panelClassName}
      contentClassName={contentClassName}
      rootInstanceId="frostedglass-lab-preview"
      panelInstanceId="frostedglass-lab-panel"
      background={(
        <img src="/demo/liquidglass-background.png" alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      )}
    >
      {children}
    </FrostedGlassSurface>
  );
};

export const frostedGlassStyle: LabStyle<any, PalettePreset> = {
  id: 'frosted-glass',
  name: 'Frosted Glass',
  palettes,
  defaultConfig: {},
  controls: [
    { type: 'color', key: '--text-primary', label: 'Text Primary', group: 'Typography' },
    { type: 'color', key: '--text-secondary', label: 'Text Secondary', group: 'Typography' },
    { type: 'color', key: '--text-tertiary', label: 'Text Tertiary', group: 'Typography' },
    { type: 'color', key: '--text-disabled', label: 'Text Disabled', group: 'Typography' },
    { type: 'color', key: '--accent-cyan', label: 'Accent Active', group: 'Material States' },
    { type: 'color', key: '--accent-ruby', label: 'Accent Error', group: 'Material States' },
    { type: 'color', key: '--accent-amber', label: 'Accent Warning', group: 'Material States' },
    { type: 'color', key: '--accent-lime', label: 'Accent Success', group: 'Material States' }
  ],
  getCssVars: (_config, palette) => {
    const { data } = palette;
    const surface = surfacePalettes[data.paletteName];
    return {
      '--text-primary': _config['--text-primary'] || data.text.primary,
      '--text-secondary': _config['--text-secondary'] || data.text.secondary,
      '--text-tertiary': _config['--text-tertiary'] || data.text.tertiary,
      '--text-disabled': _config['--text-disabled'] || data.text.disabled,
      '--accent-cyan': _config['--accent-cyan'] || data.state.active,
      '--accent-ruby': _config['--accent-ruby'] || data.state.error,
      '--accent-amber': _config['--accent-amber'] || data.state.warning,
      '--accent-lime': _config['--accent-lime'] || data.state.success,
      '--logo-primary': surface.logoPrimary,
      '--logo-tertiary': surface.logoTertiary,
      '--logo-hot': surface.logoHot,
      '--lab-surface-rgb-base': surface.rgbBase,
      '--lab-surface-rgb-edge': surface.rgbEdge,
    } as any;
  },
  Wrapper: FrostedGlassWrapper
};
