export type Granularity = 'Daily' | 'Weekly' | 'Monthly';

export type TrendPoint = {
  day: string;
  [key: string]: number | string;
};

export function bucketTrend<T extends TrendPoint>(
  points: T[],
  granularity: Granularity
): Array<Record<string, unknown>> {
  const bucketKey = (date: Date, day: string): string => {
    if (granularity === 'Weekly') {
      const diffToMonday = (date.getDay() + 6) % 7;
      const monday = new Date(date);
      monday.setDate(date.getDate() - diffToMonday);
      return monday.toISOString().slice(0, 10);
    }
    if (granularity === 'Monthly') {
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    }
    return day;
  };

  const map = new Map<string, Record<string, unknown>>();
  for (const point of points) {
    const date = new Date(`${point.day}T00:00:00`);
    const key = bucketKey(date, point.day);
    const bucket = map.get(key) ?? { day: key };
    for (const [k, v] of Object.entries(point)) {
      if (k === 'day') {
        continue;
      }
      if (typeof v === 'number') {
        bucket[k] = Number(bucket[k] ?? 0) + v;
      } else if (v !== undefined) {
        bucket[k] = v;
      }
    }
    map.set(key, bucket);
  }

  return [...map.values()]
    .sort((a, b) => String(a.day).localeCompare(String(b.day)))
    .map((bucket) => {
      const date = new Date(`${String(bucket.day)}T00:00:00`);
      const displayDay =
        granularity === 'Monthly'
          ? date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
          : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      return { ...bucket, displayDay };
    });
}
