import { createFileRoute } from '@tanstack/react-router';
import { modules } from '@/features/shared/module-data';
import { GenericViewPage } from '@/features/components/view/generic-view-page';

export const Route = createFileRoute('/_authenticated/$moduleId/$page/$id')({
  component: () => {
    const { page, id } = Route.useParams();
    return <GenericViewPage page={page} id={id} />;
  },
});

function findModuleForResource(page: string) {
  return modules.find((m) => m.resources.includes(page));
}
