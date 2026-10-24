import { Button, Group, Stack, Text, VisuallyHidden } from '@mantine/core';
import { X } from 'lucide-react';
import { useId, useRef, useState } from 'react';
import {
  bodyMapRegions,
  nextRegion,
  toggleRegion,
  type BodyMapRegion,
  type BodyMapView,
} from './body-map-data';

const WIDTH = 200;
const HEIGHT = 440;
const ARROWS = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'];

const viewLabels: Record<BodyMapView, string> = { front: 'Front', back: 'Back' };

export type BodyMapFieldProps = {
  value: readonly string[];
  onChange: (value: string[]) => void;
  views?: readonly BodyMapView[];
  /** Restrict selection to these regions (defaults to all). */
  regionIds?: readonly string[];
  regions?: readonly BodyMapRegion[];
  multiple?: boolean;
  label?: string;
};

/**
 * Clickable front/back body map. Ported from OrganUI's `BodyMap` (MIT).
 */
export function BodyMapField({
  value,
  onChange,
  views = ['front', 'back'],
  regionIds,
  regions = bodyMapRegions,
  multiple = true,
  label = 'Body map',
}: BodyMapFieldProps) {
  const helpId = useId();
  const selected = new Set(value);
  const allowed = regionIds?.length ? regions.filter((r) => regionIds.includes(r.id)) : regions;
  const byId = new Map(allowed.map((r) => [r.id, r]));
  const chosen = value.flatMap((id) => byId.get(id) ?? []);
  const [hovered, setHovered] = useState<string | null>(null);
  const [active, setActive] = useState<Record<string, string>>({});
  const [focusRing, setFocusRing] = useState<string | null>(null);
  const elements = useRef(new Map<string, SVGPathElement>());

  function toggle(id: string) {
    if (multiple) {
      onChange(toggleRegion(value, id, allowed));
      return;
    }
    onChange(value.includes(id) ? [] : [id]);
  }

  function fillFor(id: string): string {
    if (selected.has(id)) return 'var(--mantine-color-teal-6)';
    if (hovered === id) return 'var(--mantine-color-gray-4)';
    return 'var(--mantine-color-gray-2)';
  }

  return (
    <Stack gap="sm" role="group" aria-label={label}>
      <VisuallyHidden id={helpId}>
        Each view is one tab stop. Arrow keys move between regions; Space or Enter selects or clears
        the focused region.
      </VisuallyHidden>

      <div
        style={{
          display: 'grid',
          gap: 16,
          gridTemplateColumns: `repeat(${views.length}, minmax(0, 1fr))`,
        }}
      >
        {views.map((view) => {
          const items = allowed.filter((r) => r.view === view);
          if (!items.length) return null;
          const stop =
            items.find((r) => r.id === active[view]) ??
            items.find((r) => selected.has(r.id)) ??
            items[0];
          const ring = items.find((r) => r.id === focusRing);
          const hint = items.find((r) => r.id === hovered)?.label;
          const [start, end] = view === 'front' ? ['R', 'L'] : ['L', 'R'];
          return (
            <figure
              key={view}
              style={{
                margin: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <figcaption style={{ fontSize: 13, fontWeight: 600 }}>{viewLabels[view]}</figcaption>
              <svg
                viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
                role="group"
                aria-label={`${viewLabels[view]} of body`}
                aria-describedby={helpId}
                style={{
                  width: '100%',
                  height: 'auto',
                  maxWidth: 190,
                  overflow: 'visible',
                  touchAction: 'manipulation',
                }}
              >
                <text
                  x={12}
                  y={20}
                  aria-hidden
                  style={{ fontSize: 11, fill: 'var(--mantine-color-gray-6)' }}
                >
                  {start}
                </text>
                <text
                  x={WIDTH - 12}
                  y={20}
                  textAnchor="end"
                  aria-hidden
                  style={{ fontSize: 11, fill: 'var(--mantine-color-gray-6)' }}
                >
                  {end}
                </text>
                {items.map((region) => {
                  const checked = selected.has(region.id);
                  return (
                    <path
                      key={region.id}
                      ref={(element) => {
                        if (element) elements.current.set(region.id, element);
                        else elements.current.delete(region.id);
                      }}
                      d={region.d}
                      transform={region.mirrored ? `matrix(-1 0 0 1 ${WIDTH} 0)` : undefined}
                      role="checkbox"
                      aria-checked={checked}
                      aria-label={region.label}
                      tabIndex={region === stop ? 0 : -1}
                      fill={fillFor(region.id)}
                      stroke="var(--mantine-color-body)"
                      strokeWidth={1.5}
                      strokeLinejoin="round"
                      style={{ cursor: 'pointer', outline: 'none', transition: 'fill 120ms ease' }}
                      onClick={() => toggle(region.id)}
                      onPointerEnter={() => setHovered(region.id)}
                      onPointerLeave={() => setHovered((id) => (id === region.id ? null : id))}
                      onFocus={(event) => {
                        setActive((current) => ({ ...current, [view]: region.id }));
                        setFocusRing(
                          event.currentTarget.matches(':focus-visible') ? region.id : null
                        );
                      }}
                      onBlur={() => setFocusRing((id) => (id === region.id ? null : id))}
                      onKeyDown={(event) => {
                        let target: BodyMapRegion | undefined;
                        if (event.key === 'Home') target = items[0];
                        else if (event.key === 'End') target = items[items.length - 1];
                        else if (event.key === ' ' || event.key === 'Enter') {
                          event.preventDefault();
                          toggle(region.id);
                          return;
                        } else target = nextRegion(items, region, event.key);
                        if (!target && !ARROWS.includes(event.key)) return;
                        event.preventDefault();
                        if (target) elements.current.get(target.id)?.focus();
                      }}
                    />
                  );
                })}
                {ring && (
                  <path
                    d={ring.d}
                    transform={ring.mirrored ? `matrix(-1 0 0 1 ${WIDTH} 0)` : undefined}
                    aria-hidden
                    fill="none"
                    stroke="var(--mantine-color-teal-8)"
                    strokeWidth={3}
                    strokeLinejoin="round"
                    style={{ pointerEvents: 'none' }}
                  />
                )}
              </svg>
              <Text size="xs" c="dimmed" mih={16} ta="center">
                {hint}
              </Text>
            </figure>
          );
        })}
      </div>

      <Stack gap="xs">
        <Text role="status" size="sm" c="dimmed">
          {chosen.length === 0
            ? 'No regions selected'
            : `${chosen.length} ${chosen.length === 1 ? 'region' : 'regions'} selected`}
        </Text>
        {chosen.length > 0 && (
          <Group gap={6}>
            {chosen.map((region) => (
              <Button
                key={region.id}
                size="compact-xs"
                variant="light"
                color="teal"
                rightSection={<X size={12} />}
                aria-label={`Remove ${region.label}`}
                onClick={() => toggle(region.id)}
              >
                {region.label}
              </Button>
            ))}
            <Button size="compact-xs" variant="subtle" color="gray" onClick={() => onChange([])}>
              Clear all
            </Button>
          </Group>
        )}
      </Stack>
    </Stack>
  );
}
