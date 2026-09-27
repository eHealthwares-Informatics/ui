import {
  ActionIcon,
  Badge,
  Button,
  Divider,
  Grid,
  Group,
  Paper,
  Select,
  Stack,
  Tabs,
  Text,
  Textarea,
  TextInput,
  Title,
} from '@mantine/core';
import { ArrowDown, ArrowUp, Copy, Play, Plus, Trash } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { JsonEditorField } from '@/features/components/form/json-editor-field';
import { MessageType, ProtocolType } from '../../types/enums';
import {
  MappingResult,
  MappingStep,
  MappingTransformation,
  StandardMapping,
} from '../../types/mapping.model';

/* ----------------------------- CONSTANTS ----------------------------- */

const MAPPING_TYPE_OPTIONS = [
  'field-map',
  'transform',
  'conditional',
  'lookup',
  'aggregate',
  'custom-js',
];

const TRANSFORMER_OPTIONS = ['uppercase', 'lowercase', 'regex', 'concat', 'split', 'custom'];

/* -------------------------- PATH UTILITIES -------------------------- */

function flattenJsonPaths(obj: any, prefix = ''): string[] {
  if (!obj || typeof obj !== 'object') {
    return [];
  }

  return Object.keys(obj).flatMap((key) => {
    const path = prefix ? `${prefix}.${key}` : key;
    const value = obj[key];

    if (Array.isArray(value)) {
      return value.length ? flattenJsonPaths(value[0], `${path}.0`) : [path];
    }

    if (typeof value === 'object' && value !== null) {
      return [path, ...flattenJsonPaths(value, path)];
    }

    return [path];
  });
}

function getValueAtPath(obj: any, path: string) {
  return path?.split('.').reduce((acc, key) => acc?.[key], obj);
}

function setValueAtPath(obj: any, path: string, value: any) {
  const keys = path.split('.');
  let current = obj;

  keys.forEach((key, i) => {
    const isLast = i === keys.length - 1;
    if (isLast) {
      current[key] = value;
    } else {
      current = current[key] ?? (current[key] = {});
    }
  });
}

/* -------------------------- EXECUTION ENGINE -------------------------- */

function executeTransformation(value: any, step: MappingStep, source: any) {
  try {
    if (step.type === 'conditional' && step.condition) {
      const fn = new Function('value', 'source', `return ${step.condition}`);
      const ok = fn(value, source);
      return { result: ok ? value : step.fallbackValue };
    }

    const t =
      typeof step.transformation === 'string' ? { type: step.transformation } : step.transformation;

    if (!t || step.type === 'field-map') {
      return { result: value };
    }

    switch (t.type) {
      case 'uppercase':
        return { result: String(value).toUpperCase() };
      case 'lowercase':
        return { result: String(value).toLowerCase() };
      case 'regex':
        return {
          result: String(value).replace(
            new RegExp((t as MappingTransformation).params?.pattern),
            (t as MappingTransformation).params?.replace ?? ''
          ),
        };
      case 'concat':
        return {
          result: `${value ?? ''}${(t as MappingTransformation).params?.separator ?? ''}${(t as MappingTransformation).params?.append ?? ''}`,
        };
      case 'split':
        return {
          result: String(value).split((t as MappingTransformation).params?.delimiter ?? ','),
        };
      case 'custom':
        if (!(t as MappingTransformation).expression) {
          return { result: value };
        }
        if (process.env.NODE_ENV === 'production') {
          return { result: value };
        }
        const fn = new Function('value', 'source', (t as MappingTransformation).expression || '');
        return { result: fn(value, source) };
      default:
        return { result: value };
    }
  } catch (e) {
    return { result: step.fallbackValue, error: String(e) };
  }
}

/* -------------------------- PIPELINE RUNNER -------------------------- */

function runPipeline(source: any, steps: MappingStep[]) {
  const trace: any[] = [];
  const output: any = {};

  steps.forEach((step) => {
    const input = getValueAtPath(source, step.sourceField);
    const { result, error } = executeTransformation(input, step, source);

    setValueAtPath(output, step.targetField, result);

    trace.push({
      step,
      input,
      output: result,
      success: !error,
      error,
    });
  });

  return {
    success: trace.every((t) => t.success),
    targetMessage: output,
    trace,
    errors: trace.filter((t) => t.error).map((t) => t.error),
  };
}

/* -------------------------- COMPONENT -------------------------- */

