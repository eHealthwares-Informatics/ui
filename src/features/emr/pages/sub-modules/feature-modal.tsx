import {
  Alert,
  Button,
  Group,
  Modal,
  MultiSelect,
  NumberInput,
  Select,
  Stack,
  Switch,
  Text,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useMutation } from '@tanstack/react-query';
import { AlertCircle } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { emrApi } from '@/lib/emr-api';
import { ENCOUNTER_TYPES, toSelectData } from '../../lib/emr-constants';
import { getApiErrorMessage } from '../../lib/emr-errors';
import type { Feature, FormDefinition } from '../../lib/emr-types';

export type RoleOption = { code: string; name: string };

/**
 * Create/edit a Feature. A Feature is a form definition plus its menu and
 * session configuration; the form's submissions are the feature's CRUD.
 */
export function FeatureModal({
  opened,
  onClose,
  subModuleId,
  modules = [],
  feature,
  forms,
  roles,
  onSaved,
}: {
  opened: boolean;
  onClose: () => void;
  /** Fixed module when opened from a module detail page. */
  subModuleId?: string;
  /** Selectable modules when opened from the global Features page. */
  modules?: Array<{ id: string; name: string }>;
  feature: Feature | null;
  forms: FormDefinition[];
  roles: RoleOption[];
  onSaved: () => void;
}) {
  const isEdit = Boolean(feature);
  const [moduleId, setModuleId] = useState<string | null>(null);
  const [formDefinitionId, setFormDefinitionId] = useState<string | null>(null);
  const [encounterType, setEncounterType] = useState<string>('CONSULTATION');
  const [roleCodes, setRoleCodes] = useState<string[]>([]);
  const [sortOrder, setSortOrder] = useState<number>(0);
  const [isActive, setIsActive] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!opened) {
      return;
    }
    setModuleId(feature?.subModuleId ?? subModuleId ?? null);
    setFormDefinitionId(feature?.formDefinitionId ?? null);
    setEncounterType(feature?.encounterType ?? 'CONSULTATION');
    setRoleCodes(feature?.roleCodes ?? []);
    setSortOrder(feature?.sortOrder ?? 0);
    setIsActive(feature?.isActive ?? true);
    setError(null);
  }, [opened, feature, subModuleId]);

  const moduleOptions = useMemo(
    () => modules.map((module) => ({ value: module.id, label: module.name })),
    [modules]
  );

  const formOptions = useMemo(
    () =>
      forms.map((form) => ({
        value: form.id,
        label: `${form.name} (${form.code})${form.isPublished ? '' : ' · draft'}`,
      })),
    [forms]
  );

  const roleOptions = useMemo(
    () => roles.map((role) => ({ value: role.code, label: role.name })),
    [roles]
  );

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!formDefinitionId) {
        throw new Error('Select a form definition');
      }
      const targetSubModuleId = subModuleId ?? moduleId;
      if (!isEdit && !targetSubModuleId) {
        throw new Error('Select a module');
      }
      const payload = {
        formDefinitionId,
        encounterType,
        roleCodes,
        sortOrder,
        isActive,
      };
      if (isEdit && feature) {
        const { data } = await emrApi.patch(`/features/${feature.id}`, payload);
        return data;
      }
      const { data } = await emrApi.post('/features', {
        subModuleId: targetSubModuleId,
        ...payload,
      });
      return data;
    },
    onSuccess: () => {
      notifications.show({
        message: isEdit ? 'Feature updated' : 'Feature created',
        color: 'teal',
      });
      onSaved();
      onClose();
    },
    onError: (err) => {
      setError(getApiErrorMessage(err));
    },
  });

  return (
    <>
      <Modal
        opened={opened}
        onClose={onClose}
        title={isEdit ? 'Edit Feature' : 'New Feature'}
        size="lg"
        centered
      >
        <Stack gap="sm">
          {error && (
            <Alert color="red" icon={<AlertCircle size={16} />}>
              {error}
            </Alert>
          )}

          {!isEdit && !subModuleId && (
            <Select
              label="Module"
              description="The menu group this feature appears under."
              placeholder="Select a module"
              data={moduleOptions}
              value={moduleId}
              onChange={setModuleId}
              searchable
              required
              data-testid="feature-module-select"
              nothingFoundMessage="No modules found"
            />
          )}

          <Select
            label="Form definition"
            description="Choose an existing form. Create or edit forms under Admin Console → EMR Configuration → Forms."
            placeholder="Select a form"
            data={formOptions}
            value={formDefinitionId}
            onChange={setFormDefinitionId}
            searchable
            required
            data-testid="feature-form-select"
            nothingFoundMessage="No forms found"
          />

          <Select
            label="Encounter type"
            description="Encounter created when a session starts for this feature."
            data={toSelectData(ENCOUNTER_TYPES)}
            value={encounterType}
            onChange={(value) => setEncounterType(value ?? 'CONSULTATION')}
            required
            data-testid="feature-encounter-type"
          />

          <MultiSelect
            label="Roles with access"
            description="Identity roles that see this feature in the menu. Empty = everyone."
            data={roleOptions}
            value={roleCodes}
            onChange={setRoleCodes}
            searchable
            clearable
            nothingFoundMessage="No roles found"
          />

          <Group grow>
            <NumberInput
              label="Sort order"
              value={sortOrder}
              onChange={(value) => setSortOrder(Number(value) || 0)}
              min={0}
              data-testid="feature-sort-order"
            />
            <Switch
              label="Active"
              checked={isActive}
              onChange={(event) => setIsActive(event.currentTarget.checked)}
              mt="lg"
              data-testid="feature-active"
            />
          </Group>

          <Text size="xs" c="dimmed">
            Only published forms appear in the menu. Create/edit and publish forms under Admin
            Console → EMR Configuration → Forms.
          </Text>

          <Group justify="flex-end">
            <Button
              variant="light"
              onClick={onClose}
              disabled={saveMutation.isPending}
              data-testid="feature-cancel-button"
            >
              Cancel
            </Button>
            <Button
              loading={saveMutation.isPending}
              onClick={() => saveMutation.mutate()}
              data-testid="feature-save-button"
            >
              {isEdit ? 'Save Feature' : 'Create Feature'}
            </Button>
          </Group>
        </Stack>
      </Modal>
    </>
  );
}
