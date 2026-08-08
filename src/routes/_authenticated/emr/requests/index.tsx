import { createFileRoute } from '@tanstack/react-router';
import { EmrResourcePage } from '@/features/emr/pages/resource-page';
import { emrResources } from '@/features/emr/lib/emr-resources';

export const Route = createFileRoute('/_authenticated/emr/requests/')({
  component: () => <EmrResourcePage config={emrResources.requests} />,
});
