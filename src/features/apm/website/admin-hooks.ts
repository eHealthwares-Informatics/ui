import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notifications } from '@mantine/notifications';
import { apmAdminApi } from './admin-api';
import type {
  CreateStakeholderPayload,
  UpdateStakeholderPayload,
  UpdateConversionScorePayload,
  UpdatePollingUnitPayload,
  CreateWhatsAppGroupPayload,
  CreateActivityPayload,
  CreateCanvassingSessionPayload,
  UpdateCanvassingSessionPayload,
  CreateCanvassingVisitPayload,
  CreateVolunteerAssignmentPayload,
  UpdateVolunteerAssignmentPayload,
  CreateCandidateTourPayload,
  UpdateCandidateTourPayload,
  CreateContentAssetPayload,
  CreateListeningMentionPayload,
  CreateRapidResponsePayload,
  CreateAgentPayload,
  UpdateAgentPayload,
  CreateResultPayload,
  CreateIncidentPayload,
  UpdateIncidentPayload,
  CreateGotvPayload,
  UpdateGotvPayload,
} from './admin-types';
import { getApiErrorMessage } from '@/lib/get-api-error-message';

// ── LGAs ──────────────────────────────────────────────────

export function useLgas() {
  return useQuery({
    queryKey: ['apm-admin', 'lgas'],
    queryFn: () => apmAdminApi.listLgas(),
    staleTime: 30 * 60 * 1000,
  });
}

// ── Wards ─────────────────────────────────────────────────

export function useWards(lgaId: string) {
  return useQuery({
    queryKey: ['apm-admin', 'wards', lgaId],
    queryFn: () => apmAdminApi.listWards(lgaId),
    enabled: !!lgaId,
    staleTime: 30 * 60 * 1000,
  });
}

// ── Polling Units ─────────────────────────────────────────

export function usePollingUnits(wardId: string) {
  return useQuery({
    queryKey: ['apm-admin', 'polling-units', wardId],
    queryFn: () => apmAdminApi.listPollingUnits(wardId),
    enabled: !!wardId,
    staleTime: 10 * 60 * 1000,
  });
}

// ── Conversion Dashboard ──────────────────────────────────

export function useConversionDashboard() {
  return useQuery({
    queryKey: ['apm-admin', 'dashboard'],
    queryFn: () => apmAdminApi.getConversionDashboard(),
    staleTime: 5 * 60 * 1000,
  });
}

export function useLgaConversion() {
  return useQuery({
    queryKey: ['apm-admin', 'lga-conversion'],
    queryFn: () => apmAdminApi.getLgaConversionDashboard(),
    staleTime: 5 * 60 * 1000,
  });
}

export function useWardConversion(lgaId: string) {
  return useQuery({
    queryKey: ['apm-admin', 'ward-conversion', lgaId],
    queryFn: () => apmAdminApi.getWardConversionDashboard(lgaId),
    enabled: !!lgaId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useWardPollingUnits(wardId: string) {
  return useQuery({
    queryKey: ['apm-admin', 'ward-pus', wardId],
    queryFn: () => apmAdminApi.getWardPollingUnits(wardId),
    enabled: !!wardId,
    staleTime: 5 * 60 * 1000,
  });
}

// ── Stakeholders ──────────────────────────────────────────

export function useStakeholders(params?: Record<string, string | number>) {
  return useQuery({
    queryKey: ['apm-admin', 'stakeholders', params],
    queryFn: () => apmAdminApi.listStakeholders(params),
    staleTime: 5 * 60 * 1000,
  });
}

export function useStakeholder(id: string) {
  return useQuery({
    queryKey: ['apm-admin', 'stakeholder', id],
    queryFn: () => apmAdminApi.getStakeholder(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}

export function useStakeholdersByLga(lgaId: string, params?: Record<string, string | number>) {
  return useQuery({
    queryKey: ['apm-admin', 'stakeholders', lgaId, params],
    queryFn: () => apmAdminApi.listStakeholdersByLga(lgaId, params),
    enabled: !!lgaId,
    staleTime: 5 * 60 * 1000,
  });
}

// ── WhatsApp Groups ───────────────────────────────────────

export function useWhatsAppGroups(level?: string) {
  return useQuery({
    queryKey: ['apm-admin', 'whatsapp-groups', level],
    queryFn: () => apmAdminApi.listWhatsAppGroups(level),
    staleTime: 10 * 60 * 1000,
  });
}

// ── Mutations ─────────────────────────────────────────────

function invalidateApmAdmin(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: ['apm-admin'] });
}

export function useUpdateConversionScore() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ entityType, entityId, data }: { entityType: string; entityId: string; data: UpdateConversionScorePayload }) =>
      apmAdminApi.updateConversionScore(entityType, entityId, data),
    onSuccess: () => {
      notifications.show({ title: 'Score Updated', message: 'Conversion score saved.', color: 'green' });
      invalidateApmAdmin(qc);
    },
    onError: (error) => {
      notifications.show({ title: 'Error', message: getApiErrorMessage(error), color: 'red' });
      },
  });
}

