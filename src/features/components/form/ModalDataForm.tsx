import { Button, Group, Modal, Stack, Text } from '@mantine/core';
import { Loader } from 'lucide-react';
import { FieldGroup as FieldGroupType, TabGroup } from '../../rxsoft/types';
import { FieldGroup } from './FieldGroup';
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
      <Stack gap="lg">
        <Text size="sm" c="dimmed">
          Add a new record to the {title.toLowerCase()} module.
        </Text>

        <Stack gap="xl">
          {tabGroups ? (
            <TabGroups
              tabGroups={tabGroups}
              formState={formState}
              updateField={updateField}
              onSubmit={() => {
                mutation.mutate(formState);
              }}
              isPending={mutation.isPending}
            />
          ) : (
            <>
              {fieldGroups.map((fieldGroup, index) => (
                <FieldGroup
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
            <Button variant="outline" onClick={() => setShowModal(false)}>
              Cancel
            </Button>

            <Button
              onClick={() => {
                mutation.mutate(formState);
              }}
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
