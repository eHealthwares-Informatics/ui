import { createFileRoute } from '@tanstack/react-router';
import { CodedHospitalDetailPage } from '@/features/coding-concept/pages';

export const Route = createFileRoute(
  '/_authenticated/coding-concept/facilities/hospitals/$hospitalId',
)({
  component: CodedHospitalDetailRoute,
});

function CodedHospitalDetailRoute() {
  const { hospitalId } = Route.useParams();
  return <CodedHospitalDetailPage hospitalId={hospitalId} />;
}
