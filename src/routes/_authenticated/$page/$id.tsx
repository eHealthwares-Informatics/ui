import { createFileRoute } from '@tanstack/react-router';
import { GenericViewPage } from '@/features/components/view/generic-view-page';
import { modules } from '@/features/shared/module-data';

export const Route = createFileRoute('/_authenticated/$page/$id')({
  component: () => {
    const { page, id } = Route.useParams();
    return <GenericViewPage page={page} id={id} />;
  },
});

function findModuleForResource(page: string) {
  return modules.find((m) => m.resources.includes(page));
}
