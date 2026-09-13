import { Badge, Box, Container, Group, Paper, Stack, Text, ThemeIcon, Title } from '@mantine/core';
import { Clock3, Check, X, Eye, FileText } from 'lucide-react';
import { EmptyPrescriptions } from '../website/empty-states';
import { usePrescriptions } from '../website/hooks';
import { WebsiteLayout, green, ink, muted, line } from '../website/layout';
import { PrescriptionLoader } from '../website/loaders';

const statusColors: Record<string, string> = {
  Pending: 'yellow',
  'Under Review': 'blue',
  Approved: 'green',
  Rejected: 'red',
  Fulfilled: 'teal',
};

const statusIcons: Record<string, React.ReactNode> = {
  Pending: <Clock3 size={20} />,
  'Under Review': <Eye size={20} />,
  Approved: <Check size={20} />,
  Rejected: <X size={20} />,
  Fulfilled: <Check size={20} />,
};

export default function MyPrescriptionsPage() {
  const { data: prescriptions, isLoading } = usePrescriptions();

  return (
    <WebsiteLayout>
      <Container size="md" py={{ base: 28, md: 48 }}>
        <Stack gap="xl">
          <Box>
            <Title order={1} className="damorex-heading" style={{ color: ink }}>
              My Prescriptions
            </Title>
            <Text c={muted} size="lg" lh={1.7}>
              Track the status of your uploaded prescriptions.
            </Text>
          </Box>

          {isLoading ? (
            <PrescriptionLoader />
          ) : !prescriptions?.length ? (
            <EmptyPrescriptions />
          ) : (
            <Stack gap="sm">
              {prescriptions.map((prescription) => (
                <Paper
                  key={prescription.id}
                  radius={20}
                  p="lg"
                  withBorder
                  style={{ borderColor: line }}
                >
                  <Group justify="space-between" wrap="nowrap">
                    <Stack gap={4}>
                      <Group gap={8}>
                        <Badge radius="xl" color={statusColors[prescription.status] || 'gray'}>
                          {prescription.status}
                        </Badge>
                        <Text size="sm" c={muted}>
                          {new Date(prescription.createdAt).toLocaleDateString()}
                        </Text>
                      </Group>
                      {prescription.pharmacistNotes ? (
                        <Text size="sm" c={muted} lh={1.7}>
                          Pharmacist note: {prescription.pharmacistNotes}
                        </Text>
                      ) : null}
                      {prescription.files?.length ? (
                        <Text size="xs" c={muted}>
                          {prescription.files.length} file(s) uploaded
                        </Text>
                      ) : null}
                    </Stack>
                    <ThemeIcon
                      radius="xl"
                      color={(statusColors[prescription.status] as any) || 'gray'}
                      variant="light"
                    >
                      {statusIcons[prescription.status] || <Clock3 size={20} />}
                    </ThemeIcon>
                  </Group>
                </Paper>
              ))}
            </Stack>
          )}
        </Stack>
      </Container>
    </WebsiteLayout>
  );
}
