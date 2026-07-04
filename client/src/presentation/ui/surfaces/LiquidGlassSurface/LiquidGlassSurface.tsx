import { useEffect, useMemo, useRef, type ReactNode } from 'react';
import { LiquidGlass } from '@ybouane/liquidglass';
import type { GlassConfig } from '@ybouane/liquidglass';
import styles from './LiquidGlassSurface.module.css';

type LiquidGlassInstance = Awaited<ReturnType<typeof LiquidGlass.init>>;

export interface LiquidGlassSurfaceProps {
  background: ReactNode;
  children: ReactNode;
  config?: Partial<GlassConfig>;
  className?: string;
  backgroundClassName?: string;
  panelClassName?: string;
  contentClassName?: string;
  rootInstanceId?: string;
  panelInstanceId?: string;
  dynamicBackground?: boolean;
}

const joinClassNames = (...classes: Array<string | false | null | undefined>) =>
  classes.filter(Boolean).join(' ');

export function LiquidGlassSurface({
  background,
  children,
  config,
  className,
  backgroundClassName,
  panelClassName,
  contentClassName,
  rootInstanceId,
  panelInstanceId,
  dynamicBackground = false
}: LiquidGlassSurfaceProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const configJson = useMemo(() => JSON.stringify(config ?? {}), [config]);

  useEffect(() => {
    const root = rootRef.current;
    const panel = panelRef.current;
    if (!root || !panel) {
      return;
    }

    // Protect against React StrictMode double-mounting by cleaning up orphaned canvases
    // that might not have been properly removed if initialization was interrupted.
    const orphanedCanvases = Array.from(panel.children).filter(
      (child) => child.tagName === 'CANVAS' && (child as HTMLElement).style.pointerEvents === 'none'
    );
    for (const canvas of orphanedCanvases) {
      canvas.remove();
    }

    let disposed = false;
    let instance: LiquidGlassInstance | null = null;

    LiquidGlass.init({
      root,
      glassElements: [panel]
    })
      .then((glassInstance) => {
        if (disposed) {
          glassInstance.destroy();
          return;
        }
        instance = glassInstance;
      })
      .catch((error) => {
        console.warn('LiquidGlass surface failed to initialize.', error);
      });

    return () => {
      disposed = true;
      instance?.destroy();
    };
  }, []);

  return (
    <div ref={rootRef} className={joinClassNames(styles.root, className)} data-instance-id={rootInstanceId}>
      <div
        className={joinClassNames(styles.background, backgroundClassName)}
        data-dynamic={dynamicBackground ? 'true' : undefined}
        aria-hidden="true"
      >
        {background}
      </div>
      <div
        ref={panelRef}
        className={joinClassNames(styles.panel, panelClassName)}
        data-config={configJson}
        data-instance-id={panelInstanceId}
      >
        <div className={joinClassNames(styles.content, contentClassName)}>{children}</div>
      </div>
    </div>
  );
}
