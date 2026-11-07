import { createFileRoute } from '@tanstack/react-router';
import { RxWebsitePrescriptionDetailPage } from '@/features/rxsoft/pages';

export const Route = createFileRoute(
  '/_authenticated/rxsoft/website-prescriptions/$prescriptionId'
)({
  component: PrescriptionDetailRoute,
});

function PrescriptionDetailRoute() {
  const { prescriptionId } = Route.useParams();
  return <RxWebsitePrescriptionDetailPage prescriptionId={prescriptionId} />;
}
