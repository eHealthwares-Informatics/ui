import { Card, Text, Stack, Group, Grid, Button, TextInput, Select } from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import { Minus, Plus, Search } from 'lucide-react';
import { useState } from 'react';
import { Option } from '@/features/rxsoft/types';
import { rxsoftApi } from '@/lib/rxsoft-api';

type ItemLookup = {
  id: string;
  code: string;
  name: string;
};

type SimpleLookup = {
  id: string;
  code?: string | null;
  name: string;
};

export type PendingPriceListEntry = {
  itemId?: string;
  locationId?: string;
  priceList: Option;
  currencyCode: string;
  unitPrice: number;
  modified: '' | 'created' | 'edited' | 'deleted';
};

export type PendingStockEntry = {
  itemId?: string;
  locationId?: string;
  uomId?: string;
  quantity: string;
};

/* ----------------------------- LOOKUPS ----------------------------- */

function useLookups() {
  const priceLists = useQuery({
    queryKey: ['rxsoft-price-lists-lookup'],
    queryFn: async () => {
      const res = await rxsoftApi.get('/price-lists', {
        params: { page: 1, limit: 100 },
      });
      return (res.data.data ?? []) as SimpleLookup[];
    },
    staleTime: 30_000,
  });

  const locations = useQuery({
    queryKey: ['rxsoft-stock-locations-lookup'],
    queryFn: async () => {
      const res = await rxsoftApi.get('/stock-locations', {
        params: { page: 1, limit: 100 },
      });
      return (res.data.data ?? []) as SimpleLookup[];
    },
    staleTime: 30_000,
  });

  const uoms = useQuery({
    queryKey: ['rxsoft-uoms-lookup'],
    queryFn: async () => {
      const res = await rxsoftApi.get('/items/dependencies/uoms', {
        params: { page: 1, limit: 100 },
      });
      return (res.data.data ?? []) as SimpleLookup[];
    },
    staleTime: 30_000,
  });

  return {
    priceLists: priceLists.data ?? [],
    locations: locations.data ?? [],
    uoms: uoms.data ?? [],
  };
}

/* -------------------------- ITEM LOOKUP ------------------------- */

function ItemLookupInput({
  value,
  onChange,
}: {
  value?: string;
  onChange: (value?: string) => void;
}) {
  const [search, setSearch] = useState('');

  const items = useQuery({
    queryKey: ['rxsoft-item-lookup', search],
    queryFn: async () => {
      const res = await rxsoftApi.get('/items', {
        params: { page: 1, limit: 20, search },
      });
      return (res.data.data ?? []) as ItemLookup[];
    },
    enabled: search.trim().length >= 2,
    staleTime: 15_000,
  });

  return (
    <Stack gap="xs">
      <TextInput
        placeholder="Search item override..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        leftSection={<Search size={14} />}
      />

      <Select
        value={value ?? '__created__'}
        onChange={(val: any) => onChange(val === '__created__' ? null : val)}
        data={[
          { value: '__created__', label: 'Use created item' },
          ...(items.data ?? []).map((p) => ({
            value: p.id,
            label: `${p.name} (${p.code})`,
          })),
        ]}
      />
    </Stack>
  );
}

/* ---------------------- PRICE LIST UPDATER ------------------------- */

function usePriceListUpdater(
  priceListItems: PendingPriceListEntry[],
  onChange: (value: PendingPriceListEntry[]) => void
) {
  const updateEntry = (priceListId: string, patch: Partial<PendingPriceListEntry>) => {
    const exists = priceListItems.find((p) => p.priceList.value === priceListId);

    let updated: PendingPriceListEntry[];

    if (exists) {
      updated = priceListItems.map((item) =>
        item.priceList.value === priceListId
          ? {
              ...item,
              ...patch,
              modified: item.modified === 'created' ? 'created' : 'edited',
            }
          : item
      );
    } else {
      updated = [
        ...priceListItems,
        {
          priceList: {
            value: priceListId,
            label: priceListId,
          },
          currencyCode: 'NGN',
          unitPrice: 0,
          modified: 'created',
          ...patch,
        },
      ];
    }

    onChange(updated);
  };

  const removeEntry = (priceListId: string) => {
    const updated = priceListItems
      .map((item) =>
        item.priceList.value === priceListId
          ? {
              ...item,
              modified: item.modified === 'created' ? '' : 'deleted',
            }
          : item
      )
      .filter((item) => item.modified !== '');

    onChange(updated as any);
  };

  return { updateEntry, removeEntry };
}

/* ------------------- PRICE LIST SETUP UI -------------------------- */

