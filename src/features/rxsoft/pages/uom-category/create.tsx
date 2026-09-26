import { Button, Card } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useMutation } from '@tanstack/react-query';
import { Link, useNavigate } from '@tanstack/react-router';
import { FieldGroupEngine } from '@/features/components/form/field-group-engine';
import { FormProvider, useFormContext } from '@/features/components/form/form-context';
import { rxsoftApi } from '@/lib/rxsoft-api';
import { RxPage } from '../../../components/page/rx-page';
import { UOM_CATEGORY_CREATE_FIELDS } from './schema';
import { getApiErrorMessage } from '@/lib/get-api-error-message';

type UomCategoryFormState = {
  code: string;
  name: string;
  parentId: string;
};

function UomCategoryFormContent({ uomCategoryId }: { uomCategoryId: string }) {
  const navigate = useNavigate();
  const form = useFormContext<UomCategoryFormState>();

  const mutation = useMutation({
    mutationFn: async () => {
      await rxsoftApi.patch(`/uom-categories/${uomCategoryId}`, {
        code: form.formState.code || undefined,
        name: form.formState.name || undefined,
        parentId: form.formState.parentId || undefined,
      });
    },
    onSuccess: () => {
      notifications.show({
        message: 'UOM updated successfully.',
        color: 'green',
      });
      // navigate({ to: '/uom-category/$id', params: { id: uomCategoryId } });
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
      <FieldGroupEngine spec={UOM_CATEGORY_CREATE_FIELDS} />
      <Button onClick={handleSave} loading={mutation.isPending} mt="md">
        Save Changes
      </Button>
    </Card>
  );
}

export function RxUomEditPage({ uomCategoryId }: { uomCategoryId: string }) {
  return (
    <RxPage
      title="Edit UOM"
      description="PATCH /uoms/{uomId}"
      actions={
        <Button component={Link} to="/uoms" variant="outline">
          Back to UOMs
        </Button>
      }
    >
      <FormProvider<UomCategoryFormState>
        initialState={{
          code: '',
          name: '',
          parentId: '',
        }}
      >
        <UomCategoryFormContent uomCategoryId={uomCategoryId} />
      </FormProvider>
    </RxPage>
  );
}