export function useUpdatePollingUnit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdatePollingUnitPayload }) =>
      apmAdminApi.updatePollingUnit(id, data),
    onSuccess: () => {
      notifications.show({ title: 'Updated', message: 'Polling unit updated.', color: 'green' });
      invalidateApmAdmin(qc);
    },
    onError: (error) => {
      notifications.show({ title: 'Error', message: getApiErrorMessage(error), color: 'red' });
      },
  });
}

export function useCreateStakeholder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateStakeholderPayload) => apmAdminApi.createStakeholder(data),
    onSuccess: () => {
      notifications.show({ title: 'Created', message: 'Stakeholder added.', color: 'green' });
      invalidateApmAdmin(qc);
    },
    onError: (error) => {
      notifications.show({ title: 'Error', message: getApiErrorMessage(error), color: 'red' });
      },
  });
}

export function useUpdateStakeholder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateStakeholderPayload }) =>
      apmAdminApi.updateStakeholder(id, data),
    onSuccess: () => {
      notifications.show({ title: 'Updated', message: 'Stakeholder updated.', color: 'green' });
      invalidateApmAdmin(qc);
    },
    onError: (error) => {
      notifications.show({ title: 'Error', message: getApiErrorMessage(error), color: 'red' });
      },
  });
}

export function useCreateActivity() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ stakeholderId, data }: { stakeholderId: string; data: CreateActivityPayload }) =>
      apmAdminApi.createActivity(stakeholderId, data),
    onSuccess: () => {
      notifications.show({ title: 'Activity Logged', message: 'Activity recorded.', color: 'green' });
      invalidateApmAdmin(qc);
    },
    onError: (error) => {
      notifications.show({ title: 'Error', message: getApiErrorMessage(error), color: 'red' });
      },
  });
}

export function useCreateWhatsAppGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateWhatsAppGroupPayload) => apmAdminApi.createWhatsAppGroup(data),
    onSuccess: () => {
      notifications.show({ title: 'Group Created', message: 'WhatsApp group added.', color: 'green' });
      invalidateApmAdmin(qc);
    },
    onError: (error) => {
      notifications.show({ title: 'Error', message: getApiErrorMessage(error), color: 'red' });
      },
  });
}

export function useSearchPollingUnits(query: string) {
  return useQuery({
    queryKey: ['apm-admin', 'search-pu', query],
    queryFn: () => apmAdminApi.searchPollingUnits(query),
    enabled: query.length >= 3,
    staleTime: 5 * 60 * 1000,
  });
}

// ── Canvassing Hooks ──────────────────────────────────────

export function useCanvassingStats() {
  return useQuery({
    queryKey: ['apm-admin', 'canvassing-stats'],
    queryFn: () => apmAdminApi.getCanvassingStats(),
    staleTime: 5 * 60 * 1000,
  });
}

export function useCanvassingSessions(params?: Record<string, string | number>) {
  return useQuery({
    queryKey: ['apm-admin', 'canvassing-sessions', params],
    queryFn: () => apmAdminApi.listCanvassingSessions(params),
    staleTime: 5 * 60 * 1000,
  });
}

export function useCanvassingSession(id: string) {
  return useQuery({
    queryKey: ['apm-admin', 'canvassing-session', id],
    queryFn: () => apmAdminApi.getCanvassingSession(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}

export function useSessionVisits(sessionId: string) {
  return useQuery({
    queryKey: ['apm-admin', 'session-visits', sessionId],
    queryFn: () => apmAdminApi.listSessionVisits(sessionId),
    enabled: !!sessionId,
    staleTime: 2 * 60 * 1000,
  });
}

export function useSessionVisitStats(sessionId: string) {
  return useQuery({
    queryKey: ['apm-admin', 'session-visit-stats', sessionId],
    queryFn: () => apmAdminApi.getSessionVisitStats(sessionId),
    enabled: !!sessionId,
    staleTime: 2 * 60 * 1000,
  });
}

export function useAllVisitStats() {
  return useQuery({
    queryKey: ['apm-admin', 'all-visit-stats'],
    queryFn: () => apmAdminApi.getAllVisitStats(),
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateCanvassingSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateCanvassingSessionPayload) => apmAdminApi.createCanvassingSession(data),
    onSuccess: () => {
      notifications.show({ title: 'Created', message: 'Canvassing session created.', color: 'green' });
      invalidateApmAdmin(qc);
    },
    onError: (error) => {
      notifications.show({ title: 'Error', message: getApiErrorMessage(error), color: 'red' });
      },
  });
}

export function useUpdateCanvassingSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateCanvassingSessionPayload }) =>
      apmAdminApi.updateCanvassingSession(id, data),
    onSuccess: () => {
      notifications.show({ title: 'Updated', message: 'Session updated.', color: 'green' });
      invalidateApmAdmin(qc);
    },
    onError: (error) => {
      notifications.show({ title: 'Error', message: getApiErrorMessage(error), color: 'red' });
      },
  });
}

