import { Button, Card } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useMutation } from '@tanstack/react-query';
import { Link, useNavigate } from '@tanstack/react-router';
import { FieldGroupEngine } from '@/features/components/form/field-group-engine';
import { FormProvider, useFormContext } from '@/features/components/form/form-context';
import { FieldGroupSpec } from '@/features/components/form/types/form-context';
import { rxsoftApi } from '@/lib/rxsoft-api';
import { RxPage } from '../../../components/page/rx-page';
import { getApiErrorMessage } from '@/lib/get-api-error-message';

type UomFormState = {
  code: string;
  name: string;
  categoryId: string;
};

const uomFormSpec: FieldGroupSpec = {
  title: 'Edit Unit of Measure',
  mutationMode: 'field',
  fields: [
    {
      name: 'code',
      label: 'Code',
      type: 'text',
      placeholder: 'e.g., mg, ml, g',
      required: true,
    },
    {
      name: 'name',
      label: 'Name',
      type: 'text',
      placeholder: 'e.g., Milligrams, Milliliters',
      required: true,
    },
    {
      name: 'categoryId',
      label: 'Category ID',
      type: 'async-select',
      searchParam: {
        endpoint: '/uom-categories',
        minChars: 2,
        queryParam: 'search',
        labelKey: 'name',
        valueKey: 'id',
      },
      required: true,
      placeholder: 'Category ',
    },
  ],
};

function UomFormContent({ uomId }: { uomId: string }) {
  const navigate = useNavigate();
  const form = useFormContext<UomFormState>();

  const mutation = useMutation({
    mutationFn: async () => {
      await rxsoftApi.patch(`/uoms/${uomId}`, {
        code: form.formState.code || undefined,
        name: form.formState.name || undefined,
        categoryId: form.formState.categoryId || undefined,
      });
    },
    onSuccess: () => {
      notifications.show({
        message: 'UOM updated successfully.',
        color: 'green',
      });
      (navigate as any)({ to: `/uoms/${uomId}` });
    },
    onError: (error) => {
      notifications.show({
        message: getApiErrorMessage(error),
        color: 'red',
      });
    },
  });

  const handleSave = async () => {
    mutation.mutate();
  };

  return (
    <Card withBorder radius="md" p="lg">
      <FieldGroupEngine spec={uomFormSpec} />
      <Button onClick={handleSave} loading={mutation.isPending} mt="md">
        Save Changes
      </Button>
    </Card>
  );
}

export function RxUomEditPage({ uomId }: { uomId: string }) {
  return (
    <RxPage
      title="Edit UOM"
      description="PATCH /uoms/{uomId}"
      actions={
        <Button component={Link} to={'/uoms' as any} variant="outline">
          Back to UOMs
        </Button>
      }
    >
      <FormProvider<UomFormState>
        initialState={{
          code: '',
          name: '',
          categoryId: '',
        }}
      >
        <UomFormContent uomId={uomId} />
      </FormProvider>
    </RxPage>
  );
}
