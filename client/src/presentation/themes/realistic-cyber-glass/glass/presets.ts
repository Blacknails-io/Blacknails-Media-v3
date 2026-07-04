import type { GlassConfig } from '@ybouane/liquidglass';

export type SurfacePreset = Partial<GlassConfig>;

export const surfacePresets = {
  clear: {
    floating: false,
    button: false,
    blurAmount: 0,
    refraction: 0.18,
    chromAberration: 0,
    edgeHighlight: 0.03,
    specular: 0,
    fresnel: 0.35,
    cornerRadius: 65,
    zRadius: 40,
    brightness: 0.02,
    saturation: -0.08,
    shadowOpacity: 0.14,
    bevelMode: 0
  } satisfies SurfacePreset,
  dense: {
    floating: false,
    button: false,
    blurAmount: 0.55,
    refraction: 1.08,
    chromAberration: 0.18,
    edgeHighlight: 0.62,
    specular: 0.72,
    fresnel: 3.25,
    cornerRadius: 65,
    zRadius: 78,
    brightness: -0.04,
    saturation: 0.24,
    shadowOpacity: 0.72,
    bevelMode: 0
  } satisfies SurfacePreset,
  shape: {
    floating: false,
    button: false,
    blurAmount: 0.18,
    refraction: 0.74,
    chromAberration: 0.03,
    edgeHighlight: 0.34,
    specular: 0.35,
    fresnel: 2.2,
    cornerRadius: 18,
    zRadius: 72,
    brightness: 0,
    saturation: 0,
    shadowOpacity: 0.48,
    bevelMode: 1
  } satisfies SurfacePreset,
  loginPanel: {
    floating: false,
    button: false,
    blurAmount: 0,
    refraction: 0.69,
    chromAberration: 0.05,
    edgeHighlight: 0.05,
    specular: 0,
    fresnel: 1,
    cornerRadius: 40,
    zRadius: 40,
    saturation: 0,
    brightness: 0,
    shadowOpacity: 0.3,
    bevelMode: 0
  } satisfies SurfacePreset
} as const;
