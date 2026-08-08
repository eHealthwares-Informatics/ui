import { Stack, Alert, Text } from '@mantine/core';
import { AlertCircle } from 'lucide-react';
import { useNavigate } from '@tanstack/react-router';
import { useOrderContext } from '../OrderContext';
import { SaveNavigationButtons } from '../SaveNavigationButtons';
import { QAChecklistSection } from './QAChecklistSection';
import { OrderSummarySection } from './OrderSummarySection';

export function OrderQAPage() {
  const { state, saveOrder, dispatch } = useOrderContext();
  const navigate = useNavigate();

  const handleFinalize = async () => {
    await saveOrder();
    dispatch({ type: 'MARK_STEP', payload: 'qa' });
    dispatch({ type: 'SET_STEP', payload: 4 });
    navigate({ to: '/lis/orders/new/order', search: { orderNumber: state.orderNumber ?? '' } });
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

      <QAChecklistSection />
      <OrderSummarySection />

      <SaveNavigationButtons onSaveAndNext={handleFinalize} onSaveOnly={handleSave} />
    </Stack>
  );
}