export function MappingEditorPage() {
  const [mapping, setMapping] = useState<StandardMapping>({
    id: 'mapping-1',
    name: 'Mapping',
    description: '',
    sourceProtocol: ProtocolType.FHIR_R4,
    targetProtocol: ProtocolType.FHIR_R4,
    sourceMessageType: MessageType.PATIENT,
    targetMessageType: MessageType.PATIENT,
    mappingSteps: [],
    version: '1.0',
    active: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const [sourceData, setSourceData] = useState<any>({
    source: {
      patientId: '123',
      name: { first: 'John', last: 'Doe' },
    },
  });

  const [selectedStepId, setSelectedStepId] = useState<string | null>(null);
  const [result, setResult] = useState<MappingResult | null>(null);

  /* -------------------------- SCHEMA DERIVED PATHS -------------------------- */

  const sourcePaths = useMemo(
    () => flattenJsonPaths(sourceData).map((p) => ({ value: p, label: p })),
    [sourceData]
  );

  const targetPaths = useMemo(() => {
    return ['patient.id', 'patient.name.first', 'patient.name.last', 'order.id'].map((p) => ({
      value: p,
      label: p,
    }));
  }, []);

  const selectedStep = mapping.mappingSteps.find((s) => s.id === selectedStepId);

  /* -------------------------- UPDATE HELPERS -------------------------- */

  const updateStep = (id: string, patch: Partial<MappingStep>) => {
    setMapping((m) => ({
      ...m,
      mappingSteps: m.mappingSteps.map((s) => (s.id === id ? { ...s, ...patch } : s)),
      updatedAt: new Date(),
    }));
  };

  const addStep = () => {
    const id = `step-${Date.now()}`;
    const step: MappingStep = {
      id,
      name: 'New Step',
      type: 'field-map',
      sourceField: '',
      targetField: '',
      fallbackValue: '',
    };
    setMapping((m) => ({
      ...m,
      mappingSteps: [...m.mappingSteps, step],
    }));
    setSelectedStepId(id);
  };

  const run = () => {
    setResult(runPipeline(sourceData, mapping.mappingSteps));
  };

  /* -------------------------- DEBOUNCED AUTO RUN -------------------------- */

  useEffect(() => {
    const t = setTimeout(run, 300);
    return () => clearTimeout(t);
  }, [sourceData, mapping.mappingSteps]);

  /* -------------------------- DUPLICATES -------------------------- */

  const duplicates = useMemo(() => {
    const seen = new Set();
    const dup = new Set<string>();

    mapping.mappingSteps.forEach((s) => {
      const key = `${s.sourceField}->${s.targetField}`;
      if (seen.has(key)) {
        dup.add(s.id);
      } else {
        seen.add(key);
      }
    });

    return dup;
  }, [mapping.mappingSteps]);

  /* -------------------------- UI -------------------------- */

  return (
    <Stack gap="lg">
      {/* HEADER */}
      <Group justify="space-between">
        <Title order={3}>Mapping Builder</Title>
        <Group>
          <Button leftSection={<Plus size={14} />} onClick={addStep}>
            Add Step
          </Button>
          <Button leftSection={<Play size={14} />} onClick={run}>
            Run
          </Button>
        </Group>
      </Group>

      {/* UPPER PANE */}
      <Grid>
        {/* LEFT TREE */}
        <Grid.Col span={5}>
          <Paper p="md" withBorder>
            <Stack gap="sm">
              {mapping.mappingSteps.map((step) => (
                <Paper
                  key={step.id}
                  p="sm"
                  withBorder
                  style={{
                    borderColor:
                      selectedStepId === step.id
                        ? 'blue'
                        : duplicates.has(step.id)
                          ? 'orange'
                          : undefined,
                  }}
                >
                  <Group justify="space-between">
                    <div>
                      <Text size="sm">{step.name}</Text>
                      <Text size="xs" c="dimmed">
                        {step.sourceField} → {step.targetField}
                      </Text>
                    </div>

                    <Group gap="xs">
                      <Button size="xs" onClick={() => setSelectedStepId(step.id)}>
                        Edit
                      </Button>
                      <ActionIcon onClick={() => updateStep(step.id, { ...step })}>
                        <Copy size={14} />
                      </ActionIcon>
                      <ActionIcon color="red">
                        <Trash size={14} />
                      </ActionIcon>
                    </Group>
                  </Group>
                </Paper>
              ))}
            </Stack>
          </Paper>
        </Grid.Col>

        {/* RIGHT CONFIG */}
        <Grid.Col span={7}>
          <Paper p="md" withBorder>
            {selectedStep ? (
              <Stack gap="md">
                <TextInput
                  label="Name"
                  value={selectedStep.name}
                  onChange={(e) => updateStep(selectedStep.id, { name: e.target.value })}
                />

                <Select
                  label="Type"
                  data={MAPPING_TYPE_OPTIONS}
                  value={selectedStep.type}
                  onChange={(v) =>
                    updateStep(selectedStep.id, {
                      type: v as any,
                    })
                  }
                />

                <Select
                  label="Source Field"
                  searchable
                  data={sourcePaths}
                  value={selectedStep.sourceField}
                  onChange={(v) => updateStep(selectedStep.id, { sourceField: v || '' })}
                />

                <Select
                  label="Target Field"
                  searchable
                  data={targetPaths}
                  value={selectedStep.targetField}
                  onChange={(v) => updateStep(selectedStep.id, { targetField: v || '' })}
                />

                <TextInput
                  label="Fallback"
                  value={String(selectedStep.fallbackValue ?? '')}
                  onChange={(e) =>
                    updateStep(selectedStep.id, {
                      fallbackValue: e.target.value,
                    })
                  }
                />
              </Stack>
            ) : (
              <Text c="dimmed">Select a step</Text>
            )}
          </Paper>
        </Grid.Col>
      </Grid>

      {/* TESTING PANE */}
      <Grid>
        <Grid.Col span={6}>
          <Paper p="md" withBorder>
            <Text fw={500}>Source</Text>
            <JsonEditorField value={sourceData} onChange={setSourceData} />
          </Paper>
        </Grid.Col>

        <Grid.Col span={6}>
          <Paper p="md" withBorder>
            <Text fw={500}>Output</Text>
            <Textarea
              value={JSON.stringify(result?.targetMessage, null, 2)}
              readOnly
              minRows={12}
              styles={{ input: { fontFamily: 'monospace' } }}
            />
          </Paper>
        </Grid.Col>
      </Grid>
    </Stack>
  );
}
