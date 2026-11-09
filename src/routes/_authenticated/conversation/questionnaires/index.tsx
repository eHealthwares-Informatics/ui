import { createFileRoute } from '@tanstack/react-router';
import { RxQuestionnairesPage } from '@/features/conversation';

export const Route = createFileRoute('/_authenticated/conversation/questionnaires/')({
  component: RxQuestionnairesPage,
});
