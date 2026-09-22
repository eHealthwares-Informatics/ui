/**
 * MarkerClusterLayer — a thin react-leaflet wrapper around the underlying
 * `leaflet.markercluster` plugin. We drive it imperatively instead of via
 * `react-leaflet-cluster`, whose wrapper does not reliably attach child
 * markers under react-leaflet v5.
 *
 * Reconciliation runs on mount (create path) and on every props change
 * (update path): markers are created once per key, kept in a per-group
 * registry, and only added/removed/updated as needed. `addLayers` bulk-adds.
 */
import { createPathComponent } from '@react-leaflet/core';
import L from 'leaflet';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import 'leaflet.markercluster';
import type { MarkerClusterGroupOptions } from 'leaflet';

export interface ClusterMarkerSpec {
  key: string;
  lat: number;
  lng: number;
  icon: L.DivIcon;
  popupHtml: string;
}

interface Props extends MarkerClusterGroupOptions {
  markers: ClusterMarkerSpec[];
}

const popupOptions: L.PopupOptions = { maxWidth: 300 };

const registries = new WeakMap<
  L.MarkerClusterGroup,
  Map<string, { spec: ClusterMarkerSpec; marker: L.Marker }>
>();

function reconcile(instance: L.MarkerClusterGroup, markers: ClusterMarkerSpec[]) {
  let registry = registries.get(instance);
  if (!registry) {
    registry = new Map();
    registries.set(instance, registry);
  }

  const nextKeys = new Set(markers.map((m) => m.key));

  // Remove markers whose keys disappeared; update icons in place when only
  // the icon changed (highlight toggling) without re-adding to the cluster.
  const toRemove: L.Marker[] = [];
  for (const [key, entry] of registry) {
    if (!nextKeys.has(key)) {
      toRemove.push(entry.marker);
      registry.delete(key);
      continue;
    }
    const next = markers.find((m) => m.key === key)!;
    if (entry.spec.icon !== next.icon) {
      entry.marker.setIcon(next.icon);
    }
    if (entry.spec.popupHtml !== next.popupHtml) {
      entry.marker.setPopupContent(next.popupHtml);
      entry.spec.popupHtml = next.popupHtml;
    }
    entry.spec = next;
  }
  if (toRemove.length) instance.removeLayers(toRemove);

  // Bulk-add markers we have not created yet.
  const toAdd: L.Marker[] = [];
  for (const m of markers) {
    if (registry.has(m.key)) continue;
    const marker = L.marker([m.lat, m.lng], { icon: m.icon, keyboard: false, title: m.key });
    marker.bindPopup(m.popupHtml, popupOptions);
    registry.set(m.key, { spec: m, marker });
    toAdd.push(marker);
  }
  if (toAdd.length) instance.addLayers(toAdd);
}

const MarkerClusterLayer = createPathComponent<L.MarkerClusterGroup, Props>(
  ({ markers, ...options }: Props, context) => {
    const group = L.markerClusterGroup(options);
    reconcile(group, markers);
    return {
      instance: group,
      context: { ...context, layerContainer: group },
    };
  },
  (instance, props) => {
    reconcile(instance, props.markers);
    return true;
  },
);

export default MarkerClusterLayer;
