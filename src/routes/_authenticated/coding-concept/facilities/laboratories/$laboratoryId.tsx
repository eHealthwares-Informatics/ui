import { createFileRoute } from '@tanstack/react-router';
import { CodedLaboratoryDetailPage } from '@/features/coding-concept/pages';

export const Route = createFileRoute(
  '/_authenticated/coding-concept/facilities/laboratories/$laboratoryId',
)({
  component: CodedLaboratoryDetailRoute,
});

function CodedLaboratoryDetailRoute() {
  const { laboratoryId } = Route.useParams();
  return <CodedLaboratoryDetailPage laboratoryId={laboratoryId} />;
}
