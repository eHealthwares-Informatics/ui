import { Card, Text, Stack, Grid, Button, TextInput, Group, Table, Modal, Select, NumberInput, Badge, Combobox, InputBase, useCombobox, Pagination, ActionIcon } from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { notifications } from '@mantine/notifications';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, Download, Eye, Scale, Search } from 'lucide-react';
import { rxsoftApi, downloadBlob } from '@/lib/rxsoft-api';
import { DataPageShell } from '../../../components/page/data-page-shell';
import { RxPage } from '../../../components/page/rx-page';
import { UserPopover } from '../../../components/popover/user-popover';
import { StockMatrix } from './components/stock-matrix';
import { stockBalancesConfig } from './schema';
import { uomToBaseQuantity, type UomFactorInfo } from './utils';

function TransferModal({
  opened,
  onClose,
  balance,
}: {
  opened: boolean;
  onClose: () => void;
  balance: any | null;
}) {
  const qc = useQueryClient();
  const [toLocationId, setToLocationId] = useState<string | null>(null);
  const [quantity, setQuantity] = useState<number>(0);
  const [uomId, setUomId] = useState<string | null>(null);

  const { data: locations = [] } = useQuery({
    queryKey: ['stock-locations', 'all'],
    queryFn: async () => {
      const { data } = await rxsoftApi.get('/stock-locations', { params: { limit: 200 } });
      return data?.data ?? data ?? [];
    },
  });

  const { data: itemDetail } = useQuery({
    queryKey: ['item', balance?.itemId],
    enabled: opened && !!balance?.itemId,
    queryFn: async () => {
      const { data } = await rxsoftApi.get(`/items/${String(balance.itemId)}`);
      return (Array.isArray((data as any)?.data) ? undefined : (data as any)?.data) ?? data;
    },
  });

  // Base, Purchase and Sale UOMs of the item (person-deduplicated), defaulting
  // the transfer UOM to the base UOM on each open.
  const uomOptions = useMemo(() => {
    const list: Array<UomFactorInfo & { id: string }> = [
      itemDetail?.baseUom,
      itemDetail?.purchaseUom,
      itemDetail?.saleUom,
    ].filter((u) => u && u.id);
    const byId = new Map<string, UomFactorInfo & { id: string }>();
    for (const u of list) {
      byId.set(u.id, u);
    }
    return Array.from(byId.values());
  }, [itemDetail]);

  useEffect(() => {
    if (balance?.itemId) {
      setToLocationId(null);
      setQuantity(0);
      setUomId(itemDetail?.baseUom?.id ?? null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [balance?.itemId, itemDetail?.baseUom?.id]);

  const selectedUom = uomOptions.find((u) => u.id === uomId) ?? itemDetail?.baseUom ?? null;
  const baseUom = itemDetail?.baseUom ?? null;

  const availableBase = Number(balance?.quantityOnHand ?? 0) - Number(balance?.quantityReserved ?? 0);
  const baseQuantity = uomToBaseQuantity(quantity, selectedUom, baseUom);

  const transferMutation = useMutation({
    mutationFn: async () => {
      await rxsoftApi.post('/inventory/transfers', {
        fromLocationId: balance?.locationId,
        toLocationId,
        itemId: balance?.itemId,
        quantity,
        uomId: selectedUom?.id ?? baseUom?.id ?? undefined,
        reason: 'manual_transfer',
      });
    },
    onSuccess: () => {
      notifications.show({ message: 'Stock transferred successfully.', color: 'green' });
      qc.invalidateQueries({ queryKey: ['rxsoft-data-page'] });
      qc.invalidateQueries({ queryKey: ['stock-movements'] });
      onClose();
    },
    onError: () => {
      notifications.show({ message: 'Transfer failed.', color: 'red' });
    },
  });

  return (
    <Modal opened={opened} onClose={onClose} title="Transfer Stock" centered>
      <Stack>
        <Text size="sm">
          From: <Badge>{balance?.location?.name as string ?? balance?.locationId as string}</Badge>
        </Text>
        <Text size="sm">
          Item: <Badge>{balance?.item?.name as string ?? balance?.itemId as string}</Badge>
        </Text>
        <Text size="sm">
          Available: <Badge color="blue">{availableBase}</Badge>
          {baseUom?.name && <span> {baseUom.name}</span>}
        </Text>

        <Select
          label="Destination Location"
          value={toLocationId}
          onChange={setToLocationId}
          data={(Array.isArray(locations) ? locations : [])
            .filter((l: any) => l.id !== balance?.locationId)
            .map((l: any) => ({ value: l.id, label: l.name }))}
          searchable
          required
        />

        <Select
          label="UOM"
          value={selectedUom?.id ?? null}
          onChange={(v) => setUomId(v)}
          data={uomOptions.map((u) => ({
            value: u.id,
            label: u.name ?? u.code ?? u.id,
          }))}
          required
        />

        <NumberInput
          label="Quantity"
          value={quantity}
          onChange={(v) => setQuantity(Number(v) || 0)}
          min={0.001}
          description={selectedUom?.name ? `Equals ${baseQuantity} ${baseUom?.name ?? 'base units'}` : undefined}
          required
        />

        <Group justify="flex-end">
          <Button variant="light" onClick={onClose}>Cancel</Button>
          <Button
            onClick={() => transferMutation.mutate()}
            loading={transferMutation.isPending}
            disabled={!toLocationId || quantity <= 0 || baseQuantity > availableBase}
          >
            Transfer
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}

function AdjustModal({
  opened,
  onClose,
  balance,
}: {
  opened: boolean;
  onClose: () => void;
  balance: any | null;
}) {
  const qc = useQueryClient();
  const [deltaQuantity, setDeltaQuantity] = useState<number>(0);
  const [reason, setReason] = useState('');

  const adjustmentMutation = useMutation({
    mutationFn: async () => {
      await rxsoftApi.post('/inventory/adjustments', {
        stockBalanceId: balance?.id,
        deltaQuantity,
        reason,
      });
    },
    onSuccess: () => {
      notifications.show({ message: 'Adjustment posted successfully.', color: 'green' });
      qc.invalidateQueries({ queryKey: ['rxsoft-data-page'] });
      qc.invalidateQueries({ queryKey: ['stock-movements'] });
      onClose();
      setDeltaQuantity(0);
      setReason('');
    },
    onError: () => {
      notifications.show({ message: 'Adjustment failed.', color: 'red' });
    },
  });

  return (
    <Modal opened={opened} onClose={onClose} title="Stock Adjustment" centered>
      <Stack>
        <Text size="sm">
          Item: <Badge>{balance?.item?.name as string ?? balance?.itemId as string}</Badge>
        </Text>
        <Text size="sm">
          Location: <Badge>{balance?.location?.name as string ?? balance?.locationId as string}</Badge>
        </Text>
        <Text size="sm">
          Current On Hand: <Badge color="blue">{Number(balance?.quantityOnHand ?? 0)}</Badge>
        </Text>

        <NumberInput
          label="Delta Quantity"
          value={deltaQuantity}
          onChange={(v) => setDeltaQuantity(Number(v) || 0)}
          description="Positive to increase, negative to decrease"
          required
        />

        <TextInput
          label="Reason"
          value={reason}
          onChange={(e) => setReason(e.currentTarget.value)}
          required
        />

        <Group justify="flex-end">
          <Button variant="light" onClick={onClose}>Cancel</Button>
          <Button
            onClick={() => adjustmentMutation.mutate()}
            loading={adjustmentMutation.isPending}
            disabled={deltaQuantity === 0 || !reason}
          >
            Post Adjustment
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}

export function RxInventoryPage() {
  const [selectedBalanceId, setSelectedBalanceId] = useState<string | null>(null);
  const [selectedBalanceLabel, setSelectedBalanceLabel] = useState('');
  const [deltaQuantity, setDeltaQuantity] = useState('');
  const [reason, setReason] = useState('');
  const [balanceSearch, setBalanceSearch] = useState('');

  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [selectedBalance, setSelectedBalance] = useState<Record<string, unknown> | null>(null);

  const [adjustModalOpen, setAdjustModalOpen] = useState(false);
  const [selectedAdjustBalance, setSelectedAdjustBalance] = useState<Record<string, unknown> | null>(null);

  const balancesConfig = useMemo(() => ({
    ...stockBalancesConfig,
    columns: [
      ...stockBalancesConfig.columns,
      {
        key: 'actions',
        label: '',
        render: (row: any) => (
          <Group gap="xs">
            <ActionIcon
              variant="light"
              title="View Movements"
              onClick={() => {
                setMovementItemId(row.itemId ?? row.item?.id ?? null);
                setMovementLocationId(row.locationId ?? row.location?.id ?? null);
              }}
            >
              <Eye size={16} />
            </ActionIcon>
            <ActionIcon
              variant="light"
              title="Transfer"
              onClick={() => {
                setSelectedBalance(row);
                setTransferModalOpen(true);
              }}
            >
              <ArrowRight size={16} />
            </ActionIcon>
            <ActionIcon
              variant="light"
              title="Adjust"
              onClick={() => {
                setSelectedAdjustBalance(row);
                setAdjustModalOpen(true);
              }}
            >
              <Scale size={16} />
            </ActionIcon>
          </Group>
        ),
      },
    ],
  }), []);

  const balanceCombobox = useCombobox();
  const qc = useQueryClient();

  const [movementItemId, setMovementItemId] = useState<string | null>(null);
  const [movementLocationId, setMovementLocationId] = useState<string | null>(null);
  const [movementTypeFilter, setMovementTypeFilter] = useState<string | null>(null);
  const [fromDate, setFromDate] = useState<string | null>(null);
  const [toDate, setToDate] = useState<string | null>(null);
  const [movementPage, setMovementPage] = useState(1);
  const MOVEMENT_LIMIT = 20;

  const { data: locations = [] } = useQuery({
    queryKey: ['stock-locations', 'all'],
    queryFn: async () => {
      const { data } = await rxsoftApi.get('/stock-locations', { params: { limit: 200 } });
      return data?.data ?? data ?? [];
    },
  });

  const { data: movementItems = [] } = useQuery({
    queryKey: ['stock-movement-items', 'all'],
    queryFn: async () => {
      const { data } = await rxsoftApi.get('/items', { params: { limit: 200 } });
      return (data?.data ?? data ?? []).map((i: any) => ({ value: i.id, label: i.name }));
    },
  });

  const movementQueryKey = ['stock-movements', movementItemId, movementLocationId, movementTypeFilter, fromDate, toDate, movementPage] as const;

  const {
    data: movementsResponse,
    isFetching: movementsLoading,
  } = useQuery({
    queryKey: movementQueryKey,
    queryFn: async () => {
      const params: Record<string, unknown> = { page: movementPage, limit: MOVEMENT_LIMIT };
      if (movementItemId) {params.itemId = movementItemId;}
      if (movementLocationId) {params.locationId = movementLocationId;}
      if (movementTypeFilter) {params.movementType = movementTypeFilter;}
      if (fromDate) {params.fromDate = fromDate;}
      if (toDate) {params.toDate = toDate;}
      const { data } = await rxsoftApi.get('/inventory/stock-movements', { params });
      return data;
    },
  });

  const movementData = Array.isArray(movementsResponse?.data) ? movementsResponse.data : [];
  const totalMovements = movementsResponse?.meta?.total ?? 0;
  const totalMovementPages = Math.max(1, Math.ceil(totalMovements / MOVEMENT_LIMIT));

  const handleExport = async () => {
    try {
      const params: Record<string, string> = {};
      if (movementItemId) {params.itemId = movementItemId;}
      if (movementLocationId) {params.locationId = movementLocationId;}
      if (movementTypeFilter) {params.movementType = movementTypeFilter;}
      if (fromDate) {params.fromDate = fromDate;}
      if (toDate) {params.toDate = toDate;}
      params.limit = '10000';

      await downloadBlob(
        { method: 'GET', url: '/inventory/stock-movements/export', params },
        'stock_movements.csv',
      );
      notifications.show({ message: 'Stock movements exported.', color: 'green' });
    } catch {
      notifications.show({ color: 'red', message: 'Failed to export stock movements.' });
    }
  };

  const { data: balanceOptions = [] } = useQuery({
    queryKey: ['stock-balances', 'search', balanceSearch],
    queryFn: async () => {
      const params: Record<string, unknown> = { limit: 30 };
      if (balanceSearch) {params.search = balanceSearch;}
      const { data } = await rxsoftApi.get('/inventory/stock-balances', { params });
      const items = (data?.data ?? []) as Record<string, any>[];
      return items.map((b: any) => ({
        value: b.id,
        label: `${b.item?.name ?? b.itemId} @ ${b.location?.name ?? b.locationId}`,
        balance: b,
      }));
    },
    enabled: balanceCombobox.dropdownOpened,
  });

  const adjustmentMutation = useMutation({
    mutationFn: async () => {
      await rxsoftApi.post('/inventory/adjustments', {
        stockBalanceId: selectedBalanceId,
        deltaQuantity: Number(deltaQuantity),
        reason,
      });
    },
    onSuccess: () => {
      notifications.show({ message: 'Adjustment posted successfully.', color: 'green' });
      qc.invalidateQueries({ queryKey: ['rxsoft-data-page'] });
      setSelectedBalanceId(null);
      setSelectedBalanceLabel('');
      setDeltaQuantity('');
      setReason('');
    },
    onError: () => {
      notifications.show({ message: 'Failed to post adjustment.', color: 'red' });
    },
  });

  return (
    <RxPage
      title="Inventory"
      description="Stock balances, movement history, and manual adjustments."
    >
      <Stack gap="xl">
        {/* STOCK MATRIX */}
        <StockMatrix />

        {/* STOCK BALANCES */}
        <Card withBorder p="md">
          <Stack gap="sm">
            <Text fw={600}>Stock Balances</Text>
            <DataPageShell config={balancesConfig} embedded />
          </Stack>
        </Card>

        <TransferModal
          opened={transferModalOpen}
          onClose={() => {
            setTransferModalOpen(false);
            setSelectedBalance(null);
          }}
          balance={selectedBalance}
        />

        <AdjustModal
          opened={adjustModalOpen}
          onClose={() => {
            setAdjustModalOpen(false);
            setSelectedAdjustBalance(null);
          }}
          balance={selectedAdjustBalance}
        />

        {/* STOCK MOVEMENTS */}
        <Card withBorder p="md">
          <Stack gap="sm">
            <Group justify="space-between">
              <Text fw={600}>Stock Movements</Text>
              <Button
                variant="subtle"
                leftSection={<Download size={14} />}
                onClick={handleExport}
                loading={movementsLoading}
              >
                Export
              </Button>
            </Group>

            <Grid>
              <Grid.Col span={{ base: 12, md: 3 }}>
                <Select
                  label="Product"
                  placeholder="All products"
                  value={movementItemId}
                  onChange={(v) => { setMovementItemId(v); setMovementPage(1); }}
                  data={movementItems}
                  searchable
                  clearable
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, md: 3 }}>
                <Select
                  label="Location"
                  placeholder="All locations"
                  value={movementLocationId}
                  onChange={(v) => { setMovementLocationId(v); setMovementPage(1); }}
                  data={(Array.isArray(locations) ? locations : []).map((l: any) => ({
                    value: l.id,
                    label: l.name,
                  }))}
                  searchable
                  clearable
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, md: 3 }}>
                <Select
                  label="Type"
                  placeholder="All types"
                  value={movementTypeFilter}
                  onChange={(v) => { setMovementTypeFilter(v); setMovementPage(1); }}
                  data={[
                    { value: 'in', label: 'In' },
                    { value: 'out', label: 'Out' },
                    { value: 'transfer', label: 'Transfer' },
                    { value: 'adjustment', label: 'Adjustment' },
                    { value: 'base-conversion', label: 'Base Conversion' },
                  ]}
                  clearable
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, md: 3 }}>
                <Group gap="xs" align="end">
                  <DatePickerInput
                    label="From"
                    placeholder="Start date"
                    value={fromDate}
                    onChange={(v) => { setFromDate(v); setMovementPage(1); }}
                    clearable
                    style={{ flex: 1 }}
                  />
                  <DatePickerInput
                    label="To"
                    placeholder="End date"
                    value={toDate}
                    onChange={(v) => { setToDate(v); setMovementPage(1); }}
                    clearable
                    style={{ flex: 1 }}
                  />
                </Group>
              </Grid.Col>
            </Grid>

            {movementsLoading ? (
              <Text c="dimmed" size="sm">Loading movements...</Text>
            ) : movementData.length === 0 ? (
              <Text c="dimmed" size="sm">No stock movements found.</Text>
            ) : (
              <>
                <Table striped withTableBorder withColumnBorders>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Item</Table.Th>
                      <Table.Th>Location</Table.Th>
                      <Table.Th>Type</Table.Th>
                      <Table.Th>Quantity</Table.Th>
                      <Table.Th>User</Table.Th>
                      <Table.Th>Date</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {movementData.map((m: any) => {
                      const from = m.fromLocation?.name ?? m.fromLocationId;
                      const to = m.toLocation?.name ?? m.toLocationId;
                      const locationLabel = from && to ? `${from} → ${to}` : (from ?? to ?? '-');
                      return (
                        <Table.Tr key={m.id}>
                          <Table.Td>{m.item?.name ?? m.itemId}</Table.Td>
                          <Table.Td>{locationLabel}</Table.Td>
                          <Table.Td>
                            <Badge
                              color={
                                m.movementType === 'in'
                                  ? 'green'
                                  : m.movementType === 'out'
                                    ? 'red'
                                    : m.movementType === 'transfer'
                                      ? 'blue'
                                      : m.movementType === 'base-conversion'
                                        ? 'violet'
                                        : 'yellow'
                              }
                              variant="light"
                            >
                              {m.movementType}
                            </Badge>
                          </Table.Td>
                          <Table.Td>{m.quantity}</Table.Td>
                          <Table.Td><UserPopover userId={m.createdByUserId} fallback="-" /></Table.Td>
                          <Table.Td>
                            {m.occurredAt ? new Date(m.occurredAt).toLocaleDateString() : '-'}
                          </Table.Td>
                        </Table.Tr>
                      );
                    })}
                  </Table.Tbody>
                </Table>

                <Group justify="space-between">
                  <Text size="sm" c="dimmed">
                    Showing {(movementPage - 1) * MOVEMENT_LIMIT + 1}–
                    {Math.min(movementPage * MOVEMENT_LIMIT, totalMovements)} of {totalMovements}
                  </Text>
                  <Pagination
                    total={totalMovementPages}
                    value={movementPage}
                    onChange={setMovementPage}
                  />
                </Group>
              </>
            )}
          </Stack>
        </Card>

        {/* ADJUSTMENT FORM */}
        <Card withBorder p="md">
          <Stack gap="sm">
            <Text fw={600}>New Stock Adjustment</Text>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                adjustmentMutation.mutate();
              }}
            >
              <Grid>
                <Grid.Col span={{ base: 12, md: 4 }}>
                  <Combobox
                    store={balanceCombobox}
                    onOptionSubmit={(val) => {
                      const option = balanceOptions.find((o) => o.value === val);
                      setSelectedBalanceId(val);
                      setSelectedBalanceLabel(option?.label ?? val);
                      balanceCombobox.closeDropdown();
                    }}
                  >
                    <Combobox.Target>
                      <InputBase
                        label="Stock Balance"
                        value={selectedBalanceLabel || balanceSearch}
                        placeholder="Search stock balance..."
                        onChange={(e) => {
                          setBalanceSearch(e.currentTarget.value);
                          setSelectedBalanceLabel('');
                          setSelectedBalanceId(null);
                          balanceCombobox.openDropdown();
                        }}
                        onClick={() => balanceCombobox.openDropdown()}
                        onFocus={() => balanceCombobox.openDropdown()}
                        rightSection={<Search size={14} />}
                        required
                      />
                    </Combobox.Target>
                    <Combobox.Dropdown>
                      <Combobox.Options>
                        {balanceOptions.length === 0 ? (
                          <Combobox.Empty>No results</Combobox.Empty>
                        ) : (
                          balanceOptions.map((opt) => (
                            <Combobox.Option key={opt.value} value={opt.value}>
                              {opt.label}
                            </Combobox.Option>
                          ))
                        )}
                      </Combobox.Options>
                    </Combobox.Dropdown>
                  </Combobox>
                </Grid.Col>

                <Grid.Col span={{ base: 12, md: 4 }}>
                  <TextInput
                    label="Delta Quantity"
                    type="number"
                    value={deltaQuantity}
                    onChange={(e) => setDeltaQuantity(e.currentTarget.value)}
                    required
                  />
                </Grid.Col>

                <Grid.Col span={{ base: 12, md: 4 }}>
                  <TextInput
                    label="Reason"
                    value={reason}
                    onChange={(e) => setReason(e.currentTarget.value)}
                    required
                  />
                </Grid.Col>

                <Grid.Col span={12}>
                  <Group justify="flex-end">
                    <Button type="submit" loading={adjustmentMutation.isPending} disabled={!selectedBalanceId}>
                      Post Adjustment
                    </Button>
                  </Group>
                </Grid.Col>
              </Grid>
            </form>
          </Stack>
        </Card>
      </Stack>
    </RxPage>
  );
}
