import { Stack, Alert, Text } from '@mantine/core';
import { AlertCircle } from 'lucide-react';
import { useNavigate } from '@tanstack/react-router';
import { useOrderContext } from '../OrderContext';
import { SaveNavigationButtons } from '../SaveNavigationButtons';
import { SamplesCollectionSection } from './SamplesCollectionSection';
import { TestAssignmentSection } from './TestAssignmentSection';

export function OrderCollectPage() {
  const { state, saveOrder, dispatch } = useOrderContext();
  const navigate = useNavigate();

  const hasSamples = state.samples.length > 0;
  const allAssigned = state.items.length > 0 && state.assignments.length === state.items.length;

  const handleSaveAndNext = async () => {
    await saveOrder();
    dispatch({ type: 'MARK_STEP', payload: 'collect' });
    dispatch({ type: 'SET_STEP', payload: 2 });
    navigate({ to: '/lis/orders/new/label', search: { orderNumber: state.orderNumber ?? '' } });
  };

  const handleSave = async () => {
    await saveOrder();
  };

  return (
    <Stack gap="md">
      {state.error && (
        <Alert icon={<AlertCircle size={16} />} title="Error" color="red" variant="light">
          {state.error}
        </Alert>
      )}

      <SamplesCollectionSection />
      <TestAssignmentSection />

      {!hasSamples && (
        <Text size="sm" c="dimmed">
          Add at least one sample to proceed.
        </Text>
      )}
      {hasSamples && !allAssigned && (
        <Text size="sm" c="dimmed">
          Assign all tests to samples to proceed.
        </Text>
      )}

      <SaveNavigationButtons
        onSaveAndNext={hasSamples && allAssigned ? handleSaveAndNext : undefined}
        onSaveOnly={handleSave}
      />
    </Stack>
  );
}
