/**
 * Leaflet map used by both locator pages, themed to the site: a dark
 * CARTO basemap tinted green via CSS filter, custom SVG teardrop pins
 * (hospital cross for facilities, capsule for pharmacies), themed cluster
 * bubbles and dark popups. Renders clustered precise pins for records that
 * carry coordinates and optional "bubble" CircleMarkers for area-level
 * aggregations (e.g. pharmacies per LGA centroid). Auto-fits the viewport to
 * the current results and reports zoom/pan back to the page.
 */
import 'leaflet/dist/leaflet.css';
import { ActionIcon } from '@mantine/core';
import { Moon, Sun } from 'lucide-react';
import L from 'leaflet';
import { memo, useEffect, useMemo, useState } from 'react';
import {
  Circle,
  CircleMarker,
  MapContainer,
  Marker,
  TileLayer,
  useMap,
  useMapEvents,
} from 'react-leaflet';
import MarkerClusterLayer, { type ClusterMarkerSpec } from './marker-cluster-layer';

// ── Theme ──────────────────────────────────────────────────────────────────

const THEME = {
  green: '#16A34A',
  darkGreen: '#0F6F35',
  teal: '#0D9488',
  amber: '#D97706',
  ink: '#0F172A',
  line: '#134E3A',
  text: '#E2E8F0',
  textMuted: '#94A3B8',
  mapBgDark: '#13291F',
  mapBgLight: '#EFF6F1',
};

/** Basemap variants: the default dark-green style (lightened) and a soft
 * light-green style, both tinted toward the site identity. */
export type MapVariant = 'dark' | 'light';

const TILE_URLS: Record<MapVariant, string> = {
  dark: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
  light: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
};

