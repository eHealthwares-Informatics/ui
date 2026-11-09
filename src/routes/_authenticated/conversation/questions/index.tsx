import { createFileRoute } from '@tanstack/react-router';
import { RxQuestionsPage } from '@/features/conversation';

export const Route = createFileRoute('/_authenticated/conversation/questions/')({
  component: RxQuestionsPage,
});
