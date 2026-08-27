import { ActionIcon, Anchor, Breadcrumbs, Group, Stack, Text, Title } from '@mantine/core';
import { ArrowLeft } from 'lucide-react';
import { ReactNode } from 'react';

type BreadcrumbItem = { label: string; href?: string };

export function RxPage({
  title,
  description,
  actions,
  breadcrumbs,
  onBack,
  children,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  breadcrumbs?: BreadcrumbItem[];
  onBack?: () => void;
  children: ReactNode;
}) {
  return (
    <Stack gap="lg">
      {/* BREADCRUMBS & BACK */}
      {breadcrumbs && (
        <Group gap="xs">
          {onBack && (
            <ActionIcon variant="subtle" onClick={onBack} size="sm">
              <ArrowLeft size={18} />
            </ActionIcon>
          )}
          <Breadcrumbs>
            {breadcrumbs.map((bc, i) =>
              bc.href ? (
                <Anchor key={i} href={bc.href} size="sm">
                  {bc.label}
                </Anchor>
              ) : (
                <Text key={i} size="sm" c="dimmed">
                  {bc.label}
                </Text>
              ),
            )}
          </Breadcrumbs>
        </Group>
      )}

      {/* PAGE HEADER */}
      <Group justify="space-between" align="flex-end">
        <Stack gap={4}>
          <Title order={2} data-testid="page-title">{title}</Title>

          {description && (
            <Text size="sm" c="dimmed" maw={700}>
              {description}
            </Text>
          )}
        </Stack>

        {actions && (
          <Group gap="xs" wrap="wrap">
            {actions}
          </Group>
        )}
      </Group>

      {/* CONTENT */}
      <div>{children}</div>
    </Stack>
  );
}
