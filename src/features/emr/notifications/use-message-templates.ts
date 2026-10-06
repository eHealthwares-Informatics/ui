import { notifications } from '@mantine/notifications';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getApiErrorMessage } from '@/lib/get-api-error-message';
import {
  createMessageTemplate,
  deleteMessageTemplate,
  fetchChannelCodeOptions,
  fetchMessageTemplates,
  updateMessageTemplate,
} from './api';
import type { MessageTemplateInput } from './types';

export const MESSAGE_TEMPLATES_KEY = ['emr', 'message-templates'] as const;

export function useMessageTemplates(search: string) {
  return useQuery({
    queryKey: [...MESSAGE_TEMPLATES_KEY, search],
    queryFn: () => fetchMessageTemplates(search),
    staleTime: 30_000,
  });
}

export function useChannelCodeOptions() {
  return useQuery({
    queryKey: [...MESSAGE_TEMPLATES_KEY, 'channel-options'],
    queryFn: fetchChannelCodeOptions,
    staleTime: 120_000,
  });
}

export function useMessageTemplateMutations() {
  const queryClient = useQueryClient();
  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: MESSAGE_TEMPLATES_KEY });

  const createMutation = useMutation({
    mutationFn: (payload: MessageTemplateInput) => createMessageTemplate(payload),
    onSuccess: () => {
      void invalidate();
      notifications.show({ message: 'Template created' });
    },
    onError: (error) => {
      notifications.show({ color: 'red', message: getApiErrorMessage(error) });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<MessageTemplateInput> }) =>
      updateMessageTemplate(id, payload),
    onSuccess: () => {
      void invalidate();
      notifications.show({ message: 'Template updated' });
    },
    onError: (error) => {
      notifications.show({ color: 'red', message: getApiErrorMessage(error) });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteMessageTemplate(id),
    onSuccess: () => {
      void invalidate();
      notifications.show({ message: 'Template deleted' });
    },
    onError: (error) => {
      notifications.show({ color: 'red', message: getApiErrorMessage(error) });
    },
  });

  return { createMutation, updateMutation, deleteMutation };
}
