import type { ResumeSchema } from '../types/resume';
import type { ThemeDefinition } from './types';
import { esc, md, dateRange, section, link } from './helpers';

function timelineEntries(
  items: {
    date?: string;
    title: string;
    sub?: string;
    detail?: string;
    highlights?: string[];
    extra?: string;
  }[],
): string {
  if (!items.length) return '';
  return `<div class="timeline">${items
    .map(
      (item) => `<div class="tl-entry">
<div class="tl-dot"></div>
<div class="tl-date">${esc(item.date)}</div>
<div class="tl-content">
<h3>${item.title}</h3>
${item.sub ? `<div class="tl-sub">${item.sub}</div>` : ''}
${item.detail ? `<p class="tl-detail">${esc(item.detail)}</p>` : ''}
${item.highlights?.length ? `<ul>${item.highlights.map((h) => `<li>${md(h)}</li>`).join('')}</ul>` : ''}
${item.extra || ''}
</div></div>`,
    )
    .join('')}</div>`;
}

function render(resume: ResumeSchema): string {
  const b = resume.basics;
  return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(b?.name)} - ${esc(b?.label || 'Resume')}</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#374151;line-height:1.6;max-width:800px;margin:0 auto;padding:48px 40px;font-size:14px}
h1{font-size:28px;font-weight:700;color:#111827}
h2{font-size:14px;font-weight:700;text-transform:uppercase;letter-spacing:1.2px;color:#6b7280;margin-bottom:16px}
h3{font-size:15px;font-weight:600;color:#111827}
a{color:#4f46e5;text-decoration:none}a:hover{text-decoration:underline}
.label{color:#6b7280;font-size:16px;margin-bottom:12px}
.contact{display:flex;flex-wrap:wrap;gap:14px;color:#9ca3af;font-size:13px;margin-bottom:28px}
.summary{color:#6b7280;margin-bottom:32px}
.section{margin-bottom:28px}
.timeline{position:relative;padding-left:28px}
.timeline::before{content:"";position:absolute;left:5px;top:8px;bottom:8px;width:2px;background:#e5e7eb}
.tl-entry{position:relative;margin-bottom:20px}
.tl-dot{position:absolute;left:-28px;top:6px;width:12px;height:12px;border-radius:50%;background:#4f46e5;border:2px solid #fff;box-shadow:0 0 0 2px #4f46e5}
.tl-date{font-size:12px;color:#4f46e5;font-weight:600;margin-bottom:2px}
.tl-sub{color:#6b7280;font-size:13px}
.tl-detail{color:#6b7280;margin-top:4px}
ul{padding-left:18px;margin-top:6px}
li{margin-bottom:3px;color:#6b7280}
.skills-grid{display:flex;flex-wrap:wrap;gap:20px}
.skill-group h3{font-size:13px;color:#4f46e5;margin-bottom:6px}
.tags{display:flex;flex-wrap:wrap;gap:5px}
.tag{background:#eef2ff;color:#4f46e5;padding:3px 10px;border-radius:4px;font-size:12px}
.langs{display:flex;gap:12px;flex-wrap:wrap}
.lang{color:#6b7280;font-size:13px}
@media print{body{padding:20px 24px}.timeline::before{background:#ccc}.tl-dot{background:#4f46e5;-webkit-print-color-adjust:exact;print-color-adjust:exact}}
</style></head><body>
${b?.image ? `<img src="${esc(b.image)}" alt="${esc(b.name)}" style="width:80px;height:80px;border-radius:50%;object-fit:cover;margin-bottom:12px">` : ''}
${b?.name ? `<h1>${esc(b.name)}</h1>` : ''}
${b?.label ? `<p class="label">${esc(b.label)}</p>` : ''}
<div class="contact">
${b?.email ? `<span>${esc(b.email)}</span>` : ''}
${b?.phone ? `<span>${esc(b.phone)}</span>` : ''}
${b?.location?.city ? `<span>${esc(b.location.city)}${b.location.region ? ', ' + esc(b.location.region) : ''}</span>` : ''}
${b?.url ? `<span>${link(b.url, b.url.replace(/^https?:\/\//, ''))}</span>` : ''}
${(b?.profiles || []).map((p) => `<span>${link(p.url, p.network || p.username || '')}</span>`).join('')}
</div>
${b?.summary ? `<p class="summary">${md(b.summary)}</p>` : ''}
${section(
  'Experience',
  timelineEntries(
    (resume.work || []).map((w) => ({
      date: dateRange(w.startDate, w.endDate),
      title: esc(w.position || ''),
      sub: `${link(w.url, w.name || '')}${w.location ? ` - ${esc(w.location)}` : ''}${w.description ? `<div style="font-size:12px;color:#9ca3af;font-style:italic">${md(w.description)}</div>` : ''}`,
      detail: w.summary,
      highlights: w.highlights,
    })),
  ),
)}
${section(
  'Projects',
  timelineEntries(
    (resume.projects || []).map((p) => ({
      date: dateRange(p.startDate, p.endDate),
      title: `${link(p.url, p.name || '')}${p.entity ? `<span style="color:#6b7280;font-size:13px"> - ${esc(p.entity)}</span>` : ''}${p.type ? `<span style="color:#9ca3af;font-size:12px"> (${esc(p.type)})</span>` : ''}`,
      sub: p.roles?.length
        ? `<div style="font-size:12px;color:#9ca3af">Role: ${p.roles.map((r) => esc(r)).join(', ')}</div>`
        : undefined,
      detail: p.description,
      highlights: p.highlights,
      extra: p.keywords?.length
        ? `<div style="display:flex;flex-wrap:wrap;gap:4px;margin-top:6px">${p.keywords.map((k) => `<span class="tag">${esc(k)}</span>`).join('')}</div>`
        : '',
    })),
  ),
)}
${section(
  'Education',
  timelineEntries(
    (resume.education || []).map((e) => ({
      date: dateRange(e.startDate, e.endDate),
      title: link(e.url, e.institution || ''),
      sub: `${esc(e.studyType || '')}${e.area ? ` in ${esc(e.area)}` : ''}${e.score ? ` (${esc(e.score)})` : ''}`,
      extra: e.courses?.length
        ? `<div style="margin-top:4px;font-size:12px;color:#9ca3af">Courses: ${e.courses.map((c) => esc(c)).join(', ')}</div>`
        : '',
    })),
  ),
)}
${section('Skills', resume.skills?.length ? `<div class="skills-grid">${(resume.skills || []).map((s) => `<div class="skill-group"><h3>${esc(s.name)}${s.level ? ` <span style="font-weight:normal;color:#9ca3af;font-size:smaller">- ${esc(s.level)}</span>` : ''}</h3><div class="tags">${(s.keywords || []).map((k) => `<span class="tag">${esc(k)}</span>`).join('')}</div></div>`).join('')}</div>` : '')}
${section('Languages', resume.languages?.length ? `<div class="langs">${(resume.languages || []).map((l) => `<span class="lang">${esc(l.language)}${l.fluency ? ` (${esc(l.fluency)})` : ''}</span>`).join('')}</div>` : '')}
${section('Volunteer', timelineEntries((resume.volunteer || []).map((v) => ({ date: dateRange(v.startDate, v.endDate), title: esc(v.position || ''), sub: link(v.url, v.organization || ''), detail: v.summary, highlights: v.highlights }))))}
${section('Awards', (resume.awards || []).map((a) => `<div class="entry" style="margin-bottom:12px"><h3>${esc(a.title)}</h3><p style="color:#6b7280;font-size:13px">${esc(a.awarder)}${a.date ? ` - ${a.date}` : ''}</p>${a.summary ? `<p style="color:#6b7280;margin-top:4px">${md(a.summary)}</p>` : ''}</div>`).join(''))}
${section('Certificates', (resume.certificates || []).map((c) => `<div class="entry" style="margin-bottom:12px"><h3>${link(c.url, c.name || '')}</h3><p style="color:#6b7280;font-size:13px">${c.issuer || ''}${c.date ? ` - ${c.date}` : ''}</p></div>`).join(''))}
${section('Publications', (resume.publications || []).map((p) => `<div class="entry" style="margin-bottom:12px"><h3>${link(p.url, p.name || '')}</h3>${p.publisher ? `<p style="color:#6b7280;font-size:13px">${esc(p.publisher)}${p.releaseDate ? ` (${p.releaseDate})` : ''}</p>` : ''}${p.summary ? `<p style="color:#6b7280;margin-top:4px">${md(p.summary)}</p>` : ''}</div>`).join(''))}
${section('Interests', (resume.interests || []).map((i) => `<div style="margin-bottom:8px"><h3 style="display:inline">${esc(i.name)}</h3>${i.keywords?.length ? `: <span style="color:#6b7280">${i.keywords.map((k) => esc(k)).join(', ')}</span>` : ''}</div>`).join(''))}
${section('References', (resume.references || []).map((r) => `<div style="margin-bottom:12px"><h3>${esc(r.name)}</h3>${r.reference ? `<p style="color:#6b7280;font-style:italic;margin-top:4px">"${md(r.reference)}"</p>` : ''}</div>`).join(''))}
</body></html>`;
}

export const timelineTheme: ThemeDefinition = {
  id: 'timeline',
  name: 'Timeline',
  description: 'Vertical timeline with dots for experience entries',
  render,
};
