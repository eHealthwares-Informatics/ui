import { useAuthStore } from '@/stores/auth-store';
import { useNotificationSubscription } from './use-notifications';

export function NotificationSubscriptionRegistrar() {
  const user = useAuthStore((state) => state.user);

  // Tenant (org/location) is resolved from the JWT on EMR — send an empty body.
  useNotificationSubscription(user ? {} : null, Boolean(user));

  return null;
}
