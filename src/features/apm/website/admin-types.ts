export interface Lga {
  id: string;
  name: string;
  code: string;
  region: string | null;
  displayOrder: number;
}

export interface Ward {
  id: string;
  name: string;
  code: string;
  lgaId: string;
  displayOrder: number;
}

export interface PollingUnit {
  id: string;
  _id?: string;
  code: string;
  name: string;
  wardId: string;
  lgaId: string;
  registeredVoters: number;
  pastResultApm: number;
  pastResultPdp: number;
  pastResultApc: number;
  pastResultOther: number;
  latitude: string | null;
  longitude: string | null;
  riskLevel: string;
  conversionStatus: string;
  assignedAgentName: string | null;
  assignedAgentPhone: string | null;
  notes: string | null;
}

export interface Stakeholder {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  role: string | null;
  lgaId: string;
  wardId: string | null;
  affiliation: string | null;
  influenceLevel: string;
  conversionStatus: string;
  notes: string | null;
  activities?: ConversionActivity[];
}

export interface ConversionScore {
  id: string;
  entityType: string;
  entityId: string;
  score: number;
  status: string;
  lastAssessedAt: string | null;
  assessedBy: string | null;
  notes: string | null;
}

export interface ConversionActivity {
  id: string;
  stakeholderId: string;
  type: string;
  notes: string | null;
  outcome: string | null;
  conductedBy: string | null;
  conductedAt: string;
  followUpDate: string | null;
}

export interface WhatsAppGroup {
  id: string;
  level: string;
  name: string;
  parentId: string | null;
  description: string | null;
  groupLink: string | null;
  adminName: string | null;
  adminPhone: string | null;
  memberCount: number;
}

export interface ConversionDashboard {
  summary: {
    totalLgas: number;
    totalWards: number;
    totalPollingUnits: number;
    totalStakeholders: number;
  };
  conversion: {
    apmFriendlyPollingUnits: number;
    contestedPollingUnits: number;
    untouchedPollingUnits: number;
    greenLgas: number;
    redLgas: number;
    greenWards: number;
    redWards: number;
  };
  lgas: Lga[];
  scores: ConversionScore[];
}

export interface LgaConversionRow {
  id: string;
  name: string;
  code: string;
  score: number;
  status: string;
  wardCount: number;
  pollingUnitCount: number;
  wonPollingUnits: number;
  lastAssessed: string | null;
}

export interface WardConversionRow {
  id: string;
  name: string;
  code: string;
  score: number;
  status: string;
  pollingUnitCount: number;
  wonPollingUnits: number;
  lastAssessed: string | null;
}

export interface CreateStakeholderPayload {
  name: string;
  phone?: string;
  email?: string;
  role?: string;
  lgaId: string;
  wardId?: string;
  affiliation?: string;
  influenceLevel?: string;
  conversionStatus?: string;
  notes?: string;
}

export interface UpdateStakeholderPayload {
  name?: string;
  phone?: string;
  email?: string;
  role?: string;
  lgaId?: string;
  wardId?: string;
  affiliation?: string;
  influenceLevel?: string;
  conversionStatus?: string;
  notes?: string;
}

export interface UpdateConversionScorePayload {
  score: number;
  status?: string;
  assessedBy?: string;
  notes?: string;
}

export interface UpdatePollingUnitPayload {
  name?: string;
  registeredVoters?: number;
  pastResultApm?: number;
  pastResultPdp?: number;
  pastResultApc?: number;
  pastResultOther?: number;
  riskLevel?: string;
  conversionStatus?: string;
  assignedAgentName?: string;
  assignedAgentPhone?: string;
  notes?: string;
}

export interface CreateWhatsAppGroupPayload {
  level: string;
  name: string;
  parentId?: string;
  description?: string;
  groupLink?: string;
  adminName?: string;
  adminPhone?: string;
  memberCount?: number;
}

export interface CreateActivityPayload {
  type: string;
  notes?: string;
  outcome?: string;
  conductedBy?: string;
  conductedAt?: string;
  followUpDate?: string;
}

// ── Canvassing ────────────────────────────────────────────

