import { createFileRoute } from '@tanstack/react-router';
import ShopConversationPage from '@/features/shop/conversation/page';

export const Route = createFileRoute('/shop/conversation')({
  component: ShopConversationPage,
});
