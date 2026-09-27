export type ParsedOptions = {
  title: string;
  options: { value: string; label: string }[];
};

const OPTION_LINE_RE = /^\s*([^:\s][^:]*?)\s*:\s*(.+?)\s*$/;

export function parseQuestionOptions(text: string): ParsedOptions | null {
  const lines = text.split('\n').filter(Boolean);
  if (lines.length < 2) {
    return null;
  }

  const title = lines[0].trim();
  if (!title) {
    return null;
  }

  const options: { value: string; label: string }[] = [];

  for (let i = 1; i < lines.length; i++) {
    const raw = lines[i].replace(/\u200B/g, '').trim();
    const m = raw.match(OPTION_LINE_RE);
    if (!m) {
      return null;
    }
    options.push({ value: m[1].trim(), label: m[2].trim() });
  }

  if (!options.length) {
    return null;
  }

  return { title, options };
}
