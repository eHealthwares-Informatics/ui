import { Button, Card, Grid, Stack, Text } from '@mantine/core';
import { Link } from '@tanstack/react-router';
import { RxPage } from '@/features/components/page/rx-page';

const identityResources = [
  {
    key: 'users',
    title: 'Users',
    description: 'User accounts, role assignments and session settings.',
  },
  {
    key: 'roles',
    title: 'Roles',
    description: 'Role definitions with permission code sets.',
  },
  {
    key: 'permissions',
    title: 'Permissions',
    description: 'All permission codes grouped by module.',
  },
  {
    key: 'organizations',
    title: 'Organizations',
    description: 'Tenant boundaries and activation status.',
  },
  {
    key: 'locations',
    title: 'Locations',
    description: 'Sites scoped to organizations with parent hierarchy.',
  },
];

export function IdentityPage() {
  return (
    <RxPage
      title="Identity & Access"
      description="Manage users, roles, permissions, organizations and locations backed by the identity service."
    >
      <Stack gap="md">
        <Text c="dimmed">
          Choose an identity resource to manage, then open it in its own dedicated page.
        </Text>

        <Grid>
          {identityResources.map((resource) => (
            <Grid.Col key={resource.key} span={{ base: 12, sm: 6, md: 4 }}>
              <Card shadow="sm" padding="lg" radius="md" withBorder>
                <Stack gap="sm">
                  <div>
                    <Text fw={600}>{resource.title}</Text>
                    <Text c="dimmed" size="sm">
                      {resource.description}
                    </Text>
                  </div>
                  <Button component={Link} to={`/identity/${resource.key}`} variant="light">
                    Manage {resource.title}
                  </Button>
                </Stack>
              </Card>
            </Grid.Col>
          ))}
        </Grid>
      </Stack>
    </RxPage>
  );
}
