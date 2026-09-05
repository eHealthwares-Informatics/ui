import { createFileRoute } from '@tanstack/react-router';
import UploadPrescriptionPage from '@/features/damorex/prescriptions/upload';

export const Route = createFileRoute('/shop/upload-prescription')({
  component: UploadPrescriptionPage,
});
