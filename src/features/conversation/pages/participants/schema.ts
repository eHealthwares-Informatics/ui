import { FileText, MessageSquare, Users } from 'lucide-react';
import type { ModelConfig } from '@/features/shared/model-schema';
import {
  buildFields,
  jsonField,
  jsonObject,
  pickUpdatePayload,
  text,
  textField,
  withDefaultActions,
} from '../../schemas/helpers';

export const participantsConfig: ModelConfig = withDefaultActions({
  id: 'participants',
  title: 'Participants',
  description: 'Create participants and search by phone or email for questionnaire entry.',
  endpoint: '/participants',
  rowActions: [
    {
      label: 'View Conversations',
      icon: MessageSquare,
      href: (row) => `/conversation?participantId=${String(row.id ?? row._id ?? '')}`,
    },
    {
      label: 'View Projections',
      icon: Users,
      href: (row) => `/conversation/projections?participantId=${String(row.id ?? row._id ?? '')}`,
    },
    {
      label: 'View Exchanges',
      icon: FileText,
      href: (row) => `/conversation/exchanges?participantId=${String(row.id ?? row._id ?? '')}`,
    },
  ],
  columns: [
    { key: 'firstName', label: 'First Name' },
    { key: 'lastName', label: 'Last Name' },
    { key: 'phone', label: 'Phone' },
    { key: 'email', label: 'Email' },
  ],
  createFieldGroups: buildFields([
    textField('firstName', 'First Name'),
    textField('lastName', 'Last Name'),
    textField('phone', 'Phone'),
    { ...textField('email', 'Email'), type: 'email' },
    jsonField('metadata', 'Metadata'),
  ]),
  defaultState: {
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    metadata: {},
  },
  buildFormState: (row) => ({
    firstName: text(row.firstName),
    lastName: text(row.lastName),
    phone: text(row.phone),
    email: text(row.email),
    metadata: jsonObject(row.metadata),
  }),
  buildCreatePayload: (values) => ({
    firstName: text(values.firstName).trim() || undefined,
    lastName: text(values.lastName).trim() || undefined,
    phone: text(values.phone).trim() || undefined,
    email: text(values.email).trim() || undefined,
    metadata: jsonObject(values.metadata),
  }),
  buildUpdatePayload: (values) =>
    pickUpdatePayload(values, {
      firstName: (v) => text(v).trim() || undefined,
      lastName: (v) => text(v).trim() || undefined,
      phone: (v) => text(v).trim() || undefined,
      email: (v) => text(v).trim() || undefined,
      metadata: (v) => jsonObject(v),
    }),
});
