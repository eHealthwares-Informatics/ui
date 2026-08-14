import { Stack, Alert } from '@mantine/core';
import { AlertCircle } from 'lucide-react';
import { useNavigate } from '@tanstack/react-router';
import { useOrderContext } from '../OrderContext';
import { SaveNavigationButtons } from '../SaveNavigationButtons';
import { OrderReportContent } from '../../report';

export function OrderOrderPage() {
  const { state, saveOrder } = useOrderContext();
  const navigate = useNavigate();

  if (!state.orderId) {
    return (
      <Stack gap="md">
        <Alert icon={<AlertCircle size={16} />} title="No Order" color="yellow" variant="light">
          Save the order first to open the Order page.
        </Alert>
      </Stack>
    );
  }

  const handleFinalize = async () => {
    await saveOrder();
    navigate({ to: '/lis/orders' });
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

      <OrderReportContent orderId={state.orderId} embedded />

      <SaveNavigationButtons onSaveAndNext={handleFinalize} onSaveOnly={handleSave} />
    </Stack>
  );
}
