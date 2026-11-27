import { Play } from 'lucide-react';
import type { ModelConfig } from '@/features/shared/model-schema';
import { buildNotificationDeliveryConfig } from './notification-delivery/schema';
import { notificationDetailHref, shortId } from './notification-detail/link';
import { buildNotificationDispatchesConfig } from './notification-dispatches/schema';
import { buildNotificationEventsConfig } from './notification-events/schema';
import { buildNotificationTemplatesConfig } from './notification-templates/schema';

function configs(): Array<[string, ModelConfig]> {
  return [
    [
      'notification-templates',
      buildNotificationTemplatesConfig({ organizationId: null, canManageGlobal: true }),
    ],
    ['notification-dispatches', buildNotificationDispatchesConfig({ organizationId: null })],
    [
      'notification-delivery',
      buildNotificationDeliveryConfig({
        organizationId: null,
        failuresOnly: false,
        testsOnly: false,
        exchangeState: 'all',
        onFailuresOnlyChange: () => undefined,
        onTestsOnlyChange: () => undefined,
        onExchangeStateChange: () => undefined,
        onViewDetails: () => undefined,
      }),
    ],
    [
      'notification-events',
      buildNotificationEventsConfig({
        organizationId: null,
        printTemplates: [],
        isSuperAdmin: true,
        eventMutation: { mutate: () => undefined },
      }),
    ],
  ];
}

describe('notification entity tables', () => {
  it('exposes an ID column and enables click-to-copy on the SN cell for every entity', () => {
    for (const [, config] of configs()) {
      expect(config.copyRowIdOnSn).toBe(true);
      expect(config.columns.some((column) => column.key === 'id')).toBe(true);
    }
  });

  it('builds a detail link carrying the row id (and org when present)', () => {
    expect(
      notificationDetailHref('notification-templates', {
        id: 'abc123',
        organizationId: 'org-1',
      })
    ).toBe('/conversation/notification-detail/notification-templates/abc123?organizationId=org-1');

    expect(notificationDetailHref('notification-events', { id: 'evt-1' })).toBe(
      '/conversation/notification-detail/notification-events/evt-1'
    );
  });

  it('exposes the Test (Play) row action for dispatches when a handler is provided', () => {
    const config = buildNotificationDispatchesConfig({
      organizationId: null,
      onTest: () => undefined,
    });

    expect(config.rowActionsInline).toBe(true);
    expect(config.rowActions).toHaveLength(1);
    expect(config.rowActions?.[0]).toMatchObject({ id: 'test', label: 'Test', icon: Play });
  });

  it('hides the Test row action when no handler is provided', () => {
    const config = buildNotificationDispatchesConfig({ organizationId: null });
    expect(config.rowActions).toBeUndefined();
  });

  it('shortens long ids for the table label', () => {
    expect(shortId('d6eb95ec-a79d-490c-98e7-747358a3916a')).toBe('d6eb95…916a');
    expect(shortId('short')).toBe('short');
    expect(shortId(null)).toBe('—');
  });
});