export function useAddSessionVisit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ sessionId, data }: { sessionId: string; data: CreateCanvassingVisitPayload }) =>
      apmAdminApi.addSessionVisit(sessionId, data),
    onSuccess: () => {
      notifications.show({ title: 'Visit Logged', message: 'Visit recorded.', color: 'green' });
      invalidateApmAdmin(qc);
    },
    onError: (error) => {
      notifications.show({ title: 'Error', message: getApiErrorMessage(error), color: 'red' });
      },
  });
}

// ── Sentiment Hooks ───────────────────────────────────────

export function useSentimentDashboard() {
  return useQuery({
    queryKey: ['apm-admin', 'sentiment'],
    queryFn: () => apmAdminApi.getSentimentDashboard(),
    staleTime: 5 * 60 * 1000,
  });
}

// ── Volunteer Assignment Hooks ────────────────────────────

export function useVolunteerAssignments(params?: Record<string, string | number>) {
  return useQuery({
    queryKey: ['apm-admin', 'volunteer-assignments', params],
    queryFn: () => apmAdminApi.listVolunteerAssignments(params),
    staleTime: 5 * 60 * 1000,
  });
}

export function useAssignmentsByWard(wardId: string) {
  return useQuery({
    queryKey: ['apm-admin', 'assignments-ward', wardId],
    queryFn: () => apmAdminApi.listAssignmentsByWard(wardId),
    enabled: !!wardId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useVolunteerStats() {
  return useQuery({
    queryKey: ['apm-admin', 'volunteer-stats'],
    queryFn: () => apmAdminApi.getVolunteerStats(),
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateVolunteerAssignment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateVolunteerAssignmentPayload) => apmAdminApi.createVolunteerAssignment(data),
    onSuccess: () => {
      notifications.show({ title: 'Assigned', message: 'Volunteer assigned.', color: 'green' });
      invalidateApmAdmin(qc);
    },
    onError: (error) => {
      notifications.show({ title: 'Error', message: getApiErrorMessage(error), color: 'red' });
      },
  });
}

export function useUpdateVolunteerAssignment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateVolunteerAssignmentPayload }) =>
      apmAdminApi.updateVolunteerAssignment(id, data),
    onSuccess: () => {
      notifications.show({ title: 'Updated', message: 'Assignment updated.', color: 'green' });
      invalidateApmAdmin(qc);
    },
    onError: (error) => {
      notifications.show({ title: 'Error', message: getApiErrorMessage(error), color: 'red' });
      },
  });
}

// ── Candidate Tour Hooks ─────────────────────────────────

export function useTours(params?: Record<string, string | number>) {
  return useQuery({ queryKey: ['apm-admin', 'tours', params], queryFn: () => apmAdminApi.listTours(params), staleTime: 5 * 60 * 1000 });
}

export function useTour(id: string) {
  return useQuery({ queryKey: ['apm-admin', 'tour', id], queryFn: () => apmAdminApi.getTour(id), enabled: !!id, staleTime: 5 * 60 * 1000 });
}

export function useTourStats() {
  return useQuery({ queryKey: ['apm-admin', 'tour-stats'], queryFn: () => apmAdminApi.getTourStats(), staleTime: 5 * 60 * 1000 });
}

export function useCreateTour() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateCandidateTourPayload) => apmAdminApi.createTour(data),
    onSuccess: () => { notifications.show({ title: 'Created', message: 'Tour created.', color: 'green' }); invalidateApmAdmin(qc); },
    onError: (error) => { notifications.show({ title: 'Error', message: getApiErrorMessage(error), color: 'red' }); },
  });
}

