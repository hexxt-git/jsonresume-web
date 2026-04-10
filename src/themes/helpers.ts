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
  const end = endDate ? formatDate(endDate) : 'Present';
  return `${start} - ${end}`;
}

export function section(title: string, content: string): string {
  if (!content.trim()) return '';
  return `<section class="section"><h2>${esc(title)}</h2>${content}</section>`;
}

export function link(url: string | undefined, text: string): string {
  if (!url) return esc(text);
  return `<a href="${esc(url)}" target="_blank" rel="noopener">${esc(text)}</a>`;
}
