import { createFileRoute } from '@tanstack/react-router';
import ShopMedicineDetailPage from '@/features/shop/shop/medicine-detail';

export const Route = createFileRoute('/shop/medicines/$code')({
  component: MedicineDetailRoute,
});

function MedicineDetailRoute() {
  const { code } = Route.useParams();
  return <ShopMedicineDetailPage code={code} />;
}