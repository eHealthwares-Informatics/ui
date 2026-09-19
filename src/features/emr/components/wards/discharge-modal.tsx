import { Button, Group, Modal, Select, Stack, Text, Textarea } from '@mantine/core';
import { useState } from 'react';
import { DISCHARGE_TYPES, toSelectData } from '../../lib/emr-constants';
import type { Admission } from '../../lib/emr-types';

export function DischargeModal({
  admission,
  onClose,
  onConfirm,
}: {
  admission: Admission | null;
  onClose: () => void;
  onConfirm: (values: { dischargeType: string; dischargeSummary: string }) => void;
}) {
  const [dischargeType, setDischargeType] = useState('DISCHARGED_HOME');
  const [dischargeSummary, setDischargeSummary] = useState('');
  return (
    <Modal opened={Boolean(admission)} onClose={onClose} title="Discharge Patient" centered>
      <Stack gap="sm">
        <Text size="xs" c="dimmed">
          Discharging {admission?.patientName ?? ''} ({admission?.admissionNumber ?? ''})
        </Text>
        <Select
          label="Discharge type"
          data={toSelectData(DISCHARGE_TYPES)}
          value={dischargeType}
          onChange={(value) => setDischargeType(value ?? 'DISCHARGED_HOME')}
        />
        <Textarea
          label="Discharge summary"
          autosize
          minRows={3}
          value={dischargeSummary}
          onChange={(e) => setDischargeSummary(e.currentTarget.value)}
        />
        <Group justify="flex-end">
          <Button variant="light" onClick={onClose}>
            Cancel
          </Button>
          <Button color="red" onClick={() => onConfirm({ dischargeType, dischargeSummary })}>
            Confirm Discharge
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}