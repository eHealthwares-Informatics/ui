import {
  Button,
  Group,
  Modal,
  NativeSelect,
  SegmentedControl,
  Stack,
  Text,
  Textarea,
  TextInput,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { emrApi } from '@/lib/emr-api';
import { formatEnum, REFERRAL_PRIORITIES } from '../../lib/emr-constants';
import { getApiErrorMessage } from '../../lib/emr-errors';

export type ReferralEncounterContext = {
  id: string;
  patientId: string;
  patientName?: string | null;
};

type StaffRow = {
  id: string;
  firstName: string;
  lastName: string;
  department?: string | null;
};

export function CreateReferralModal({
  opened,
  onClose,
  encounter,
}: {
  opened: boolean;
  onClose: () => void;
  encounter: ReferralEncounterContext;
}) {
  const queryClient = useQueryClient();
  const [specialistId, setSpecialistId] = useState('');
  const [reason, setReason] = useState('');
  const [priority, setPriority] = useState<string>('ROUTINE');
  const [notes, setNotes] = useState('');

  const specialistsQuery = useQuery({
    queryKey: ['emr', 'staff', 'specialists'],
    queryFn: async () => {
      const res = await emrApi.get<{ data: StaffRow[] }>('/staff', {
        params: { roleType: 'Specialist', isActive: true, limit: 100 },
      });
      return res.data.data;
    },
    enabled: opened,
  });

  useEffect(() => {
    if (!opened) {
      setSpecialistId('');
      setReason('');
      setPriority('ROUTINE');
      setNotes('');
    }
  }, [opened]);

  const createMutation = useMutation({
    mutationFn: async () => {
      const specialist = specialistsQuery.data?.find((s) => s.id === specialistId);
      const { data } = await emrApi.post('/referrals', {
        patientId: encounter.patientId,
        patientName: encounter.patientName ?? undefined,
        encounterId: encounter.id,
        specialistProviderId: specialistId,
        specialistProviderName: specialist
          ? `${specialist.firstName} ${specialist.lastName}`.trim()
          : undefined,
        specialty: specialist?.department ?? undefined,
        reason,
        notes: notes || undefined,
        priority,
      });
      return data;
    },
    onSuccess: () => {
      notifications.show({ message: 'Referral created', color: 'teal' });
      queryClient.invalidateQueries({ queryKey: ['emr', 'referrals'] });
      onClose();
    },
    onError: (error) => {
      notifications.show({ color: 'red', message: getApiErrorMessage(error) });
    },
  });

  const canSubmit = Boolean(specialistId) && reason.trim().length >= 3;

  return (
    <Modal opened={opened} onClose={onClose} title="Refer to Specialist" size="md" centered>
      <Stack gap="sm">
        <TextInput
          label="Patient"
          value={
            encounter.patientName
              ? `${encounter.patientName} (${encounter.patientId})`
              : encounter.patientId
          }
          readOnly
        />
        <NativeSelect
          label="Specialist"
          data={[
            {
              value: '',
              label: specialistsQuery.isLoading ? 'Loading…' : 'Select specialist',
            },
            ...(specialistsQuery.data ?? []).map((s) => ({
              value: s.id,
              label: `${s.firstName} ${s.lastName}`.trim(),
            })),
          ]}
          value={specialistId}
          onChange={(e) => setSpecialistId(e.currentTarget.value)}
        />
        <Textarea
          label="Reason"
          description="Minimum 3 characters"
          minRows={3}
          value={reason}
          onChange={(e) => setReason(e.currentTarget.value)}
        />
        <Stack gap={4}>
          <Text size="sm" fw={500}>
            Priority
          </Text>
          <SegmentedControl
            fullWidth
            data={REFERRAL_PRIORITIES.map((p) => ({ value: p, label: formatEnum(p) }))}
            value={priority}
            onChange={setPriority}
          />
        </Stack>
        <Textarea
          label="Notes (optional)"
          minRows={2}
          value={notes}
          onChange={(e) => setNotes(e.currentTarget.value)}
        />
        <Group justify="flex-end" mt="xs">
          <Button variant="default" onClick={onClose}>
            Cancel
          </Button>
          <Button
            loading={createMutation.isPending}
            disabled={!canSubmit}
            onClick={() => createMutation.mutate()}
          >
            Create referral
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
