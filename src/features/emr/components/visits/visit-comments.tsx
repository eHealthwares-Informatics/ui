import { Avatar, Button, Group, Loader, Stack, Text, Textarea } from '@mantine/core';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Send } from 'lucide-react';
import { useState } from 'react';
import { emrApi } from '@/lib/emr-api';
import { getApiErrorMessage } from '../../lib/emr-errors';

type VisitComment = {
  id: string;
  comment: string;
  authorName: string | null;
  createdAt: string | null;
};

/**
 * Comment thread for a visit: chronological list plus a composer. Shared by
 * the visit detail page and the quick "Add comment" action on the visits list.
 */
export function VisitCommentsPanel({ visitId }: { visitId: string }) {
  const queryClient = useQueryClient();
  const [text, setText] = useState('');
  const [error, setError] = useState<string | null>(null);

  const commentsQuery = useQuery({
    queryKey: ['emr', 'visits', visitId, 'comments'],
    queryFn: async () => {
      const res = await emrApi.get<{ data: VisitComment[] }>(`/visits/${visitId}/comments`);
      return res.data.data;
    },
    enabled: Boolean(visitId),
  });

  const addComment = useMutation({
    mutationFn: async (comment: string) => {
      const { data } = await emrApi.post(`/visits/${visitId}/comments`, {
        comment,
      });
      return data;
    },
    onSuccess: () => {
      setText('');
      setError(null);
      void queryClient.invalidateQueries({
        queryKey: ['emr', 'visits', visitId, 'comments'],
      });
    },
    onError: (e) => setError(getApiErrorMessage(e)),
  });

  const comments = commentsQuery.data ?? [];

  return (
    <Stack gap="sm">
      <Stack gap="xs">
        {commentsQuery.isLoading ? (
          <Loader size="sm" type="dots" />
        ) : comments.length === 0 ? (
          <Text size="sm" c="dimmed">
            No comments yet.
          </Text>
        ) : (
          comments.map((comment) => (
            <Group key={comment.id} align="flex-start" gap="xs" wrap="nowrap" py={4}>
              <Avatar size="sm" radius="xl" name={comment.authorName ?? 'User'} />
              <Stack gap={2} style={{ flex: 1 }}>
                <Group gap="xs">
                  <Text size="sm" fw={600}>
                    {comment.authorName ?? 'Unknown'}
                  </Text>
                  {comment.createdAt ? (
                    <Text size="xs" c="dimmed">
                      {new Date(comment.createdAt).toLocaleString()}
                    </Text>
                  ) : null}
                </Group>
                <Text size="sm" style={{ whiteSpace: 'pre-wrap' }}>
                  {comment.comment}
                </Text>
              </Stack>
            </Group>
          ))
        )}
      </Stack>

      <Textarea
        placeholder="Add a comment…"
        autosize
        minRows={2}
        maxRows={6}
        value={text}
        error={error}
        onChange={(e) => {
          setText(e.currentTarget.value);
          setError(null);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && (e.metaKey || e.ctrlKey) && text.trim()) {
            addComment.mutate(text.trim());
          }
        }}
      />
      <Group justify="flex-end">
        <Button
          size="xs"
          leftSection={<Send size={14} />}
          disabled={!text.trim()}
          loading={addComment.isPending}
          onClick={() => addComment.mutate(text.trim())}
        >
          Comment
        </Button>
      </Group>
    </Stack>
  );
}
