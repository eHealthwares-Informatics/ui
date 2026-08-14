import { Stack, Alert, Text } from '@mantine/core';
import { useNavigate } from '@tanstack/react-router';
import { AlertCircle } from 'lucide-react';
import { useOrderContext } from '../OrderContext';
import { SaveNavigationButtons } from '../SaveNavigationButtons';
import { PrintLabelsSection } from './PrintLabelsSection';
import { StorageSection } from './StorageSection';

export function OrderLabelPage() {
  const { state, saveOrder, dispatch } = useOrderContext();
  const navigate = useNavigate();

  const handleSaveAndNext = async () => {
    await saveOrder();
    dispatch({ type: 'MARK_STEP', payload: 'label' });
    dispatch({ type: 'SET_STEP', payload: 3 });
    navigate({ to: '/lis/orders/workflow/qa', search: { orderNumber: state.orderNumber ?? '' } });
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

      <PrintLabelsSection />
      <StorageSection />

      {state.samples.length === 0 && (
        <Text size="sm" c="dimmed">
          No samples to label. Complete sample collection first.
        </Text>
      )}

      <SaveNavigationButtons onSaveAndNext={handleSaveAndNext} onSaveOnly={handleSave} />
    </Stack>
  );
}
