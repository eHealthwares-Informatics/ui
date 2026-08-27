export function formatCompact(value: number): string {
  if (value >= 1_000_000) {
    return `${Number((value / 1_000_000).toFixed(1))}M`;
  }
  if (value >= 1_000) {
    return `${Math.round(value / 1_000)}K`;
  }
  return Math.round(value).toLocaleString();
}

export function formatNaira(value: number): string {
  return `\u20a6${formatCompact(value)}`;
}

export function formatAmount(value: number): string {
  return `\u20a6${Math.round(value).toLocaleString('en-NG')}`;
}

export function formatPct(value: number): string {
  return `${value.toFixed(1)}%`;
}

export function formatDelta(value: number): string {
  return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
}

export function formatLastUpdated(timestamp: number): string {
  return new Date(timestamp).toLocaleString('en-NG', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