/** Green-tinted dark basemap styles + themed Leaflet chrome, injected once. */
function injectLocatorStyles() {
  if (typeof document === 'undefined' || document.getElementById('locator-map-styles')) return;
  const style = document.createElement('style');
  style.id = 'locator-map-styles';
  style.textContent = `
    .locator-container--dark.leaflet-container.locator-map {
      background: ${THEME.mapBgDark};
    }
    .locator-container--light.leaflet-container.locator-map {
      background: ${THEME.mapBgLight};
    }
    .locator-map {
      font-family: inherit;
    }
    /* Green-tinted basemaps: the dark style is deliberately lightened (the
     * first pass was too murky), the light style gets a soft green wash. */
    .locator-container--dark .leaflet-tile-pane {
      filter: sepia(0.34) hue-rotate(72deg) saturate(1.18) brightness(1.04) contrast(0.97);
    }
    .locator-container--light .leaflet-tile-pane {
      filter: sepia(0.22) hue-rotate(66deg) saturate(0.85) brightness(1.05);
    }
    .locator-map .leaflet-control-zoom a {
      background: ${THEME.ink} !important;
      color: ${THEME.text} !important;
      border-color: ${THEME.line} !important;
    }
    .locator-container--light .leaflet-control-zoom a {
      background: #ffffff !important;
      color: ${THEME.ink} !important;
      border-color: #d8e5dd !important;
    }
    .locator-map .leaflet-control-zoom a:hover {
      background: #1E293B !important;
    }
    .locator-container--light .leaflet-control-zoom a:hover {
      background: #eef6f1 !important;
    }
    .locator-map .leaflet-control-attribution {
      background: rgba(15, 23, 42, 0.75) !important;
      color: ${THEME.textMuted} !important;
    }
    .locator-container--light .leaflet-control-attribution {
      background: rgba(255, 255, 255, 0.82) !important;
      color: #52606d !important;
    }
    .locator-map .leaflet-control-attribution a {
      color: ${THEME.text} !important;
    }
    .locator-container--light .leaflet-control-attribution a {
      color: ${THEME.darkGreen} !important;
    }
    .locator-map .leaflet-popup-content-wrapper,
    .locator-map .leaflet-popup-tip {
      background: ${THEME.ink};
      color: ${THEME.text};
      border: 1px solid ${THEME.line};
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.45);
    }
    .locator-map .leaflet-popup-content-wrapper {
      border-radius: 12px;
    }
    .locator-map .leaflet-popup-tip {
      border-top-color: ${THEME.ink};
      border-bottom-color: ${THEME.ink};
    }
    .locator-map .leaflet-popup-content {
      margin: 12px 14px;
      line-height: 1.45;
    }
    /* Mantine Text renders dark-on-light by default — keep popup content light */
    .locator-map .leaflet-popup-content .mantine-Text-root {
      color: ${THEME.text} !important;
    }
    .locator-map .leaflet-popup-content a {
      color: #5EEAD4 !important;
    }
    .locator-map .leaflet-popup-close-button {
      color: ${THEME.textMuted} !important;
    }
    .locator-pin {
      filter: drop-shadow(0 2px 3px rgba(0, 0, 0, 0.55));
    }
    .locator-pin--highlight {
      filter: drop-shadow(0 0 6px rgba(13, 148, 136, 0.9));
      z-index: 1000 !important;
    }
    .locator-user-dot {
      background: transparent;
      border: none;
    }
    .locator-user-dot__inner {
      width: 18px;
      height: 18px;
      border-radius: 50%;
      background: #3B82F6;
      border: 3px solid #fff;
      box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.55), 0 0 14px 4px rgba(59, 130, 246, 0.45);
      animation: locator-user-pulse 2.2s ease-out infinite;
    }
    @keyframes locator-user-pulse {
      0% { box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.55), 0 0 10px 3px rgba(59, 130, 246, 0.5); }
      50% { box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.4), 0 0 20px 8px rgba(59, 130, 246, 0.35); }
      100% { box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.55), 0 0 10px 3px rgba(59, 130, 246, 0.5); }
    }
    .locator-cluster {
      background: transparent;
      border: none;
    }
    .locator-cluster__inner {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      height: 100%;
      border-radius: 50%;
      font-weight: 800;
      color: #fff;
      background: radial-gradient(circle at 32% 28%, ${THEME.green}, ${THEME.darkGreen} 78%);
      border: 2px solid ${THEME.teal};
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.55);
      font-family: inherit;
    }
  `;
  document.head.appendChild(style);
}
injectLocatorStyles();

// ── Custom SVG pins ────────────────────────────────────────────────────────

export type PinKind = 'facility' | 'pharmacy';

const TEARDROP = (fill: string, inner: string) => `
<svg xmlns="http://www.w3.org/2000/svg" width="28" height="40" viewBox="0 0 28 40">
  <path d="M14 0C6.3 0 0 6.3 0 14c0 10.5 14 26 14 26s14-15.5 14-26C28 6.3 21.7 0 14 0z" fill="${fill}"/>
  <circle cx="14" cy="13.6" r="8.6" fill="rgba(255,255,255,0.16)"/>
  ${inner}
</svg>`;

/** White hospital cross (facility) or white capsule (pharmacy) glyph. */
const CROSS = `
  <rect x="12.4" y="7.6" width="3.2" height="12" rx="0.9" fill="#fff"/>
  <rect x="8" y="12" width="12" height="3.2" rx="0.9" fill="#fff"/>`;

const CAPSULE = `
  <g transform="rotate(45 14 13.6)">
    <rect x="9.6" y="8.6" width="8.8" height="10" rx="4.4" fill="#fff"/>
    <path d="M9.6 13.6 h8.8 v0.8 a4.4 4.4 0 0 1 -4.4 4.2 h0 a4.4 4.4 0 0 1 -4.4 -4.2 z" fill="${THEME.amber}"/>
  </g>`;

