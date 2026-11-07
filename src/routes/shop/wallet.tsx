import { createFileRoute } from '@tanstack/react-router';
import WalletPage from '@/features/shop/wallet/page';

export const Route = createFileRoute('/shop/wallet')({
  component: WalletPage,
});
