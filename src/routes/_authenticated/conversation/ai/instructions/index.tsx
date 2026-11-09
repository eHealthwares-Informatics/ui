import { createFileRoute } from '@tanstack/react-router';
import { RxAIInstructionsPage } from '@/features/conversation';

export const Route = createFileRoute('/_authenticated/conversation/ai/instructions/')({
  component: RxAIInstructionsPage,
});
