import { Badge, Card, Grid, Group, Stack, Text, Title } from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import { useModuleContext } from '@/context/module-context';
import { getMyPosConfig } from '@/features/rxsoft/pages/user-insights/api';
import { useModuleLocations } from '@/layout/use-module-locations';
import { useAuthStore } from '@/stores/auth-store';

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <Stack gap={2}>
      <Text size="xs" c="dimmed">
        {label}
      </Text>
      <Text size="sm" fw={500}>
        {value ?? '—'}
      </Text>
    </Stack>
  );
}

function YesNo({ value }: { value?: boolean | null }) {
  if (value === undefined || value === null) {
    return <>—</>;
  }
  return (
    <Badge color={value ? 'green' : 'gray'} variant="light">
      {value ? 'Allowed' : 'Disabled'}
    </Badge>
  );
}

/**
 * Account fields that only make sense for the module the user is currently in.
 * Identity fields (name/email/phone) live in `BasicInformationSection`; this
 * section renders the module-specific settings that sit alongside them, so the
 * account page adapts to the active module instead of showing one fixed form.
 */
export function ModuleAccountSection() {
  const { moduleId, moduleName } = useModuleContext();
  const user = useAuthStore((state) => state.user);
  const roles = user?.roles ?? [];

  const isPharmacy = moduleId === 'rxsoft' || moduleId === 'website';
  // `GET /user-pos-config/me` is role-gated (admin/super_admin/cashier/
  // website_user). Only call it for those roles — a 403 would otherwise trip
  // the global query-error handler and bounce the user to /403.
  const canReadPosConfig = roles.some((role) =>
    ['admin', 'super_admin', 'cashier', 'website_user'].includes(role)
  );
  const posQuery = useQuery({
    queryKey: ['account', 'pos-config'],
    queryFn: getMyPosConfig,
    enabled: isPharmacy && canReadPosConfig,
    retry: false,
  });

  const { scope, locations, defaultLocationId } = useModuleLocations();
  const locationName =
    locations.find((location) => location.id === defaultLocationId)?.name ??
    locations[0]?.name ??
    'All locations';

  const pos = posQuery.data;

  return (
    <Card withBorder radius="md" p="lg" data-testid="account-module-settings">
      <Stack gap="md">
        <Group justify="space-between" align="center">
          <Stack gap={2}>
            <Title order={3}>{moduleName} settings</Title>
            <Text size="sm" c="dimmed">
              Fields specific to the {moduleName} module you are currently in.
            </Text>
          </Stack>
          <Badge variant="light" color="blue" data-testid="account-module-badge">
            {moduleId}
          </Badge>
        </Group>

        <Grid>
          <Grid.Col span={{ base: 12, sm: 6 }}>
            <Field label="Module" value={moduleName} />
          </Grid.Col>
          {scope && (
            <Grid.Col span={{ base: 12, sm: 6 }}>
              <Field label={scope.label} value={locationName} />
            </Grid.Col>
          )}

          {isPharmacy && (
            <>
              <Grid.Col span={{ base: 12, sm: 6 }}>
                <Field label="Store" value={pos?.storeId ?? '—'} />
              </Grid.Col>
              <Grid.Col span={{ base: 12, sm: 6 }}>
                <Field label="Stock location" value={pos?.stockLocation?.name ?? '—'} />
              </Grid.Col>
              <Grid.Col span={{ base: 12, sm: 4 }}>
                <Field label="POS" value={<YesNo value={pos?.allowPos} />} />
              </Grid.Col>
              <Grid.Col span={{ base: 12, sm: 4 }}>
                <Field label="A4 print" value={<YesNo value={pos?.allowA4Print} />} />
              </Grid.Col>
              <Grid.Col span={{ base: 12, sm: 4 }}>
                <Field
                  label="Auto-select location"
                  value={<YesNo value={pos?.autoSelectLocation} />}
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, sm: 6 }}>
                <Field
                  label="Login timeout"
                  value={
                    pos?.loginTimeoutMinutes != null
                      ? `${pos.loginTimeoutMinutes} min`
                      : 'System default'
                  }
                />
              </Grid.Col>
            </>
          )}
        </Grid>

        <Stack gap={4}>
          <Text size="xs" c="dimmed">
            Roles
          </Text>
          <Group gap={4}>
            {roles.length > 0 ? (
              roles.map((role) => (
                <Badge key={role} variant="outline" size="sm">
                  {role}
                </Badge>
              ))
            ) : (
              <Text size="sm" c="dimmed">
                No roles assigned
              </Text>
            )}
          </Group>
        </Stack>
      </Stack>
    </Card>
  );
}