export interface CanvassingSession {
  id: string;
  title: string;
  lgaId: string;
  wardId: string | null;
  teamLead: string | null;
  teamSize: number;
  status: string;
  scheduledDate: string | null;
  completedDate: string | null;
  notes: string | null;
  visits?: CanvassingVisit[];
}

export interface CanvassingVisit {
  id: string;
  sessionId: string;
  name: string;
  phone: string | null;
  address: string | null;
  supportLevel: string | null;
  issues: string | null;
  outcome: string | null;
  contactedAt: string;
}

export interface VolunteerAssignment {
  id: string;
  volunteerId: string;
  lgaId: string;
  wardId: string | null;
  role: string | null;
  status: string;
  assignedAt: string;
  notes: string | null;
}

export interface SentimentDashboard {
  total: number;
  positive: number;
  negative: number;
  neutral: number;
  sentimentScore: number;
  topicBreakdown: { topic: string; count: number }[];
  byLga: { lga: string; positive: number; negative: number; neutral: number; total: number }[];
}

export interface CanvassingStats {
  total: number;
  planned: number;
  inProgress: number;
  completed: number;
  totalVisits: number;
}

export interface VisitStats {
  total: number;
  strong: number;
  leaning: number;
  undecided: number;
  opposed: number;
  supportRate: number;
}

export interface VolunteerStats {
  totalVolunteers: number;
  totalAssignments: number;
  activeAssignments: number;
}

export interface CreateCanvassingSessionPayload {
  title: string;
  lgaId: string;
  wardId?: string;
  teamLead?: string;
  teamSize?: number;
  scheduledDate?: string;
  notes?: string;
}

export interface UpdateCanvassingSessionPayload {
  title?: string;
  status?: string;
  teamLead?: string;
  teamSize?: number;
  completedDate?: string;
  notes?: string;
}

export interface CreateCanvassingVisitPayload {
  name: string;
  phone?: string;
  address?: string;
  supportLevel?: string;
  issues?: string;
  outcome?: string;
  contactedAt?: string;
}

export interface CreateVolunteerAssignmentPayload {
  volunteerId: string;
  lgaId: string;
  wardId?: string;
  role?: string;
  notes?: string;
}

export interface UpdateVolunteerAssignmentPayload {
  wardId?: string;
  role?: string;
  status?: string;
  notes?: string;
}

// ── Candidate Tours ──────────────────────────────────────

export interface CandidateTour {
  id: string;
  title: string;
  lgaId: string;
  wardId: string | null;
  visitType: string;
  tourDate: string | null;
  description: string | null;
  expectedAttendees: number;
  actualAttendees: number;
  stakeholdersMet: string | null;
  commitments: string | null;
  complaints: string | null;
  volunteerSignups: number;
  mediaCoverage: string | null;
  notes: string | null;
  status: string;
}

export interface TourStats {
  total: number;
  completed: number;
  planned: number;
  cancelled: number;
  totalAttendees: number;
  totalSignups: number;
}

// ── Content Assets ───────────────────────────────────────

export interface ContentAsset {
  id: string;
  title: string;
  type: string;
  lgaId: string | null;
  targetAudience: string | null;
  messageKey: string | null;
  assetUrl: string;
  language: string | null;
  tags: string | null;
  status: string;
}

// ── Listening Mentions ──────────────────────────────────

export interface ListeningMention {
  id: string;
  platform: string;
  mentionUrl: string | null;
  title: string;
  content: string | null;
  sentiment: string | null;
  reach: number;
  mentionedAt: string | null;
  source: string | null;
  category: string | null;
  isUrgent: boolean;
  status: string;
}

export interface ListeningStats {
  total: number;
  urgent: number;
  facebook: number;
  whatsapp: number;
  twitter: number;
  tiktok: number;
  instagram: number;
}

// ── Rapid Responses ─────────────────────────────────────

export interface RapidResponse {
  id: string;
  mentionId: string;
  responseType: string;
  content: string;
  publishedAt: string;
  publishedBy: string | null;
  platform: string | null;
  effectiveness: string | null;
}

export interface CreateCandidateTourPayload {
  title: string;
  lgaId: string;
  wardId?: string;
  visitType?: string;
  tourDate?: string;
  description?: string;
  expectedAttendees?: number;
  notes?: string;
}

