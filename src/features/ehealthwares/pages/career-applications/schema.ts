import { createElement } from 'react';
import { ColumnDataType, type Column, type Field } from '@/features/rxsoft/types';
import type { ModelConfig } from '@/features/shared/model-schema';
import { buildContentPayload } from '../helpers';

const endpoint = '/ehealthwares/admin/career-applications';

const statusOptions = [
  { value: 'new', label: 'New' },
  { value: 'reviewed', label: 'Reviewed' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'hired', label: 'Hired' },
];

const columns: Column[] = [
  { key: 'name', label: 'Name', sortable: true },
  { key: 'email', label: 'Email', sortable: true },
  { key: 'careerTitle', label: 'Role', sortable: true },
  { key: 'status', label: 'Status', sortable: true },
  {
    key: 'cvUrl',
    label: 'CV',
    render: (row) =>
      row.cvUrl
        ? createElement(
            'a',
            {
              href: String(row.cvUrl),
              target: '_blank',
              rel: 'noopener noreferrer',
              style: { color: 'var(--mantine-color-blue-6)' },
            },
            'CV'
          )
        : null,
  },
  {
    key: 'coverLetterUrl',
    label: 'Cover Letter',
    render: (row) =>
      row.coverLetterUrl
        ? createElement(
            'a',
            {
              href: String(row.coverLetterUrl),
              target: '_blank',
              rel: 'noopener noreferrer',
              style: { color: 'var(--mantine-color-blue-6)' },
            },
            'Cover Letter'
          )
        : null,
  },
  {
    key: 'createdAt',
    label: 'Received At',
    dataType: ColumnDataType.DATE,
    sortable: true,
    render: (row) => (row.createdAt ? new Date(row.createdAt as string).toLocaleString() : '-'),
  },
];

const createFields: Field[] = [
  { name: 'name', label: 'Name', col: 6 },
  { name: 'email', label: 'Email', type: 'email', col: 6 },
  { name: 'phone', label: 'Phone', col: 6 },
  { name: 'portfolio', label: 'Portfolio', col: 6 },
  { name: 'careerSlug', label: 'Role Slug', col: 6 },
  { name: 'careerTitle', label: 'Role Title', col: 6 },
  {
    name: 'status',
    label: 'Status',
    type: 'select',
    col: 6,
    options: statusOptions,
  },
  { name: 'coverLetter', label: 'Cover Letter', type: 'textarea', col: 12 },
];

function buildCreatePayload(values: Record<string, unknown>) {
  return buildContentPayload(values, createFields);
}

function buildUpdatePayload(values: Record<string, unknown>) {
  return buildContentPayload(values, createFields);
}

export const ehealthwaresCareerApplicationsConfig: ModelConfig = {
  id: 'ehealthwares-career-applications',
  title: 'Career Applications',
  description: 'Review and manage job applications submitted through the eHealthwares website.',
  endpoint,
  columns,
  createFields,
  buildCreatePayload,
  buildUpdatePayload,
  canCreate: false,
  canDelete: true,
  defaultSort: { sortBy: 'createdAt', sortOrder: 'desc' },
};
