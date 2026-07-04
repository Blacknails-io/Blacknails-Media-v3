export const surfacePaletteNames = ['cyan', 'magenta', 'obsidian'] as const;
export type SurfacePaletteName = typeof surfacePaletteNames[number];

export type TextTokenKey = 'primary' | 'secondary' | 'tertiary' | 'disabled';
export type StateTokenKey = 'active' | 'error' | 'warning' | 'success';
export type PalettePresetName = 'corpos' | 'netrunners' | 'underground';

export interface SurfacePalette {
  label: string;
  surfaceBase: string;
  surfaceEdge: string;
  textMain: string;
  accent: string;
  logoPrimary: string;
  logoTertiary: string;
  logoHot: string;
  logoInk: string;
  logoGlow: string;
  rgbBase: string;
  rgbEdge: string;
}

export interface PalettePreset {
  label: string;
  paletteName: SurfacePaletteName;
  text: Record<TextTokenKey, string>;
  state: Record<StateTokenKey, string>;
}

const palettePresetActiveColors = {
  corpos: '#F5C451',
  netrunners: '#00F5FF',
  underground: '#FF4F86'
} satisfies Record<PalettePresetName, string>;

export const palettePresets = {
  corpos: {
    label: 'Corpos',
    paletteName: 'obsidian',
    text: {
      primary: palettePresetActiveColors.corpos,
      secondary: '#E6D28C',
      tertiary: '#BCA05A',
      disabled: '#746A4A'
    },
    state: {
      active: palettePresetActiveColors.corpos,
      error: '#FF5C7A',
      warning: '#FF8A3D',
      success: '#A8FFCF'
    }
  },
  netrunners: {
    label: 'Netrunners',
    paletteName: 'cyan',
    text: {
      primary: palettePresetActiveColors.netrunners,
      secondary: '#B8FFF8',
      tertiary: '#65D6E4',
      disabled: '#438891'
    },
    state: {
      active: palettePresetActiveColors.netrunners,
      error: '#FF4FD8',
      warning: '#F7FF5C',
      success: '#9DFF5A'
    }
  },
  underground: {
    label: 'Underground',
    paletteName: 'magenta',
    text: {
      primary: palettePresetActiveColors.underground,
      secondary: '#FFC1D4',
      tertiary: '#D87899',
      disabled: '#845064'
    },
    state: {
      active: palettePresetActiveColors.underground,
      error: '#FF174D',
      warning: '#FFB45E',
      success: '#67FFB3'
    }
  }
} satisfies Record<PalettePresetName, PalettePreset>;

export const surfacePalettes = {
  cyan: {
    label: 'Cyan',
    surfaceBase: '#020712',
    surfaceEdge: '#35dfff',
    textMain: '#ffffff',
    accent: '#35dfff',
    logoPrimary: '#9df8ff',
    logoTertiary: '#f6fbff',
    logoHot: '#ff2d55',
    logoInk: '#020407',
    logoGlow: 'rgba(56, 248, 255, 0.34)',
    rgbBase: '2, 7, 18',
    rgbEdge: '53, 223, 255'
  },
  magenta: {
    label: 'Magenta',
    surfaceBase: '#12020a',
    surfaceEdge: '#ff2d55',
    textMain: '#ffffff',
    accent: '#ff2d55',
    logoPrimary: '#ff4167',
    logoTertiary: '#f6f0ed',
    logoHot: '#ff174d',
    logoInk: '#050204',
    logoGlow: 'rgba(255, 45, 85, 0.34)',
    rgbBase: '18, 2, 10',
    rgbEdge: '255, 45, 85'
  },
  obsidian: {
    label: 'Obsidian',
    surfaceBase: '#090b10',
    surfaceEdge: '#dbe5f0',
    textMain: '#ffffff',
    accent: '#dbe5f0',
    logoPrimary: '#edf3fb',
    logoTertiary: '#83f4ff',
    logoHot: '#ff2d55',
    logoInk: '#010204',
    logoGlow: 'rgba(237, 243, 251, 0.34)',
    rgbBase: '9, 11, 16',
    rgbEdge: '219, 229, 240'
  }
} satisfies Record<SurfacePaletteName, SurfacePalette>;
