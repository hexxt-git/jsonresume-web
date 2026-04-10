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
  if (start) return start;
  return end;
}

export function section(title: string, content: string): string {
  if (!content.trim()) return '';
  return `<section class="section"><h2>${esc(title)}</h2>${content}</section>`;
}

export function link(url: string | undefined, text: string): string {
  if (!url) return esc(text);
  return `<a href="${esc(url)}" target="_blank" rel="noopener">${esc(text)}</a>`;
}

/** Render inline markdown: **bold**, *italic*, `code`, [text](url) */
export function md(str: string | undefined | null): string {
  if (!str) return '';
  return esc(str)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(
      /`(.+?)`/g,
      '<code style="font-size:0.9em;background:rgba(0,0,0,0.05);padding:1px 4px;border-radius:2px">$1</code>',
    )
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
}
