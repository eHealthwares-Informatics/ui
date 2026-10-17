import { CircleCheck, CircleX, MapPin, PackageSearch, ShoppingCart, Truck } from 'lucide-react';
import type { ReactNode } from 'react';

export const STATUS_COLORS: Record<string, string> = {
  pending: 'yellow',
  confirmed: 'cyan',
  processing: 'blue',
  dispatched: 'violet',
  in_transit: 'indigo',
  delivered: 'green',
  cancelled: 'red',
};

export const STATUS_ICONS: Record<string, ReactNode> = {
  pending: <ShoppingCart size={16} />,
  confirmed: <CircleCheck size={16} />,
  processing: <PackageSearch size={16} />,
  dispatched: <Truck size={16} />,
  in_transit: <MapPin size={16} />,
  delivered: <CircleCheck size={16} />,
  cancelled: <CircleX size={16} />,
};

export const STATUS_TRANSITIONS: Record<string, string[]> = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['processing', 'cancelled'],
  processing: ['dispatched', 'cancelled'],
  dispatched: ['in_transit'],
  in_transit: ['delivered'],
  delivered: [],
  cancelled: [],
};

/** Happy-path order of the fulfilment timeline (cancelled is off-track). */
export const ORDER_TIMELINE = [
  'pending',
  'confirmed',
  'processing',
  'dispatched',
  'in_transit',
  'delivered',
] as const;

export function statusLabel(s: string) {
  return s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}
