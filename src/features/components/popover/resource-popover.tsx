import { HoverCard, Skeleton, Stack, Text } from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import { memo, useState } from 'react';
import { rxsoftApi } from '@/lib/rxsoft-api';

type ResourcePopoverProps = {
  resourceId: string | null;
  endpoint: string;
  children?: React.ReactNode;
  render: (data: unknown) => React.ReactNode;
  fallback?: React.ReactNode;
};

function shortenId(id: string) {
  if (id.length <= 8) {return id;}
  return `${id.slice(0, 4)}…${id.slice(-4)}`;
}

function ResourcePopoverInner({ resourceId, endpoint, children, render, fallback }: ResourcePopoverProps) {
  const [isHovered, setIsHovered] = useState(false);

  const { data, isFetching } = useQuery({
    queryKey: [endpoint, resourceId],
    queryFn: async () => {
      const { data } = await rxsoftApi.get(`${endpoint}/${resourceId}`);
      return data;
    },
    enabled: isHovered && !!resourceId,
  });

  if (!resourceId) {return <>{fallback ?? '-'}</>;}

  return (
    <HoverCard
      position="top"
      withArrow
      shadow="md"
      openDelay={300}
      closeDelay={300}
      onOpen={() => setIsHovered(true)}
      onClose={() => setIsHovered(false)}
    >
      <HoverCard.Target>
        <span style={{ cursor: 'pointer', borderBottom: '1px dashed var(--mantine-color-gray-5)' }}>
          {children ?? shortenId(resourceId)}
        </span>
      </HoverCard.Target>
      <HoverCard.Dropdown>
        {isFetching ? (
          <Stack gap="xs" miw={180}>
            <Skeleton height={14} width="60%" />
            <Skeleton height={14} width="40%" />
          </Stack>
        ) : data ? (
          render(data)
        ) : (
          <Text size="sm" c="dimmed">No data</Text>
        )}
      </HoverCard.Dropdown>
    </HoverCard>
  );
}

export const ResourcePopover = memo(ResourcePopoverInner);
