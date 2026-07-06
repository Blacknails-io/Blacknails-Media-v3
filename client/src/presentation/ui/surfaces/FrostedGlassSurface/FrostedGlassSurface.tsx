import type { ReactNode } from 'react';
import styles from './FrostedGlassSurface.module.css';

export interface FrostedGlassSurfaceProps {
  background: ReactNode;
  children: ReactNode;
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

export function FrostedGlassSurface({
  background,
  children,
  className,
  backgroundClassName,
  panelClassName,
  contentClassName,
  rootInstanceId,
  panelInstanceId,
  dynamicBackground = false
}: FrostedGlassSurfaceProps) {
  return (
    <div className={joinClassNames(styles.root, className)} data-instance-id={rootInstanceId}>
      <div
        className={joinClassNames(styles.background, backgroundClassName)}
        data-dynamic={dynamicBackground ? 'true' : undefined}
        aria-hidden="true"
      >
        {background}
      </div>
      <div
        className={joinClassNames(styles.panel, panelClassName)}
        data-instance-id={panelInstanceId}
      >
        <div className={joinClassNames(styles.content, contentClassName)}>{children}</div>
      </div>
    </div>
  );
}
