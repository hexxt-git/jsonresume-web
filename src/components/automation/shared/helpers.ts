/** Split a multi-JD blob by --- / === separators or 3+ blank lines. */
export function splitJds(text: string): string[] {
  return text
    .split(/\n(?:---+|===+)\n|\n{3,}/)
    .map((s) => s.trim())
    .filter((s) => s.length > 20);
}

/** Extract a best-guess title and company from the first lines of a JD. */
export function extractMeta(text: string): { title: string; company: string } {
  const lines = text
    .trim()
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);
  let title = lines[0]?.slice(0, 100) || 'Untitled';
  let company = '';

  const atMatch = title.match(/^(.+?)\s+(?:at|@|[-–—])\s+(.+)$/i);
  if (atMatch) {
    title = atMatch[1].trim();
    company = atMatch[2].trim();
  } else {
    for (const line of lines.slice(0, 10)) {
      const m = line.match(/(?:company|employer|organization)[:\s]+(.+)/i);
      if (m) {
        company = m[1].trim();
        break;
      }
    }
  }
  return { title, company };
}

/** Relative timestamp → short label. */
export function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d`;
  return new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

/** Normalise a value to a diff-friendly string. */
export function stringify(v: unknown): string {
  if (typeof v === 'string') return v;
  return JSON.stringify(v, null, 2);
}
