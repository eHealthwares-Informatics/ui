import { Box, Group, Loader, Text, Tooltip } from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart3,
  Package,
  AlertTriangle,
  CheckCircle,
  XCircle,
  ShoppingCart,
  DollarSign,
} from 'lucide-react';
import { useModuleContext } from '@/context/module-context';
import type { MetricsConfig } from '@/features/shared/model-schema';

const ICON_MAP: Record<string, React.ReactNode> = {
  Package: <Package size={12} />,
  AlertTriangle: <AlertTriangle size={12} />,
  CheckCircle: <CheckCircle size={12} />,
  XCircle: <XCircle size={12} />,
  ShoppingCart: <ShoppingCart size={12} />,
  DollarSign: <DollarSign size={12} />,
  BarChart3: <BarChart3 size={12} />,
};

function getIcon(name?: string): React.ReactNode {
  return name && ICON_MAP[name] ? ICON_MAP[name] : <BarChart3 size={12} />;
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);

function formatValue(value: string | number, format?: 'number' | 'currency'): string {
  if (format === 'currency') {
    return formatCurrency(Number(value));
  }
  if (typeof value === 'number') {
    return value.toLocaleString();
  }
  return value;
}

function StatCard({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  color: string;
}) {
  return (
    <Tooltip label={label}>
      <Box
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '2px 10px',
          borderRadius: 4,
          background: `var(--mantine-color-${color}-0)`,
          border: `1px solid var(--mantine-color-${color}-3)`,
          cursor: 'default',
        }}
      >
        {icon}
        <Text size="xs" fw={600}>
          {value}
        </Text>
      </Box>
    </Tooltip>
  );
}

export function MetricsBar({
  metricsConfig,
  params,
}: {
  metricsConfig: MetricsConfig;
  params?: Record<string, string>;
}) {
  const { apiProvider } = useModuleContext();

  const { data, isLoading } = useQuery({
    queryKey: ['metrics', metricsConfig.endpoint, params],
    queryFn: async () => {
      const res = await apiProvider.get(metricsConfig.endpoint, { params });
      return res.data;
    },
  });

  if (isLoading) {
    return <Loader size="xs" />;
  }
  if (!data) {
    return null;
  }

  const items = metricsConfig.items(data);
  if (items.length === 0) {
    return null;
  }

  return (
    <Box
      bg="gray.0"
      py={4}
      px="md"
      style={{ borderBottom: '1px solid var(--mantine-color-gray-3)' }}
    >
      <Group gap="xs" wrap="wrap">
        {items.map((item, i) => (
          <StatCard
            key={i}
            label={item.label}
            value={formatValue(item.value, item.format)}
            icon={getIcon(item.icon)}
            color={item.color ?? 'gray'}
          />
        ))}
      </Group>
    </Box>
  );
}
