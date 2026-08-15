import type { Column } from '@/features/rxsoft/types';
import type { ModelConfig } from '@/features/shared/model-schema';

const endpoint = '/ehealthwares/admin/contact-submissions';

const columns: Column[] = [
  { key: 'name', label: 'Name', sortable: true },
  { key: 'email', label: 'Email', sortable: true },
  { key: 'subject', label: 'Subject' },
  { key: 'read', label: 'Read', sortable: true },
  { key: 'createdAt', label: 'Received At', sortable: true },
];

export const ehealthwaresContactsConfig: ModelConfig = {
  id: 'ehealthwares-contact-submissions',
  title: 'eHealthwares Contact Submissions',
  description: 'View contact form submissions from the eHealthwares website.',
  endpoint,
  columns,
};
