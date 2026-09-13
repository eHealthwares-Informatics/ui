import { Drawer, Loader, NumberInput, Select, Stack, Switch, TextInput, useMantineColorScheme } from '@mantine/core';
import { useEffect, useRef, useCallback } from 'react';
import { useUserPosConfig, useUpdateUserPosConfig, useStockLocations, useCustomers, usePriceLists } from '../../api/posApi';

interface Props {
  opened: boolean;
  onClose: () => void;
}

export function PosSettingsDrawer({ opened, onClose }: Props) {
  const { toggleColorScheme } = useMantineColorScheme();
  const { data: config, isLoading } = useUserPosConfig();
  const updateConfig = useUpdateUserPosConfig();
  const { data: stockLocations = [] } = useStockLocations();
  const { data: customers = [] } = useCustomers('');
  const { data: priceLists = [] } = usePriceLists('');

  const stockInitialized = useRef(false);

  const locationData = (Array.isArray(stockLocations) ? stockLocations : []).map((l: any) => ({
    value: l.id,
    label: `${l.code ? `${l.code  } - ` : ''}${l.name}`,
  }));

  const customerData = (Array.isArray(customers) ? customers : []).map((c: any) => ({
    value: c.id,
    label: c.name,
  }));

  const priceListData = (Array.isArray(priceLists) ? priceLists : []).map((p: any) => ({
    value: p.id,
    label: p.name,
  }));

  useEffect(() => {
    if (opened) {stockInitialized.current = false;}
  }, [opened]);

  const handleStockLocationChange = useCallback((value: string | null) => {
    if (value === null && !stockInitialized.current) {
      stockInitialized.current = true;
      return;
    }
    updateConfig.mutate({ stockLocationId: value });
  }, [updateConfig]);

  if (isLoading) {
    return (
      <Drawer opened={opened} onClose={onClose} title="POS Settings" position="right">
        <Loader />
      </Drawer>
    );
  }

  return (
    <Drawer opened={opened} onClose={onClose} title="POS Settings" position="right">
      <Stack>
        <Switch label="Allow POS" checked={config?.allowPos ?? true} onChange={(e) => updateConfig.mutate({ allowPos: e.currentTarget.checked })} />

        <Switch label="Allow A4 Print (Wholesale)" checked={config?.allowA4Print ?? false} onChange={(e) => updateConfig.mutate({ allowA4Print: e.currentTarget.checked })} />

        <TextInput label="Store ID" placeholder="default" value={config?.storeId ?? ''} onChange={(e) => updateConfig.mutate({ storeId: e.currentTarget.value || null })} />

        <Select
          label="Stock Location"
          placeholder="Select stock location"
          value={config?.stockLocationId}
          data={locationData}
          clearable
          searchable
          nothingFoundMessage="No locations found"
          onChange={handleStockLocationChange}
        />

        <Select label="Default Customer" placeholder="Select default customer" value={config?.defaultCustomerId} data={customerData} clearable searchable nothingFoundMessage="No customers found" onChange={(value) => updateConfig.mutate({ defaultCustomerId: value })} />

        <Select label="Default Price List" placeholder="Select default price list" value={config?.defaultPriceListId} data={priceListData} clearable searchable nothingFoundMessage="No price lists found" onChange={(value) => updateConfig.mutate({ defaultPriceListId: value })} />

        <Switch label="Auto-select Stock Location" checked={config?.autoSelectLocation ?? true} onChange={(e) => updateConfig.mutate({ autoSelectLocation: e.currentTarget.checked })} />

        <Switch label="Auto-select Customer" checked={config?.autoSelectCustomer ?? true} onChange={(e) => updateConfig.mutate({ autoSelectCustomer: e.currentTarget.checked })} />

        <Switch label="Auto-select Price List" checked={config?.autoSelectPriceList ?? true} onChange={(e) => updateConfig.mutate({ autoSelectPriceList: e.currentTarget.checked })} />

        <NumberInput label="Login Timeout (minutes)" value={config?.loginTimeoutMinutes ?? 480} onChange={(v) => updateConfig.mutate({ loginTimeoutMinutes: v ? Number(v) : null })} min={1} max={1440} />

        <Switch label="Toggle Theme" onClick={() => toggleColorScheme()} />
      </Stack>
    </Drawer>
  );
}
