import { Button, Group, Modal, Stack, Text } from '@mantine/core';
import { Loader } from 'lucide-react';
import { FieldGroup as FieldGroupType, TabGroup } from '@/features/rxsoft/types';
import { collectFields } from '@/features/shared/payload-utils';
import { FieldGroup } from './FieldGroup';
import { useValidatedSubmit, buildZodSchema } from './submit';
import { TabGroups } from './tab-groups';

type FormProps = {
  editingRow: Record<string, unknown> | null;
  showModal: boolean;
  setShowModal: (value: boolean) => void;
  title: string;
  formState: Record<string, unknown>;
  setFormState: (value: Record<string, unknown>) => void;
  modalTitle?: string;
  fieldGroups: FieldGroupType[];
  tabGroups?: TabGroup[];
  mode?: 'create-then-update' | 'create-once' | 'update';
  mutation: any;
  updateField: (name: string, value: unknown) => void;
  renderCreateExtras?: (props: {
    formState: Record<string, unknown>;
    updateField: (name: string, value: unknown) => void;
  }) => any;
};

export const ModalDataForm = ({
  modalTitle,
  formState,
  showModal,
  setShowModal,
  title,
  tabGroups,
  fieldGroups,
  mutation,
  updateField,
  editingRow,
  renderCreateExtras,
}: FormProps) => {
  const fields = collectFields({ createFieldGroups: fieldGroups, tabGroups });
  const handleSubmit = useValidatedSubmit({ fields, formState, mutation });

  // Debounced text inputs commit on blur. Blur first, then submit on the next
  // tick so the last keystroke is part of the PATCH payload.
  const handleSubmitClick = () => {
    if (typeof document !== 'undefined' && document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    window.setTimeout(() => {
      void handleSubmit();
    }, 0);
  };

  const isWizard = Boolean(tabGroups);

  return (
    <Modal
      opened={showModal}
      onClose={() => setShowModal(false)}
      title={modalTitle ? modalTitle : `Create ${title}`}
      size="lg"
      centered
      styles={{
        content: { maxHeight: '90vh', overflowY: 'auto' },
      }}
    >
      <Stack gap="lg" data-testid="modal-form">
        <Text size="sm" c="dimmed" data-testid="modal-title">
          Add a new record to the {title.toLowerCase()} module.
        </Text>

        <Stack gap="xl">
          {tabGroups ? (
            <TabGroups
              tabGroups={tabGroups}
              formState={formState}
              updateField={updateField}
              onSubmit={handleSubmit}
              isPending={mutation.isPending}
            />
          ) : (
            <>
              {fieldGroups.map((fieldGroup, index) => (
                <FieldGroup
                  key={index}
                  index={index}
                  fieldGroup={fieldGroup}
                  formState={formState}
                  updateField={updateField}
                />
              ))}
              {renderCreateExtras?.({
                formState,
                updateField,
              })}
            </>
          )}
        </Stack>

        {!isWizard && (
          <Group justify="flex-end">
            <Button data-testid="form-cancel" variant="outline" onClick={() => setShowModal(false)}>
              Cancel
            </Button>

            <Button
              data-testid={editingRow ? 'form-update' : 'form-create'}
              onClick={handleSubmitClick}
              disabled={mutation.isPending}
              leftSection={mutation.isPending ? <Loader size={16} /> : null}
            >
              {editingRow ? 'Update' : 'Create'}
            </Button>
          </Group>
        )}
      </Stack>
    </Modal>
  );
};
