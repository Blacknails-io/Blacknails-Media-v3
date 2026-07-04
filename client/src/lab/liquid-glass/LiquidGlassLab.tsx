import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import type { GlassConfig } from '@ybouane/liquidglass';
import {
  LiquidGlassSurface,
  surfacePresets
} from '../../presentation/ui/surfaces/LiquidGlassSurface/index.js';
import {
  palettePresets,
  surfacePaletteNames,
  surfacePalettes,
  type PalettePresetName,
  type StateTokenKey,
  type SurfacePalette,
  type SurfacePaletteName,
  type TextTokenKey
} from '../../presentation/themes/realistic-cyber-glass/glass/palette.js';
import { LogoSpecimen, type LogoMode, type LogoPaletteName } from './specimens/LogoSpecimen.js';
import styles from './LiquidGlassLab.module.css';

type NumericMaterialKey = Extract<keyof GlassConfig,
  | 'blurAmount'
  | 'refraction'
  | 'chromAberration'
  | 'edgeHighlight'
  | 'specular'
  | 'fresnel'
  | 'cornerRadius'
  | 'zRadius'
  | 'brightness'
  | 'saturation'
  | 'shadowOpacity'
  | 'bevelMode'
>;

type BooleanMaterialKey = Extract<keyof GlassConfig, 'floating' | 'button'>;

interface SliderSpec {
  key: NumericMaterialKey;
  label: string;
  min: number;
  max: number;
  step: number;
}

interface ToggleSpec {
  key: BooleanMaterialKey;
  label: string;
}

type LabSpecimenName = 'login' | 'logo' | 'calibration';
type LabVariantName = 'var1' | 'var2' | 'var3';

interface LabAgentStatus {
  active: boolean;
  message: string;
}

interface LiquidGlassLabProps {
  initialSpecimen?: LabSpecimenName;
}

const labAgentStatusUrl = '/demo/lab-agent-status.json';
const fallbackLabAgentMessage = 'Codex ajustando el componente visual';
const specimenNames = ['calibration', 'login', 'logo'] as const satisfies readonly LabSpecimenName[];
const specimenLabels = {
  calibration: 'Calibration',
  login: 'Login',
  logo: 'Logo'
} satisfies Record<LabSpecimenName, string>;

const textTokenSpecs = [
  { key: 'primary', name: 'Primary', token: '--text-primary', sample: 'Archive command ready' },
  { key: 'secondary', name: 'Secondary', token: '--text-secondary', sample: 'Media intelligence synchronized' },
  { key: 'tertiary', name: 'Tertiary', token: '--text-tertiary', sample: 'Last scan 03:17:42' },
  { key: 'disabled', name: 'Disabled', token: '--text-disabled', sample: 'Offline worker channel' }
] as const satisfies ReadonlyArray<{
  key: TextTokenKey;
  name: string;
  token: `--text-${string}`;
  sample: string;
}>;

const stateTokenSpecs = [
  { key: 'active', name: 'Active', token: '--accent-cyan', sample: 'Gallery index online' },
  { key: 'error', name: 'Error', token: '--accent-ruby', sample: 'Authentication rejected' },
  { key: 'warning', name: 'Warning', token: '--accent-amber', sample: 'Derivative queue delayed' },
  { key: 'success', name: 'Success', token: '--accent-lime', sample: 'AI metadata complete' }
] as const satisfies ReadonlyArray<{
  key: StateTokenKey;
  name: string;
  token: `--accent-${string}`;
  sample: string;
}>;

const logoModeByVariant = {
  var1: 'lockup',
  var2: 'badge',
  var3: 'monogram'
} satisfies Record<LabVariantName, LogoMode>;

const logoPaletteByLabPalette = {
  cyan: 'graphiteCyan',
  magenta: 'oxbloodChrome',
  obsidian: 'blackChrome'
} satisfies Record<SurfacePaletteName, LogoPaletteName>;

const resolveSpecimenName = (value: string | null | undefined): LabSpecimenName | undefined => {
  if (value === 'glass' || value === 'surface') {
    return 'calibration';
  }
  return specimenNames.includes(value as LabSpecimenName) ? value as LabSpecimenName : undefined;
};

