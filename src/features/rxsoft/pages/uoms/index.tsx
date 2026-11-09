import { FormProvider } from '@/components/form/form-context';
import { DataPageShell } from '@/components/page/data-page-shell';
import { uomsConfig } from './schema';

export function RxUomsPage() {
  return (
    <FormProvider initialState={{}}>
      <DataPageShell config={uomsConfig} />
    </FormProvider>
  );
}

export { RxUomEditPage } from './create';
export { RxUomDetailsPage } from './detail';
