import { ActionIcon, Select, Tooltip } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useQuery, useQueryClient, type QueryKey } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { HelpCircle } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { ModuleContext, useModuleContext } from '@/context/module-context';
import { entityInfoMap } from '@/features/lis/schema/entity-info';
import type { ModelConfig } from '@/features/shared/model-schema';
import { collectFields } from '@/features/shared/payload-utils';
import { useAuthStore } from '@/stores/auth-store';
import { JsonPreviewDialog } from '../../rxsoft';
import type { FilterValue } from '../../rxsoft/types';
import { useFormContext } from '../form/form-context';
import { ModalDataForm } from '../form/ModalDataForm';
import {
  useCreateMutation,
  useDeleteMutation,
  useExportMutation,
  useUpdateMutation,
} from '../form/mutations';
import { HeaderBar } from '../table/HeaderBar';
import { MetricsBar } from '../table/MetricsBar';
import { Pagination } from '../table/pagination';
import { DataTable } from '../table/table';
import { triggerBlobDownload } from '../export/download';
import { getArrayPayload } from '../utils';
import { InfoDrawer } from './info-drawer';
import { RxPage } from './rx-page';

function getRowsFromPayload(payload: unknown): Record<string, unknown>[] {
  return getArrayPayload(payload);
}

type DataPageShellProps = {
  config: ModelConfig;
  formState?: Record<string, unknown>;
  setFormState?: (state: Record<string, unknown>) => void;
  updateField?: (name: string, value: unknown) => void;
  embedded?: boolean;
};

