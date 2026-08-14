import { Button, Group } from '@mantine/core';
import { useLocation, useNavigate } from '@tanstack/react-router';
import { ChevronLeft, ChevronRight, Save } from 'lucide-react';
import { useOrderContext } from './OrderContext';

const STEP_ROUTES = [
  '/lis/orders/workflow/enter',
  '/lis/orders/workflow/collect',
  '/lis/orders/workflow/label',
  '/lis/orders/workflow/qa',
  '/lis/orders/workflow/order',
];

interface Props {
  onSaveAndNext?: () => Promise<void>;
  onSaveOnly?: () => Promise<void>;
  hideBack?: boolean;
}

export function SaveNavigationButtons({ onSaveAndNext, onSaveOnly, hideBack }: Props) {
  const { state } = useOrderContext();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const currentStep = Math.max(0, STEP_ROUTES.indexOf(pathname));

  const isLastStep = currentStep === 4;
  const isFirstStep = currentStep === 0;

  const handleBack = () => {
    if (currentStep > 0) {
      navigate({
        to: STEP_ROUTES[currentStep - 1],
        search: { orderNumber: state.orderNumber ?? '' },
      });
    }
  };

  const handleNext = async () => {
    if (onSaveAndNext) {
      await onSaveAndNext();
    }
    if (currentStep < 4) {
      navigate({
        to: STEP_ROUTES[currentStep + 1],
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
          <Button
            variant="outline"
            leftSection={<ChevronLeft size={16} />}
            onClick={handleBack}
            disabled={state.isSubmitting}
          >
            Back
          </Button>
        )}
      </Group>
      <Group>
        <Button
          variant="light"
          leftSection={<Save size={16} />}
          onClick={handleSave}
          loading={state.isSubmitting}
        >
          Save
        </Button>
        {isLastStep ? (
          <Button
            color="green"
            leftSection={<ChevronRight size={16} />}
            onClick={handleNext}
            loading={state.isSubmitting}
          >
            Complete
          </Button>
        ) : (
          <Button
            leftSection={<ChevronRight size={16} />}
            onClick={handleNext}
            loading={state.isSubmitting}
          >
            Save & Next
          </Button>
        )}
      </Group>
    </Group>
  );
}
