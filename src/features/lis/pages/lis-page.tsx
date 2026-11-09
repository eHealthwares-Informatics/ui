import { Grid, Card, Stack, Text, Button, Group } from '@mantine/core';
import { Link } from '@tanstack/react-router';
import { RxPage } from '@/components/page/rx-page';
import { lisResources } from '../schema/resources';

export function LisPage() {
  return (
    <RxPage
      title="Laboratory Information System"
      description="Manage LIS test catalogs, sample handling, locations, priorities and reference ranges."
    >
      <Stack gap="md">
        <Text c="dimmed">
          Choose a LIS resource to manage, then open it in its own dedicated page.
        </Text>

        <Grid>
          {lisResources.map((resource) => (
            <Grid.Col key={resource.key} span={{ base: 12, sm: 6, md: 4 }}>
              <Card shadow="sm" padding="lg" radius="md" withBorder>
                <Stack gap="sm">
                  <div>
                    <Text fw={600}>{resource.title}</Text>
                    <Text c="dimmed" size="sm">
                      {resource.description}
                    </Text>
                  </div>
                  <Button component={Link} to={`/lis/${resource.key}`} variant="light">
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
