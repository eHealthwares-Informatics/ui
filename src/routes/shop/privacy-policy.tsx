import { createFileRoute } from '@tanstack/react-router';
import PrivacyPage from '@/features/shop/pages/privacy';

export const Route = createFileRoute('/shop/privacy-policy')({
  component: PrivacyPage,
});
