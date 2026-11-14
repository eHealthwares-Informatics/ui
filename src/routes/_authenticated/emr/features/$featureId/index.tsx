import { createFileRoute } from '@tanstack/react-router';
import { FeaturePage } from '@/features/emr/pages/feature-page';

export const Route = createFileRoute('/_authenticated/emr/features/$featureId/')({
  component: FeaturePage,
});
