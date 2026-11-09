import { Modal } from '@mantine/core';
import { DataPageShell } from '@/components/page/data-page-shell';
import { questionsConfig } from '@/features/conversation/pages/questions/schema';
import type { ModelConfig } from '@/features/shared/model-schema';

const config: ModelConfig = questionsConfig;

export type QuestionFormState = Record<string, unknown>;

export const defaultQuestionForm: QuestionFormState = questionsConfig.defaultState ?? {};

export function buildQuestionForm(row: Record<string, unknown>): QuestionFormState {
  return questionsConfig.buildFormState?.(row) ?? row;
}

export function buildQuestionPayload(form: QuestionFormState): unknown {
  return questionsConfig.buildCreatePayload?.(form) ?? form;
}

export function QuestionEditorDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Modal opened={open} onClose={() => onOpenChange(false)} title="Question Editor" size="xl">
      <DataPageShell config={config} embedded />
    </Modal>
  );
}

export function QuestionnaireQuestionsManager() {
  return <DataPageShell config={config} embedded />;
}