function pinIcon(kind: PinKind, highlighted: boolean): L.DivIcon {
  const fill = kind === 'pharmacy' ? THEME.amber : highlighted ? THEME.teal : THEME.green;
  const glyph = kind === 'pharmacy' ? CAPSULE : CROSS;
  const scale = highlighted ? 1.32 : 1;
  const w = Math.round(28 * scale);
  const h = Math.round(40 * scale);
  return L.divIcon({
    className: `locator-pin${highlighted ? ' locator-pin--highlight' : ''}`,
    html: TEARDROP(fill, glyph).replace('width="28" height="40"', `width="${w}" height="${h}"`),
    iconSize: [w, h],
    iconAnchor: [w / 2, h - 2],
    popupAnchor: [0, -(h - 16)],
  });
}

// ── Public types ───────────────────────────────────────────────────────────

/** Escape a plain string for safe interpolation into popup HTML. */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export interface MapPoint {
  key: string;
  latitude: number;
  longitude: number;
  title: string;
  subtitle?: string | null;
  /** Extra popup content as an HTML string (contact links, lists…). */
  detail?: string;
  /** Pin style when rendered as a marker (defaults to facility). */
  pinKind?: PinKind;
  /** Render as a count bubble instead of a pin (area aggregations). */
  bubble?: { count: number; label?: string };
}

export interface Viewport {
  zoom: number;
  centerLatitude: number;
  centerLongitude: number;
}

/** A point the map should fly to (card selection). */
export interface MapFocus {
  key: string;
  latitude: number;
  longitude: number;
  zoom?: number;
}

/** The user's position (pulsing blue dot). */
export interface UserDot {
  latitude: number;
  longitude: number;
  approx?: boolean;
}

interface LocatorMapProps {
  points: MapPoint[];
  /** Changes whenever the result set changes → re-fit bounds. */
  fitKey: string;
  /** Point to emphasise (selected list row). */
  highlightKey?: string | null;
  /** When set, the map flies to this point (click-to-zoom from the list). */
  focus?: MapFocus | null;
  /** The user's position, rendered as a pulsing blue dot. */
  userLocation?: UserDot | null;
  /** Basemap style: lightened dark-green (default) or soft light-green. */
  variant?: MapVariant;
  /** Controlled mode: pass both `variant` and this callback. */
  onVariantChange?: (v: MapVariant) => void;
  onViewportChange?: (viewport: Viewport) => void;
  height?: number | string;
}

const NIGERIA_CENTER: [number, number] = [9.082, 8.6753];

function isValidLatLng(lat: unknown, lng: unknown): boolean {
  return (
    typeof lat === 'number' &&
    typeof lng === 'number' &&
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    !(lat === 0 && lng === 0)
  );
}

/** Fits the map to the current points (or falls back to Nigeria view). */
function FitBounds({ points, fitKey }: { points: MapPoint[]; fitKey: string }) {
  const map = useMap();
  useEffect(() => {
    const coords = points.filter((p) => isValidLatLng(p.latitude, p.longitude));
    if (coords.length === 0) {
      map.setView(NIGERIA_CENTER, 6);
      return;
    }
    if (coords.length === 1) {
      map.setView([coords[0].latitude, coords[0].longitude], 13);
      return;
    }
    const bounds = L.latLngBounds(coords.map((p) => [p.latitude, p.longitude] as [number, number]));
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 13 });
    // fitKey drives refits; points is captured fresh via fitKey-driven renders.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fitKey, map]);
  return null;
}

/** Flies the map to the focused point whenever selection changes. */
function FocusHandler({ focus }: { focus?: MapFocus | null }) {
  const map = useMap();
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as unknown as { __locatorMap?: L.Map }).__locatorMap = map;
    }
    if (!focus) return;
    if (!isValidLatLng(focus.latitude, focus.longitude)) return;
    map.flyTo([focus.latitude, focus.longitude], focus.zoom ?? 14, { duration: 0.9 });
  }, [focus, map]);
  return null;
}

