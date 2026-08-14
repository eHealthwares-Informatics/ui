import { Stack, Alert, Text } from '@mantine/core';
import { useNavigate } from '@tanstack/react-router';
import { AlertCircle } from 'lucide-react';
import { useOrderContext } from '../OrderContext';
import { SaveNavigationButtons } from '../SaveNavigationButtons';
import { OrderDetailsSection } from './OrderDetailsSection';
import { PatientSearchSection } from './PatientSearchSection';
import { SampleTestSelectionSection } from './SampleTestSelectionSection';

export function OrderEnterPage() {
  const { state, saveOrder, saveOrderEntry, dispatch } = useOrderContext();
  const navigate = useNavigate();

  const canSave = state.patientName && state.patientId && state.items.length > 0;

  const handleSaveAndNext = async () => {
    if (!canSave) return;
    const result = await saveOrderEntry();
    if (result?.id) {
      dispatch({ type: 'MARK_STEP', payload: 'enter' });
      dispatch({ type: 'SET_STEP', payload: 1 });
      navigate({
        to: '/lis/orders/workflow/collect',
        search: { orderNumber: result.orderNumber ?? '' },
      });
    }
  };

  const handleSave = async () => {
    if (state.orderId) {
      await saveOrder();
    } else {
      await saveOrderEntry();
    }
  };

  return (
    <Stack gap="md">
      {state.error && (
        <Alert icon={<AlertCircle size={16} />} title="Error" color="red" variant="light">
          {state.error}
        </Alert>
      )}

      <PatientSearchSection />
      <SampleTestSelectionSection />
      <OrderDetailsSection />

      {!canSave && (
        <Text size="sm" c="dimmed">
          Please select a patient and at least one test to proceed.
        </Text>
      )}

      <SaveNavigationButtons onSaveAndNext={handleSaveAndNext} onSaveOnly={handleSave} />
    </Stack>
  );
}
