import {
  Box,
  Card,
  Grid,
  Group,
  Skeleton,
  Stack,
  Text,
  Title,
  Badge,
  Table,
  Anchor,
} from '@mantine/core';
import { useNavigate } from '@tanstack/react-router';
import { useConversionDashboard, useLgaConversion } from '../website/admin-hooks';
import { apmBlue, apmGreen, ink, muted } from '../website/layout';

function statusColor(status: string) {
  switch (status) {
    case 'green':
      return '#16A34A';
    case 'yellow':
      return '#EAB308';
    case 'red':
      return '#DC2626';
    case 'grey':
      return '#94A3B8';
    default:
      return '#94A3B8';
  }
}

export function ConversionDashboard() {
  const { data: dashboard, isLoading: dashLoading } = useConversionDashboard();
  const { data: lgas, isLoading: lgasLoading } = useLgaConversion();
  const navigate = useNavigate();

  if (dashLoading || lgasLoading) {
    return (
      <Stack gap="lg">
        <Skeleton height={120} radius="md" />
        <Skeleton height={400} radius="md" />
      </Stack>
    );
  }

  const summary = dashboard?.summary;
  const conversion = dashboard?.conversion;

  const statCards = [
    { label: 'LGAs', value: summary?.totalLgas ?? 0, color: apmBlue },
    { label: 'Wards', value: summary?.totalWards ?? 0, color: apmBlue },
    { label: 'Polling Units', value: summary?.totalPollingUnits ?? 0, color: apmBlue },
    { label: 'Stakeholders', value: summary?.totalStakeholders ?? 0, color: apmBlue },
    { label: 'APM-Friendly PUs', value: conversion?.apmFriendlyPollingUnits ?? 0, color: apmGreen },
    { label: 'Contested PUs', value: conversion?.contestedPollingUnits ?? 0, color: '#EAB308' },
    { label: 'Green LGAs', value: conversion?.greenLgas ?? 0, color: '#16A34A' },
    { label: 'Red LGAs', value: conversion?.redLgas ?? 0, color: '#DC2626' },
  ];

  return (
    <Stack gap="lg">
      <Title order={3} style={{ color: ink }}>
        Conversion Dashboard
      </Title>

      <Grid>
        {statCards.map((stat) => (
          <Grid.Col key={stat.label} span={{ base: 6, sm: 4, md: 3 }}>
            <Card padding="lg" radius="md" withBorder>
              <Stack gap={4} align="center">
                <Text size="sm" style={{ color: muted }}>
                  {stat.label}
                </Text>
                <Text
                  fw={800}
                  style={{
                    fontSize: 'clamp(1.5rem, 3vw, 2rem)',
                    color: stat.color,
                    lineHeight: 1.2,
                  }}
                >
                  {stat.value}
                </Text>
              </Stack>
            </Card>
          </Grid.Col>
        ))}
      </Grid>

      <Card padding="lg" radius="md" withBorder>
        <Title order={4} mb="md" style={{ color: ink }}>
          LGA Conversion Status
        </Title>
        {lgas && lgas.length > 0 ? (
          <Table striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>LGA</Table.Th>
                <Table.Th>Code</Table.Th>
                <Table.Th>Score</Table.Th>
                <Table.Th>Status</Table.Th>
                <Table.Th>Wards</Table.Th>
                <Table.Th>Polling Units</Table.Th>
                <Table.Th>APM-Friendly PUs</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {lgas.map((lga) => (
                <Table.Tr
                  key={lga.id}
                  style={{ cursor: 'pointer' }}
                  onClick={() => {
                    /* navigate to LGA detail */
                  }}
                >
                  <Table.Td>
                    <Anchor
                      underline="never"
                      style={{ color: apmBlue, fontWeight: 600 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        // navigate to ward view for this LGA
                      }}
                    >
                      {lga.name}
                    </Anchor>
                  </Table.Td>
                  <Table.Td style={{ color: muted }}>{lga.code}</Table.Td>
                  <Table.Td>
                    <Text fw={700} style={{ color: statusColor(lga.status) }}>
                      {lga.score}%
                    </Text>
                  </Table.Td>
                  <Table.Td>
                    <Badge
                      color={
                        lga.status === 'green'
                          ? 'green'
                          : lga.status === 'yellow'
                            ? 'yellow'
                            : lga.status === 'red'
                              ? 'red'
                              : 'gray'
                      }
                    >
                      {lga.status}
                    </Badge>
                  </Table.Td>
                  <Table.Td>{lga.wardCount}</Table.Td>
                  <Table.Td>{lga.pollingUnitCount}</Table.Td>
                  <Table.Td>
                    <Text fw={700} style={{ color: apmGreen }}>
                      {lga.wonPollingUnits}
                    </Text>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        ) : (
          <Text style={{ color: muted }}>No LGA data available. Seed the database first.</Text>
        )}
      </Card>
    </Stack>
  );
}