export interface UpdateCandidateTourPayload {
  title?: string;
  visitType?: string;
  tourDate?: string;
  description?: string;
  actualAttendees?: number;
  stakeholdersMet?: string;
  commitments?: string;
  complaints?: string;
  volunteerSignups?: number;
  mediaCoverage?: string;
  notes?: string;
  status?: string;
}

export interface CreateContentAssetPayload {
  title: string;
  type: string;
  assetUrl: string;
  lgaId?: string;
  targetAudience?: string;
  messageKey?: string;
  language?: string;
  tags?: string;
}

export interface CreateListeningMentionPayload {
  platform: string;
  title: string;
  mentionUrl?: string;
  content?: string;
  sentiment?: string;
  reach?: number;
  mentionedAt?: string;
  source?: string;
  category?: string;
  isUrgent?: boolean;
}

export interface CreateRapidResponsePayload {
  mentionId: string;
  responseType?: string;
  content: string;
  publishedBy?: string;
  platform?: string;
}

// ── Polling Agents ──────────────────────────────────────────

export interface PollingAgent {
  id: string;
  pollingUnitId: string;
  name: string;
  phone: string;
  role: string;
  trainingStatus: string;
  assignedAt: string | null;
  notes: string | null;
  isActive: boolean;
}

export interface AgentStats {
  total: number;
  trained: number;
  assigned: number;
  agent: number;
  backup: number;
  supervisor: number;
}

export interface CreateAgentPayload {
  pollingUnitId: string;
  name: string;
  phone: string;
  role?: string;
}

export interface UpdateAgentPayload {
  name?: string;
  phone?: string;
  role?: string;
  trainingStatus?: string;
  notes?: string;
  isActive?: boolean;
}

// ── Result Entries ──────────────────────────────────────────

export interface ResultEntry {
  id: string;
  pollingUnitId: string;
  lgaId: string;
  wardId: string;
  apmVotes: number;
  pdpVotes: number;
  apcVotes: number;
  otherVotes: number;
  totalVotes: number;
  registeredVoters: number;
  photoUrl: string | null;
  enteredBy: string | null;
  status: string;
  notes: string | null;
  createdAt: string;
}

export interface ResultDashboard {
  total: number;
  submitted: number;
  verified: number;
  totalApmVotes: number;
  totalPdpVotes: number;
  totalApcVotes: number;
}

export interface CreateResultPayload {
  pollingUnitId: string;
  lgaId: string;
  wardId: string;
  apmVotes: number;
  pdpVotes: number;
  apcVotes: number;
  otherVotes?: number;
  registeredVoters: number;
  photoUrl?: string;
  enteredBy?: string;
  notes?: string;
}

// ── Incident Reports ────────────────────────────────────────

export interface IncidentReport {
  id: string;
  pollingUnitId: string | null;
  type: string;
  description: string;
  severity: string;
  reportedBy: string | null;
  reportedAt: string | null;
  status: string;
  legalEscalation: boolean;
  securityEscalation: boolean;
  notes: string | null;
}

export interface IncidentStats {
  total: number;
  open: number;
  critical: number;
  escalated: number;
}

export interface CreateIncidentPayload {
  pollingUnitId?: string;
  type: string;
  description: string;
  severity?: string;
  reportedBy?: string;
}

export interface UpdateIncidentPayload {
  status?: string;
  legalEscalation?: boolean;
  securityEscalation?: boolean;
  notes?: string;
}

// ── GOTV Records ────────────────────────────────────────────

export interface GotvRecord {
  id: string;
  pollingUnitId: string;
  supporterName: string;
  supporterPhone: string | null;
  contacted: boolean;
  turnedOut: boolean;
  contactedVia: string | null;
  contactedAt: string | null;
  notes: string | null;
}

export interface GotvStats {
  total: number;
  contacted: number;
  turnedOut: number;
  turnoutRate: number;
}

export interface CreateGotvPayload {
  pollingUnitId: string;
  supporterName: string;
  supporterPhone?: string;
  contactedVia?: string;
  notes?: string;
}

export interface UpdateGotvPayload {
  contacted?: boolean;
  turnedOut?: boolean;
  contactedVia?: string;
  notes?: string;
}
