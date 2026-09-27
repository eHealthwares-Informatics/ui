import { Button, Group, Stepper } from '@mantine/core';
import { memo, useCallback, useState } from 'react';
import { TabGroup } from '@/features/rxsoft/types';
import { TabPanel } from './tab-panel';

type Props = {
  tabGroups: TabGroup[];
  formState: Record<string, unknown>;
  updateField: (name: string, value: unknown) => void;
  onSubmit?: () => void;
  isPending?: boolean;
  /** Called when stepping from a tab whose next step has an unsatisfied waitFor */
  onStepSubmit?: (stepIndex: number) => Promise<Record<string, unknown> | void>;
};

function TabGroupsComponent({
  tabGroups,
  formState,
  updateField,
  onSubmit,
  isPending,
  onStepSubmit,
}: Props) {
  const [activeStep, setActiveStep] = useState(0);
  const [stepSubmitting, setStepSubmitting] = useState(false);

  const isStepDisabled = (stepIndex: number) => {
    const tab = tabGroups[stepIndex];
    if (!tab?.waitFor) {
      return false;
    }
    return typeof tab.waitFor === 'function' ? !tab.waitFor(formState) : !formState[tab.waitFor];
  };

  const hasUnsatisfiedWaitFor = useCallback(
    (stepIndex: number) => {
      const tab = tabGroups[stepIndex];
      if (!tab?.waitFor) {
        return false;
      }
      return typeof tab.waitFor === 'function' ? !tab.waitFor(formState) : !formState[tab.waitFor];
    },
    [tabGroups, formState]
  );

  const handleNext = async () => {
    if (hasUnsatisfiedWaitFor(activeStep + 1) && onStepSubmit) {
      setStepSubmitting(true);
      try {
        const result = await onStepSubmit(activeStep);
        if (result && typeof result === 'object' && 'id' in result) {
          updateField('id', result.id);
        }
        setActiveStep((s) => s + 1);
      } finally {
        setStepSubmitting(false);
      }
    } else {
      setActiveStep((s) => s + 1);
    }
  };

  const loading = isPending || stepSubmitting;

  return (
    <>
      <Stepper
        active={activeStep}
        onStepClick={setActiveStep}
        allowNextStepsSelect={false}
        keepMounted
      >
        {tabGroups.map((tab, i) => (
          <Stepper.Step
            key={tab.value}
            label={tab.title}
            disabled={isStepDisabled(i)}
            onClick={() => {
              if (!isStepDisabled(i)) {
                setActiveStep(i);
              }
            }}
          >
            <TabPanel tab={tab} formState={formState} updateField={updateField} />
          </Stepper.Step>
        ))}
      </Stepper>

      <Group justify="flex-end" mt="xl">
        <Button
          variant="outline"
          onClick={() => setActiveStep((s) => Math.max(0, s - 1))}
          disabled={activeStep === 0 || loading}
        >
          Previous
        </Button>
        {activeStep < tabGroups.length - 1 ? (
          <Button
            onClick={handleNext}
            disabled={hasUnsatisfiedWaitFor(activeStep + 1) && !onStepSubmit}
            loading={loading}
          >
            {hasUnsatisfiedWaitFor(activeStep + 1) && onStepSubmit ? 'Create & Continue' : 'Next'}
          </Button>
        ) : (
          onSubmit && (
            <Button onClick={onSubmit} disabled={loading} loading={loading}>
              {loading ? 'Submitting...' : 'Submit'}
            </Button>
          )
        )}
      </Group>
    </>
  );
}

export const TabGroups = memo(TabGroupsComponent);
