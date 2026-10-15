import { Button, Group, Modal, Select, Stack, Switch, Table, Text } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Settings2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { getApiErrorMessage } from '@/lib/get-api-error-message';
import { rxsoftApi } from '@/lib/rxsoft-api';
import { useAuthStore } from '@/stores/auth-store';

const CHANNELS = [
  { key: 'email', label: 'Email' },
  { key: 'sms', label: 'SMS' },
  { key: 'whatsapp', label: 'WhatsApp' },
] as const;

/**
 * Fallback scenario list, only used until `GET /orders/admin/notification-scenarios`
 * answers. The backend catalog is authoritative — it is what the dispatcher
 * actually gates — so the matrix renders whatever it returns (rxsoft#18 2/2).
 */
const SCENARIOS = [
  { key: 'order_confirmation', label: 'Order confirmation' },
  { key: 'payment_confirmation', label: 'Payment confirmation' },
  { key: 'status_changed', label: 'Status changed' },
  { key: 'payment_receivable', label: 'Payment / receivable' },
  { key: 'dispatch', label: 'Dispatch' },
  { key: 'delivery', label: 'Delivery' },
  { key: 'prescription_review', label: 'Prescription reviewed' },
  { key: 'refill_due', label: 'Refill due' },
  { key: 'promotion', label: 'Promotional campaign' },
] as const;

/** Opens the per-facility channel x scenario notification switches. */
export function NotificationSettingsButton() {
  const [opened, setOpened] = useState(false);
  const [orgId, setOrgId] = useState<string | null>(null);
  const [values, setValues] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);

  // The backend owns the event list; the constant above is only a fallback.
  const { data: scenarioCatalog = [] } = useQuery({
    queryKey: ['orders', 'notification-scenarios'],
    queryFn: async () => {
      const { data } = await rxsoftApi.get('/orders/admin/notification-scenarios');
      return data?.data ?? [];
    },
    staleTime: 5 * 60 * 1000,
  });

  const scenarios: ReadonlyArray<{ key: string; label: string }> = useMemo(
    () =>
      scenarioCatalog.length
        ? scenarioCatalog.map((entry: { scenario: string; label: string }) => ({
            key: entry.scenario,
            label: entry.label,
          }))
        : SCENARIOS.map((entry) => ({ key: entry.key, label: entry.label })),
    [scenarioCatalog]
  );

  // The switches live on the facility config now (rxsoft-qa#804). Ordinary
  // admins only ever see their own facility — the server takes it from the
  // token — so the picker is superadmin-only, same as every other facility
  // switcher in the console.
  const currentUser = useAuthStore((state) => state.user);
  const isSuperAdmin = currentUser?.roles?.includes('super_admin') ?? false;

  const { data: organizations = [] } = useQuery({
    queryKey: ['organizations', 'all'],
    queryFn: async () => {
      const { data } = await rxsoftApi.get('/organizations', { params: { limit: 200 } });
      return data?.data ?? data ?? [];
    },
    enabled: isSuperAdmin,
  });

  const endpoint =
    isSuperAdmin && orgId
      ? `/organisation-config/by-organization/${orgId}`
      : '/organisation-config';

  // Load the facility's switches whenever one is chosen; missing keys mean
  // "never configured" and default to enabled.
  useEffect(() => {
    // A superadmin has to pick a facility first; everyone else is scoped by
    // their token, so load straight away.
    if (isSuperAdmin && !orgId) {
      return;
    }
    let cancelled = false;
    setLoading(true);
    rxsoftApi
      .get(endpoint)
      .then(({ data }) => {
        if (cancelled) {
          return;
        }
        const saved = data?.data?.notificationSettings ?? {};
        const merged: Record<string, boolean> = {};
        for (const c of CHANNELS) {
          for (const s of scenarios) {
            merged[`${c.key}:${s.key}`] = saved[`${c.key}:${s.key}`] !== false;
          }
        }
        setValues(merged);
      })
      .catch(() => {
        if (cancelled) {
          return;
        }
        const merged: Record<string, boolean> = {};
        for (const c of CHANNELS) {
          for (const s of scenarios) {
            merged[`${c.key}:${s.key}`] = true;
          }
        }
        setValues(merged);
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [endpoint, isSuperAdmin, orgId, scenarios]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      await rxsoftApi.patch(endpoint, { notificationSettings: values });
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
          if (isSuperAdmin && !orgId && organizations[0]?.id) {
            setOrgId(organizations[0].id);
          }
        }}
      >
        Notifications
      </Button>
      <Modal
        opened={opened}
        onClose={() => setOpened(false)}
        title="Notification Settings"
        centered
      >
        <Stack>
          <Text size="sm" c="dimmed">
            Choose which channels send customer notifications for each scenario — orders, payments,
            prescriptions, refill reminders and campaigns. Switches that have never been configured
            default to on.
          </Text>
          {isSuperAdmin && (
            <Select
              label="Facility (organisation)"
              placeholder="Select facility"
              data={(Array.isArray(organizations) ? organizations : []).map((o: any) => ({
                value: o.id,
                label: o.name,
              }))}
              value={orgId}
              onChange={setOrgId}
              searchable
            />
          )}
          {!isSuperAdmin || orgId ? (
            <Table.ScrollContainer minWidth={720}>
              <Table withTableBorder verticalSpacing="xs" style={{ opacity: loading ? 0.5 : 1 }}>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Channel</Table.Th>
                    {scenarios.map((s) => (
                      <Table.Th key={s.key}>{s.label}</Table.Th>
                    ))}
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {CHANNELS.map((c) => (
                    <Table.Tr key={c.key}>
                      <Table.Td fw={600}>{c.label}</Table.Td>
                      {scenarios.map((s) => {
                        const key = `${c.key}:${s.key}`;
                        return (
                          <Table.Td key={key}>
                            <Switch
                              aria-label={`${c.label} — ${s.label}`}
                              checked={values[key] ?? true}
                              onChange={(e) => {
                                // Read during dispatch: React nulls
                                // `currentTarget` once the event finishes, and the
                                // updater runs later (rxsoft-qa#794).
                                const checked = e.currentTarget.checked;
                                setValues((prev) => ({ ...prev, [key]: checked }));
                              }}
                            />
                          </Table.Td>
                        );
                      })}
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </Table.ScrollContainer>
          ) : (
            <Text size="sm" c="dimmed">
              Select a facility to configure its channels.
            </Text>
          )}
          <Group justify="flex-end">
            <Button variant="light" onClick={() => setOpened(false)}>
              Cancel
            </Button>
            <Button
              loading={saveMutation.isPending}
              disabled={(isSuperAdmin && !orgId) || loading}
              onClick={() => saveMutation.mutate()}
            >
              Save
            </Button>
          </Group>
        </Stack>
      </Modal>
    </>
  );
}
