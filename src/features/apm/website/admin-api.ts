import { rxsoftApi } from '@/lib/rxsoft-api';
import type {
  Lga,
  Ward,
  PollingUnit,
  Stakeholder,
  ConversionDashboard,
  LgaConversionRow,
  WardConversionRow,
  WhatsAppGroup,
  CreateStakeholderPayload,
  UpdateStakeholderPayload,
  UpdateConversionScorePayload,
  UpdatePollingUnitPayload,
  CreateWhatsAppGroupPayload,
  CreateActivityPayload,
  CanvassingSession,
  CanvassingVisit,
  VolunteerAssignment,
  SentimentDashboard,
  CanvassingStats,
  VisitStats,
  VolunteerStats,
  CreateCanvassingSessionPayload,
  UpdateCanvassingSessionPayload,
  CreateCanvassingVisitPayload,
  CreateVolunteerAssignmentPayload,
  UpdateVolunteerAssignmentPayload,
  CandidateTour,
  TourStats,
  ContentAsset,
  ListeningMention,
  ListeningStats,
  RapidResponse,
  CreateCandidateTourPayload,
  UpdateCandidateTourPayload,
  CreateContentAssetPayload,
  CreateListeningMentionPayload,
  CreateRapidResponsePayload,
} from './admin-types';
import type {
  PollingAgent,
  AgentStats,
  CreateAgentPayload,
  UpdateAgentPayload,
  ResultEntry,
  ResultDashboard,
  CreateResultPayload,
  IncidentReport,
  IncidentStats,
  CreateIncidentPayload,
  UpdateIncidentPayload,
  GotvRecord,
  GotvStats,
  CreateGotvPayload,
  UpdateGotvPayload,
} from './admin-types';
import type { Stakeholder as StakeholderFull } from './admin-types';
import type { PaginatedResponse } from './types';

