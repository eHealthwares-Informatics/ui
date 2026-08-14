import axios from 'axios';
import type {
  HomepageData,
  Achievement,
  AgendaItem,
  NewsArticle,
  CampaignEvent,
  Testimonial,
  MediaAsset,
  PaginatedResponse,
  VolunteerPayload,
  JoinMovementPayload,
  ContactPayload,
  EventRegistrationPayload,
  CitizenFeedbackPayload,
  IssueReportPayload,
  DonationPayload,
} from './types';

const api = axios.create({
  baseURL: import.meta.env.VITE_APM_API_URL || '/api',
});

export const apmApi = {
  // Homepage
  getHomepage: () => api.get<HomepageData>('/apm/homepage').then((r) => r.data),

  // Agenda
  listAgenda: () => api.get<AgendaItem[]>('/apm/agenda').then((r) => r.data),

  // Achievements
  listAchievements: () => api.get<Achievement[]>('/apm/achievements').then((r) => r.data),

  // News
  listNews: (params?: Record<string, string | number>) =>
    api.get<PaginatedResponse<NewsArticle>>('/apm/news', { params }).then((r) => r.data),

  getNewsBySlug: (slug: string) =>
    api.get<NewsArticle>(`/apm/news/${slug}`).then((r) => r.data),

  // Events
  listEvents: () => api.get<CampaignEvent[]>('/apm/events').then((r) => r.data),

  getEvent: (id: string) => api.get<CampaignEvent>(`/apm/events/${id}`).then((r) => r.data),

  registerForEvent: (eventId: string, data: EventRegistrationPayload) =>
    api.post(`/apm/events/${eventId}/register`, data).then((r) => r.data),

  // Volunteer
  registerVolunteer: (data: VolunteerPayload) =>
    api.post('/apm/volunteer', data).then((r) => r.data),

  // Join Movement
  joinMovement: (data: JoinMovementPayload) =>
    api.post('/apm/join', data).then((r) => r.data),

  // Contact
  submitContact: (data: ContactPayload) =>
    api.post('/apm/contact', data).then((r) => r.data),

  // Newsletter
  subscribeNewsletter: (data: { email: string; phone?: string }) =>
    api.post('/apm/newsletter', data).then((r) => r.data),

  // Citizens Speak
  submitFeedback: (data: CitizenFeedbackPayload) =>
    api.post('/apm/citizens-speak', data).then((r) => r.data),

  // Report Issue
  reportIssue: (data: IssueReportPayload) =>
    api.post('/apm/report', data).then((r) => r.data),

  // Media
  listMedia: () => api.get<MediaAsset[]>('/apm/media').then((r) => r.data),

  // Testimonials
  listTestimonials: () => api.get<Testimonial[]>('/apm/testimonials').then((r) => r.data),

  // Donate
  donate: (data: DonationPayload) =>
    api.post('/apm/donate', data).then((r) => r.data),
};