/** Keeps the map container's variant class in sync (tiles + chrome styling). */
function VariantClass({ variant }: { variant: MapVariant }) {
  const map = useMap();
  useEffect(() => {
    const el = map.getContainer();
    el.classList.remove('locator-container--dark', 'locator-container--light');
    el.classList.add(`locator-container--${variant}`);
  }, [variant, map]);
  return null;
}

/** Top-right toggle between the lightened dark-green and soft light-green
 * basemap styles. Controlled when both `variant` and `onVariantChange` are
 * provided; otherwise manages its own state. */
function VariantSwitch({
  variant,
  onChange,
}: {
  variant: MapVariant;
  onChange: (v: MapVariant) => void;
}) {
  const dark = variant === 'dark';
  const label = dark ? 'Switch map to light mode' : 'Switch map to dark mode';
  return (
    <ActionIcon
      aria-label={label}
      title={label}
      variant="filled"
      onClick={() => onChange(dark ? 'light' : 'dark')}
      style={{
        position: 'absolute',
        top: 12,
        right: 12,
        zIndex: 1100,
        width: 36,
        height: 36,
        borderRadius: 10,
        background: dark ? 'rgba(15, 23, 42, 0.88)' : '#ffffff',
        color: dark ? THEME.text : THEME.ink,
        border: `1px solid ${dark ? THEME.line : '#d8e5dd'}`,
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.35)',
      }}
    >
      {dark ? <Sun size={17} /> : <Moon size={17} />}
    </ActionIcon>
  );
}

/** Renders the user's position as a pulsing blue dot and flies to it once. */
function UserDotMarker({ userLocation }: { userLocation?: UserDot | null }) {
  const map = useMap();
  const [arrived, setArrived] = useState(false);
  const valid = isValidLatLng(userLocation?.latitude, userLocation?.longitude);
  useEffect(() => {
    if (!valid) {
      setArrived(false);
      return;
    }
    if (!arrived) {
      map.flyTo([userLocation!.latitude, userLocation!.longitude], 12, { duration: 1.1 });
      setArrived(true);
    }
  }, [valid, arrived, map, userLocation]);
  if (!valid) return null;
  const icon = L.divIcon({
    className: 'locator-user-dot',
    html: '<div class="locator-user-dot__inner"></div>',
    iconSize: [18, 18],
    iconAnchor: [9, 9],
  });
  return (
    <Marker
      position={[userLocation!.latitude, userLocation!.longitude]}
      icon={icon}
      zIndexOffset={900}
      interactive={false}
    >
      {userLocation?.approx ? (
        <Circle
          center={[userLocation.latitude, userLocation.longitude]}
          radius={8000}
          pathOptions={{
            color: '#3B82F6',
            weight: 1,
            fillColor: '#3B82F6',
            fillOpacity: 0.08,
            dashArray: '4 4',
          }}
        />
      ) : null}
    </Marker>
  );
}

