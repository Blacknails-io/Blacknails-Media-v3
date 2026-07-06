import type { ReactNode, CSSProperties } from 'react';

export interface LabControlSlider {
  type: 'slider';
  key: string;
  label: string;
  min: number;
  max: number;
  step: number;
  group?: string;
}

export interface LabControlToggle {
  type: 'toggle';
  key: string;
  label: string;
  group?: string;
}

export interface LabControlColor {
  type: 'color';
  key: string;
  label: string;
  group?: string;
}

export type LabControl = LabControlSlider | LabControlToggle | LabControlColor;

export interface LabPalette<P = any> {
  id: string;
  name: string;
  swatchA: string;
  swatchB: string;
  data: P;
}

export interface LabStyleWrapperProps<C = any, P = any> {
  config: C;
  palette: LabPalette<P>;
  panelClassName?: string;
  contentClassName?: string;
  children: ReactNode;
}

export interface LabStyle<C = any, P = any> {
  id: string;
  name: string;
  controls: LabControl[];
  defaultConfig: C;
  palettes: LabPalette<P>[];
  getCssVars?: (config: C, palette: LabPalette<P>) => CSSProperties;
  Wrapper: React.ComponentType<LabStyleWrapperProps<C, P>>;
}

export interface LabVariant {
  id: string;
  name: string;
}

export interface LabSpecimenProps<C = any, P = any> {
  variantId: string;
  palette: LabPalette<P>;
  config: C;
}

export interface LabSpecimen<C = any, P = any> {
  id: string;
  name: string;
  variants: LabVariant[];
  getPanelClassName?: (variantId: string) => string | undefined;
  getContentClassName?: (variantId: string) => string | undefined;
  Component: React.ComponentType<LabSpecimenProps<C, P>>;
}