export function useUpdateTour() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateCandidateTourPayload }) => apmAdminApi.updateTour(id, data),
    onSuccess: () => { notifications.show({ title: 'Updated', message: 'Tour updated.', color: 'green' }); invalidateApmAdmin(qc); },
    onError: (error) => { notifications.show({ title: 'Error', message: getApiErrorMessage(error), color: 'red' }); },
  });
}

// ── Content Asset Hooks ──────────────────────────────────

export function useContentAssets(params?: Record<string, string | number>) {
  return useQuery({ queryKey: ['apm-admin', 'content', params], queryFn: () => apmAdminApi.listContent(params), staleTime: 10 * 60 * 1000 });
}

export function useCreateContentAsset() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateContentAssetPayload) => apmAdminApi.createContent(data),
    onSuccess: () => { notifications.show({ title: 'Created', message: 'Content added.', color: 'green' }); invalidateApmAdmin(qc); },
    onError: (error) => { notifications.show({ title: 'Error', message: getApiErrorMessage(error), color: 'red' }); },
  });
}

// ── Listening Mention Hooks ─────────────────────────────

export function useMentions(params?: Record<string, string | number>) {
  return useQuery({ queryKey: ['apm-admin', 'mentions', params], queryFn: () => apmAdminApi.listMentions(params), staleTime: 2 * 60 * 1000 });
}

export function useMention(id: string) {
  return useQuery({ queryKey: ['apm-admin', 'mention', id], queryFn: () => apmAdminApi.getMention(id), enabled: !!id, staleTime: 2 * 60 * 1000 });
}

export function useListeningStats() {
  return useQuery({ queryKey: ['apm-admin', 'listening-stats'], queryFn: () => apmAdminApi.getListeningStats(), staleTime: 2 * 60 * 1000 });
}

export function useCreateMention() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateListeningMentionPayload) => apmAdminApi.createMention(data),
    onSuccess: () => { notifications.show({ title: 'Logged', message: 'Mention recorded.', color: 'green' }); invalidateApmAdmin(qc); },
    onError: (error) => { notifications.show({ title: 'Error', message: getApiErrorMessage(error), color: 'red' }); },
  });
}

export function useUpdateMentionStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => apmAdminApi.updateMentionStatus(id, status),
    onSuccess: () => { notifications.show({ title: 'Updated', message: 'Status updated.', color: 'green' }); invalidateApmAdmin(qc); },
    onError: (error) => { notifications.show({ title: 'Error', message: getApiErrorMessage(error), color: 'red' }); },
  });
}

// ── Truth Desk Hooks ────────────────────────────────────

export function useResponses(mentionId: string) {
  return useQuery({ queryKey: ['apm-admin', 'responses', mentionId], queryFn: () => apmAdminApi.listResponses(mentionId), enabled: !!mentionId, staleTime: 2 * 60 * 1000 });
}

export function useCreateResponse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateRapidResponsePayload) => apmAdminApi.createResponse(data),
    onSuccess: () => { notifications.show({ title: 'Response Sent', message: 'Rapid response published.', color: 'green' }); invalidateApmAdmin(qc); },
    onError: (error) => { notifications.show({ title: 'Error', message: getApiErrorMessage(error), color: 'red' }); },
  });
}

// ── Agent Hooks ─────────────────────────────────────────────

export function useAgentStats() {
  return useQuery({ queryKey: ['apm-admin', 'agent-stats'], queryFn: () => apmAdminApi.getAgentStats(), staleTime: 5 * 60 * 1000 });
}

export function useAgents(params?: Record<string, string | number>) {
  return useQuery({ queryKey: ['apm-admin', 'agents', params], queryFn: () => apmAdminApi.listAgents(params), staleTime: 5 * 60 * 1000 });
}

export function useAgent(id: string) {
  return useQuery({ queryKey: ['apm-admin', 'agent', id], queryFn: () => apmAdminApi.getAgent(id), enabled: !!id, staleTime: 5 * 60 * 1000 });
}

export function useCreateAgent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateAgentPayload) => apmAdminApi.createAgent(data),
    onSuccess: () => { notifications.show({ title: 'Created', message: 'Agent registered.', color: 'green' }); invalidateApmAdmin(qc); },
    onError: (error) => { notifications.show({ title: 'Error', message: getApiErrorMessage(error), color: 'red' }); },
  });
}

export function useUpdateAgent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateAgentPayload }) => apmAdminApi.updateAgent(id, data),
    onSuccess: () => { notifications.show({ title: 'Updated', message: 'Agent updated.', color: 'green' }); invalidateApmAdmin(qc); },
    onError: (error) => { notifications.show({ title: 'Error', message: getApiErrorMessage(error), color: 'red' }); },
  });
}

