import { createFileRoute } from '@tanstack/react-router';
import { CodedDrugClassificationDetailPage } from '@/features/coding-concept/pages';

export const Route = createFileRoute('/_authenticated/coding-concept/drug-classifications/$classificationId')({
  component: DrugClassificationDetailRoute,
});

function DrugClassificationDetailRoute() {
  const { classificationId } = Route.useParams();
  return <CodedDrugClassificationDetailPage classificationId={classificationId} />;
}