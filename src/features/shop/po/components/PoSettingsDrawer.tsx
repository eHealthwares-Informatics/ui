import { Button, Drawer, Select, Stack, Switch } from '@mantine/core';
import { usePoStore } from '../store/usePoStore';
import { useWarehouses } from '../api/poApi';

export function PoSettingsDrawer() {
  const {
    settingsOpened,
    setSettingsOpened,
    defaultWarehouseId,
    defaultWarehouseName,
    autoPrint,
    autoReceiptNumber,
    setDefaultWarehouse,
    setAutoPrint,
    setAutoReceiptNumber,
  } = usePoStore();

  const { data: warehouses = [] } = useWarehouses();

  const warehouseOpts = (Array.isArray(warehouses) ? warehouses : []).map((w: any) => ({
    value: w.id,
    label: w.name,
  }));

  return (
    <Drawer
      opened={settingsOpened}
      onClose={() => setSettingsOpened(false)}
      title="Purchase Order Settings"
      position="right"
      size="sm"
    >
      <Stack>
        <Select
          label="Default Warehouse"
          placeholder="Select default warehouse"
          data={warehouseOpts}
          value={defaultWarehouseId || null}
          onChange={(v, opt) => {
            if (v) {setDefaultWarehouse(v, opt.label);}
          }}
          searchable
          clearable
        />
        <Switch
          label="Auto Print on Post"
          checked={autoPrint}
          onChange={(e) => setAutoPrint(e.currentTarget.checked)}
        />
        <Switch
          label="Auto Generate Receipt #"
          checked={autoReceiptNumber}
          onChange={(e) => setAutoReceiptNumber(e.currentTarget.checked)}
        />
        <Button onClick={() => setSettingsOpened(false)}>Save</Button>
      </Stack>
    </Drawer>
  );
}
