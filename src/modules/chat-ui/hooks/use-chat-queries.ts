import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  addProjection,
  createConversation,
  fetchConversationInbox,
  fetchConversationMessages,
  listProjections,
  markConversationRead,
  removeParticipantProjections,
  sendConversationMessage,
} from '../services/chat-api';
import type {
  ExchangeMessage,
  ExchangeMessagesResponse,
} from '../types';

export const chatKeys = {
  inbox: (search: string, status?: string, channelId?: string, participantId?: string) =>
    ['conversation-inbox', { search, status, channelId, participantId }] as const,
  messages: (conversationId?: string) => ['conversation-messages', conversationId] as const,
  projections: (conversationId?: string) => ['projections', conversationId] as const,
  pending: (conversationId?: string) => ['pending-exchanges', conversationId] as const,
};

export function useConversationInbox(
  search: string,
  status?: string,
  channelId?: string,
  participantId?: string,
) {
  return useQuery({
    queryKey: chatKeys.inbox(search, status, channelId, participantId),
    queryFn: () =>
      fetchConversationInbox({
        search: search.trim() || undefined,
        status: status || undefined,
        channelId: channelId || undefined,
        participantId: participantId || undefined,
      }),
    // Keep the inbox cached while navigating between threads.
    staleTime: 30_000,
    gcTime: 5 * 60_000,
  });
}

export function useConversationMessages(conversationId?: string) {
  return useInfiniteQuery({
    queryKey: chatKeys.messages(conversationId),
    enabled: Boolean(conversationId),
    queryFn: ({ pageParam }) =>
      fetchConversationMessages({
        conversationId: conversationId!,
        cursor: pageParam,
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    // Client-cached infinite scroll: staleTime avoids refetching fresh pages
    // on revisit, while event-invalidated threads still refetch on mount.
    staleTime: 30_000,
    gcTime: 5 * 60_000,
  });
}

/**
 * Flatten the paginated exchanges into a chronological (oldest → newest)
 * message list, ready for rendering in a bottom-anchored thread.
 */
export function useConversationThread(conversationId?: string) {
  const query = useConversationMessages(conversationId);
  const messages = (query.data?.pages.flatMap((page) => page.items) ?? [])
    .slice()
    .reverse();
  return { ...query, messages };
}

export function usePendingExchanges(conversationId?: string) {
  return useQuery({
    queryKey: chatKeys.pending(conversationId),
    enabled: Boolean(conversationId),
    queryFn: () => fetchConversationMessages({ conversationId: conversationId! }),
    refetchInterval: conversationId ? 3000 : false,
    select: (data) => ({ ...data, items: [...data.items].reverse() }),
  });
}

export function useSendConversationMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: sendConversationMessage,
    onMutate: async (input) => {
      const queryKey = chatKeys.messages(input.conversationId);
      await queryClient.cancelQueries({ queryKey });
      const optimisticMessage: ExchangeMessage = {
        id: `optimistic-${Date.now()}`,
        conversationId: input.conversationId,
        senderId: input.senderPhone,
        direction: 'inbound',
        text: input.text,
        createdAt: new Date().toISOString(),
        status: 'sent',
        optimistic: true,
      };

      queryClient.setQueryData<{
        pages: ExchangeMessagesResponse[];
        pageParams: Array<string | undefined>;
      }>(queryKey, (current) => {
        if (!current) {
          return {
            pages: [{ items: [optimisticMessage] }],
            pageParams: [undefined],
          };
        }

        const [firstPage, ...restPages] = current.pages;
        return {
          ...current,
          pages: [
            {
              ...firstPage,
              items: [optimisticMessage, ...firstPage.items],
            },
            ...restPages,
          ],
        };
      });

      return { queryKey, optimisticId: optimisticMessage.id };
    },
    onError: (_error, _input, context) => {
      if (!context) {return;}

      queryClient.setQueryData<{
        pages: ExchangeMessagesResponse[];
        pageParams: Array<string | undefined>;
      }>(context.queryKey, (current) => {
        if (!current) {return current;}

        return {
          ...current,
          pages: current.pages.map((page) => ({
            ...page,
            items: page.items.map((message) =>
              message.id === context.optimisticId
                ? { ...message, status: 'failed', optimistic: false }
                : message
            ),
          })),
        };
      });
    },
    onSuccess: (_data, input, context) => {
      const queryKey = chatKeys.messages(input.conversationId);
      queryClient.setQueryData<{
        pages: ExchangeMessagesResponse[];
        pageParams: Array<string | undefined>;
      }>(queryKey, (current) => {
        if (!current || !context) {return current;}

        return {
          ...current,
          pages: current.pages.map((page) => ({
            ...page,
            items: page.items.filter((message) => message.id !== context.optimisticId),
          })),
        };
      });

      queryClient.invalidateQueries({ queryKey });
      queryClient.invalidateQueries({ queryKey: ['conversation-inbox'] });
    },
  });
}

export function useMarkConversationRead() {
  return useMutation({
    mutationFn: markConversationRead,
  });
}

export function useCreateConversation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createConversation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversation-inbox'] });
    },
  });
}

export function useAddProjection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: addProjection,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversation-inbox'] });
    },
  });
}

export function useListProjections(conversationId?: string) {
  return useQuery({
    queryKey: chatKeys.projections(conversationId),
    enabled: Boolean(conversationId),
    queryFn: () => listProjections(conversationId!),
  });
}

export function useRemoveParticipantProjections() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: removeParticipantProjections,
    onSuccess: (_data, input) => {
      queryClient.invalidateQueries({ queryKey: ['conversation-inbox'] });
      queryClient.invalidateQueries({ queryKey: chatKeys.projections(input.conversationId) });
    },
  });
}
