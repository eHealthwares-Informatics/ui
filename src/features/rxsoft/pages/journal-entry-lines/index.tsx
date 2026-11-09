import { Card, Select, Stack, Text } from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { DataPageShell } from '@/components/page/data-page-shell';
import { RxPage } from '@/components/page/rx-page';
import type { ModelConfig } from '@/features/shared/model-schema';
import { rxsoftApi } from '@/lib/rxsoft-api';

type JournalEntryOption = {
  id: string;
  entryNumber: string;
};

export function RxJournalEntryLinesPage() {
  const [entryId, setEntryId] = useState<string>('');

  const entriesQuery = useQuery<JournalEntryOption[]>({
    queryKey: ['rxsoft-journal-entries-select'],
    queryFn: async () => {
      const response = await rxsoftApi.get('/journal-entries');
      return response.data?.data ?? [];
    },
  });

  const entries = entriesQuery.data ?? [];

  const journalEntryLinesConfig: ModelConfig = {
    id: 'journal-entry-lines',
    title: 'Journal Entry Lines',
    description: 'Debit and credit lines for the selected journal entry.',
    endpoint: `/journal-entries/${entryId}/lines`,
    columns: [
      { key: 'lineNumber', label: 'Line #' },
      { key: 'glAccountId', label: 'GL Account' },
      { key: 'partyId', label: 'Party' },
      { key: 'productId', label: 'Product' },
      { key: 'debitAmount', label: 'Debit' },
      { key: 'creditAmount', label: 'Credit' },
    ],
    createFields: [
      {
        name: 'lineNumber',
        label: 'Line Number',
        type: 'number',
        required: true,
      },
      {
        name: 'glAccountId',
        label: 'GL Account ID',
        required: true,
      },
      { name: 'partyId', label: 'Party ID' },
      { name: 'productId', label: 'Product ID' },
      { name: 'debitAmount', label: 'Debit Amount', type: 'number' },
      { name: 'creditAmount', label: 'Credit Amount', type: 'number' },
      { name: 'description', label: 'Description' },
    ],
    buildCreatePayload: (values) => ({
      lineNumber: Number(values.lineNumber || 0),
      glAccountId: values.glAccountId,
      partyId: values.partyId || undefined,
      productId: values.productId || undefined,
      debitAmount: values.debitAmount ? Number(values.debitAmount) : undefined,
      creditAmount: values.creditAmount ? Number(values.creditAmount) : undefined,
      description: values.description || undefined,
    }),
    canDelete: true,
  };

  return (
    <RxPage
      title="Journal Entry Lines"
      description="Line-level debits and credits for a selected journal entry."
    >
      {/* SELECT ENTRY */}
      <Card withBorder>
        <Stack gap="xs" p="md">
          <Text fw={600}>Select Journal Entry</Text>
          <Text size="sm" c="dimmed">
            Choose a journal entry before managing its lines.
          </Text>

          <Select
            value={entryId}
            onChange={(value) => setEntryId(value ?? '')}
            placeholder="Select a journal entry"
            data={entries.map((entry) => ({
              value: entry.id,
              label: entry.entryNumber,
            }))}
            clearable
          />
        </Stack>
      </Card>

      {/* DATA TABLE */}
      {entryId && <DataPageShell config={journalEntryLinesConfig} />}
    </RxPage>
  );
}
