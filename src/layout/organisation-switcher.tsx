import { Loader, Menu, ScrollArea, Text, UnstyledButton } from '@mantine/core';
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
 */
export function OrganisationSwitcher() {
  const user = useAuthStore((state) => state.user);
  const selectedId = useAuthStore((state) => state.selectedOrganisationId);
  const setSelectedId = useAuthStore((state) => state.setSelectedOrganisationId);

  const [organizations, setOrganizations] = useState<OrgOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setIsLoading(true);
      try {
        const response = await identityApi.get<{ data?: OrgOption[] } | OrgOption[]>(
          '/organizations',
          { params: { limit: 200 } },
        );
        const raw = response.data;
        const orgs = Array.isArray(raw) ? raw : (raw?.data ?? []);
        if (!cancelled) {
          setOrganizations(orgs as OrgOption[]);
        }
      } catch {
        // best effort — the dropdown will simply be empty
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const isSuperAdmin = user?.roles?.includes('super_admin') ?? false;
  if (!isSuperAdmin) return null;

  const current = useMemo(
    () => organizations.find((org) => org.id === selectedId) ?? null,
    [organizations, selectedId],
  );

  return (
    <Menu width={260} position="bottom-start" offset={6} withinPortal>
      <Menu.Target>
        <UnstyledButton
          className={classes.trigger}
          data-testid="header-organisation-trigger"
          aria-label="Switch organisation"
        >
          <Building2 className={classes.icon} size={16} />
          <span className={classes.text}>
            <span className={classes.label}>
              {current?.name ?? 'Organisation'}
            </span>
            <span className={classes.hint}>
              {current?.code ? current.code : isLoading ? 'Loading…' : 'All organisations'}
            </span>
          </span>
          <ChevronsUpDown className={classes.chevron} size={14} />
        </UnstyledButton>
      </Menu.Target>

      <Menu.Dropdown>
        <Menu.Label>Organisation</Menu.Label>

        {isLoading && organizations.length === 0 ? (
          <Menu.Item leftSection={<Loader size="xs" />} disabled>
            Loading organisations…
          </Menu.Item>
        ) : organizations.length === 0 ? (
          <Menu.Item disabled>No organisations available</Menu.Item>
        ) : (
          <ScrollArea.Autosize mah={280}>
            <Menu.Item
              data-testid="header-organisation-option-global"
              onClick={() => setSelectedId(null)}
              rightSection={!selectedId ? <span className={classes.check}>✓</span> : null}
            >
              <Text size="sm" fw={!selectedId ? 700 : 500}>All organisations</Text>
            </Menu.Item>
            {organizations.map((org) => {
              const isActive = org.id === selectedId;
              return (
                <Menu.Item
                  key={org.id}
                  data-testid={`header-organisation-option-${org.id}`}
                  onClick={() => setSelectedId(org.id)}
                  rightSection={isActive ? <span className={classes.check}>✓</span> : null}
                >
                  <Text size="sm" fw={isActive ? 700 : 500}>
                    {org.code ? `${org.code} - ${org.name}` : org.name}
                  </Text>
                </Menu.Item>
              );
            })}
          </ScrollArea.Autosize>
        )}
      </Menu.Dropdown>
    </Menu>
  );
}
