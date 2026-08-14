import { Stepper } from '@mantine/core';
import { useNavigate } from '@tanstack/react-router';
import { useOrderContext } from './OrderContext';

const STEPS = [
  { label: 'Enter', description: 'Patient & Tests', route: '/lis/orders/workflow/enter' },
  { label: 'Collect', description: 'Sample Collection', route: '/lis/orders/workflow/collect' },
  { label: 'Label', description: 'Labels & Storage', route: '/lis/orders/workflow/label' },
  { label: 'QA', description: 'Review & Approve', route: '/lis/orders/workflow/qa' },
  { label: 'Order', description: 'Review Order', route: '/lis/orders/workflow/order' },
] as const;

const STEP_KEYS = ['enter', 'collect', 'label', 'qa', 'order'] as const;

export function OrderStepper() {
  const { state } = useOrderContext();
  const navigate = useNavigate();

  const getStepStatus = (index: number): 'stepInactive' | 'stepProgress' | 'stepComplete' => {
    const key = STEP_KEYS[index];
    if (state.stepProgress[key]) return 'stepComplete';
    if (index === state.currentStep) return 'stepProgress';
    return 'stepInactive';
  };

  return (
    <Stepper
      active={state.currentStep}
      onStepClick={(i) => {
        if (i <= state.currentStep || state.stepProgress[STEP_KEYS[i]]) {
          navigate({
            to: STEPS[i].route,
            search: { orderNumber: state.orderNumber ?? '' },
          });
        }
      }}
      allowNextStepsSelect={false}
    >
      {STEPS.map((step, i) => (
        <Stepper.Step key={step.label} label={step.label} description={step.description} />
      ))}
    </Stepper>
  );
}
