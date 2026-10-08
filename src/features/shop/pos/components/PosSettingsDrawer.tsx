import {
  Alert,
  Anchor,
  Button,
  Code,
  Drawer,
  Group,
  Loader,
  NumberInput,
  Select,
  Stack,
  Switch,
  Text,
  TextInput,
  useMantineColorScheme,
} from '@mantine/core';
import { useEffect, useRef, useCallback, useState } from 'react';
import {
  useUserPosConfig,
  useUpdateUserPosConfig,
  useStockLocations,
  useCustomers,
  usePriceLists,
} from '../../api/posApi';
import {
  getPrintServerUrl,
  setPrintServerUrl as persistPrintServerUrl,
  parseCandidates,
  discoverPrintServers,
  printTestPage,
  type DiscoveredAgent,
} from '../utils/printServer';

interface Props {
  opened: boolean;
  onClose: () => void;
}

type FindState =
  | { status: 'idle' }
  | { status: 'scanning' }
  | { status: 'found'; agents: DiscoveredAgent[] }
  | { status: 'error'; message: string };

type TestPrintState =
  | { status: 'idle' }
  | { status: 'printing' }
  | { status: 'success'; message: string }
  | { status: 'failure'; message: string };

export function PosSettingsDrawer({ opened, onClose }: Props) {
  const { toggleColorScheme } = useMantineColorScheme();
  const { data: config, isLoading } = useUserPosConfig();
  const updateConfig = useUpdateUserPosConfig();
  const { data: stockLocations = [] } = useStockLocations();
  const { data: customers = [] } = useCustomers('');
  const { data: priceLists = [] } = usePriceLists('');

  const stockInitialized = useRef(false);

  const [printServerUrl, setPrintServerUrlState] = useState(getPrintServerUrl());
  const [candidates, setCandidates] = useState('');
  const [findState, setFindState] = useState<FindState>({ status: 'idle' });
  const [testPrint, setTestPrint] = useState<TestPrintState>({ status: 'idle' });

  useEffect(() => {
    if (opened) {
      setPrintServerUrlState(getPrintServerUrl());
      setFindState({ status: 'idle' });
      setTestPrint({ status: 'idle' });
    }
  }, [opened]);

  const locationData = (Array.isArray(stockLocations) ? stockLocations : []).map((l: any) => ({
    value: l.id,
    label: `${l.code ? `${l.code} - ` : ''}${l.name}`,
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
    if (opened) {
      stockInitialized.current = false;
    }
  }, [opened]);

  const handleStockLocationChange = useCallback(
    (value: string | null) => {
      if (value === null && !stockInitialized.current) {
        stockInitialized.current = true;
        return;
      }
      updateConfig.mutate({ stockLocationId: value });
    },
    [updateConfig]
  );

  const handleSavePrintServerUrl = useCallback(() => {
    const saved = persistPrintServerUrl(printServerUrl);
    setPrintServerUrlState(saved);
    setTestPrint({ status: 'idle' });
  }, [printServerUrl]);

  const handleFind = useCallback(async () => {
    const targets = candidates.trim()
      ? parseCandidates(candidates)
      : [printServerUrl];
    if (targets.length === 0) {
      setFindState({ status: 'error', message: 'Enter at least one IP address to search.' });
      return;
    }
    setFindState({ status: 'scanning' });
    const agents = await discoverPrintServers(targets);
    setFindState(
      agents.length > 0
        ? { status: 'found', agents }
        : { status: 'error', message: `No print-agent found on ${targets.length} address(es).` }
    );
  }, [candidates, printServerUrl]);

  const handleUseAgent = useCallback((url: string) => {
    const saved = persistPrintServerUrl(url);
    setPrintServerUrlState(saved);
  }, []);

  const handleTestPrint = useCallback(async () => {
    setTestPrint({ status: 'printing' });
    const result = await printTestPage(printServerUrl);
    setTestPrint(
      result.ok
        ? { status: 'success', message: result.message }
        : { status: 'failure', message: result.message }
    );
  }, [printServerUrl]);

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
        <Switch
          label="Allow POS"
          checked={config?.allowPos ?? true}
          onChange={(e) => updateConfig.mutate({ allowPos: e.currentTarget.checked })}
        />

        <Switch
          label="Allow A4 Print (Wholesale)"
          checked={config?.allowA4Print ?? false}
          onChange={(e) => updateConfig.mutate({ allowA4Print: e.currentTarget.checked })}
        />

        <TextInput
          label="Store ID"
          placeholder="default"
          value={config?.storeId ?? ''}
          onChange={(e) => updateConfig.mutate({ storeId: e.currentTarget.value || null })}
        />

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

        <Select
          label="Default Customer"
          placeholder="Select default customer"
          value={config?.defaultCustomerId}
          data={customerData}
          clearable
          searchable
          nothingFoundMessage="No customers found"
          onChange={(value) => updateConfig.mutate({ defaultCustomerId: value })}
        />

        <Select
          label="Default Price List"
          placeholder="Select default price list"
          value={config?.defaultPriceListId}
          data={priceListData}
          clearable
          searchable
          nothingFoundMessage="No price lists found"
          onChange={(value) => updateConfig.mutate({ defaultPriceListId: value })}
        />

        <Switch
          label="Auto-select Stock Location"
          checked={config?.autoSelectLocation ?? true}
          onChange={(e) => updateConfig.mutate({ autoSelectLocation: e.currentTarget.checked })}
        />

        <Switch
          label="Auto-select Customer"
          checked={config?.autoSelectCustomer ?? true}
          onChange={(e) => updateConfig.mutate({ autoSelectCustomer: e.currentTarget.checked })}
        />

        <Switch
          label="Auto-select Price List"
          checked={config?.autoSelectPriceList ?? true}
          onChange={(e) => updateConfig.mutate({ autoSelectPriceList: e.currentTarget.checked })}
        />

        <NumberInput
          label="Login Timeout (minutes)"
          value={config?.loginTimeoutMinutes ?? 480}
          onChange={(v) => updateConfig.mutate({ loginTimeoutMinutes: v ? Number(v) : null })}
          min={1}
          max={1440}
        />

        <Switch label="Toggle Theme" onClick={() => toggleColorScheme()} />

        {/* ── Print Server ─────────────────────────────────────────── */}
        <Text fw={600} mt="md">
          Print Server
        </Text>

        <TextInput
          data-testid="pos-settings-print-server-url"
          label="Print Server URL"
          placeholder="http://localhost:8094"
          value={printServerUrl}
          onChange={(e) => setPrintServerUrlState(e.currentTarget.value)}
        />
        <Button
          data-testid="pos-settings-print-server-save"
          variant="light"
          onClick={handleSavePrintServerUrl}
        >
          Save print server URL
        </Button>

        <TextInput
          data-testid="pos-settings-print-server-candidates"
          label="Find print servers"
          description="IPs or ranges to probe, e.g. 192.168.1.10-12, localhost"
          placeholder="192.168.1.10-12"
          value={candidates}
          onChange={(e) => setCandidates(e.currentTarget.value)}
        />
        <Button
          data-testid="pos-settings-print-server-find"
          variant="light"
          onClick={handleFind}
          disabled={findState.status === 'scanning'}
        >
          {findState.status === 'scanning' ? 'Searching…' : 'Find print servers'}
        </Button>

        {findState.status === 'scanning' && (
          <Group gap="xs">
            <Loader size="xs" />
            <Text size="sm" c="dimmed">
              Probing addresses…
            </Text>
          </Group>
        )}

        {findState.status === 'error' && (
          <Alert color="red" data-testid="pos-settings-print-server-find-error">
            {findState.message}
          </Alert>
        )}

        {findState.status === 'found' && (
          <Stack gap="xs" data-testid="pos-settings-print-server-results">
            <Text size="sm" c="dimmed">
              {findState.agents.length} print server(s) found
            </Text>
            {findState.agents.map((agent) => (
              <Group key={agent.url} justify="space-between" wrap="nowrap">
                <div>
                  <Text size="sm" fw={500}>
                    {agent.info.hostname || agent.info.ips?.[0] || agent.url}
                  </Text>
                  <Text size="xs" c="dimmed">
                    {agent.url} · {agent.info.printer} · {agent.info.width} col
                  </Text>
                </div>
                <Button
                  size="xs"
                  variant="light"
                  data-testid={`pos-settings-print-server-use-${agent.url}`}
                  onClick={() => handleUseAgent(agent.url)}
                >
                  Use
                </Button>
              </Group>
            ))}
          </Stack>
        )}

        <Button
          data-testid="pos-settings-print-test"
          onClick={handleTestPrint}
          disabled={testPrint.status === 'printing'}
        >
          {testPrint.status === 'printing' ? 'Printing…' : 'Print test page'}
        </Button>

        {testPrint.status === 'success' && (
          <Alert
            color="green"
            data-testid="pos-settings-print-test-success"
          >
            {testPrint.message}
          </Alert>
        )}
        {testPrint.status === 'failure' && (
          <Alert color="red" data-testid="pos-settings-print-test-failure">
            {testPrint.message}
          </Alert>
        )}

        <Text size="sm" c="dimmed">
          Active: <Code>{printServerUrl}</Code>
        </Text>

        <Anchor
          href="https://drive.google.com/file/d/1xNb5oHOPX7JGA12z5OwlL_HzPo4inIsJ/view"
          target="_blank"
          rel="noopener noreferrer"
        >
          Download Print Server
        </Anchor>
      </Stack>
    </Drawer>
  );
}
