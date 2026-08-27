/**
 * Predefined gradient palettes for bar chart hover cursors.
 * Each palette maps a gradient ID to its SVG gradient stops.
 */
const CURSOR_GRADIENTS: Record<string, { from: string; via?: string; to: string }> = {
  blue: { from: '#dbeafe', via: '#eff6ff', to: '#f8fafc' },
  green: { from: '#dcfce7', via: '#f0fdf4', to: '#f8fafc' },
  grape: { from: '#f3e8ff', via: '#faf5ff', to: '#f8fafc' },
  gray: { from: '#f1f5f9', via: '#f8fafc', to: '#ffffff' },
  teal: { from: '#ccfbf1', via: '#f0fdfa', to: '#f8fafc' },
  orange: { from: '#ffedd5', via: '#fff7ed', to: '#f8fafc' },
  red: { from: '#fee2e2', via: '#fef2f2', to: '#f8fafc' },
  cyan: { from: '#cffafe', via: '#ecfeff', to: '#f8fafc' },
  violet: { from: '#ede9fe', via: '#f5f3ff', to: '#f8fafc' },
};

/**
 * SVG <defs> block that registers gradient definitions for chart cursors.
 * Render this as a child of any Mantine BarChart / CompositeChart.
 *
 * Usage:
 *   <BarChart ...>
 *     <ChartDefs ids={['blue', 'green']} />
 *   </BarChart>
 */
export function ChartDefs({ ids }: { ids: string[] }) {
  return (
    <defs>
      {ids.map((id) => {
        const g = CURSOR_GRADIENTS[id] ?? CURSOR_GRADIENTS.blue;
        return (
          <linearGradient key={id} id={`cursor-grad-${id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={g.from} stopOpacity={0.95} />
            {g.via && <stop offset="50%" stopColor={g.via} stopOpacity={0.6} />}
            <stop offset="100%" stopColor={g.to} stopOpacity={0.15} />
          </linearGradient>
        );
      })}
    </defs>
  );
}

/**
 * Props for the custom gradient cursor element.
 */
interface GradientCursorProps {
  /** Gradient palette key (must match an id passed to <ChartDefs>). */
  gradientId: string;
  /** Border radius for the cursor rectangle. @default 4 */
  rx?: number;
  /** Stroke color for the cursor outline. @default 'transparent' */
  stroke?: string;
  /** Stroke width. @default 0 */
  strokeWidth?: number;
  /** Opacity of the cursor fill. @default 1 */
  fillOpacity?: number;
}

/**
 * Custom Recharts cursor element with a gradient fill and rounded corners.
 * Pass this as the `cursor` prop via `tooltipProps` on any Mantine chart.
 *
 * Usage:
 *   <BarChart
 *     tooltipProps={{ cursor: <GradientCursor gradientId="blue" /> }}
 *   >
 *     <ChartDefs ids={['blue']} />
 *   </BarChart>
 */
export function GradientCursor({
  gradientId,
  rx = 4,
  stroke = 'transparent',
  strokeWidth = 0,
  fillOpacity = 1,
}: GradientCursorProps) {
  return (
    <rect
      fill={`url(#cursor-grad-${gradientId})`}
      fillOpacity={fillOpacity}
      rx={rx}
      ry={rx}
      stroke={stroke}
      strokeWidth={strokeWidth}
    />
  );
}

/**
 * Convenience: builds the `tooltipProps.cursor` value and the matching
 * `<ChartDefs>` element in one call.
 *
 * Usage:
 *   const { cursor, defs } = useGradientCursor('blue');
 *   <BarChart tooltipProps={{ cursor }}>
 *     {defs}
 *   </BarChart>
 */
export function useGradientCursor(gradientId: string) {
  return {
    cursor: <GradientCursor gradientId={gradientId} />,
    defs: <ChartDefs ids={[gradientId]} />,
  };
}
