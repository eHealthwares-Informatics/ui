import Handlebars from 'handlebars';

/**
 * Renders the notification template bodies for the dispatch Test dialog, so an
 * operator can see exactly what will be sent before pressing "Send test".
 *
 * The renderer must match the backend (`handlebars.util.ts`) or the preview
 * lies about the real output:
 *   - same engine (Handlebars),
 *   - `noEscape: true`, so authored HTML inside a token (a document narrative,
 *     for example) is not double-escaped,
 *   - a token the context does not provide renders as an empty string.
 */

export type ChannelBody = {
  body?: string;
  subject?: string;
  html?: string;
};

export type NotificationBodies = {
  email?: ChannelBody | null;
  sms?: ChannelBody | null;
  sms_proxy?: ChannelBody | null;
  whatsapp?: ChannelBody | null;
};

export type PreviewChannelKey = 'email' | 'sms' | 'whatsapp';

export type PreviewChannel = {
  key: PreviewChannelKey;
  label: string;
  /** Email only. */
  subject?: string;
  /** Email text body, SMS body, or WhatsApp body. */
  text: string;
  /** Email only — rendered HTML for the sandboxed iframe. */
  html?: string;
  /**
   * Context paths the body references that the context does not provide. The
   * backend rejects the send for such a body (`missingParamsForChannel`), so
   * the preview surfaces the same list before the operator presses "Send test".
   */
  missingParams: string[];
  /** Template compile/render error, shown instead of the output. */
  error?: string;
};

const LABELS: Record<PreviewChannelKey, string> = {
  email: 'Email',
  sms: 'SMS',
  whatsapp: 'WhatsApp',
};

// Mirrors `extractTemplateParams` in the backend's template-params.util: every
// plain Handlebars token (`{{patientName}}`, `{{sale.total}}`, `{{{html}}}`) is
// required; block helpers (`{{#if}}`, `{{/each}}`), comments, partials and
// Meta's numeric placeholders (`{{1}}`) are not.
const TOKEN_PATTERN = /\{\{\{?\s*([\w.]+)\s*\}?\}\}/g;
const IGNORED_TOKENS = new Set(['else', 'this', 'true', 'false', 'null', 'undefined']);

/** Context paths referenced by one or more template strings (deduped, ordered). */
export function extractParams(...sources: Array<string | null | undefined>): string[] {
  const params: string[] = [];
  const seen = new Set<string>();
  for (const source of sources) {
    if (!source || typeof source !== 'string') {
      continue;
    }
    TOKEN_PATTERN.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = TOKEN_PATTERN.exec(source)) !== null) {
      const token = match[1].trim();
      if (!token || /^\d+$/.test(token) || IGNORED_TOKENS.has(token.toLowerCase())) {
        continue;
      }
      if (seen.has(token)) {
        continue;
      }
      seen.add(token);
      params.push(token);
    }
  }
  return params;
}

/** Read a dotted path (`sale.total`), mirroring the backend's `getPath`. */
export function getPath(source: unknown, path: string): unknown {
  if (!path) {
    return source;
  }
  return path
    .split('.')
    .reduce<unknown>(
      (current, segment) =>
        current == null ? undefined : (current as Record<string, unknown>)[segment],
      source
    );
}

/**
 * Params a body needs that the context does not provide. A key counts as
 * provided when its value is not `undefined` — an empty string is a value.
 */
export function missingParams(
  params: string[],
  context: Record<string, unknown> | null | undefined
): string[] {
  const source = context ?? {};
  return params.filter((path) => getPath(source, path) === undefined);
}

/** Render one body. Mirrors `renderHandlebars` from the backend. */
export function renderTemplate(
  source: string | null | undefined,
  context: Record<string, unknown>
): string {
  const template = String(source ?? '');
  if (!template) {
    return '';
  }
  return Handlebars.compile(template, { noEscape: true })(context ?? {});
}

function renderChannel(
  key: PreviewChannelKey,
  fields: { subject?: string; text?: string; html?: string },
  context: Record<string, unknown>
): PreviewChannel {
  const missing = missingParams(extractParams(fields.subject, fields.text, fields.html), context);
  try {
    return {
      key,
      label: LABELS[key],
      subject: fields.subject ? renderTemplate(fields.subject, context) : undefined,
      text: renderTemplate(fields.text, context),
      html: fields.html ? renderTemplate(fields.html, context) : undefined,
      missingParams: missing,
    };
  } catch (error) {
    return {
      key,
      label: LABELS[key],
      text: '',
      missingParams: missing,
      error: (error as Error)?.message ?? 'Could not render this body',
    };
  }
}

/**
 * Build the per-channel preview. Only channels the template actually defines are
 * returned, in a stable order (email, sms, whatsapp) so the tab order does not
 * jump around while the operator edits the context.
 *
 * `sms_proxy` shares the SMS copy: the dispatcher sends `bodies.sms` for an
 * `sms` channel and `bodies.sms_proxy` (falling back to `bodies.sms`) for an
 * `sms_proxy` channel, so the dialog shows whichever exists.
 */
export function buildPreview(
  bodies: NotificationBodies | null | undefined,
  context: Record<string, unknown>
): PreviewChannel[] {
  if (!bodies) {
    return [];
  }
  const channels: PreviewChannel[] = [];

  const email = bodies.email;
  if (email && (email.subject || email.body || email.html)) {
    channels.push(
      renderChannel(
        'email',
        { subject: email.subject, text: email.body, html: email.html },
        context
      )
    );
  }

  const sms = bodies.sms ?? bodies.sms_proxy;
  if (sms?.body) {
    channels.push(renderChannel('sms', { text: sms.body }, context));
  }

  if (bodies.whatsapp?.body) {
    channels.push(renderChannel('whatsapp', { text: bodies.whatsapp.body }, context));
  }

  return channels;
}