// ── Result Hooks ────────────────────────────────────────────

export function useResultDashboard() {
  return useQuery({ queryKey: ['apm-admin', 'result-dashboard'], queryFn: () => apmAdminApi.getResultDashboard(), staleTime: 2 * 60 * 1000 });
}

export function useResults(params?: Record<string, string | number>) {
  return useQuery({ queryKey: ['apm-admin', 'results', params], queryFn: () => apmAdminApi.listResults(params), staleTime: 2 * 60 * 1000 });
}

export function useResultsByLga(lgaId: string) {
  return useQuery({ queryKey: ['apm-admin', 'results', lgaId], queryFn: () => apmAdminApi.listResultsByLga(lgaId), enabled: !!lgaId, staleTime: 2 * 60 * 1000 });
}

export function useCreateResult() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateResultPayload) => apmAdminApi.createResult(data),
    onSuccess: () => { notifications.show({ title: 'Submitted', message: 'Result entry created.', color: 'green' }); invalidateApmAdmin(qc); },
    onError: (error) => { notifications.show({ title: 'Error', message: getApiErrorMessage(error), color: 'red' }); },
  });
}

export function useVerifyResult() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apmAdminApi.verifyResult(id),
    onSuccess: () => { notifications.show({ title: 'Verified', message: 'Result verified.', color: 'green' }); invalidateApmAdmin(qc); },
    onError: (error) => { notifications.show({ title: 'Error', message: getApiErrorMessage(error), color: 'red' }); },
  });
}

// ── Incident Hooks ──────────────────────────────────────────

export function useIncidentStats() {
  return useQuery({ queryKey: ['apm-admin', 'incident-stats'], queryFn: () => apmAdminApi.getIncidentStats(), staleTime: 2 * 60 * 1000 });
}

export function useIncidents(params?: Record<string, string | number>) {
  return useQuery({ queryKey: ['apm-admin', 'incidents', params], queryFn: () => apmAdminApi.listIncidents(params), staleTime: 2 * 60 * 1000 });
}

export function useCreateIncident() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateIncidentPayload) => apmAdminApi.createIncident(data),
    onSuccess: () => { notifications.show({ title: 'Reported', message: 'Incident reported.', color: 'green' }); invalidateApmAdmin(qc); },
    onError: (error) => { notifications.show({ title: 'Error', message: getApiErrorMessage(error), color: 'red' }); },
  });
}

export function useUpdateIncident() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateIncidentPayload }) => apmAdminApi.updateIncident(id, data),
    onSuccess: () => { notifications.show({ title: 'Updated', message: 'Incident updated.', color: 'green' }); invalidateApmAdmin(qc); },
    onError: (error) => { notifications.show({ title: 'Error', message: getApiErrorMessage(error), color: 'red' }); },
  });
}

// ── GOTV Hooks ──────────────────────────────────────────────

export function useGotvStats() {
  return useQuery({ queryKey: ['apm-admin', 'gotv-stats'], queryFn: () => apmAdminApi.getGotvStats(), staleTime: 5 * 60 * 1000 });
}

export function useGotvRecords(params?: Record<string, string | number>) {
  return useQuery({ queryKey: ['apm-admin', 'gotv', params], queryFn: () => apmAdminApi.listGotv(params), staleTime: 5 * 60 * 1000 });
}

export function useGotvByPu(pollingUnitId: string) {
  return useQuery({ queryKey: ['apm-admin', 'gotv-pu', pollingUnitId], queryFn: () => apmAdminApi.listGotvByPu(pollingUnitId), enabled: !!pollingUnitId, staleTime: 5 * 60 * 1000 });
}

export function useCreateGotv() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateGotvPayload) => apmAdminApi.createGotv(data),
    onSuccess: () => { notifications.show({ title: 'Logged', message: 'GOTV record created.', color: 'green' }); invalidateApmAdmin(qc); },
    onError: (error) => { notifications.show({ title: 'Error', message: getApiErrorMessage(error), color: 'red' }); },
  });
}

export function useUpdateGotv() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateGotvPayload }) => apmAdminApi.updateGotv(id, data),
    onSuccess: () => { notifications.show({ title: 'Updated', message: 'GOTV record updated.', color: 'green' }); invalidateApmAdmin(qc); },
    onError: (error) => { notifications.show({ title: 'Error', message: getApiErrorMessage(error), color: 'red' }); },
  });
}
