import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { DataPageShell } from '@/features/components/page/data-page-shell';
import type { Option } from '@/features/rxsoft/types';
import { fetchChannelCodeOptions } from '../../../notifications/api';
import { MESSAGE_TEMPLATES_KEY } from '../../../notifications/types';
import { buildMessageTemplatesConfig } from './schema';

/**
 * EMR Message Templates — schema-forms admin page.
 *
 * List + create/edit modal are driven by messageTemplatesConfig (DataPageShell),
 * matching other EMR settings pages. Channel-code options are loaded from the
 * communication module and injected into the multi-pick field.
 */
export function MessageTemplatesPage() {
  const { data: channelOptions = [] } = useQuery<Option[]>({
    queryKey: [...MESSAGE_TEMPLATES_KEY, 'channel-options'],
    queryFn: fetchChannelCodeOptions,
    staleTime: 120_000,
  });

  const config = useMemo(() => buildMessageTemplatesConfig(channelOptions), [channelOptions]);

  return <DataPageShell config={config} />;
}