export const apmAdminApi = {
  // ── Public Data ──────────────────────────────────────────────

  listLgas: () => rxsoftApi.get<Lga[]>('/apm/data/lgas').then((r) => r.data),

  listWards: (lgaId: string) =>
    rxsoftApi.get<Ward[]>(`/apm/data/lgas/${lgaId}/wards`).then((r) => r.data),

  listPollingUnits: (wardId: string) =>
    rxsoftApi.get<PollingUnit[]>(`/apm/data/wards/${wardId}/polling-units`).then((r) => r.data),

  getPollingUnit: (id: string) =>
    rxsoftApi.get<PollingUnit>(`/apm/data/polling-units/${id}`).then((r) => r.data),

  searchPollingUnits: (query: string) =>
    rxsoftApi.get<PollingUnit[]>(`/apm/data/polling-units/search/${query}`).then((r) => r.data),

  // ── Conversion Dashboard ───────────────────────────────────

  getConversionDashboard: () =>
    rxsoftApi.get<ConversionDashboard>('/apm/conversion/dashboard').then((r) => r.data),

  getLgaConversionDashboard: () =>
    rxsoftApi.get<LgaConversionRow[]>('/apm/conversion/lgas').then((r) => r.data),

  getWardConversionDashboard: (lgaId: string) =>
    rxsoftApi.get<WardConversionRow[]>(`/apm/conversion/wards/${lgaId}`).then((r) => r.data),

  getWardPollingUnits: (wardId: string) =>
    rxsoftApi.get<PollingUnit[]>(`/apm/conversion/polling-units/${wardId}`).then((r) => r.data),

  updateConversionScore: (
    entityType: string,
    entityId: string,
    data: UpdateConversionScorePayload
  ) => rxsoftApi.put(`/apm/conversion/score/${entityType}/${entityId}`, data).then((r) => r.data),

  updatePollingUnit: (id: string, data: UpdatePollingUnitPayload) =>
    rxsoftApi.put(`/apm/conversion/polling-units/${id}`, data).then((r) => r.data),

  // ── Stakeholders ──────────────────────────────────────────

  listStakeholders: (params?: Record<string, string | number>) =>
    rxsoftApi
      .get<PaginatedResponse<Stakeholder>>('/apm/stakeholders', { params })
      .then((r) => r.data),

  listStakeholdersByLga: (lgaId: string, params?: Record<string, string | number>) =>
    rxsoftApi
      .get<PaginatedResponse<Stakeholder>>(`/apm/stakeholders/lga/${lgaId}`, { params })
      .then((r) => r.data),

  getStakeholder: (id: string) =>
    rxsoftApi.get<StakeholderFull>(`/apm/stakeholders/${id}`).then((r) => r.data),

  createStakeholder: (data: CreateStakeholderPayload) =>
    rxsoftApi.post('/apm/stakeholders', data).then((r) => r.data),

  updateStakeholder: (id: string, data: UpdateStakeholderPayload) =>
    rxsoftApi.put(`/apm/stakeholders/${id}`, data).then((r) => r.data),

  // ── Activities ────────────────────────────────────────────

  createActivity: (stakeholderId: string, data: CreateActivityPayload) =>
    rxsoftApi.post(`/apm/stakeholders/${stakeholderId}/activities`, data).then((r) => r.data),

  listActivities: (stakeholderId: string) =>
    rxsoftApi.get(`/apm/stakeholders/${stakeholderId}/activities`).then((r) => r.data),

  // ── WhatsApp Groups ───────────────────────────────────────

  listWhatsAppGroups: (level?: string) =>
    rxsoftApi
      .get<WhatsAppGroup[]>('/apm/whatsapp/groups', { params: { level } })
      .then((r) => r.data),

  createWhatsAppGroup: (data: CreateWhatsAppGroupPayload) =>
    rxsoftApi.post('/apm/whatsapp/groups', data).then((r) => r.data),

  // ── Canvassing ────────────────────────────────────────────

  getCanvassingStats: () =>
    rxsoftApi.get<CanvassingStats>('/apm/canvassing/stats').then((r) => r.data),

  listCanvassingSessions: (params?: Record<string, string | number>) =>
    rxsoftApi
      .get<PaginatedResponse<CanvassingSession>>('/apm/canvassing/sessions', { params })
      .then((r) => r.data),

  getCanvassingSession: (id: string) =>
    rxsoftApi.get<CanvassingSession>(`/apm/canvassing/sessions/${id}`).then((r) => r.data),

  createCanvassingSession: (data: CreateCanvassingSessionPayload) =>
    rxsoftApi.post('/apm/canvassing/sessions', data).then((r) => r.data),

  updateCanvassingSession: (id: string, data: UpdateCanvassingSessionPayload) =>
    rxsoftApi.put(`/apm/canvassing/sessions/${id}`, data).then((r) => r.data),

  listSessionVisits: (sessionId: string) =>
    rxsoftApi
      .get<CanvassingVisit[]>(`/apm/canvassing/sessions/${sessionId}/visits`)
      .then((r) => r.data),

  getSessionVisitStats: (sessionId: string) =>
    rxsoftApi
      .get<VisitStats>(`/apm/canvassing/sessions/${sessionId}/visit-stats`)
      .then((r) => r.data),

  addSessionVisit: (sessionId: string, data: CreateCanvassingVisitPayload) =>
    rxsoftApi.post(`/apm/canvassing/sessions/${sessionId}/visits`, data).then((r) => r.data),

  getAllVisitStats: () =>
    rxsoftApi.get<VisitStats>('/apm/canvassing/visits/stats').then((r) => r.data),

  // ── Sentiment ─────────────────────────────────────────────

  getSentimentDashboard: () =>
    rxsoftApi.get<SentimentDashboard>('/apm/sentiment').then((r) => r.data),

  // ── Volunteer Assignments ─────────────────────────────────

  listVolunteerAssignments: (params?: Record<string, string | number>) =>
    rxsoftApi
      .get<PaginatedResponse<VolunteerAssignment>>('/apm/volunteer-assignments', { params })
      .then((r) => r.data),

  listAssignmentsByWard: (wardId: string) =>
    rxsoftApi
      .get<VolunteerAssignment[]>(`/apm/volunteer-assignments/ward/${wardId}`)
      .then((r) => r.data),

  createVolunteerAssignment: (data: CreateVolunteerAssignmentPayload) =>
    rxsoftApi.post('/apm/volunteer-assignments', data).then((r) => r.data),

  updateVolunteerAssignment: (id: string, data: UpdateVolunteerAssignmentPayload) =>
    rxsoftApi.put(`/apm/volunteer-assignments/${id}`, data).then((r) => r.data),

  getVolunteerStats: () =>
    rxsoftApi.get<VolunteerStats>('/apm/volunteer-assignments/stats').then((r) => r.data),

  // ── Candidate Tours ─────────────────────────────────────

  listTours: (params?: Record<string, string | number>) =>
    rxsoftApi.get<PaginatedResponse<CandidateTour>>('/apm/tours', { params }).then((r) => r.data),

  getTour: (id: string) => rxsoftApi.get<CandidateTour>(`/apm/tours/${id}`).then((r) => r.data),

  getTourStats: () => rxsoftApi.get<TourStats>('/apm/tours/stats').then((r) => r.data),

  createTour: (data: CreateCandidateTourPayload) =>
    rxsoftApi.post('/apm/tours', data).then((r) => r.data),

  updateTour: (id: string, data: UpdateCandidateTourPayload) =>
    rxsoftApi.put(`/apm/tours/${id}`, data).then((r) => r.data),

  // ── Content Assets ─────────────────────────────────────

  listContent: (params?: Record<string, string | number>) =>
    rxsoftApi.get<PaginatedResponse<ContentAsset>>('/apm/content', { params }).then((r) => r.data),

  createContent: (data: CreateContentAssetPayload) =>
    rxsoftApi.post('/apm/content', data).then((r) => r.data),

  // ── Listening Mentions ────────────────────────────────

  listMentions: (params?: Record<string, string | number>) =>
    rxsoftApi
      .get<PaginatedResponse<ListeningMention>>('/apm/listening', { params })
      .then((r) => r.data),

  getMention: (id: string) =>
    rxsoftApi.get<ListeningMention>(`/apm/listening/${id}`).then((r) => r.data),

  getListeningStats: () =>
    rxsoftApi.get<ListeningStats>('/apm/listening/stats').then((r) => r.data),

  createMention: (data: CreateListeningMentionPayload) =>
    rxsoftApi.post('/apm/listening', data).then((r) => r.data),

  updateMentionStatus: (id: string, status: string) =>
    rxsoftApi.put(`/apm/listening/${id}/status`, { status }).then((r) => r.data),

  // ── Truth Desk / Rapid Responses ──────────────────────

  listResponses: (mentionId: string) =>
    rxsoftApi.get<RapidResponse[]>(`/apm/truth-desk/${mentionId}/responses`).then((r) => r.data),

  createResponse: (data: CreateRapidResponsePayload) =>
    rxsoftApi.post('/apm/truth-desk', data).then((r) => r.data),

  // ── Polling Agents ──────────────────────────────────────────

  listAgents: (params?: Record<string, string | number>) =>
    rxsoftApi.get<PaginatedResponse<PollingAgent>>('/apm/agents', { params }).then((r) => r.data),

  getAgentStats: () => rxsoftApi.get<AgentStats>('/apm/agents/stats').then((r) => r.data),

  getAgent: (id: string) => rxsoftApi.get<PollingAgent>(`/apm/agents/${id}`).then((r) => r.data),

  createAgent: (data: CreateAgentPayload) =>
    rxsoftApi.post('/apm/agents', data).then((r) => r.data),

  updateAgent: (id: string, data: UpdateAgentPayload) =>
    rxsoftApi.put(`/apm/agents/${id}`, data).then((r) => r.data),

  // ── Result Entries ──────────────────────────────────────────

  listResults: (params?: Record<string, string | number>) =>
    rxsoftApi.get<PaginatedResponse<ResultEntry>>('/apm/results', { params }).then((r) => r.data),

  getResultDashboard: () =>
    rxsoftApi.get<ResultDashboard>('/apm/results/dashboard').then((r) => r.data),

  listResultsByLga: (lgaId: string) =>
    rxsoftApi.get<ResultEntry[]>(`/apm/results/lga/${lgaId}`).then((r) => r.data),

  getResult: (id: string) => rxsoftApi.get<ResultEntry>(`/apm/results/${id}`).then((r) => r.data),

  createResult: (data: CreateResultPayload) =>
    rxsoftApi.post('/apm/results', data).then((r) => r.data),

  verifyResult: (id: string) => rxsoftApi.put(`/apm/results/${id}/verify`, {}).then((r) => r.data),

  // ── Incident Reports ────────────────────────────────────────

  listIncidents: (params?: Record<string, string | number>) =>
    rxsoftApi
      .get<PaginatedResponse<IncidentReport>>('/apm/incidents', { params })
      .then((r) => r.data),

  getIncidentStats: () => rxsoftApi.get<IncidentStats>('/apm/incidents/stats').then((r) => r.data),

  createIncident: (data: CreateIncidentPayload) =>
    rxsoftApi.post('/apm/incidents', data).then((r) => r.data),

  updateIncident: (id: string, data: UpdateIncidentPayload) =>
    rxsoftApi.put(`/apm/incidents/${id}`, data).then((r) => r.data),

  // ── GOTV Records ────────────────────────────────────────────

  listGotv: (params?: Record<string, string | number>) =>
    rxsoftApi.get<PaginatedResponse<GotvRecord>>('/apm/gotv', { params }).then((r) => r.data),

  getGotvStats: () => rxsoftApi.get<GotvStats>('/apm/gotv/stats').then((r) => r.data),

  listGotvByPu: (pollingUnitId: string) =>
    rxsoftApi.get<GotvRecord[]>(`/apm/gotv/pu/${pollingUnitId}`).then((r) => r.data),

  createGotv: (data: CreateGotvPayload) => rxsoftApi.post('/apm/gotv', data).then((r) => r.data),

  updateGotv: (id: string, data: UpdateGotvPayload) =>
    rxsoftApi.put(`/apm/gotv/${id}`, data).then((r) => r.data),
};
