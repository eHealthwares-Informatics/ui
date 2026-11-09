type QuestionRow = {
  id?: string;
  attribute: string;
  index?: number;
};

type WorkflowTransition = {
  event: string;
  condition?: string;
  nextStepId: string;
};

type WorkflowStep = {
  id: string;
  type: string;
  config?: Record<string, unknown>;
  transitions?: WorkflowTransition[];
};

type WorkflowRow = {
  id?: string;
  version?: number;
  steps?: WorkflowStep[];
};

type MappingRow = {
  questionId?: string;
  questionAttribute: string;
  workflowStepId?: string;
};

export type WorkflowValidationIssue = {
  level: 'error' | 'warning' | 'success';
  code: string;
  message: string;
  stepId?: string;
  attribute?: string;
  questionAttribute?: string;
};

const SYSTEM_ATTRIBUTES = [
  'conversationId',
  'participantId',
  'questionnaireId',
  'workflowId',
  'workflowInstanceId',
  'channelId',
];

export function buildWorkflowAttachmentValidation({
  workflow,
  questions,
  mappings,
}: {
  workflow: WorkflowRow | null;
  questions: QuestionRow[];
  mappings: MappingRow[];
}) {
  const steps = workflow?.steps ?? [];
  const orderedQuestions = [...questions].sort(
    (a, b) => Number(a.index ?? 0) - Number(b.index ?? 0)
  );
  const issues: WorkflowValidationIssue[] = [];
  const stepMap = new Map(steps.map((step) => [step.id, step]));
  const questionAttributeSet = new Set(orderedQuestions.map((question) => question.attribute));
  const mappingByAttribute = new Map(
    mappings.map((mapping) => [mapping.questionAttribute, mapping])
  );
  const workflowDerivedAttributes = getWorkflowDerivedAttributes(steps);
  const availableAttributes = new Set([
    ...orderedQuestions.map((question) => question.attribute),
    ...SYSTEM_ATTRIBUTES,
    ...workflowDerivedAttributes,
  ]);

  orderedQuestions.forEach((question) => {
    const mapping = mappingByAttribute.get(question.attribute);
    if (!mapping?.workflowStepId) {
      issues.push({
        level: 'warning',
        code: 'QUESTION_NOT_MAPPED',
        message: `Question "${question.attribute}" has no mapped workflow step`,
        questionAttribute: question.attribute,
      });
      return;
    }

    const step = stepMap.get(mapping.workflowStepId);
    if (!step) {
      issues.push({
        level: 'error',
        code: 'STEP_NOT_FOUND',
        message: `Mapped step "${mapping.workflowStepId}" was not found`,
        questionAttribute: question.attribute,
        stepId: mapping.workflowStepId,
      });
      return;
    }

    issues.push({
      level: 'success',
      code: 'QUESTION_STEP_MAPPED',
      message: `Step ${step.id} mapped to question "${question.attribute}"`,
      questionAttribute: question.attribute,
      stepId: step.id,
    });
  });

  steps.forEach((step) => {
    if ((step.transitions?.length ?? 0) === 0 && step.type !== 'END') {
      issues.push({
        level: 'error',
        code: 'STEP_WITHOUT_EXIT',
        message: `Step "${step.id}" has no exit path`,
        stepId: step.id,
      });
    }

    for (const transition of step.transitions ?? []) {
      if (transition.nextStepId !== 'END' && !stepMap.has(transition.nextStepId)) {
        issues.push({
          level: 'error',
          code: 'TRANSITION_TARGET_NOT_FOUND',
          message: `Step "${step.id}" points to missing step "${transition.nextStepId}"`,
          stepId: step.id,
        });
      }
    }

    getStepAttributeReferences(step).forEach((attribute) => {
      if (!availableAttributes.has(attribute)) {
        issues.push({
          level: 'error',
          code: 'ATTRIBUTE_NOT_FOUND',
          message: `Attribute "${attribute}" not defined`,
          stepId: step.id,
          attribute,
        });
      }
    });

    validateResponseMapping(step, issues);
  });

  const reachable = getReachableStepIds(steps);
  steps.forEach((step) => {
    if (!reachable.has(step.id)) {
      issues.push({
        level: 'warning',
        code: 'UNREACHABLE_STEP',
        message: `Unused step "${step.id}" is not reachable from the workflow start`,
        stepId: step.id,
      });
    }
  });

  const progressivelyAvailable = new Set<string>(SYSTEM_ATTRIBUTES);
  orderedQuestions.forEach((question) => {
    progressivelyAvailable.add(question.attribute);
    const stepId = mappingByAttribute.get(question.attribute)?.workflowStepId;
    if (!stepId) {
      return;
    }
    const step = stepMap.get(stepId);
    if (!step) {
      return;
    }

    getStepAttributeReferences(step).forEach((attribute) => {
      if (questionAttributeSet.has(attribute) && !progressivelyAvailable.has(attribute)) {
        issues.push({
          level: 'warning',
          code: 'ATTRIBUTE_USED_BEFORE_COLLECTION',
          message: `Step "${step.id}" uses "${attribute}" before it is collected`,
          stepId: step.id,
          attribute,
        });
      }
    });
  });

  return {
    valid: !issues.some((issue) => issue.level === 'error'),
    availableAttributes: Array.from(availableAttributes),
    workflowDerivedAttributes,
    issues,
    summary: {
      errors: issues.filter((issue) => issue.level === 'error').length,
      warnings: issues.filter((issue) => issue.level === 'warning').length,
      successes: issues.filter((issue) => issue.level === 'success').length,
    },
  };
}

