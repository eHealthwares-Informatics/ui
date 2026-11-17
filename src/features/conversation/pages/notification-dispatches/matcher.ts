/**
 * JSON matcher helpers for notification dispatch rules.
 *
 * Mirrors the backend matcher (`conversation/src/shared/utils/matcher.util.ts`):
 * a leaf is `{ path, operator, value }` and nodes compose with
 * `and` / `or` / `not`.
 */

export const MATCHER_OPERATORS = [
  'eq',
  'ne',
  'gt',
  'gte',
  'lt',
  'lte',
  'contains',
  'startswith',
  'ends_with',
  'in',
  'exists',
  'missing',
  'regex',
  '==',
  '!=',
  '===',
  '!==',
  '>',
  '>=',
  '<',
  '<=',
  '=',
] as const;

const OPERATOR_SET = new Set(MATCHER_OPERATORS.map((operator) => operator.toLowerCase()));

/** Empty objects/arrays become null so the API stores a clean `matcher`. */
export function normalizeMatcher(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }
  return Object.keys(value as Record<string, unknown>).length
    ? (value as Record<string, unknown>)
    : null;
}

/** Validate a matcher tree; returns `true` or a human-readable error. */
export function validateMatcher(value: unknown): true | string {
  const error = validateNode(value, 'matcher');
  return error ?? true;
}

function validateNode(node: unknown, at: string): string | null {
  if (node === null || node === undefined) {
    return null;
  }
  if (typeof node !== 'object' || Array.isArray(node)) {
    return `${at} must be a JSON object`;
  }
  const obj = node as Record<string, unknown>;
  // An empty object means "no matcher" — treated as always-true.
  if (Object.keys(obj).length === 0) {
    return null;
  }
  const hasAnd = Object.hasOwn(obj, 'and');
  const hasOr = Object.hasOwn(obj, 'or');
  const hasNot = Object.hasOwn(obj, 'not');

  if (hasAnd || hasOr) {
    const key = hasAnd ? 'and' : 'or';
    const children = obj[key];
    if (!Array.isArray(children) || children.length === 0) {
      return `${at}.${key} must be a non-empty array`;
    }
    for (let i = 0; i < children.length; i += 1) {
      const error = validateNode(children[i], `${at}.${key}[${i}]`);
      if (error) {
        return error;
      }
    }
  }

  if (hasNot) {
    const error = validateNode(obj.not, `${at}.not`);
    if (error) {
      return error;
    }
  }

  const isLeaf = 'path' in obj || 'operator' in obj || 'value' in obj;
  if (isLeaf) {
    if (typeof obj.path !== 'string' || !obj.path.trim()) {
      return `${at}.path must be a non-empty string`;
    }
    if (obj.operator !== undefined && obj.operator !== null) {
      const operator = String(obj.operator).toLowerCase();
      if (!OPERATOR_SET.has(operator)) {
        return `${at}.operator "${String(obj.operator)}" is not supported`;
      }
    }
  } else if (!hasAnd && !hasOr && !hasNot) {
    return `${at} must contain path/operator/value or and/or/not`;
  }

  return null;
}

/** One-line summary for the list column. */
export function compactMatcher(value: unknown): string {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return '';
  }
  const matcher = value as Record<string, any>;
  if (Array.isArray(matcher.and)) {
    return `and(${matcher.and.length})`;
  }
  if (Array.isArray(matcher.or)) {
    return `or(${matcher.or.length})`;
  }
  if (matcher.not) {
    return 'not(...)';
  }
  if (!('path' in matcher) && !('operator' in matcher) && !('value' in matcher)) {
    return '';
  }
  const path = String(matcher.path ?? '?');
  const operator = String(matcher.operator ?? 'eq');
  if (matcher.value === undefined) {
    return `${path} ${operator}`;
  }
  return `${path} ${operator} ${JSON.stringify(matcher.value)}`;
}
