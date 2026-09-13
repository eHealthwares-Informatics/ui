import {
  Button,
  Card,
  Container,
  Group,
  Loader,
  NumberInput,
  Select,
  Stack,
  Switch,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { rxsoftApi } from '@/lib/rxsoft-api';

type PosConfig = {
  id: string;
  userId: string;
  organizationId: string;
  stockLocationId: string | null;
  storeId: string | null;
  allowA4Print: boolean;
  allowPos: boolean;
  loginTimeoutMinutes: number | null;
  defaultCustomerId: string | null;
  defaultPriceListId: string | null;
  autoSelectLocation: boolean;
  autoSelectCustomer: boolean;
  autoSelectPriceList: boolean;
};

type UserRecord = {
  id: string;
  username?: string;
  name?: string;
  email?: string;
  loginTimeoutMinutes?: number | null;
  posConfig?: Partial<PosConfig> | null;
};

type UserOption = { id: string; username?: string; name?: string; email?: string };

type Option = { id: string; name: string; code?: string | null };

type Draft = {
  stockLocationId: string | null;
  storeId: string;
  allowA4Print: boolean;
  allowPos: boolean;
  loginTimeoutMinutes: number | string;
  defaultCustomerId: string | null;
  defaultPriceListId: string | null;
  autoSelectLocation: boolean;
  autoSelectCustomer: boolean;
  autoSelectPriceList: boolean;
};

const emptyDraft: Draft = {
  stockLocationId: null,
  storeId: '',
  allowA4Print: false,
  allowPos: true,
  loginTimeoutMinutes: 480,
  defaultCustomerId: null,
  defaultPriceListId: null,
  autoSelectLocation: true,
  autoSelectCustomer: true,
  autoSelectPriceList: true,
};

function userLabel(user: UserOption): string {
  return user.name ?? user.username ?? user.email ?? user.id;
}

export function RxUserConfigPage() {
  const queryClient = useQueryClient();
  const [userId, setUserId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft>(emptyDraft);

  const { data: users = [], isLoading: loadingUsers } = useQuery({
    queryKey: ['config', 'users'],
    queryFn: async () => {
      const { data } = await rxsoftApi.get('/users', { params: { limit: 200 } });
      return (data?.data ?? data ?? []) as UserOption[];
    },
    staleTime: 300_000,
  });

  const { data: stockLocations = [] } = useQuery({
    queryKey: ['config', 'stock-locations'],
    queryFn: async () => {
      const { data } = await rxsoftApi.get('/stock-locations', { params: { limit: 200 } });
      return (data?.data ?? data ?? []) as Option[];
    },
    staleTime: 300_000,
  });

  const { data: customers = [] } = useQuery({
    queryKey: ['config', 'customers'],
    queryFn: async () => {
      const { data } = await rxsoftApi.get('/customers', { params: { limit: 200 } });
      return (data?.data ?? data ?? []) as Option[];
    },
    staleTime: 300_000,
  });

  const { data: priceLists = [] } = useQuery({
    queryKey: ['config', 'price-lists'],
    queryFn: async () => {
      const { data } = await rxsoftApi.get('/price-lists', { params: { limit: 200 } });
      return (data?.data ?? data ?? []) as Option[];
    },
    staleTime: 300_000,
  });

  const { data: user, isLoading: loadingConfig } = useQuery({
    queryKey: ['user-config', userId],
    enabled: !!userId,
    refetchOnWindowFocus: false,
    queryFn: async () => {
      const { data } = await rxsoftApi.get(`/users/${userId}`);
      return data as UserRecord;
    },
  });

  useEffect(() => {
    if (!user) {
      setDraft(emptyDraft);
      return;
    }
    const pos = user.posConfig;
    setDraft({
      stockLocationId: pos?.stockLocationId ?? null,
      storeId: pos?.storeId ?? '',
      allowA4Print: pos?.allowA4Print ?? false,
      allowPos: pos?.allowPos ?? true,
      loginTimeoutMinutes: user.loginTimeoutMinutes ?? pos?.loginTimeoutMinutes ?? '',
      defaultCustomerId: pos?.defaultCustomerId ?? null,
      defaultPriceListId: pos?.defaultPriceListId ?? null,
      autoSelectLocation: pos?.autoSelectLocation ?? true,
      autoSelectCustomer: pos?.autoSelectCustomer ?? true,
      autoSelectPriceList: pos?.autoSelectPriceList ?? true,
    });
  }, [user]);

  const save = useMutation({
    mutationFn: async () => {
      const loginTimeoutMinutes =
        draft.loginTimeoutMinutes === '' ? null : Number(draft.loginTimeoutMinutes);
      const { data } = await rxsoftApi.patch(`/users/${userId}`, {
        loginTimeoutMinutes,
        posConfig: {
          stockLocationId: draft.stockLocationId,
          storeId: draft.storeId || null,
          allowA4Print: draft.allowA4Print,
          allowPos: draft.allowPos,
          loginTimeoutMinutes,
          defaultCustomerId: draft.defaultCustomerId,
          defaultPriceListId: draft.defaultPriceListId,
          autoSelectLocation: draft.autoSelectLocation,
          autoSelectCustomer: draft.autoSelectCustomer,
          autoSelectPriceList: draft.autoSelectPriceList,
        },
      });
      return data as UserRecord;
    },
    onSuccess: () => {
      const loginTimeoutMinutes =
        draft.loginTimeoutMinutes === '' ? null : Number(draft.loginTimeoutMinutes);
      queryClient.setQueryData<UserRecord | undefined>(['user-config', userId], (prev) => ({
        ...(prev ?? { id: userId ?? '' }),
        loginTimeoutMinutes,
        posConfig: {
          ...(prev?.posConfig ?? {}),
          stockLocationId: draft.stockLocationId,
          storeId: draft.storeId || null,
          allowA4Print: draft.allowA4Print,
          allowPos: draft.allowPos,
          loginTimeoutMinutes,
          defaultCustomerId: draft.defaultCustomerId,
          defaultPriceListId: draft.defaultPriceListId,
          autoSelectLocation: draft.autoSelectLocation,
          autoSelectCustomer: draft.autoSelectCustomer,
          autoSelectPriceList: draft.autoSelectPriceList,
        },
      }));
      queryClient.invalidateQueries({ queryKey: ['config', 'users'] });
      notifications.show({ color: 'green', message: 'User configuration saved' });
    },
    onError: (err: any) => {
      notifications.show({
        color: 'red',
        message: err?.response?.data?.message ?? err?.message ?? 'Failed to save configuration',
      });
    },
  });

  const userData = users.map((u) => ({ value: u.id, label: userLabel(u) }));
  const locationData = stockLocations.map((l) => ({
    value: l.id,
    label: l.code ? `${l.code} - ${l.name}` : l.name,
  }));
  const customerData = customers.map((c) => ({ value: c.id, label: c.name }));
  const priceListData = priceLists.map((p) => ({ value: p.id, label: p.name }));

  return (
    <Container size="lg" py="xl">
      <Stack gap="lg">
        <div>
          <Title order={2}>User Configuration</Title>
          <Text c="dimmed" size="sm">
            Select a user to view and update their POS and session configuration.
          </Text>
        </div>

        <Card withBorder radius="md" padding="lg">
          <Select
            label="User"
            placeholder={loadingUsers ? 'Loading users…' : 'Select a user'}
            data={userData}
            value={userId}
            onChange={setUserId}
            searchable
            clearable
            disabled={loadingUsers}
            nothingFoundMessage="No users found"
          />
        </Card>

        {!userId && (
          <Text c="dimmed" ta="center" py="xl">
            Select a user above to configure them.
          </Text>
        )}

        {userId && loadingConfig && (
          <Group justify="center" py="xl">
            <Loader />
          </Group>
        )}

        {userId && !loadingConfig && (
          <Card withBorder radius="md" padding="lg">
            <Stack>
              <Select
                label="Stock Location"
                placeholder="Select stock location"
                data={locationData}
                value={draft.stockLocationId}
                onChange={(value) => setDraft((d) => ({ ...d, stockLocationId: value }))}
                searchable
                clearable
                nothingFoundMessage="No locations found"
              />
              <TextInput
                label="Store ID"
                placeholder="default"
                value={draft.storeId}
                onChange={(e) => setDraft((d) => ({ ...d, storeId: e.currentTarget.value }))}
              />
              <Select
                label="Default Customer"
                placeholder="Select default customer"
                data={customerData}
                value={draft.defaultCustomerId}
                onChange={(value) => setDraft((d) => ({ ...d, defaultCustomerId: value }))}
                searchable
                clearable
                nothingFoundMessage="No customers found"
              />
              <Select
                label="Default Price List"
                placeholder="Select default price list"
                data={priceListData}
                value={draft.defaultPriceListId}
                onChange={(value) => setDraft((d) => ({ ...d, defaultPriceListId: value }))}
                searchable
                clearable
                nothingFoundMessage="No price lists found"
              />
              <NumberInput
                label="Login Timeout (minutes)"
                description="Per-user session length. Empty falls back to the system default."
                value={draft.loginTimeoutMinutes}
                onChange={(value) => setDraft((d) => ({ ...d, loginTimeoutMinutes: value }))}
                min={1}
                allowDecimal={false}
              />
              <Switch
                label="Allow POS"
                checked={draft.allowPos}
                onChange={(e) => setDraft((d) => ({ ...d, allowPos: e.currentTarget.checked }))}
              />
              <Switch
                label="Allow A4 Print (Wholesale)"
                checked={draft.allowA4Print}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, allowA4Print: e.currentTarget.checked }))
                }
              />
              <Switch
                label="Auto-select Stock Location"
                checked={draft.autoSelectLocation}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, autoSelectLocation: e.currentTarget.checked }))
                }
              />
              <Switch
                label="Auto-select Customer"
                checked={draft.autoSelectCustomer}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, autoSelectCustomer: e.currentTarget.checked }))
                }
              />
              <Switch
                label="Auto-select Price List"
                checked={draft.autoSelectPriceList}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, autoSelectPriceList: e.currentTarget.checked }))
                }
              />
              <Group justify="flex-end" mt="sm">
                <Button onClick={() => save.mutate()} loading={save.isPending}>
                  Save Configuration
                </Button>
              </Group>
            </Stack>
          </Card>
        )}
      </Stack>
    </Container>
  );
}