const sliderSpecs = [
  { key: 'blurAmount', label: 'Blur Amount', min: 0, max: 1, step: 0.01 },
  { key: 'refraction', label: 'Refraction', min: 0, max: 1.2, step: 0.01 },
  { key: 'chromAberration', label: 'Chrom. Aberration', min: 0, max: 0.25, step: 0.01 },
  { key: 'edgeHighlight', label: 'Edge Highlight', min: 0, max: 1, step: 0.01 },
  { key: 'specular', label: 'Specular', min: 0, max: 1, step: 0.01 },
  { key: 'fresnel', label: 'Fresnel', min: 0, max: 4, step: 0.01 },
  { key: 'cornerRadius', label: 'Corner Radius', min: 0, max: 80, step: 1 },
  { key: 'zRadius', label: 'Z-Radius', min: 0, max: 80, step: 1 },
  { key: 'brightness', label: 'Brightness', min: -0.5, max: 0.5, step: 0.01 },
  { key: 'saturation', label: 'Saturation', min: -1, max: 1, step: 0.01 },
  { key: 'shadowOpacity', label: 'Shadow Opacity', min: 0, max: 1, step: 0.01 },
  { key: 'bevelMode', label: 'Bevel Mode', min: 0, max: 1, step: 1 }
] satisfies SliderSpec[];

const toggleSpecs = [
  { key: 'floating', label: 'Floating' },
  { key: 'button', label: 'Button Mode' }
] satisfies ToggleSpec[];

const formatValue = (value: number | boolean | undefined) => {
  if (typeof value === 'boolean') {
    return value ? 'on' : 'off';
  }
  if (typeof value !== 'number') {
    return '';
  }
  return Number.isInteger(value) ? String(value) : value.toFixed(2).replace(/0+$/, '').replace(/\.$/, '');
};

const buildConfigText = (config: Partial<GlassConfig>) => JSON.stringify(config, null, 2);

const buildTokenText = (
  textColors: Record<TextTokenKey, string>,
  stateColors: Record<StateTokenKey, string>,
  palette: SurfacePalette
) => JSON.stringify({
  surface: {
    '--surface-base': palette.surfaceBase,
    '--surface-edge': palette.surfaceEdge,
    '--accent-primary': palette.accent
  },
  text: Object.fromEntries(textTokenSpecs.map((item) => [item.token, textColors[item.key]])),
  state: Object.fromEntries(stateTokenSpecs.map((item) => [item.token, stateColors[item.key]]))
}, null, 2);

const joinClassNames = (...classes: Array<string | false | null | undefined>) =>
  classes.filter(Boolean).join(' ');

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const cssNumber = (value: number) => value.toFixed(3).replace(/0+$/, '').replace(/\.$/, '');

const normalizeHexColor = (value: string) => value.trim().toUpperCase();

