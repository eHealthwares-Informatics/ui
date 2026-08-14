import { Button, Group } from '@mantine/core';
import { useNavigate } from '@tanstack/react-router';
import { ChevronLeft, ChevronRight, Save } from 'lucide-react';
import { useOrderContext } from './OrderContext';

const STEP_ROUTES = ['/lis/orders/new/enter', '/lis/orders/new/collect', '/lis/orders/new/label', '/lis/orders/new/qa', '/lis/orders/new/order'];

interface Props {
  onSaveAndNext?: () => Promise<void>;
  onSaveOnly?: () => Promise<void>;
  hideBack?: boolean;
}

export function SaveNavigationButtons({ onSaveAndNext, onSaveOnly, hideBack }: Props) {
  const { state } = useOrderContext();
  const navigate = useNavigate();

  const isLastStep = state.currentStep === 4;
  const isFirstStep = state.currentStep === 0;

  const handleBack = () => {
    if (state.currentStep > 0) {
      navigate({
        to: STEP_ROUTES[state.currentStep - 1],
        search: { orderNumber: state.orderNumber ?? '' },
      });
    }
  };

  const handleNext = async () => {
    if (onSaveAndNext) {
      await onSaveAndNext();
    }
    if (state.currentStep < 4) {
      navigate({
        to: STEP_ROUTES[state.currentStep + 1],
        search: { orderNumber: state.orderNumber ?? '' },
      });
    }
  };

  const handleSave = async () => {
    if (onSaveOnly) {
      await onSaveOnly();
    }
  };

  return (
    <Group justify="space-between" mt="xl">
      <Group>
        {!hideBack && !isFirstStep && (
          <Button variant="outline" leftSection={<ChevronLeft size={16} />} onClick={handleBack} disabled={state.isSubmitting}>
            Back
          </Button>
        )}
      </Group>
      <Group>
        <Button variant="light" leftSection={<Save size={16} />} onClick={handleSave} loading={state.isSubmitting}>
          Save
        </Button>
        {isLastStep ? (
          <Button color="green" leftSection={<ChevronRight size={16} />} onClick={handleNext} loading={state.isSubmitting}>
            Complete
          </Button>
        ) : (
          <Button leftSection={<ChevronRight size={16} />} onClick={handleNext} loading={state.isSubmitting}>
            Save & Next
          </Button>
        )}
      </Group>
    </Group>
  );
}
