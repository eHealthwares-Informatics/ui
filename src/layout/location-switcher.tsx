import { Loader, Menu, ScrollArea, Text, UnstyledButton } from '@mantine/core';
import { Check, ChevronsUpDown, MapPin, Package } from 'lucide-react';
import { useMemo } from 'react';
import { useAuthStore } from '@/stores/auth-store';
import { useActiveLocationId, useLocationStore } from './location-store';
import { useModuleLocations } from './use-module-locations';
import classes from './location-switcher.module.css';

/**
 * Current-location control for the app header. What a "location" is depends on
 * the module: RxSoft works in stock locations, EMR in clinical sites and the
 * Admin console in organisation sites. Modules without a location concept have
 * no switcher at all — the header simply omits it.
 */
export function LocationSwitcher() {
  const user = useAuthStore((state) => state.user);
  const { scope, locations, isLoading } = useModuleLocations();

  const scopeKey = scope?.key ?? 'none';
  const accountLocationId = scope?.followsAccountLocation ? (user?.locationId ?? null) : null;
  const activeId = useActiveLocationId(scopeKey, accountLocationId);
  const pickedId = useLocationStore((state) => state.byScope[scopeKey]);
  const setLocation = useLocationStore((state) => state.setLocation);

  const current = useMemo(
    () => locations.find((location) => location.id === activeId) ?? null,
    [locations, activeId]
  );

  if (!scope) {
    return null;
  }

  const Icon = scope.key === 'stock' ? Package : MapPin;
  const label = current?.code || current?.name || (activeId ? 'Unknown location' : 'Select location');
  const hint = current?.name
    ? current.name
    : isLoading
      ? 'Loading…'
      : (activeId ? scope.hint : 'None selected');

  return (
    <Menu width={280} position="bottom-start" offset={6} withinPortal>
      <Menu.Target>
        <UnstyledButton
          className={classes.trigger}
          data-testid="header-location-trigger"
          aria-label={`Switch ${scope.label.toLowerCase()}`}
        >
          <Icon className={classes.icon} size={16} />
          <span className={classes.text}>
            <span className={classes.label}>{label}</span>
            <span className={classes.hint}>{hint}</span>
          </span>
          <ChevronsUpDown className={classes.chevron} size={14} />
        </UnstyledButton>
      </Menu.Target>

      <Menu.Dropdown>
        <Menu.Label>{scope.label}</Menu.Label>

        {isLoading && locations.length === 0 ? (
          <Menu.Item leftSection={<Loader size="xs" />} disabled>
            Loading locations…
          </Menu.Item>
        ) : locations.length === 0 ? (
          <Menu.Item disabled>No {scope.label.toLowerCase()}s available</Menu.Item>
        ) : (
          <ScrollArea.Autosize mah={280}>
            {locations.map((location) => {
              const isActive = location.id === activeId;
              return (
                <Menu.Item
                  key={location.id}
                  data-testid={`header-location-option-${location.id}`}
                  onClick={() => setLocation(scopeKey, location.id)}
                  rightSection={isActive ? <Check className={classes.check} size={14} /> : null}
                >
                  <Text size="sm" fw={isActive ? 700 : 500}>
                    {location.code || location.name}
                  </Text>
                  <Text size="xs" c="dimmed">
                    {location.code ? location.name : scope.hint}
                  </Text>
                </Menu.Item>
              );
            })}
          </ScrollArea.Autosize>
        )}

        {pickedId && accountLocationId && (
          <>
            <Menu.Divider />
            <Menu.Item onClick={() => setLocation(scopeKey, null)}>
              Use my account location
            </Menu.Item>
          </>
        )}
        {pickedId && !accountLocationId && (
          <>
            <Menu.Divider />
            <Menu.Item onClick={() => setLocation(scopeKey, null)}>Clear selection</Menu.Item>
          </>
        )}
      </Menu.Dropdown>
    </Menu>
  );
}
