import { createFileRoute } from '@tanstack/react-router';
import { RxExchangeDetailsPage } from '@/features/rxsoft/pages';

export const Route = createFileRoute('/_authenticated/conversation/exchanges/$exchangeId')({
  component: ExchangeDetailsRoute,
});

function ExchangeDetailsRoute() {
  const { exchangeId } = Route.useParams();
  return <RxExchangeDetailsPage exchangeId={exchangeId} />;
}
