export function esc(str: string | undefined | null): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function formatDate(iso: string | undefined): string {
  if (!iso) return '';
  const parts = iso.split('-');
  if (parts.length === 1) return parts[0];
  const months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];
  const month = months[parseInt(parts[1], 10) - 1] || parts[1];
  return `${month} ${parts[0]}`;
}

export function dateRange(startDate?: string, endDate?: string): string {
  if (!startDate && !endDate) return '';
  const start = formatDate(startDate);
  const end = formatDate(endDate);
  if (start && end) return `${start} - ${end}`;
  if (start) return `${start} - Present`;
  return end;
}

export function section(title: string, content: string): string {
  if (!content.trim()) return '';
  return `<section class="section" aria-label="${esc(title)}"><h2>${esc(title)}</h2>${content}</section>`;
}

/** Block dangerous URL protocols (javascript:, data:, vbscript:, etc.) */
function safeUrl(url: string): string {
  const trimmed = url.trim().toLowerCase();
  if (/^(javascript|data|vbscript)\s*:/i.test(trimmed)) return '';
  return url;
}

export function link(url: string | undefined, text: string): string {
  if (!url) return esc(text);
  const safe = safeUrl(url);
  if (!safe) return esc(text);
  return `<a href="${esc(safe)}" target="_blank" rel="noopener">${esc(text)}</a>`;
}

/** Render inline markdown: **bold**, *italic*, `code`, [text](url) */
export function md(str: string | undefined | null): string {
  if (!str) return '';
  return esc(str)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(
      /`(.+?)`/g,
      '<code style="font-size:calc(0.9em * var(--fs-mult, 1));background:rgba(0,0,0,0.05);padding:1px 4px;border-radius:2px">$1</code>',
    )
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, text, url) => {
      const safe = safeUrl(url);
      return safe ? `<a href="${safe}" target="_blank" rel="noopener">${text}</a>` : text;
    });
}

/** Sanitize image src — block non-http protocols */
export function safeSrc(url: string | undefined): string {
  if (!url) return '';
  const safe = safeUrl(url);
  return safe ? esc(safe) : '';
}
