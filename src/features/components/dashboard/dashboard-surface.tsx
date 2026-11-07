import { Box, UnstyledButton } from '@mantine/core';
import type { CSSProperties, ReactNode } from 'react';
import classes from './dashboard-surface.module.css';

/**
 * Accent tone for a dashboard card — any Mantine palette colour name. The card
 * derives its border, gradient wash and focus ring from it, so callers pass the
 * semantic colour they already use (status colour, module colour) instead of
 * repeating hex values.
 */
export type DashboardTone = string;

/** Inline custom property that tints any element declaring `--tone` styles. */
export function dashboardToneStyle(tone: DashboardTone): CSSProperties {
  return { '--tone': `var(--mantine-color-${tone}-6)` } as CSSProperties;
}

/** Page shell: soft mint/blue wash, centred content column. */
export function DashboardPage({ children, testId }: { children: ReactNode; testId?: string }) {
  return (
    <div className={classes.page} data-testid={testId}>
      <div className={classes.content}>{children}</div>
    </div>
  );
}

/**
 * Dashboard hero heading. The title carries `data-testid="page-title"` so it
 * stays a drop-in replacement for an RxPage header in page-level tests.
 */
export function DashboardHero({
  eyebrow,
  title,
  subtitle,
  aside,
  actions,
}: {
  eyebrow?: string;
  title: ReactNode;
  subtitle?: ReactNode;
  /** Right-aligned meta such as a formatted date. */
  aside?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <header className={classes.hero}>
      <div className={classes.heroText}>
        {eyebrow ? <span className={classes.eyebrow}>{eyebrow}</span> : null}
        <h1 className={classes.heroTitle} data-testid="page-title">
          {title}
        </h1>
        {subtitle ? <div className={classes.heroSubtitle}>{subtitle}</div> : null}
      </div>
      {(aside || actions) && (
        <div className={classes.heroAside}>
          {aside}
          {actions}
        </div>
      )}
    </header>
  );
}

type DashboardCardProps = {
  children: ReactNode;
  /** Mantine palette colour driving the tint (default: brand blue). */
  tone?: DashboardTone;
  padding?: 'sm' | 'md' | 'lg';
  /** Hover lift + pointer; implied when `onClick` or `href` is given. */
  interactive?: boolean;
  onClick?: () => void;
  /** Renders the card as a real link (middle-click / open-in-new-tab work). */
  href?: string;
  /** Link target — e.g. `_blank` to open in a new tab. */
  target?: string;
  /** Link rel — e.g. `noopener noreferrer` when target is `_blank`. */
  rel?: string;
  className?: string;
  style?: CSSProperties;
  testId?: string;
};

/** Tinted surface card — the module-landing tile treatment for dashboard content. */
export function DashboardCard({
  children,
  tone = 'brand',
  padding = 'lg',
  interactive,
  onClick,
  href,
  target,
  rel,
  className,
  style,
  testId,
}: DashboardCardProps) {
  const padClass =
    padding === 'sm' ? classes.padSm : padding === 'md' ? classes.padMd : classes.padLg;
  const isInteractive = interactive ?? Boolean(onClick || href);
  const composed = [
    classes.card,
    padClass,
    isInteractive ? classes.interactive : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ');
  const mergedStyle = { ...dashboardToneStyle(tone), ...style };

  if (isInteractive) {
    return (
      <UnstyledButton
        component={href ? 'a' : 'button'}
        href={href}
        target={target}
        rel={rel}
        className={composed}
        style={mergedStyle}
        onClick={onClick}
        data-testid={testId}
      >
        {children}
      </UnstyledButton>
    );
  }

  return (
    <Box className={composed} style={mergedStyle} data-testid={testId}>
      {children}
    </Box>
  );
}

/** Card heading row: navy title plus an optional muted hint on the right. */
export function DashboardCardTitle({ children, hint }: { children: ReactNode; hint?: ReactNode }) {
  return (
    <div className={classes.cardTitleRow}>
      <span className={classes.cardTitle}>{children}</span>
      {hint ? <span className={classes.cardHint}>{hint}</span> : null}
    </div>
  );
}

/** CSS classes for the metric typography inside a card. */
export const dashboardMetricClasses = {
  label: classes.metricLabel,
  value: classes.metricValue,
};
