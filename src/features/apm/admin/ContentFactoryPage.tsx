import {
  Box,
  Card,
  Group,
  Skeleton,
  Stack,
  Text,
  Title,
  Badge,
  Table,
  Button,
  Modal,
  TextInput,
  Select,
  Grid,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useState } from 'react';
import { useContentAssets, useCreateContentAsset } from '../website/admin-hooks';
import { apmBlue, ink, muted } from '../website/layout';

export function ContentFactoryPage() {
  const { data, isLoading } = useContentAssets();
  const createContent = useCreateContentAsset();
  const [opened, { open, close }] = useDisclosure(false);
  const [form, setForm] = useState({
    title: '',
    type: 'flyer',
    assetUrl: '',
    language: 'English',
    tags: '',
    messageKey: '',
  });

  const typeCounts: Record<string, number> = {};
  (data?.items ?? []).forEach((c: any) => {
    typeCounts[c.type] = (typeCounts[c.type] || 0) + 1;
  });

  return (
    <Stack gap="lg">
      <Group justify="space-between">
        <Title order={3} style={{ color: ink }}>
          Content Factory
        </Title>
        <Button
          onClick={() => {
            setForm({
              title: '',
              type: 'flyer',
              assetUrl: '',
              language: 'English',
              tags: '',
              messageKey: '',
            });
            open();
          }}
          style={{ background: apmBlue }}
        >
          Add Content
        </Button>
      </Group>

      <Grid>
        {Object.entries(typeCounts).map(([type, count]) => (
          <Grid.Col key={type} span={{ base: 6, sm: 4, md: 2 }}>
            <Card padding="md" radius="md" withBorder>
              <Stack gap={2} align="center">
                <Text size="xs" style={{ color: muted }}>
                  {type}s
                </Text>
                <Text fw={800} style={{ fontSize: '1.5rem', color: apmBlue }}>
                  {count}
                </Text>
              </Stack>
            </Card>
          </Grid.Col>
        ))}
        {Object.keys(typeCounts).length === 0 && (
          <Grid.Col span={12}>
            <Text style={{ color: muted, textAlign: 'center' }}>No content assets yet</Text>
          </Grid.Col>
        )}
      </Grid>

      {isLoading ? (
        <Skeleton height={300} radius="md" />
      ) : (
        <Card padding="lg" radius="md" withBorder>
          <Table striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Title</Table.Th>
                <Table.Th>Type</Table.Th>
                <Table.Th>Language</Table.Th>
                <Table.Th>Status</Table.Th>
                <Table.Th>Link</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {(data?.items ?? []).map((c: any) => (
                <Table.Tr key={c.id}>
                  <Table.Td fw={600}>{c.title}</Table.Td>
                  <Table.Td>
                    <Badge variant="light">{c.type}</Badge>
                  </Table.Td>
                  <Table.Td>{c.language ?? '—'}</Table.Td>
                  <Table.Td>
                    <Badge
                      color={
                        c.status === 'published'
                          ? 'green'
                          : c.status === 'draft'
                            ? 'gray'
                            : 'yellow'
                      }
                    >
                      {c.status}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    <Button
                      size="xs"
                      variant="light"
                      component="a"
                      href={c.assetUrl}
                      target="_blank"
                    >
                      Open
                    </Button>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Card>
      )}

      <Modal opened={opened} onClose={close} title="Add Content Asset" size="md">
        <Stack gap="sm">
          <TextInput
            label="Title"
            required
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.currentTarget.value })}
          />
          <Select
            label="Type"
            data={[
              'flyer',
              'video',
              'voice-note',
              'infographic',
              'poster',
              'social-media',
              'script',
            ].map((v) => ({
              value: v,
              label: v.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
            }))}
            value={form.type}
            onChange={(v) => setForm({ ...form, type: v ?? 'flyer' })}
          />
          <TextInput
            label="Asset URL"
            required
            value={form.assetUrl}
            onChange={(e) => setForm({ ...form, assetUrl: e.currentTarget.value })}
          />
          <TextInput
            label="Language"
            value={form.language}
            onChange={(e) => setForm({ ...form, language: e.currentTarget.value })}
          />
          <TextInput
            label="Message Key"
            value={form.messageKey}
            onChange={(e) => setForm({ ...form, messageKey: e.currentTarget.value })}
          />
          <TextInput
            label="Tags (comma-separated)"
            value={form.tags}
            onChange={(e) => setForm({ ...form, tags: e.currentTarget.value })}
          />
          <Button
            fullWidth
            onClick={() => createContent.mutate(form, { onSuccess: close })}
            style={{ background: apmBlue }}
            mt="sm"
          >
            Create
          </Button>
        </Stack>
      </Modal>
    </Stack>
  );
}
