import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import type { LabSpecimen, LabStyle } from './types.js';
import styles from './VisualLab.module.css';

interface VisualLabProps {
  stylesDef: LabStyle[];
  specimens: LabSpecimen[];
  initialStyleId?: string;
  initialSpecimenId?: string;
}

export function VisualLab({ stylesDef, specimens, initialStyleId, initialSpecimenId }: VisualLabProps) {
  const [activeStyleId, setActiveStyleId] = useState(initialStyleId ?? stylesDef[0]?.id);
  const [activeSpecimenId, setActiveSpecimenId] = useState(initialSpecimenId ?? specimens[0]?.id);
  
  const activeStyle = useMemo(() => stylesDef.find((s) => s.id === activeStyleId) ?? stylesDef[0], [stylesDef, activeStyleId]);
  const activeSpecimen = useMemo(() => specimens.find((s) => s.id === activeSpecimenId) ?? specimens[0], [specimens, activeSpecimenId]);
  
  const [activeVariantId, setActiveVariantId] = useState(activeSpecimen.variants[0]?.id);
  const [activePaletteId, setActivePaletteId] = useState(activeStyle.palettes[0]?.id);
  const [config, setConfig] = useState(activeStyle.defaultConfig);

  // Reset config and palette when style changes
  useEffect(() => {
    setConfig(activeStyle.defaultConfig);
    setActivePaletteId(activeStyle.palettes[0]?.id);
  }, [activeStyle]);

  // Fetch overrides from codebase when specimen changes
  useEffect(() => {
    const fetchOverrides = async () => {
      try {
        const component = activeSpecimenId === 'calibration' ? 'global' : 'login';
        const res = await fetch(`/__theme_sync?component=${component}`);
        if (res.ok) {
          const data = await res.json();
          if (data.overrides) {
            setConfig(() => ({ ...activeStyle.defaultConfig, ...data.overrides }));
          }
        }
      } catch (e) {
        console.error('Failed to fetch overrides', e);
      }
    };
    fetchOverrides();
  }, [activeSpecimenId, activeStyle.defaultConfig]);

  // Reset variant when specimen changes
  useEffect(() => {
    setActiveVariantId(activeSpecimen.variants[0]?.id);
  }, [activeSpecimen]);

  const activePalette = useMemo(() => activeStyle.palettes.find(p => p.id === activePaletteId) ?? activeStyle.palettes[0], [activeStyle, activePaletteId]);

  const cssVars = useMemo(() => {
    if (activeStyle.getCssVars) {
      return activeStyle.getCssVars(config, activePalette);
    }
    return {} as CSSProperties;
  }, [activeStyle, config, activePalette]);

  const updateConfig = (key: string, value: number | boolean | string | undefined) => {
    setConfig((c: any) => {
      const newConfig = { ...c };
      if (value === undefined) {
        delete newConfig[key];
      } else {
        newConfig[key] = value;
      }
      return newConfig;
    });
  };

  const deployTheme = async () => {
    // Merge palette defaults with explicit config overrides
    const overrides: Record<string, string> = {};
    for (const control of activeStyle.controls) {
      if (control.type === 'color') {
        const val = config[control.key] || (cssVars as any)[control.key];
        if (typeof val === 'string') {
          overrides[control.key] = val;
        }
      }
    }

    const component = activeSpecimenId === 'calibration' ? 'global' : 'login';
    
    try {
      const res = await fetch('/__theme_sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ component, overrides })
      });
      if (res.ok) {
        alert('Theme deployed to codebase successfully!');
      } else {
        const err = await res.json();
        alert('Failed to deploy: ' + err.error);
      }
    } catch (e: any) {
      alert('Error deploying theme: ' + e.message);
    }
  };

  const panelClassName = activeSpecimen.getPanelClassName?.(activeVariantId);
  const contentClassName = activeSpecimen.getContentClassName?.(activeVariantId);
  const Wrapper = activeStyle.Wrapper;
  const SpecimenComponent = activeSpecimen.Component;

  return (
    <main className={styles.labShell} style={cssVars} data-instance-id="visual-lab">
      <section className={styles.previewPane} aria-label="Preview">

        
        <Wrapper
          config={config}
          palette={activePalette}
          panelClassName={panelClassName}
          contentClassName={contentClassName}
        >
          <SpecimenComponent variantId={activeVariantId} palette={activePalette} config={config} />
        </Wrapper>
      </section>

      <aside className={styles.controlPanel} data-instance-id="visual-lab-controls">
        <header className={styles.controlHeader}>
          <div>
            <p>Blacknails Lab</p>
            <select 
              className={styles.headerSelect}
              value={activeStyleId} 
              onChange={e => setActiveStyleId(e.target.value)}
              aria-label="Style"
            >
              {stylesDef.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
        </header>

        {activeStyle.palettes.length > 0 && (
          <section className={styles.controlGroup} aria-label="Palette">
            <div className={styles.controlLabel}>
              <span>Palette</span>
              <output>{activePalette.name}</output>
            </div>
            <div className={styles.paletteRow}>
              {activeStyle.palettes.map((p) => {
                const swatchA = p.swatchA;
                const swatchB = p.swatchB;
                return (
                  <button
                    key={p.id}
                    type="button"
                    aria-label={p.name}
                    className={activePaletteId === p.id ? styles.activeSwatch : ''}
                    onClick={() => {
                      setActivePaletteId(p.id);
                      setConfig(activeStyle.defaultConfig);
                    }}
                    style={{ '--swatch-a': swatchA, '--swatch-b': swatchB } as CSSProperties}
                  />
                );
              })}
            </div>
          </section>
        )}

        {(() => {
          const colorControls = activeStyle.controls.filter(c => c.type === 'color');
          if (colorControls.length === 0) return null;

          const groups: Record<string, typeof colorControls> = {};
          colorControls.forEach(c => {
            const g = c.group || 'Colors';
            if (!groups[g]) groups[g] = [];
            groups[g].push(c);
          });

          return Object.entries(groups).map(([groupName, controls]) => (
            <details className={styles.controlAccordion} key={groupName} open>
              <summary className={styles.accordionSummary}>{groupName}</summary>
              <div className={styles.colorEditorList}>
                {controls.map((spec) => {
                  const hasOverride = config[spec.key] !== undefined;
                  const value = (config[spec.key] as string) || ((cssVars as any)[spec.key] as string) || '#ffffff';
                  return (
                    <label className={styles.colorControlRow} key={spec.key}>
                      <div className={styles.colorMeta}>
                        <strong>{spec.label}</strong>
                        <code>{spec.key}</code>
                      </div>
                      <input
                        type="color"
                        value={value}
                        onChange={(event) => updateConfig(spec.key, event.target.value)}
                      />
                      <div className={styles.hexInputWrapper}>
                        <input
                          type="text"
                          value={value}
                          onChange={(event) => updateConfig(spec.key, event.target.value)}
                          maxLength={9}
                          className={styles.colorHexInput}
                        />
                        {hasOverride && (
                          <button 
                            type="button" 
                            className={styles.resetButton}
                            onClick={(e) => { e.preventDefault(); updateConfig(spec.key, undefined); }}
                            title="Reset to Palette Default"
                          >
                            ⟲
                          </button>
                        )}
                      </div>
                    </label>
                  );
                })}
              </div>
            </details>
          ));
        })()}

        <hr className={styles.controlDivider} />

        <section className={styles.controlGroup} aria-label="Specimen">
          <div className={styles.controlLabel} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Specimen</span>
            <button className={styles.deployButton} onClick={deployTheme} title="Sync overrides to codebase">
              DEPLOY THEME
            </button>
          </div>
          <select
            className={styles.specimenSelectBox}
            value={activeSpecimenId}
            onChange={(e) => setActiveSpecimenId(e.target.value)}
          >
            {specimens.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </section>

        {activeSpecimen.variants.length > 1 && (
          <section className={styles.controlGroup} aria-label="Variants">
            <div className={styles.controlLabel}>
              <span>Variants</span>
            </div>
            <div className={styles.segmentedControl}>
              {activeSpecimen.variants.map((v) => (
                <button
                  key={v.id}
                  className={activeVariantId === v.id ? styles.activeSegment : ''}
                  type="button"
                  onClick={() => setActiveVariantId(v.id)}
                >
                  {v.name}
                </button>
              ))}
            </div>
          </section>
        )}

        <div className={styles.sliderList}>
          {activeStyle.controls.filter(c => c.type === 'slider').map((spec) => {
            if (spec.type !== 'slider') return null;
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
                  onChange={(event) => updateConfig(spec.key, Number(event.target.value))}
                />
                <output>{value}</output>
              </label>
            );
          })}
        </div>

        <div className={styles.toggleList}>
          {activeStyle.controls.filter(c => c.type === 'toggle').map((spec) => {
            if (spec.type !== 'toggle') return null;
            return (
              <label className={styles.toggleRow} key={spec.key}>
                <span>{spec.label}</span>
                <input
                  type="checkbox"
                  checked={Boolean(config[spec.key])}
                  onChange={(event) => updateConfig(spec.key, event.target.checked)}
                />
              </label>
            );
          })}
        </div>
      </aside>
    </main>
  );
}
