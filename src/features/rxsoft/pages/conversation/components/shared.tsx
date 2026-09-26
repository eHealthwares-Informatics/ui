import { Badge, Button, Group, Input, Modal } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useMutation, useQuery, useQueryClient, type QueryKey } from '@tanstack/react-query';
import { Loader2, Plus, X } from 'lucide-react';
import { useState } from 'react';
import { CommunicationRow } from '@/features/communication/components/shared';
import { getArrayPayload } from '@/features/components/utils';
import { conversationApi } from '@/lib/conversation-api';
import { getApiErrorMessage } from '@/lib/get-api-error-message';

export type ConversationRow = Record<string, unknown>;

/* -----------------------------
   QUERY
------------------------------*/
export function useConversationList(
  endpoint: string,
  search: string,
  extraParams?: Record<string, unknown>
) {
  return useQuery({
    queryKey: ['conversation-engine', endpoint, search, extraParams] satisfies QueryKey,
    queryFn: async () => {
      const { data } = await conversationApi.get(endpoint, {
        params: {
          ...(extraParams ?? {}),
          ...(search.trim() ? { search: search.trim() } : {}),
        },
      });

      return getArrayPayload(data);
    },
    staleTime: 30_000,
  });
}

/* -----------------------------
   CRUD HOOK
------------------------------*/
export function useConversationCrud(endpoint: string) {
  const queryClient = useQueryClient();

  const baseKey = ['conversation-engine', endpoint];

  const invalidate = () => queryClient.invalidateQueries({ queryKey: baseKey });

  const createMutation = useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      conversationApi.post(endpoint, payload).then((r) => r.data),

    onSuccess: () => {
      invalidate();
      notifications.show({ message: 'Record created successfully' });
    },
    onError: (err) => {
      notifications.show({
        color: 'red',
        message: `Create failed - ${getErrorMessage(err)}`,
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      payload,
      method = 'patch',
    }: {
      id: string;
      payload: Record<string, unknown>;
      method?: 'patch' | 'put';
    }) =>
      method === 'put'
        ? conversationApi.put(`${endpoint}/${id}`, payload).then((r) => r.data)
        : conversationApi.patch(`${endpoint}/${id}`, payload).then((r) => r.data),

    onSuccess: () => {
      invalidate();
      notifications.show({ message: 'Record updated successfully' });
    },
    onError: (err) => {
      notifications.show({
        color: 'red',
        message: `Update failed - ${getErrorMessage(err)}`,
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => conversationApi.delete(`${endpoint}/${id}`).then((r) => r.data),

    onSuccess: () => {
      invalidate();
      notifications.show({ message: 'Record deleted successfully' });
    },
    onError: (err) => {
      notifications.show({
        color: 'red',
        message: getErrorMessage(err),
      });
    },
  });

  return {
    createMutation,
    updateMutation,
    deleteMutation,
  };
}

/* -----------------------------
   UTILITIES
------------------------------*/
export function getDirtyPayload(
  original: Record<string, unknown>,
  current: Record<string, unknown>
) {
  return Object.fromEntries(
    Object.entries(current).filter(
      ([k, v]) => JSON.stringify(original[k] ?? null) !== JSON.stringify(v ?? null)
    )
  );
}

export function getErrorMessage(error: unknown) {
  // Delegate to the shared extractor so all envelope shapes
  // ({error:{message}}, classic Nest {message}, arrays) are covered.
  return getApiErrorMessage(error);
}

/* -----------------------------
   JSON DIALOG
------------------------------*/
export function JsonPreviewDialog({
  open,
  onOpenChange,
  title,
  value,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  value: unknown;
}) {
  return (
    <Modal opened={open} onClose={() => onOpenChange(false)} title={title}>
      <div className="space-y-3">
        <div>
          <h2 className="text-lg font-semibold">{title}</h2>
          <p className="text-sm text-muted-foreground">Read-only JSON view</p>
        </div>

        <pre className="overflow-x-auto rounded-lg border bg-muted/30 p-4 text-xs">
          {JSON.stringify(value ?? {}, null, 2)}
        </pre>
      </div>
    </Modal>
  );
}

/* -----------------------------
   TAG INPUT
------------------------------*/
export function TagInput({
  value,
  onChange,
  placeholder = 'Add tag and press Enter',
}: {
  value: string[];
  onChange: (v: string[]) => void;
  placeholder?: string;
}) {
  const [input, setInput] = useState('');

  const addTag = (tag: string) => {
    const t = tag.trim();
    if (!t || value.includes(t)) {return;}
    onChange([...value, t]);
  };

  return (
    <div className="space-y-3 rounded-lg border p-3">
      <Input
        value={input}
        placeholder={placeholder}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => {
          if (e.key !== 'Enter') {return;}
          e.preventDefault();
          addTag(input);
          setInput('');
        }}
      />

      <div className="flex flex-wrap gap-2">
        {value.map((tag) => (
          <Badge key={tag} variant="secondary" className="gap-1">
            {tag}
            <button type="button" onClick={() => onChange(value.filter((t) => t !== tag))}>
              <X className="size-3" />
            </button>
          </Badge>
        ))}
      </div>
    </div>
  );
}

/* -----------------------------
   UI HELPERS
------------------------------*/
export function DialogActions({
  onCancel,
  onSubmit,
  loading,
  submitLabel,
}: {
  onCancel: () => void;
  onSubmit: () => void;
  loading?: boolean;
  submitLabel: string;
}) {
  return (
    <Group justify="flex-end" mt="md">
      <Button variant="outline" onClick={onCancel}>
        Cancel
      </Button>

      <Button onClick={onSubmit} disabled={loading}>
        {loading && <Loader2 className="animate-spin mr-2" size={16} />}
        {submitLabel}
      </Button>
    </Group>
  );
}

export function InlineSection({
  title,
  action,
  children,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-3 rounded-lg border p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">{title}</h3>
        {action}
      </div>
      {children}
    </div>
  );
}

export function LabelField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      {label}
      {children}
    </div>
  );
}

export function AddRowButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <Button variant="outline" onClick={onClick}>
      <Plus className="size-4" />
      {label}
    </Button>
  );
}

export function getBoolean(value: unknown): boolean {
  return typeof value === 'boolean' ? value : Boolean(value);
}

export function getString(value: unknown): string {
  return typeof value === 'string' ? value : String(value ?? '');
}

export function getObject(value: unknown): Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

export function normalizeRows(rows: unknown[]): CommunicationRow[] {
  return rows.map((row, index) => ({
    id: getString((row as any)?.id ?? index),
    ...getObject(row),
  }));
}
