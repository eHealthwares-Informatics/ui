import { createFileRoute } from '@tanstack/react-router';
import { CodedPharmacyDetailPage } from '@/features/coding-concept/pages';

export const Route = createFileRoute(
  '/_authenticated/coding-concept/facilities/pharmacies/$pharmacyId',
)({
  component: CodedPharmacyDetailRoute,
});

function CodedPharmacyDetailRoute() {
  const { pharmacyId } = Route.useParams();
  return <CodedPharmacyDetailPage pharmacyId={pharmacyId} />;
}