export function LiquidGlassLab({ initialSpecimen }: LiquidGlassLabProps = {}) {
  const requestedSpecimen = useMemo(() => {
    return initialSpecimen ?? resolveSpecimenName(new URLSearchParams(window.location.search).get('specimen')) ?? 'calibration';
  }, [initialSpecimen]);
  const [config, setConfig] = useState<Partial<GlassConfig>>(surfacePresets.clear);
  const [specimenName, setSpecimenName] = useState<LabSpecimenName>(requestedSpecimen);
  const [variantName, setVariantName] = useState<LabVariantName>('var1');
  const [paletteName, setPaletteName] = useState<SurfacePaletteName>(palettePresets.corpos.paletteName);
  const [colorPresetName, setColorPresetName] = useState<PalettePresetName | undefined>('corpos');
  const [textTokenColors, setTextTokenColors] = useState<Record<TextTokenKey, string>>(palettePresets.corpos.text);
  const [stateTokenColors, setStateTokenColors] = useState<Record<StateTokenKey, string>>(palettePresets.corpos.state);
  
  const selectSpecimen = (spec: LabSpecimenName) => {
    setSpecimenName(spec);
    if (spec !== 'logo') {
      setVariantName('var1');
    }
    setCopyState('idle');
  };
  
  const palette = surfacePalettes[paletteName];
  const blurAmount = typeof config.blurAmount === 'number' ? config.blurAmount : surfacePresets.clear.blurAmount;
  const cornerRadius = typeof config.cornerRadius === 'number' ? config.cornerRadius : surfacePresets.clear.cornerRadius;
  const edgeHighlight = typeof config.edgeHighlight === 'number' ? config.edgeHighlight : surfacePresets.clear.edgeHighlight;
  const specular = typeof config.specular === 'number' ? config.specular : surfacePresets.clear.specular;
  const shadowOpacity = typeof config.shadowOpacity === 'number' ? config.shadowOpacity : surfacePresets.clear.shadowOpacity;
  const fillAlpha = clamp(0.08 + blurAmount * 0.22 + shadowOpacity * 0.1, 0.08, 0.3);
  const borderAlpha = clamp(0.15 + edgeHighlight * 0.52 + specular * 0.1, 0.14, 0.64);
  const edgeAlpha = clamp(0.05 + edgeHighlight * 0.22 + specular * 0.1, 0.05, 0.3);
  const glowAlpha = clamp(0.04 + edgeHighlight * 0.25 + specular * 0.14, 0.04, 0.34);
  const shadowAlpha = clamp(0.22 + shadowOpacity * 0.5, 0.22, 0.64);
  const highlightAlpha = clamp(0.1 + edgeHighlight * 0.28 + specular * 0.16, 0.1, 0.52);
  
  const cssVars = {
    '--lab-surface-base': palette.surfaceBase,
    '--lab-surface-edge': palette.surfaceEdge,
    '--lab-surface-radius': `${clamp(cornerRadius, 0, 80)}px`,
    '--lab-surface-fill-alpha': cssNumber(fillAlpha),
    '--lab-surface-border-alpha': cssNumber(borderAlpha),
    '--lab-surface-edge-alpha': cssNumber(edgeAlpha),
    '--lab-surface-glow-alpha': cssNumber(glowAlpha),
    '--lab-surface-shadow-alpha': cssNumber(shadowAlpha),
    '--lab-surface-highlight-alpha': cssNumber(highlightAlpha),
    '--lab-text-main': palette.textMain,
    '--lab-accent': palette.accent,
    '--text-primary': textTokenColors.primary,
    '--text-secondary': textTokenColors.secondary,
    '--text-tertiary': textTokenColors.tertiary,
    '--text-disabled': textTokenColors.disabled,
    '--accent-cyan': stateTokenColors.active,
    '--accent-ruby': stateTokenColors.error,
    '--accent-amber': stateTokenColors.warning,
    '--accent-lime': stateTokenColors.success,
    '--logo-primary': palette.logoPrimary,
    '--logo-secondary': palette.surfaceBase,
    '--logo-tertiary': palette.logoTertiary,
    '--logo-ink': palette.logoInk,
    '--logo-metal': palette.surfaceEdge,
    '--logo-hot': palette.logoHot,
    '--logo-glow': palette.logoGlow,
    '--lab-surface-rgb-base': palette.rgbBase,
    '--lab-surface-rgb-edge': palette.rgbEdge
  } as CSSProperties;
  
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'failed'>('idle');
  const [surfaceResetKey, setSurfaceResetKey] = useState(0);
  const [agentStatus, setAgentStatus] = useState<LabAgentStatus>({
    active: false,
    message: fallbackLabAgentMessage
  });
  const configText = useMemo(() => buildConfigText(config), [config]);
  const tokenText = useMemo(
    () => buildTokenText(textTokenColors, stateTokenColors, palette),
    [palette, stateTokenColors, textTokenColors]
  );

  const updateNumber = (key: NumericMaterialKey, value: number) => {
    setConfig((current) => ({ ...current, [key]: value }));
    setCopyState('idle');
  };

  const updateBoolean = (key: BooleanMaterialKey, value: boolean) => {
    setConfig((current) => ({ ...current, [key]: value }));
    if (key === 'floating' && !value) {
      setSurfaceResetKey((current) => current + 1);
    }
    setCopyState('idle');
  };

  const applyPreset = (preset: Partial<GlassConfig>) => {
    const wasFloating = Boolean(config.floating);
    setConfig(preset);
    if (wasFloating && preset.floating === false) {
      setSurfaceResetKey((current) => current + 1);
    }
    setCopyState('idle');
  };

  const updateTextTokenColor = (key: TextTokenKey, value: string) => {
    setColorPresetName(undefined);
    setTextTokenColors((current) => ({ ...current, [key]: normalizeHexColor(value) }));
    setCopyState('idle');
  };

  const updateStateTokenColor = (key: StateTokenKey, value: string) => {
    setColorPresetName(undefined);
    setStateTokenColors((current) => ({ ...current, [key]: normalizeHexColor(value) }));
    setCopyState('idle');
  };

  const applyColorPreset = (name: PalettePresetName) => {
    const preset = palettePresets[name];
    setColorPresetName(name);
    setPaletteName(preset.paletteName);
    setTextTokenColors(preset.text);
    setStateTokenColors(preset.state);
    setCopyState('idle');
  };

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopyState('copied');
    } catch (error) {
      console.error('Could not copy lab config.', error);
      setCopyState('failed');
    }
  };

  useEffect(() => {
    let isMounted = true;

    const readAgentStatus = async () => {
      try {
        const response = await fetch(labAgentStatusUrl + '?t=' + Date.now(), { cache: 'no-store' });

        if (!response.ok) {
          if (isMounted) {
            setAgentStatus((current) => ({ ...current, active: false }));
          }
          return;
        }

        const nextStatus = await response.json() as Partial<LabAgentStatus>;
        const nextMessage = typeof nextStatus.message === 'string' && nextStatus.message.trim().length > 0
          ? nextStatus.message.trim()
          : fallbackLabAgentMessage;

        if (isMounted) {
          setAgentStatus({
            active: Boolean(nextStatus.active),
            message: nextMessage
          });
        }
      } catch {
        if (isMounted) {
          setAgentStatus((current) => ({ ...current, active: false }));
        }
      }
    };

    void readAgentStatus();
    const intervalId = window.setInterval(() => void readAgentStatus(), 1600);

    return () => {
      isMounted = false;
      window.clearInterval(intervalId);
    };
  }, []);

  const panelClassName = specimenName === 'login'
    ? styles.loginPreviewPanel
    : specimenName === 'logo'
      ? joinClassNames(
        styles.logoPreviewPanel,
        variantName === 'var2' && styles.logoBadgePanel,
        variantName === 'var3' && styles.logoMonogramPanel
      )
      : styles.calibrationPreviewPanel;

  const contentClassName = specimenName === 'login'
    ? styles.loginPreviewContent
    : specimenName === 'logo'
      ? joinClassNames(
        styles.logoPreviewContent,
        variantName === 'var2' && styles.logoBadgeContent,
        variantName === 'var3' && styles.logoMonogramContent
      )
      : styles.calibrationPreviewContent;

  return (
    <main className={styles.labShell} style={cssVars} data-instance-id="liquidglass-lab">
      <section className={styles.previewPane} aria-label="LiquidGlass preview">
        <label className={styles.specimenSelect}>
          <span>Specimen</span>
          <select
            aria-label="Specimen"
            value={specimenName}
            onChange={(event) => selectSpecimen(resolveSpecimenName(event.target.value) ?? 'calibration')}
          >
            {specimenNames.map((nextSpecimen) => (
              <option key={nextSpecimen} value={nextSpecimen}>
                {specimenLabels[nextSpecimen]}
              </option>
            ))}
          </select>
        </label>
        <LiquidGlassSurface
          key={surfaceResetKey}
          className={joinClassNames(styles.previewStage, agentStatus.active && styles.previewStageBlocked)}
          backgroundClassName={styles.previewBackdrop}
          panelClassName={panelClassName}
          contentClassName={contentClassName}
          config={config}
          rootInstanceId="liquidglass-lab-preview"
          panelInstanceId="liquidglass-lab-panel"
          dynamicBackground
          background={(
            <>
              <img className={styles.backdropImage} src="/demo/liquidglass-background.png" alt="" />
              <div className={styles.backdropLightLayer} />
            </>
          )}
        >
          {specimenName === 'login' && (
            <div className={styles.previewLoginCard}>
              <span className={styles.previewLogo}>BN</span>
              <h1>INICIAR SESIÓN</h1>
              <p>Acceso seguro a Blacknails Media</p>
              <div className={styles.previewInput}>USUARIO / CORREO ELECTRÓNICO</div>
              <div className={styles.previewInput}>CONTRASEÑA</div>
              <div className={styles.previewButton}>ACCEDER A LA RED</div>
            </div>
          )}

          {specimenName === 'logo' && (
            <LogoSpecimen
              mode={logoModeByVariant[variantName]}
              paletteName={logoPaletteByLabPalette[paletteName]}
            />
          )}

          {specimenName === 'calibration' && (
            <div className={styles.calibrationSpecimen} data-instance-id="liquidglass-calibration-specimen">
              <header className={styles.calibrationHeader}>
                <div>
                  <p>Lab-only token calibration</p>
                  <h1>Archive terminal clarity</h1>
                </div>
                <span>LAB</span>
              </header>

              <section className={styles.calibrationTypeStack} aria-label="Typography tokens">
                {textTokenSpecs.map((item) => (
                  <article className={styles.typeTokenRow} key={item.token}>
                    <div>
                      <span>{item.name}</span>
                      <strong data-token={item.token} style={{ color: `var(${item.token})` }}>{item.sample}</strong>
                    </div>
                    <code>{item.token}</code>
                  </article>
                ))}
              </section>

              <section className={styles.calibrationStateGrid} aria-label="State tokens">
                {stateTokenSpecs.map((item) => (
                  <article className={styles.stateTokenCard} key={item.token} style={{ '--state-color': `var(${item.token})` } as CSSProperties}>
                    <span>{item.name}</span>
                    <strong data-token={item.token}>{item.sample}</strong>
                    <code>{item.token}</code>
                  </article>
                ))}
              </section>

              <section className={styles.calibrationMediaBand} aria-label="Media-neutral sample">
                <div className={styles.mediaSwatchA} />
                <div className={styles.mediaSwatchB} />
                <div className={styles.mediaSwatchC} />
                <p>Media stays color-true while terminal chrome carries status.</p>
              </section>
            </div>
          )}
        </LiquidGlassSurface>

        {agentStatus.active && (
          <div
            className={styles.agentStatus}
            data-instance-id="liquidglass-lab-agent-status"
            role="status"
            aria-live="polite"
          >
            <span>{agentStatus.message}</span>
          </div>
        )}
      </section>

      <aside className={styles.controlPanel} data-instance-id="liquidglass-lab-controls">
        <header className={styles.controlHeader}>
          <div>
            <p>Blacknails Lab</p>
            <h1>{specimenName === 'calibration' ? 'Palette' : 'LiquidGlass'}</h1>
          </div>
        </header>

        {specimenName === 'calibration' ? (
          <>
            <section className={styles.controlGroup} aria-label="Palette presets">
              <div className={styles.controlLabel}>
                <span>Presets</span>
              </div>
              <div className={styles.segmentedControl}>
                {(Object.keys(palettePresets) as PalettePresetName[]).map((name) => (
                  <button
                    className={colorPresetName === name ? styles.activeSegment : ''}
                    key={name}
                    type="button"
                    onClick={() => applyColorPreset(name)}
                  >
                    {palettePresets[name].label}
                  </button>
                ))}
              </div>
            </section>

            <section className={styles.controlGroup} aria-label="Typography colors">
              <div className={styles.controlLabel}>
                <span>Typography</span>
              </div>
              <div className={styles.colorEditorList}>
                {textTokenSpecs.map((item) => (
                  <label className={styles.colorControlRow} key={item.token}>
                    <span className={styles.colorMeta}>
                      <strong>{item.name}</strong>
                      <code>{item.token}</code>
                    </span>
                    <input
                      aria-label={`${item.name} color`}
                      type="color"
                      value={textTokenColors[item.key]}
                      onChange={(event) => updateTextTokenColor(item.key, event.target.value)}
                    />
                    <output>{textTokenColors[item.key]}</output>
                  </label>
                ))}
              </div>
            </section>

            <section className={styles.controlGroup} aria-label="State colors">
              <div className={styles.controlLabel}>
                <span>States</span>
              </div>
              <div className={styles.colorEditorList}>
                {stateTokenSpecs.map((item) => (
                  <label className={styles.colorControlRow} key={item.token}>
                    <span className={styles.colorMeta}>
                      <strong>{item.name}</strong>
                      <code>{item.token}</code>
                    </span>
                    <input
                      aria-label={`${item.name} color`}
                      type="color"
                      value={stateTokenColors[item.key]}
                      onChange={(event) => updateStateTokenColor(item.key, event.target.value)}
                    />
                    <output>{stateTokenColors[item.key]}</output>
                  </label>
                ))}
              </div>
            </section>

            <section className={styles.configOutput}>
              <div className={styles.outputHeader}>
                <span>Tokens</span>
                <button type="button" onClick={() => handleCopy(tokenText)}>{copyState === 'copied' ? 'Copied' : copyState === 'failed' ? 'Failed' : 'Copy'}</button>
              </div>
              <textarea aria-label="Palette tokens" value={tokenText} readOnly rows={11} spellCheck={false} />
            </section>
          </>
        ) : (
          <>
            <section className={styles.controlGroup} aria-label="Variants">
              <div className={styles.controlLabel}>
                <span>Variants</span>
              </div>
              <div className={styles.segmentedControl}>
                <button
                  className={variantName === 'var1' ? styles.activeSegment : ''}
                  type="button"
                  onClick={() => setVariantName('var1')}
                >
                  {specimenName === 'logo' ? 'Lockup' : 'Default'}
                </button>
                <button
                  className={variantName === 'var2' ? styles.activeSegment : ''}
                  type="button"
                  disabled={specimenName !== 'logo'}
                  onClick={() => setVariantName('var2')}
                >
                  {specimenName === 'logo' ? 'Badge' : '-'}
                </button>
                <button
                  className={variantName === 'var3' ? styles.activeSegment : ''}
                  type="button"
                  disabled={specimenName !== 'logo'}
                  onClick={() => setVariantName('var3')}
                >
                  {specimenName === 'logo' ? 'Monogram' : '-'}
                </button>
              </div>
            </section>

            <section className={styles.controlGroup} aria-label="Palette">
              <div className={styles.controlLabel}>
                <span>Palette</span>
                <output>{palette.label}</output>
              </div>
              <div className={styles.paletteRow}>
                {surfacePaletteNames.map((pn) => {
                  const p = surfacePalettes[pn];
                  return (
                    <button
                      key={pn}
                      type="button"
                      aria-label={p.label}
                      className={paletteName === pn ? styles.activeSwatch : ''}
                      onClick={() => setPaletteName(pn)}
                      style={{ '--swatch-a': p.surfaceBase, '--swatch-b': p.surfaceEdge } as CSSProperties}
                    />
                  );
                })}
              </div>
            </section>

            <div className={styles.presetRow}>
              <button type="button" onClick={() => applyPreset(surfacePresets.clear)}>Clear</button>
              <button type="button" onClick={() => applyPreset(surfacePresets.dense)}>Dense</button>
              <button type="button" onClick={() => applyPreset(surfacePresets.shape)}>Shape</button>
            </div>

            <div className={styles.sliderList}>
              {sliderSpecs.map((spec) => {
                const value = Number(config[spec.key] ?? 0);
                return (
                  <label className={styles.sliderRow} key={spec.key}>
                    <span>{spec.label}</span>
                    <input
                      type="range"
                      min={spec.min}
                      max={spec.max}
                      step={spec.step}
                      value={value}
                      onChange={(event) => updateNumber(spec.key, Number(event.target.value))}
                    />
                    <output>{formatValue(value)}</output>
                  </label>
                );
              })}
            </div>

            <div className={styles.toggleList}>
              {toggleSpecs.map((spec) => (
                <label className={styles.toggleRow} key={spec.key}>
                  <span>{spec.label}</span>
                  <input
                    type="checkbox"
                    checked={Boolean(config[spec.key])}
                    onChange={(event) => updateBoolean(spec.key, event.target.checked)}
                  />
                </label>
              ))}
            </div>

            <section className={styles.configOutput}>
              <div className={styles.outputHeader}>
                <span>Config</span>
                <button type="button" onClick={() => handleCopy(configText)}>{copyState === 'copied' ? 'Copied' : copyState === 'failed' ? 'Failed' : 'Copy'}</button>
              </div>
              <textarea aria-label="LiquidGlass config" value={configText} readOnly rows={13} spellCheck={false} />
            </section>
          </>
        )}
      </aside>
    </main>
  );
}
