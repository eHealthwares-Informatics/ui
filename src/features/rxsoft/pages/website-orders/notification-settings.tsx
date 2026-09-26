import { useEffect, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { notifications } from '@mantine/notifications';
import { Button, Group, Modal, Select, Stack, Switch, Table, Text } from '@mantine/core';
import { Settings2 } from 'lucide-react';
import { rxsoftApi } from '@/lib/rxsoft-api';
import { getApiErrorMessage } from '@/lib/get-api-error-message';

const CHANNELS = [
  { key: 'email', label: 'Email' },
  { key: 'sms', label: 'SMS' },
  { key: 'whatsapp', label: 'WhatsApp' },
] as const;

const SCENARIOS = [
  { key: 'status_changed', label: 'Status changed' },
  { key: 'payment_receivable', label: 'Payment / receivable' },
] as const;

/** Opens the per-facility channel x scenario notification switches. */
export function NotificationSettingsButton() {
  const [opened, setOpened] = useState(false);
  const [orgId, setOrgId] = useState<string | null>(null);
  const [values, setValues] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);

  const { data: organizations = [] } = useQuery({
    queryKey: ['organizations', 'all'],
    queryFn: async () => {
      const { data } = await rxsoftApi.get('/organizations', { params: { limit: 200 } });
      return data?.data ?? data ?? [];
    },
  });

  // Load the facility's switches whenever one is chosen; missing keys mean
  // "never configured" and default to enabled.
  useEffect(() => {
    if (!orgId) {return;}
    let cancelled = false;
    setLoading(true);
    rxsoftApi
      .get(`/orders/admin/notification-settings/${orgId}`)
      .then(({ data }) => {
        if (cancelled) {return;}
        const saved = data?.data ?? {};
        const merged: Record<string, boolean> = {};
        for (const c of CHANNELS) {
          for (const s of SCENARIOS) {
            merged[`${c.key}:${s.key}`] = saved[`${c.key}:${s.key}`] !== false;
          }
        }
        setValues(merged);
      })
      .catch(() => {
        if (cancelled) {return;}
        const merged: Record<string, boolean> = {};
        for (const c of CHANNELS) {
          for (const s of SCENARIOS) {
            merged[`${c.key}:${s.key}`] = true;
          }
        }
        setValues(merged);
      })
      .finally(() => {
        if (!cancelled) {setLoading(false);}
      });
    return () => {
      cancelled = true;
    };
  }, [orgId]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      await rxsoftApi.put(`/orders/admin/notification-settings/${orgId}`, { settings: values });
    },
    onSuccess: () => {
      notifications.show({ message: 'Notification settings saved.', color: 'green' });
      setOpened(false);
    },
    onError: (err: any) => {
      notifications.show({ message: getApiErrorMessage(err), color: 'red' });
    },
  });

  return (
    <>
      <Button
        size="compact-xs"
        variant="light"
        leftSection={<Settings2 size={14} />}
        onClick={() => {
          setOpened(true);
          if (!orgId && organizations[0]?.id) {setOrgId(organizations[0].id);}
        }}
      >
        Notifications
      </Button>
      <Modal opened={opened} onClose={() => setOpened(false)} title="Order Notification Settings" centered>
        <Stack>
          <Text size="sm" c="dimmed">
            Choose which channels send order notifications for each facility and scenario. Switches
            that have never been configured default to on.
          </Text>
          <Select
            label="Facility (organisation)"
            placeholder="Select facility"
            data={(Array.isArray(organizations) ? organizations : []).map((o: any) => ({ value: o.id, label: o.name }))}
            value={orgId}
            onChange={setOrgId}
            searchable
          />
          {orgId ? (
            <Table withTableBorder verticalSpacing="xs" style={{ opacity: loading ? 0.5 : 1 }}>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Channel</Table.Th>
                  {SCENARIOS.map((s) => (
                    <Table.Th key={s.key}>{s.label}</Table.Th>
                  ))}
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {CHANNELS.map((c) => (
                  <Table.Tr key={c.key}>
                    <Table.Td fw={600}>{c.label}</Table.Td>
                    {SCENARIOS.map((s) => {
                      const key = `${c.key}:${s.key}`;
                      return (
                        <Table.Td key={key}>
                          <Switch
                            aria-label={`${c.label} — ${s.label}`}
                            checked={values[key] ?? true}
                            onChange={(e) =>
                              setValues((prev) => ({ ...prev, [key]: e.currentTarget.checked }))
                            }
                          />
                        </Table.Td>
                      );
                    })}
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          ) : (
            <Text size="sm" c="dimmed">Select a facility to configure its channels.</Text>
          )}
          <Group justify="flex-end">
            <Button variant="light" onClick={() => setOpened(false)}>Cancel</Button>
            <Button loading={saveMutation.isPending} disabled={!orgId || loading} onClick={() => saveMutation.mutate()}>
              Save
            </Button>
          </Group>
        </Stack>
      </Modal>
    </>
  );
}
