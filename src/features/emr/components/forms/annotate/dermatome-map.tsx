import { Button, Group, Stack, Text } from '@mantine/core';
import { useState } from 'react';
import {
  dermatomeColor,
  dermatomeMirror,
  dermatomeRegions as regionOrder,
  dermatomeShapes,
  dermatomeViewNames,
  dermatomes,
  type DermatomeId,
  type DermatomeView,
} from './dermatome-data';

type Shape = { d: string; label?: [number, number]; point?: [number, number] };

export type DermatomeMapFieldProps = {
  value: string | null;
  onChange: (value: string | null) => void;
  views?: readonly DermatomeView[];
  showLabels?: boolean;
  label?: string;
};

/**
 * Clickable dermatome map (ISNCSCI levels). Ported from OrganUI's
 * `DermatomeMap` (MIT).
 */
export function DermatomeMapField({
  value,
  onChange,
  views = ['front', 'back'],
  showLabels = true,
  label = 'Dermatome map',
}: DermatomeMapFieldProps) {
  const selectedId = (value as DermatomeId | null) ?? null;
  const [hovered, setHovered] = useState<DermatomeId | null>(null);
  const shownId = hovered ?? selectedId;
  const shown = dermatomes.find((d) => d.id === shownId);

  const fill = (id: DermatomeId) =>
    selectedId === id ? 'var(--mantine-color-teal-6)' : dermatomeColor(id);
  const select = (id: DermatomeId) => onChange(selectedId === id ? null : id);

  return (
    <Stack gap="md" role="group" aria-label={label}>
      <div
        style={{
          display: 'grid',
          gap: 16,
          gridTemplateColumns: `repeat(${views.length}, minmax(0, 1fr))`,
        }}
      >
        {views.map((view) => {
          const { outline, unassigned, regions } = dermatomeShapes[view];
          const entries = Object.entries(regions) as Array<[DermatomeId, Shape]>;
          const shownShape = shownId ? (regions[shownId] as Shape | undefined) : undefined;
          return (
            <figure
              key={view}
              style={{
                margin: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <svg
                viewBox="0 0 220 480"
                role="img"
                aria-label={`${dermatomeViewNames[view]} view of the dermatomes`}
                style={{ width: '100%', height: 'auto', maxWidth: 260 }}
              >
                <path
                  d={outline}
                  fill="var(--mantine-color-gray-2)"
                  stroke="var(--mantine-color-gray-5)"
                  strokeWidth={3}
                />
                {[undefined, dermatomeMirror].map((transform) => (
                  <g key={transform ?? 'right'} transform={transform}>
                    <path d={unassigned} fill="var(--mantine-color-gray-3)" />
                    {entries.map(([level, shape]) => (
                      <path
                        key={level}
                        d={shape.d}
                        data-dermatome={level}
                        fill={fill(level)}
                        stroke="var(--mantine-color-body)"
                        strokeWidth={0.6}
                        style={{
                          cursor: 'pointer',
                          transition: 'opacity 120ms ease',
                          opacity: shownId && shownId !== level ? 0.35 : 1,
                        }}
                        onPointerEnter={() => setHovered(level)}
                        onPointerLeave={() =>
                          setHovered((current) => (current === level ? null : current))
                        }
                        onClick={() => select(level)}
                      />
                    ))}
                    {shownShape && (
                      <path
                        d={shownShape.d}
                        fill="none"
                        stroke="var(--mantine-color-dark-9)"
                        strokeWidth={shownId === selectedId ? 1.4 : 0.8}
                        style={{ pointerEvents: 'none' }}
                      />
                    )}
                    {shownShape?.point && (
                      <circle
                        cx={shownShape.point[0]}
                        cy={shownShape.point[1]}
                        r={2.6}
                        fill="var(--mantine-color-dark-9)"
                        stroke="var(--mantine-color-body)"
                        strokeWidth={1}
                        style={{ pointerEvents: 'none' }}
                      />
                    )}
                  </g>
                ))}
                {showLabels &&
                  entries.map(([level, shape]) =>
                    shape.label ? (
                      <text
                        key={level}
                        x={shape.label[0]}
                        y={shape.label[1]}
                        fontSize={7}
                        textAnchor="middle"
                        dominantBaseline="central"
                        paintOrder="stroke"
                        stroke="var(--mantine-color-body)"
                        strokeWidth={1.6}
                        fill="var(--mantine-color-dark-9)"
                        style={{ pointerEvents: 'none', userSelect: 'none', fontWeight: 600 }}
                      >
                        {level}
                      </text>
                    ) : null
                  )}
              </svg>
              <figcaption style={{ fontSize: 12, color: 'var(--mantine-color-dimmed)' }}>
                {dermatomeViewNames[view]}
              </figcaption>
            </figure>
          );
        })}
      </div>

      <Stack gap="xs">
        {regionOrder.map((region) => (
          <div key={region}>
            <Text size="xs" fw={600} c="dimmed">
              {region}
            </Text>
            <Group gap={4} mt={4}>
              {dermatomes
                .filter((d) => d.region === region)
                .map((d) => (
                  <Button
                    key={d.id}
                    size="compact-xs"
                    variant={selectedId === d.id ? 'filled' : 'light'}
                    color="teal"
                    aria-pressed={selectedId === d.id}
                    onClick={() => select(d.id)}
                  >
                    {d.id}
                  </Button>
                ))}
            </Group>
          </div>
        ))}
      </Stack>

      {shown ? (
        <Text size="sm" c="dimmed">
          <Text span fw={700} c="var(--mantine-color-text)">
            {shown.id}
          </Text>{' '}
          — {shown.area}. Key point: {shown.keyPoint}.
        </Text>
      ) : (
        <Text size="sm" c="dimmed">
          No dermatome selected
        </Text>
      )}

      {selectedId && (
        <Group>
          <Button size="compact-xs" variant="subtle" color="gray" onClick={() => onChange(null)}>
            Clear selection
          </Button>
        </Group>
      )}
    </Stack>
  );
}
