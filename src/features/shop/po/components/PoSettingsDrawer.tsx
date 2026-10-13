import { Button, Drawer, Select, Stack, Switch } from '@mantine/core';
import { useWarehouses } from '../api/poApi';
import { usePoStore } from '../store/usePoStore';

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
            if (v) {
              setDefaultWarehouse(v, opt.label);
            }
          }}
          searchable
          clearable
          data-testid="po-settings-default-warehouse"
        />
        <Switch
          label="Auto Print on Post"
          checked={autoPrint}
          onChange={(e) => setAutoPrint(e.currentTarget.checked)}
          data-testid="po-settings-auto-print"
        />
        <Switch
          label="Auto Generate Receipt #"
          checked={autoReceiptNumber}
          onChange={(e) => setAutoReceiptNumber(e.currentTarget.checked)}
          data-testid="po-settings-auto-receipt-number"
        />
        <Button onClick={() => setSettingsOpened(false)} data-testid="po-settings-save-btn">
          Save
        </Button>
      </Stack>
    </Drawer>
  );
}
