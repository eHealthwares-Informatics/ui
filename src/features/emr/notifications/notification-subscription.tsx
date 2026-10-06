import { useAuthStore } from '@/stores/auth-store';
import { useNotificationSubscription } from './use-notifications';

export function NotificationSubscriptionRegistrar() {
  const user = useAuthStore((state) => state.user);

  useNotificationSubscription(
    user ? { organizationId: user.organizationId, locationId: user.locationId } : null,
    Boolean(user)
  );

  return null;
}