export function ItemPriceListSetup({
  priceListItems,
  existigPriceLists,
  onChange,
}: {
  priceListItems?: PendingPriceListEntry[];
  existigPriceLists?: PendingPriceListEntry[];
  onChange: (value: PendingPriceListEntry[]) => void;
}) {
  const resolved = priceListItems ?? existigPriceLists ?? [];
  const { priceLists } = useLookups();
  const { updateEntry, removeEntry } = usePriceListUpdater(resolved, onChange);

  const [showAll, setShowAll] = useState(true);
  const [selected, setSelected] = useState('');

  const missing = priceLists.filter((pl) => !resolved.some((x) => x.priceList.value === pl.id));

  const handleAdd = () => {
    if (!selected) {
      return;
    }
    updateEntry(selected, {});
    setSelected('');
  };

  return (
    <Card withBorder p="md">
      <Stack gap="md">
        <Group justify="space-between">
          <div>
            <Text fw={600}>Price List Setup</Text>
            <Text size="sm" c="dimmed">
              Configure pricing per price list
            </Text>
          </div>

          <Button variant="light" onClick={() => setShowAll((s) => !s)}>
            {showAll ? 'Show Add Only' : 'Show All'}
          </Button>
        </Group>

        {showAll &&
          priceLists
            .filter((pl) => resolved.some((x) => x.priceList.value === pl.id))
            .map((pl) => {
              const item = resolved.find((x) => x.priceList.value === pl.id);

              if (!item || item.modified === 'deleted') {
                return null;
              }

              return (
                <Card key={pl.id} withBorder p="sm">
                  <Grid>
                    <Grid.Col span={4}>
                      <ItemLookupInput
                        value={item.itemId}
                        onChange={(v) => updateEntry(pl.id, { itemId: v })}
                      />
                    </Grid.Col>

                    <Grid.Col span={3}>
                      <TextInput label="Currency" value={item.currencyCode} disabled />
                    </Grid.Col>

                    <Grid.Col span={3}>
                      <TextInput
                        label="Unit Price"
                        type="number"
                        value={item.unitPrice}
                        onChange={(e) =>
                          updateEntry(pl.id, {
                            unitPrice: +e.target.value,
                          })
                        }
                      />
                    </Grid.Col>

                    <Grid.Col span={2}>
                      <Button color="red" variant="light" onClick={() => removeEntry(pl.id)}>
                        <Minus size={16} />
                      </Button>
                    </Grid.Col>
                  </Grid>
                </Card>
              );
            })}

        {missing.length > 0 && (
          <Group>
            <Select
              placeholder="Select price list"
              value={selected}
              onChange={(v) => setSelected(v ?? '')}
              data={missing.map((pl) => ({
                value: pl.id,
                label: pl.name,
              }))}
              style={{ flex: 1 }}
            />

            <Button onClick={handleAdd}>
              <Plus size={16} />
            </Button>
          </Group>
        )}
      </Stack>
    </Card>
  );
}

/* ------------------- STOCK SETUP UI -------------------------- */

export function ItemStockQuantitySetup({
  value,
  onChange,
}: {
  value: PendingStockEntry[];
  onChange: (value: PendingStockEntry[]) => void;
}) {
  const { locations, uoms } = useLookups();
  const entries = value.length ? value : [{ quantity: '' }];

  function update(index: number, patch: Partial<PendingStockEntry>) {
    onChange(entries.map((e, i) => (i === index ? { ...e, ...patch } : e)));
  }

  return (
    <Card withBorder p="md">
      <Stack gap="md">
        <Text fw={600}>Stock Quantity Setup</Text>

        {entries.map((entry, i) => (
          <Card key={i} withBorder p="sm">
            <Grid>
              <Grid.Col span={4}>
                <ItemLookupInput value={entry.itemId} onChange={(v) => update(i, { itemId: v })} />
              </Grid.Col>

              <Grid.Col span={3}>
                <Select
                  label="Location"
                  value={entry.locationId ?? ''}
                  onChange={(v) => update(i, { locationId: v ?? undefined })}
                  data={locations.map((l) => ({
                    value: l.id,
                    label: l.name,
                  }))}
                />
              </Grid.Col>

              <Grid.Col span={3}>
                <Select
                  label="UOM"
                  value={entry.uomId ?? ''}
                  onChange={(v) => update(i, { uomId: v ?? undefined })}
                  data={uoms.map((u) => ({
                    value: u.id,
                    label: u.name,
                  }))}
                />
              </Grid.Col>

              <Grid.Col span={2}>
                <TextInput
                  label="Qty"
                  value={entry.quantity}
                  onChange={(e) => update(i, { quantity: e.target.value })}
                />
              </Grid.Col>
            </Grid>
          </Card>
        ))}

        <Button variant="light" onClick={() => onChange([...entries, { quantity: '' }])}>
          <Plus size={16} />
          Add Entry
        </Button>
      </Stack>
    </Card>
  );
}
