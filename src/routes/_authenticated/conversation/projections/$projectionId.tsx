import { createFileRoute } from '@tanstack/react-router';
import { RxProjectionDetailsPage } from '@/features/rxsoft/pages';

export const Route = createFileRoute('/_authenticated/conversation/projections/$projectionId')({
  component: ProjectionDetailsRoute,
});

function ProjectionDetailsRoute() {
  const { projectionId } = Route.useParams();
  return <RxProjectionDetailsPage projectionId={projectionId} />;
}