export function DataPageShell(props: DataPageShellProps) {
  const {
    config,
    formState: propsFormState,
    setFormState: propsSetFormState,
    updateField: propsUpdateField,
    embedded = false,
  } = props;

  const navigate = useNavigate();

  const {
    title,
    description,
    endpoint,
    columns,
    modalTitle,
    createFields,
    createFieldGroups,
    tabGroups,
    buildCreatePayload,
    buildUpdatePayload,
    buildFormState,
    csvEndpoint,
    createPathBuilder,
    detailPathBuilder,
    editPathBuilder,
    deletePathBuilder,
    renderCreateExtras,
    renderHeaderActions,
    transformRows,
    canDelete,
    canExport,
    defaultState,
    apiProvider: configApiProvider,
    minSearchLength,
    debounceMs,
    metricsEndpoint,
    metricsConfig,
    superAdminOrgFilter,
  } = config;
  const moduleContext = useModuleContext();
  const apiProvider = configApiProvider ?? moduleContext.apiProvider;
  const moduleId = moduleContext.moduleId;
  const shellModuleContext = configApiProvider
    ? { ...moduleContext, apiProvider: configApiProvider }
    : moduleContext;

  // Try to use FormProvider if available, otherwise use props or local state
  let formContext: ReturnType<typeof useFormContext> | null = null;
  let usingFormProvider = false;
  try {
    formContext = useFormContext();
    usingFormProvider = true;
  } catch (e) {
    // FormProvider not available
  }

  // Create local state as fallback
  const [localFormState, setLocalFormState] = useState<Record<string, unknown>>(
    propsFormState ?? {}
  );

  // Determine which form state management to use
  const effectiveFormState = usingFormProvider
    ? (formContext?.formState ?? {})
    : (propsFormState ?? localFormState);

  const effectiveSetFormState = useCallback(
    usingFormProvider
      ? (state: Record<string, unknown>) => {
          formContext?.setFields(state as any);
        }
      : (propsSetFormState ?? setLocalFormState),
    [usingFormProvider, formContext, propsSetFormState]
  );

  const effectiveUpdateField = useCallback(
    usingFormProvider
      ? (name: string, value: unknown) => {
          formContext?.setField(name as any, value as any);
        }
      : (propsUpdateField ??
          ((name: string, value: unknown) => {
            setLocalFormState((prev) => ({
              ...prev,
              [name]: value,
            }));
          })),
    [usingFormProvider, formContext, propsUpdateField]
  );

  const queryClient = useQueryClient();

  // -----------------------------
  // STATE
  // -----------------------------
  const [search, setSearch] = useState('');
  const [searchBy, setSearchBy] = useState<string[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingRow, setEditingRow] = useState<Record<string, unknown> | null>(null);
  const [pageIndex, setPageIndex] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [isDeleteOpen, setIsDeleteOpen] = useState<boolean>(false);
  const [jsonToPreview, setJsonToPreview] = useState<Record<string, unknown> | null>(null);

  const [initialFormState, setInitialFormState] = useState<Record<string, unknown> | null>(null);

  const [filtersModalOpened, setFiltersModalOpened] = useState<boolean>(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const helpInfo = entityInfoMap[config.id] ?? null;

  const [sortBy, setSortBy] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc' | null>(null);
  const handleSortChange = (key: string, order: 'asc' | 'desc' | null) => {
    setSortBy(order ? key : null);
    setSortOrder(order);
    setPageIndex(1);
  };

  const [appliedFilters, setAppliedFilters] = useState<Record<string, FilterValue | null>>({});
  const handleApplyFilter = (columnKey: string, filterValue: FilterValue | null) => {
    setAppliedFilters((prev) => ({
      ...prev,
      [columnKey]: filterValue,
    }));
  };

  const currentUser = useAuthStore((s) => s.user);
  const isSuperAdmin = currentUser?.roles?.includes('super_admin') ?? false;
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);

  const { data: orgs = [] } = useQuery({
    queryKey: ['organizations', 'list'],
    queryFn: async () => {
      const res = await apiProvider.get('/organizations', { params: { limit: 100 } });
      return res.data?.data ?? [];
    },
    enabled: isSuperAdmin && !!superAdminOrgFilter,
    staleTime: 120_000,
  });

  const hasCreate = Boolean(tabGroups || createFields || createFieldGroups);
  const hasInlineEdit = hasCreate && !editPathBuilder;
  const hasFilterableColumns = columns.some((c) => c.filters && c.filters.length > 0);

  const fieldGroups = createFieldGroups ?? (createFields ? [{ fields: createFields }] : []);
  const fields = useMemo(
    () => collectFields({ createFields, createFieldGroups, tabGroups }),
    [createFields, createFieldGroups, tabGroups]
  );

  // -----------------------------
  // QUERY PARAMS
  // -----------------------------
  const queryParams = useMemo(() => {
    const params: Record<string, unknown> = {};

    // -----------------------------
    // FILTERS ✅ NEW
    // -----------------------------
    if (appliedFilters) {
      Object.entries(appliedFilters)
        .filter(([a, b]) => a && b)
        .forEach(([columnKey, filterValue]) => {
          params[columnKey] =
            `${filterValue?.filter.type}|${filterValue?.value}|${filterValue?.valueTo}`;
        });
    }

    if (search.trim()) {
      params.search = search.trim();
    }

    if (sortBy) {
      params.sortBy = sortBy;
      params.sortOrder = sortOrder ?? 'desc';
    }

    if (isSuperAdmin && superAdminOrgFilter && selectedOrgId) {
      params.organizationId = selectedOrgId;
    }

    params.page = pageIndex;
    params.limit = pageSize;

    // Per-config default list params (e.g. items: { includeAll: true }) stay as
    // top-level query params on every request.
    if (config.listParams) {
      Object.assign(params, config.listParams);
    }

    return params;
  }, [
    search,
    searchBy,
    appliedFilters,
    sortBy,
    sortOrder,
    pageIndex,
    pageSize,
    isSuperAdmin,
    superAdminOrgFilter,
    selectedOrgId,
    config.listParams,
  ]);

  useEffect(() => {
    setPageIndex(1);
  }, [search]);

  useEffect(() => {
    if (!showModal) {
      setInitialFormState(null);
    }
  }, [showModal]);

  // -----------------------------
  // DATA FETCH
  // -----------------------------
  const query = useQuery({
    queryKey: ['rxsoft-data-page', endpoint, queryParams] satisfies QueryKey,
    queryFn: async () => {
      let params: any = queryParams;
      if (moduleId === 'rxsoft' && Object.keys(queryParams).length > 2) {
        const { page, limit, sortBy: sort, sortOrder: order, ...rest } = queryParams;
        // Config-driven top-level params (config.listParams) are re-emitted as
        // real query params, never JSON-encoded into the search bag.
        for (const key of Object.keys(config.listParams ?? {})) {
          delete rest[key];
        }
        // A free-text search alone must be sent as a PLAIN string: every backend
        // implements the ILIKE fallback for it, but JSON-parsing backends treat
        // `{"search":"..."}` as a column filter (no-op) and plain-LIKE backends
        // try to match the JSON text itself (returns nothing). JSON-encode only
        // when real column filters are present.
        const restKeys = Object.keys(rest);
        const onlyPlainSearch = restKeys.length === 1 && restKeys[0] === 'search';
        const search = onlyPlainSearch ? String(rest.search) : JSON.stringify(rest);
        params = {
          page,
          limit,
          ...(sort ? { sortBy: sort, sortOrder: order ?? 'desc' } : {}),
          search,
          ...(config.listParams ?? {}),
        };
      }
      const response = await apiProvider.get(endpoint, { params });
      const meta = response.data?.meta;

      setTotalItems(meta?.total ?? response.data.length);

      return response.data;
    },
  });

  const rows = transformRows
    ? transformRows(getRowsFromPayload(query.data))
    : getRowsFromPayload(query.data);

  // Store LIS order IDs in localStorage for Prev/Next navigation on report page
  useEffect(() => {
    if (endpoint === '/lis/orders' && rows.length > 0) {
      const ids = rows.map((r) => String(r.id)).filter(Boolean);
      localStorage.setItem('lis_orders_ids', JSON.stringify(ids));
    }
  }, [endpoint, rows]);

  // -----------------------------
  // MUTATIONS
  // -----------------------------
  const createMutation = useCreateMutation({
    buildCreatePayload,
    endpoint,
    formState: effectiveFormState,
    queryClient,
    setShowModal,
    title,
    apiProvider,
    fields,
  });

  const updateMutation = useUpdateMutation({
    buildUpdatePayload,
    endpoint,
    formState: effectiveFormState,
    queryClient,
    setShowModal,
    title,
    setEditingRow,
    editingRow,
    apiProvider,
    initialFormState: initialFormState ?? undefined,
    fields,
  });

  const deleteMutation = useDeleteMutation({
    endpoint,
    formState: effectiveFormState,
    queryClient,
    title,
    deletePathBuilder,
    apiProvider,
  });

  const exportMutation = useExportMutation({
    endpoint,
    formState: effectiveFormState,
    queryClient,
    title,
    csvEndpoint,
    apiProvider,
  });

  // Export strips pagination — backends force a large limit so every row that
  // matches the current search/filters is downloaded (CSV and PDF alike).
  const exportParams = useMemo(() => {
    const rest = { ...queryParams };
    delete rest.page;
    delete rest.limit;
    return rest;
  }, [queryParams]);

  const pdfEndpoint = csvEndpoint ? `${csvEndpoint}/pdf` : undefined;

  const downloadPdf = async () => {
    if (!pdfEndpoint) {
      return;
    }
    try {
      await triggerBlobDownload(
        apiProvider!,
        { method: 'GET', url: pdfEndpoint, params: exportParams },
        `${title.toLowerCase().replace(/\s+/g, '_')}.pdf`,
      );
      notifications.show({ message: `${title} export downloaded` });
    } catch {
      notifications.show({ color: 'red', message: `Failed to export ${title.toLowerCase()}` });
    }
  };

  function openModal(row: Record<string, unknown> | null = null) {
    setEditingRow(row);
    const initialState = buildFormState && row ? buildFormState(row) : row || defaultState || {};
    effectiveSetFormState(initialState);
    setInitialFormState(initialState);
    setShowModal(true);
  }

  function handleDelete() {}

  const content = (
    <>
      {isSuperAdmin && superAdminOrgFilter && (
        <Select
          placeholder="Filter by organization"
          data={(Array.isArray(orgs) ? orgs : []).map((o: any) => ({
            value: o.id,
            label: `${o.code} - ${o.name}`,
          }))}
          value={selectedOrgId}
          onChange={setSelectedOrgId}
          clearable
          searchable
          size="xs"
          mb="xs"
        />
      )}
      {metricsConfig && (
        <MetricsBar
          metricsConfig={metricsConfig}
          params={(() => {
            const p: Record<string, string> = {};
            const hasFilters = Object.keys(appliedFilters).length > 0;
            if (hasFilters) {
              const filterParams: Record<string, string> = {};
              Object.entries(appliedFilters)
                .filter(([, v]) => v)
                .forEach(([key, val]) => {
                  filterParams[key] =
                    `${val!.filter.type}|${val!.value ?? ''}|${val!.valueTo ?? ''}`;
                });
              const filtStr = JSON.stringify(filterParams);
              if (filtStr !== '{}') {
                p.search = filtStr;
              }
            } else if (search) {
              p.search = search;
            }
            return p;
          })()}
        />
      )}
      <HeaderBar
        open={filtersModalOpened}
        setOpen={setFiltersModalOpened}
        appliedFilters={appliedFilters}
        updateFilters={handleApplyFilter}
        columns={columns}
        pageIndex={pageIndex}
        pageSize={pageSize}
        totalItems={totalItems}
        refresh={() => {
          query.refetch();
        }}
        search={search}
        onSearchChange={setSearch}
        customActions={renderHeaderActions?.({
          rows,
          refresh: () => {
            query.refetch();
          },
        })}
        onExportCsv={
          canExport && csvEndpoint ? () => exportMutation.mutate(exportParams) : undefined
        }
        onExportPdf={canExport && pdfEndpoint ? () => void downloadPdf() : undefined}
        onDelete={canDelete || deletePathBuilder ? () => setIsDeleteOpen(true) : undefined}
        hasFilterableColumns={hasFilterableColumns}
        minSearchLength={minSearchLength}
        debounceMs={debounceMs}
        onCreate={
          hasCreate
            ? () => {
                createPathBuilder ? navigate({ to: createPathBuilder() }) : openModal();
              }
            : undefined
        }
      />

      <DataTable
        columns={columns}
        rows={rows}
        isLoading={query.isLoading}
        errorLoading={query.isError}
        actionCellProps={
          detailPathBuilder ||
          editPathBuilder ||
          buildUpdatePayload ||
          deletePathBuilder ||
          canDelete
            ? {
                detailPathBuilder,
                editPathBuilder,
                onEdit: buildUpdatePayload && openModal,
                onDelete: deletePathBuilder || canDelete ? () => undefined : undefined,
                deleteMutation,
              }
            : undefined
        }
        appliedFilters={appliedFilters}
        applyColumnFilter={handleApplyFilter}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSortChange={handleSortChange}
      />
      <Pagination
        pageIndex={pageIndex}
        pageSize={pageSize}
        totalItems={totalItems}
        onPageChange={setPageIndex}
        onPageSizeChange={setPageSize}
      />
      <ModalDataForm
        editingRow={editingRow}
        showModal={showModal}
        setShowModal={setShowModal}
        title={title}
        tabGroups={tabGroups}
        fieldGroups={fieldGroups}
        formState={effectiveFormState}
        setFormState={effectiveSetFormState}
        updateField={effectiveUpdateField}
        mutation={editingRow ? updateMutation : createMutation}
        modalTitle={modalTitle}
        renderCreateExtras={renderCreateExtras}
      />

      <ConfirmDialog
        title={`Delete ${title}`}
        description={`Are you sure you want to delete this ${title}? This action cannot be undone.`}
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        onConfirm={handleDelete}
        confirmText="Delete"
        isLoading={deleteMutation.isPending}
      />

      <JsonPreviewDialog
        value={jsonToPreview}
        title={`${title}: ${jsonToPreview?.name}`}
        open={jsonToPreview !== null}
        onOpenChange={(open) => setJsonToPreview(!open ? null : jsonToPreview)}
      />

      <InfoDrawer opened={helpOpen} onClose={() => setHelpOpen(false)} info={helpInfo} />
    </>
  );

  return (
    <ModuleContext.Provider value={shellModuleContext}>
      {embedded ? (
        content
      ) : (
        <RxPage
          title={title}
          description={description}
          actions={
            helpInfo
              ? [
                  <Tooltip label={`About ${title}`} key="help">
                    <ActionIcon variant="subtle" size="sm" onClick={() => setHelpOpen(true)}>
                      <HelpCircle size={18} />
                    </ActionIcon>
                  </Tooltip>,
                ]
              : undefined
          }
        >
          {content}
        </RxPage>
      )}
    </ModuleContext.Provider>
  );
}