function validateResponseMapping(step: WorkflowStep, issues: WorkflowValidationIssue[]) {
  const responseMapping =
    (step.config?.responseMapping as Record<string, unknown> | undefined) ?? {};

  Object.entries(responseMapping).forEach(([field, mapping]) => {
    if (typeof mapping === 'string') {
      if (!isValidPath(mapping)) {
        issues.push({
          level: 'error',
          code: 'INVALID_RESPONSE_MAPPING_PATH',
          message: `Response mapping "${field}" on step "${step.id}" has invalid path "${mapping}"`,
          stepId: step.id,
        });
      }
      return;
    }

    if (!mapping || typeof mapping !== 'object') {
      issues.push({
        level: 'error',
        code: 'INVALID_RESPONSE_MAPPING',
        message: `Response mapping "${field}" on step "${step.id}" must be a string or object`,
        stepId: step.id,
      });
      return;
    }

    const typedMapping = mapping as {
      path?: string;
      dependencies?: string[];
    };

    if (!typedMapping.path || !isValidPath(typedMapping.path)) {
      issues.push({
        level: 'error',
        code: 'INVALID_RESPONSE_MAPPING_PATH',
        message: `Response mapping "${field}" on step "${step.id}" has invalid path`,
        stepId: step.id,
      });
    }

    (typedMapping.dependencies ?? []).forEach((dependency) => {
      if (isLikelyAttributeToken(dependency)) {
        issues.push({
          level: 'success',
          code: 'RESPONSE_MAPPING_DEPENDENCY',
          message: `Response mapping "${field}" depends on "${dependency}"`,
          stepId: step.id,
          attribute: dependency,
        });
      }
    });
  });
}

function getWorkflowDerivedAttributes(steps: WorkflowStep[]) {
  const derived = new Set<string>();

  steps.forEach((step) => {
    Object.keys(
      (step.config?.responseMapping as Record<string, unknown> | undefined) ?? {}
    ).forEach((key) => derived.add(key));
    Object.keys((step.config?.defaultValues as Record<string, unknown> | undefined) ?? {}).forEach(
      (key) => derived.add(key)
    );
  });

  return Array.from(derived);
}

function getReachableStepIds(steps: WorkflowStep[]) {
  const stepMap = new Map(steps.map((step) => [step.id, step]));
  const visited = new Set<string>();
  const start = steps[0]?.id;

  if (!start) {
    return visited;
  }

  const visit = (stepId: string) => {
    if (!stepId || visited.has(stepId) || stepId === 'END') {
      return;
    }
    visited.add(stepId);
    stepMap.get(stepId)?.transitions?.forEach((transition) => visit(transition.nextStepId));
  };

  visit(start);
  return visited;
}

function getStepAttributeReferences(step: WorkflowStep) {
  const refs = new Set<string>();
  extractConditionAttributes(step, refs);
  extractTemplateAttributes(step.config, refs);
  extractResponseMappingDependencies(step, refs);
  return Array.from(refs);
}

function extractConditionAttributes(step: WorkflowStep, refs: Set<string>) {
  (step.transitions ?? [])
    .flatMap((transition) => tokenizeExpression(transition.condition))
    .forEach((token) => refs.add(token));
}

function extractTemplateAttributes(value: unknown, refs: Set<string>) {
  if (typeof value === 'string') {
    const matches = value.match(/\{\{\s*([^}]+)\s*\}\}/g) ?? [];
    matches
      .map((match) => match.replace(/\{\{|\}\}/g, '').trim())
      .flatMap((match) => tokenizeExpression(match))
      .forEach((token) => refs.add(token));
    return;
  }

  if (Array.isArray(value)) {
    value.forEach((item) => extractTemplateAttributes(item, refs));
    return;
  }

  if (value && typeof value === 'object') {
    Object.values(value).forEach((item) => extractTemplateAttributes(item, refs));
  }
}

function extractResponseMappingDependencies(step: WorkflowStep, refs: Set<string>) {
  Object.values(
    (step.config?.responseMapping as Record<string, unknown> | undefined) ?? {}
  ).forEach((mapping) => {
    if (!mapping || typeof mapping !== 'object' || Array.isArray(mapping)) {
      return;
    }
    ((mapping as { dependencies?: string[] }).dependencies ?? []).forEach((dependency) => {
      if (isLikelyAttributeToken(dependency)) {
        refs.add(dependency);
      }
    });
  });
}

function tokenizeExpression(expression?: string) {
  if (!expression) {
    return [];
  }

  const rawTokens = expression.match(/[A-Za-z_][A-Za-z0-9_.]*/g) ?? [];
  const ignored = new Set([
    'true',
    'false',
    'null',
    'undefined',
    'payload',
    'state',
    'env',
    'data',
    'length',
  ]);

  return rawTokens
    .map((token) =>
      token.startsWith('state.')
        ? token.replace(/^state\./, '')
        : token.startsWith('payload.')
          ? token.replace(/^payload\./, '')
          : token.startsWith('env.')
            ? ''
            : token
    )
    .filter((token) => token && !ignored.has(token))
    .filter((token) => isLikelyAttributeToken(token));
}

function isLikelyAttributeToken(token: string) {
  return /^[A-Za-z_][A-Za-z0-9_]*$/.test(token);
}

function isValidPath(path: string) {
  return /^[A-Za-z_$][A-Za-z0-9_$]*(\.[A-Za-z_$][A-Za-z0-9_$]*)*$/.test(path);
}
