import {
  Button,
  Divider,
  Group,
  Loader,
  Popover,
  ScrollArea,
  Stack,
  Text,
  TextInput,
  UnstyledButton,
} from '@mantine/core';
import { Building2, ChevronsUpDown } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { identityApi } from '@/lib/identity-api';
import { useAuthStore } from '@/stores/auth-store';
import classes from './organisation-switcher.module.css';

type OrgOption = { id: string; name: string; code?: string };

/**
 * Organisation filter for the app header. Only shown to super admins.
 * The chosen organisation id is persisted in the auth store so every module
 * (e.g. Notification Delivery) can scope its data to the same tenant.
 *
 * The dropdown lists known organisations and ends with a free-text input so an
 * organisation id can be entered manually (e.g. when it is not in the list).
 */
export function OrganisationSwitcher() {
  const user = useAuthStore((state) => state.user);
  const selectedId = useAuthStore((state) => state.selectedOrganisationId);
  const setSelectedId = useAuthStore((state) => state.setSelectedOrganisationId);

  const [organizations, setOrganizations] = useState<OrgOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [opened, setOpened] = useState(false);
  const [manualId, setManualId] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setIsLoading(true);
      try {
        const response = await identityApi.get<{ data?: OrgOption[] } | OrgOption[]>(
          '/organizations',
          { params: { limit: 200 } }
        );
        const raw = response.data;
        const orgs = Array.isArray(raw) ? raw : (raw?.data ?? []);
        if (!cancelled) {
          setOrganizations(orgs as OrgOption[]);
        }
      } catch {
        // best effort — the dropdown will simply be empty
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const isSuperAdmin = user?.roles?.includes('super_admin') ?? false;

  const current = useMemo(
    () => organizations.find((org) => org.id === selectedId) ?? null,
    [organizations, selectedId]
  );

  if (!isSuperAdmin) {
    return null;
  }

  const select = (id: string | null | undefined) => {
    setSelectedId(id);
    setManualId('');
    setOpened(false);
  };

  const applyManualId = () => {
    const id = manualId.trim();
    if (!id) {
      return;
    }
    select(id);
  };

  return (
    <Popover
      opened={opened}
      onChange={setOpened}
      width={280}
      position="bottom-start"
      offset={6}
      withinPortal
      shadow="md"
    >
      <Popover.Target>
        <UnstyledButton
          className={classes.trigger}
          data-testid="header-organisation-trigger"
          aria-label="Switch organisation"
          onClick={() => setOpened((open) => !open)}
        >
          <Building2 className={classes.icon} size={16} />
          <span className={classes.text}>
            <span className={classes.label}>
              {current?.name ??
                (selectedId === null
                  ? 'Global organisations'
                  : typeof selectedId === 'string'
                    ? selectedId
                    : 'All organisations')}
            </span>
            <span className={classes.hint}>
              {current?.code
                ? current.code
                : selectedId === null
                  ? 'Global defaults only'
                  : typeof selectedId === 'string'
                    ? 'Manual organisation id'
                    : isLoading
                      ? 'Loading…'
                      : 'No organisation filter'}
            </span>
          </span>
          <ChevronsUpDown className={classes.chevron} size={14} />
        </UnstyledButton>
      </Popover.Target>

      <Popover.Dropdown p="xs">
        <Stack gap="xs">
          <Text size="xs" c="dimmed" fw={700}>
            Organisation
          </Text>

          <Stack gap={2}>
            <UnstyledButton
              className={classes.option}
              data-testid="header-organisation-option-all"
              onClick={() => select(undefined)}
            >
              <Text size="sm" fw={selectedId === undefined ? 700 : 500}>
                All organisations
              </Text>
              {selectedId === undefined ? <span className={classes.check}>✓</span> : null}
            </UnstyledButton>
            <UnstyledButton
              className={classes.option}
              data-testid="header-organisation-option-global"
              onClick={() => select(null)}
            >
              <Text size="sm" fw={selectedId === null ? 700 : 500}>
                Global organisations
              </Text>
              {selectedId === null ? <span className={classes.check}>✓</span> : null}
            </UnstyledButton>
          </Stack>

          {isLoading && organizations.length === 0 ? (
            <Group gap="xs" p="xs">
              <Loader size="xs" />
              <Text size="sm" c="dimmed">
                Loading organisations…
              </Text>
            </Group>
          ) : organizations.length === 0 ? (
            <Text size="sm" c="dimmed" p="xs">
              No organisations available
            </Text>
          ) : (
            <ScrollArea.Autosize mah={260}>
              <Stack gap={2}>
                {organizations.map((org) => {
                  const isActive = org.id === selectedId;
                  return (
                    <UnstyledButton
                      key={org.id}
                      className={`${classes.option} ${isActive ? classes.optionActive : ''}`}
                      data-testid={`header-organisation-option-${org.id}`}
                      onClick={() => select(org.id)}
                    >
                      <Text size="sm" fw={isActive ? 700 : 500} truncate>
                        {org.code ? `${org.code} - ${org.name}` : org.name}
                      </Text>
                      {isActive ? <span className={classes.check}>✓</span> : null}
                    </UnstyledButton>
                  );
                })}
              </Stack>
            </ScrollArea.Autosize>
          )}

          <Divider />

          <Text size="xs" c="dimmed">
            Or enter an organisation ID
          </Text>
          <Group gap="xs" wrap="nowrap" align="flex-end">
            <TextInput
              size="xs"
              placeholder="Organisation ID"
              value={manualId}
              onChange={(event) => setManualId(event.currentTarget.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  applyManualId();
                }
              }}
              style={{ flex: 1 }}
              data-testid="header-organisation-manual-input"
            />
            <Button
              size="xs"
              onClick={applyManualId}
              disabled={!manualId.trim()}
              data-testid="header-organisation-manual-use"
            >
              Use
            </Button>
          </Group>
        </Stack>
      </Popover.Dropdown>
    </Popover>
  );
}
