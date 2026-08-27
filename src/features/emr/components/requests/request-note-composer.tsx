import { Button, Group, Textarea } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Send } from 'lucide-react';
import { useState } from 'react';
import { emrApi } from '@/lib/emr-api';
import { getApiErrorMessage } from '../../lib/emr-errors';

export function RequestNoteComposer({ requestId }: { requestId: string }) {
  const queryClient = useQueryClient();
  const [note, setNote] = useState('');

  const noteMutation = useMutation({
    mutationFn: async (text: string) => {
      const { data } = await emrApi.post(`/requests/${requestId}/note`, { note: text });
      return data;
    },
    onSuccess: () => {
      setNote('');
      notifications.show({ message: 'Note added to the request', color: 'teal' });
      queryClient.invalidateQueries({ queryKey: ['emr', 'requests'] });
    },
    onError: (error) => {
      notifications.show({ color: 'red', message: getApiErrorMessage(error) });
    },
  });

  const submit = () => {
    const text = note.trim();
    if (text && !noteMutation.isPending) {
      noteMutation.mutate(text);
    }
  };

  return (
    <Group align="flex-end" gap="sm" wrap="nowrap">
      <Textarea
        flex={1}
        label="Add a note"
        placeholder="Append an update without changing the request status…"
        autosize
        minRows={1}
        maxRows={4}
        value={note}
        onChange={(e) => setNote(e.currentTarget.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
            e.preventDefault();
            submit();
          }
        }}
      />
      <Button
        leftSection={<Send size={14} />}
        variant="light"
        loading={noteMutation.isPending}
        disabled={!note.trim()}
        onClick={submit}
      >
        Add note
      </Button>
    </Group>
  );
}
