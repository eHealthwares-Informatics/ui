import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notifications } from '@mantine/notifications';
import { apmApi } from './api';
import type {
  VolunteerPayload,
  JoinMovementPayload,
  ContactPayload,
  EventRegistrationPayload,
  CitizenFeedbackPayload,
  IssueReportPayload,
  DonationPayload,
} from './types';
import { getApiErrorMessage } from '@/lib/get-api-error-message';

// ── Homepage ─────────────────────────────────────────────────

export function useHomepage() {
  return useQuery({
    queryKey: ['apm', 'homepage'],
    queryFn: () => apmApi.getHomepage(),
    staleTime: 5 * 60 * 1000,
  });
}

// ── Agenda ───────────────────────────────────────────────────

export function useAgenda() {
  return useQuery({
    queryKey: ['apm', 'agenda'],
    queryFn: () => apmApi.listAgenda(),
    staleTime: 10 * 60 * 1000,
  });
}

// ── Achievements ─────────────────────────────────────────────

export function useAchievements() {
  return useQuery({
    queryKey: ['apm', 'achievements'],
    queryFn: () => apmApi.listAchievements(),
    staleTime: 10 * 60 * 1000,
  });
}

// ── News ─────────────────────────────────────────────────────

export function useNews(params?: Record<string, string | number>) {
  return useQuery({
    queryKey: ['apm', 'news', params],
    queryFn: () => apmApi.listNews(params),
    staleTime: 5 * 60 * 1000,
  });
}

export function useNewsArticle(slug: string) {
  return useQuery({
    queryKey: ['apm', 'news', slug],
    queryFn: () => apmApi.getNewsBySlug(slug),
    enabled: !!slug,
    staleTime: 10 * 60 * 1000,
  });
}

// ── Events ───────────────────────────────────────────────────

export function useEvents() {
  return useQuery({
    queryKey: ['apm', 'events'],
    queryFn: () => apmApi.listEvents(),
    staleTime: 5 * 60 * 1000,
  });
}

export function useEvent(id: string) {
  return useQuery({
    queryKey: ['apm', 'event', id],
    queryFn: () => apmApi.getEvent(id),
    enabled: !!id,
    staleTime: 10 * 60 * 1000,
  });
}

// ── Media ────────────────────────────────────────────────────

export function useMedia() {
  return useQuery({
    queryKey: ['apm', 'media'],
    queryFn: () => apmApi.listMedia(),
    staleTime: 30 * 60 * 1000,
  });
}

// ── Testimonials ─────────────────────────────────────────────

export function useTestimonials() {
  return useQuery({
    queryKey: ['apm', 'testimonials'],
    queryFn: () => apmApi.listTestimonials(),
    staleTime: 10 * 60 * 1000,
  });
}

// ── Mutations ────────────────────────────────────────────────

function useSimpleMutation<T>(
  fn: (data: T) => Promise<unknown>,
  successMessage: string,
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: () => {
      notifications.show({ title: 'Success', message: successMessage, color: 'green' });
      qc.invalidateQueries({ queryKey: ['apm'] });
    },
    onError: (error) => {
      notifications.show({
        title: 'Error',
        message: getApiErrorMessage(error),
        color: 'red',
      });
    },
  });
}

export function useRegisterVolunteer() {
  return useSimpleMutation<VolunteerPayload>(
    (data) => apmApi.registerVolunteer(data),
    'Thank you for volunteering! We will contact you soon.',
  );
}

export function useJoinMovement() {
  return useSimpleMutation<JoinMovementPayload>(
    (data) => apmApi.joinMovement(data),
    'Welcome to the movement! Together we can build a better Oyo State.',
  );
}

export function useSubmitContact() {
  return useSimpleMutation<ContactPayload>(
    (data) => apmApi.submitContact(data),
    'Message sent successfully! We will respond shortly.',
  );
}

export function useRegisterForEvent(eventId: string) {
  return useSimpleMutation<EventRegistrationPayload>(
    (data) => apmApi.registerForEvent(eventId, data),
    'Registration confirmed!',
  );
}

export function useSubscribeNewsletter() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { email: string; phone?: string }) =>
      apmApi.subscribeNewsletter(data),
    onSuccess: () => {
      notifications.show({
        title: 'Subscribed!',
        message: 'You have been added to our newsletter.',
        color: 'green',
      });
      qc.invalidateQueries({ queryKey: ['apm'] });
    },
    onError: (error) => {
      notifications.show({
        title: 'Error',
        message: getApiErrorMessage(error),
        color: 'red',
      });
    },
  });
}

export function useSubmitFeedback() {
  return useSimpleMutation<CitizenFeedbackPayload>(
    (data) => apmApi.submitFeedback(data),
    'Thank you for your feedback!',
  );
}

export function useReportIssue() {
  return useSimpleMutation<IssueReportPayload>(
    (data) => apmApi.reportIssue(data),
    'Issue reported successfully.',
  );
}

export function useDonate() {
  return useSimpleMutation<DonationPayload>(
    (data) => apmApi.donate(data),
    'Thank you for your donation!',
  );
}