/** Reports zoom/pan so pages can filter the list to the visible map area. */
function ViewportReporter({ onViewportChange }: { onViewportChange?: (v: Viewport) => void }) {
  const map = useMapEvents({
    zoomend: () => {
      const c = map.getCenter();
      onViewportChange?.({ zoom: map.getZoom(), centerLatitude: c.lat, centerLongitude: c.lng });
    },
    moveend: () => {
      const c = map.getCenter();
      onViewportChange?.({ zoom: map.getZoom(), centerLatitude: c.lat, centerLongitude: c.lng });
    },
  });
  useEffect(() => {
    // Emit the initial viewport once tiles/layout settle.
    map.whenReady(() => {
      const c = map.getCenter();
      onViewportChange?.({ zoom: map.getZoom(), centerLatitude: c.lat, centerLongitude: c.lng });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map]);
  return null;
}

function LocatorMapInner({
  points,
  fitKey,
  highlightKey,
  focus,
  userLocation,
  variant = 'dark',
  onVariantChange,
  onViewportChange,
  height = 520,
}: LocatorMapProps) {
  const [internalVariant, setInternalVariant] = useState<MapVariant>(variant);
  // Controlled when the parent passes onVariantChange; self-managed otherwise.
  const activeVariant = onVariantChange ? variant : internalVariant;
  const setVariant = (v: MapVariant) => {
    setInternalVariant(v);
    onVariantChange?.(v);
  };

  const pins = useMemo(
    () => points.filter((p) => !p.bubble && isValidLatLng(p.latitude, p.longitude)),
    [points],
  );
  const bubbles = useMemo(
    () => points.filter((p) => p.bubble && isValidLatLng(p.latitude, p.longitude)),
    [points],
  );

  const clusterIcon = (cluster: { getChildCount: () => number }): L.DivIcon => {
    const count = cluster.getChildCount();
    const size = count >= 100 ? 52 : count >= 10 ? 44 : 36;
    return L.divIcon({
      className: 'locator-cluster',
      html: `<div class="locator-cluster__inner" style="width:${size}px;height:${size}px;font-size:${
        count >= 100 ? 14 : 13
      }px">${count}</div>`,
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2],
    });
  };

  const clusterMarkers = useMemo<ClusterMarkerSpec[]>(
    () =>
      pins.map((p) => {
        const body = [
          `<div style="font-weight:700;margin-bottom:2px;color:${THEME.text}">${escapeHtml(p.title)}</div>`,
          p.subtitle
            ? `<div style="color:${THEME.textMuted};font-size:12px">${escapeHtml(p.subtitle)}</div>`
            : '',
          p.detail ?? '',
        ].join('');
        return { key: p.key, lat: p.latitude, lng: p.longitude, icon: pinIcon(p.pinKind ?? 'facility', p.key === highlightKey), popupHtml: body };
      }),
    [pins, highlightKey],
  );

  return (
    <div style={{ position: 'relative', width: '100%' }}>
    <MapContainer
      center={NIGERIA_CENTER}
      zoom={6}
      scrollWheelZoom
      className={`locator-map locator-container--${activeVariant}`}
      style={{ height, width: '100%', borderRadius: 16, zIndex: 0 }}
    >
      <TileLayer
        key={activeVariant}
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
        url={TILE_URLS[activeVariant]}
      />
      <VariantClass variant={activeVariant} />
      <FitBounds points={points} fitKey={fitKey} />
      <FocusHandler focus={focus} />
      <UserDotMarker userLocation={userLocation} />
      <ViewportReporter onViewportChange={onViewportChange} />

      {clusterMarkers.length > 0 && (
        <MarkerClusterLayer
          chunkedLoading
          maxClusterRadius={45}
          showCoverageOnHover={false}
          iconCreateFunction={clusterIcon}
          markers={clusterMarkers}
        />
      )}

      {bubbles.map((p) => {
        const radius = Math.min(30, 14 + Math.sqrt(p.bubble!.count) * 2.2);
        const active = p.key === highlightKey;
        const body = [
          `<div style="font-weight:700;margin-bottom:2px;color:${THEME.text}">${escapeHtml(p.title)}${
            p.bubble?.label ? ` — ${escapeHtml(p.bubble.label)}` : ''
          }</div>`,
          p.subtitle
            ? `<div style="color:${THEME.textMuted};font-size:12px">${escapeHtml(p.subtitle)}</div>`
            : '',
          p.detail ?? '',
        ].join('');
        return (
          <CircleMarker
            key={p.key}
            center={[p.latitude, p.longitude]}
            radius={active ? radius + 4 : radius}
            pathOptions={{
              color: active ? THEME.teal : THEME.green,
              weight: 2,
              fillColor: active ? THEME.teal : THEME.green,
              fillOpacity: 0.55,
            }}
            eventHandlers={{
              add: (e) => (e.target as L.CircleMarker).bindPopup(body, { maxWidth: 300 }),
            }}
          />
        );
      })}
    </MapContainer>
    <VariantSwitch variant={activeVariant} onChange={setVariant} />
    </div>
  );
}

export const LocatorMap = memo(LocatorMapInner);
