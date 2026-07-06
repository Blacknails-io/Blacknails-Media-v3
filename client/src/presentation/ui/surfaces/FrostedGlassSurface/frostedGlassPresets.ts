export type SurfacePreset = 'default' | 'cyber' | 'stealth';
export type FrostedGlassPreset = Record<string, unknown>;

export const surfacePresets = {
  default: {},
  cyber: {},
  stealth: {}
};

export const frostedGlassPresets = surfacePresets;
