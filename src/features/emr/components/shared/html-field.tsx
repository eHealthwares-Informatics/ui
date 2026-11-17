import { Box } from '@mantine/core';
import DOMPurify from 'dompurify';

/** Readonly, sanitized HTML content (consent text, instructions). */
export function HtmlField({ html }: { html?: string | null }) {
  if (!html?.trim()) {
    return null;
  }
  const clean = DOMPurify.sanitize(html, {
    USE_PROFILES: { html: true },
  });
  return <Box style={{ lineHeight: 1.55 }} dangerouslySetInnerHTML={{ __html: clean }} />;
}
