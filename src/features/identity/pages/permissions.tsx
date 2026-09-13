import { Badge, Card, Group, Loader, Stack, Text } from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import { RxPage } from '@/features/components/page/rx-page';
import { identityApi } from '@/lib/identity-api';

type IdentityPermission = {
  code: string;
  name: string;
  description: string;
  resource: string;
  action: string;
};

type IdentityPermissionModule = {
  module: string;
  moduleDisplayName: string;
  permissions: IdentityPermission[];
};

export function IdentityPermissionsPage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['identity', 'permissions'],
    queryFn: async () =>
      (await identityApi.get<IdentityPermissionModule[]>('/permissions/modules')).data,
  });

  return (
    <RxPage
      title="Permissions"
      description="All permission codes the identity service understands, grouped by module."
    >
      {isLoading && <Loader />}
      {isError && <Text c="red">Failed to load permissions.</Text>}
      <Stack gap="md">
        {(data ?? []).map((mod) => (
          <Card key={mod.module} shadow="sm" padding="lg" radius="md" withBorder>
            <Stack gap="xs">
              <Group justify="space-between">
                <Text fw={600}>{mod.moduleDisplayName}</Text>
                <Badge variant="light">{mod.module}</Badge>
              </Group>
              <Stack gap={6}>
                {mod.permissions.map((permission) => (
                  <Group key={permission.code} gap="sm" wrap="wrap" align="flex-start">
                    <Badge variant="outline" size="sm" miw={120}>
                      {permission.name}
                    </Badge>
                    <Stack gap={0}>
                      <Text size="xs" fw={600} ff="monospace">
                        {permission.code}
                      </Text>
                      <Text size="xs" c="dimmed">
                        {permission.description}
                      </Text>
                    </Stack>
                  </Group>
                ))}
              </Stack>
            </Stack>
          </Card>
        ))}
      </Stack>
    </RxPage>
  );
}
