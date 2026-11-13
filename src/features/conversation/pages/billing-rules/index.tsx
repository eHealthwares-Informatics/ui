import { Stack } from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { DataPageShell } from '@/components/page/data-page-shell';
import { getArrayPayload } from '@/components/utils';
import { conversationApi } from '@/lib/conversation-api';
import { useAuthStore } from '@/stores/auth-store';
import {
  buildBillingRulesConfig,
  type BillingAiModelRef,
  type BillingChannelRef,
  type BillingEventRef,
  type BillingQuestionnaireRef,
  type BillingQuestionRef,
  type BillingTemplateRef,
} from './schema';

export function RxBillingRulesPage() {
  const selectedOrganisationId = useAuthStore((state) => state.selectedOrganisationId);
  const organizationId = selectedOrganisationId ?? null;
  const scopeParams = useMemo<Record<string, string>>(() => {
    const params: Record<string, string> = {};
    if (selectedOrganisationId === null) {
      params.organizationId = 'null';
    } else if (selectedOrganisationId) {
      params.organizationId = selectedOrganisationId;
    }
    return params;
  }, [selectedOrganisationId]);
  const scopeKey =
    selectedOrganisationId === undefined ? 'all' : (selectedOrganisationId ?? 'global');

  const { data: channels = [] } = useQuery({
    queryKey: ['billing-rules', 'channels'],
    queryFn: async () => {
      const { data } = await conversationApi.get('/channels', {
        params: { limit: 1000 },
      });
      return getArrayPayload(data) as BillingChannelRef[];
    },
  });

  const { data: questionnaires = [] } = useQuery({
    queryKey: ['billing-rules', 'questionnaires'],
    queryFn: async () => {
      const { data } = await conversationApi.get('/questionnaires', {
        params: { limit: 500 },
      });
      return getArrayPayload(data) as BillingQuestionnaireRef[];
    },
  });

  const { data: questions = [] } = useQuery({
    queryKey: ['billing-rules', 'questions'],
    queryFn: async () => {
      const { data } = await conversationApi.get('/questions', {
        params: { limit: 1000 },
      });
      return getArrayPayload(data) as BillingQuestionRef[];
    },
  });

  const { data: aiModels = [] } = useQuery({
    queryKey: ['billing-rules', 'ai-models'],
    queryFn: async () => {
      const { data } = await conversationApi.get('/ai/models', {
        params: { limit: 500 },
      });
      return getArrayPayload(data) as BillingAiModelRef[];
    },
  });

  const { data: events = [] } = useQuery({
    queryKey: ['billing-rules', 'events'],
    queryFn: async () => {
      const { data } = await conversationApi.get('/notification-events', {
        params: { limit: 500 },
      });
      return getArrayPayload(data) as BillingEventRef[];
    },
  });

  const { data: templates = [] } = useQuery({
    queryKey: ['billing-rules', 'templates', scopeKey],
    queryFn: async () => {
      const { data } = await conversationApi.get('/notification-templates', {
        params: { ...scopeParams, limit: 200 },
      });
      return getArrayPayload(data) as BillingTemplateRef[];
    },
  });

  const config = useMemo(
    () =>
      buildBillingRulesConfig({
        organizationId,
        scopeKey,
        scopeParams,
        channels,
        questionnaires,
        questions,
        aiModels,
        events,
        templates,
      }),
    [
      organizationId,
      scopeKey,
      scopeParams,
      channels,
      questionnaires,
      questions,
      aiModels,
      events,
      templates,
    ]
  );

  return (
    <Stack gap="lg">
      <DataPageShell key={scopeKey} config={config} />
    </Stack>
  );
}
