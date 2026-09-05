import { createFileRoute } from '@tanstack/react-router';
import PrivacyPage from '@/features/damorex/pages/privacy';

export const Route = createFileRoute('/shop/privacy-policy')({
  component: PrivacyPage,
});
