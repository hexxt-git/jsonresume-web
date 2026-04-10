import type { ResumeSchema } from '../types/resume';
import type { ThemeDefinition } from './types';
import { esc, md, dateRange, section, link } from './helpers';

function render(resume: ResumeSchema): string {
  const b = resume.basics;
  const sidebarSections = [
    b?.email ? `<div class="sb-section"><h3>Email</h3><p>${esc(b.email)}</p></div>` : '',
    b?.phone ? `<div class="sb-section"><h3>Phone</h3><p>${esc(b.phone)}</p></div>` : '',
    b?.location?.city
      ? `<div class="sb-section"><h3>Location</h3><p>${esc(b.location.city)}${b.location.region ? ', ' + esc(b.location.region) : ''}</p></div>`
      : '',
    b?.url
      ? `<div class="sb-section"><h3>Website</h3><p>${link(b.url, b.url.replace(/^https?:\/\//, ''))}</p></div>`
      : '',
    b?.profiles?.length
      ? `<div class="sb-section"><h3>Profiles</h3>${b.profiles.map((p) => `<p>${link(p.url, p.network || p.username || '')}</p>`).join('')}</div>`
      : '',
    resume.skills?.length
      ? `<div class="sb-section"><h3>Skills</h3>${(resume.skills || []).map((s) => `<div class="sb-skill"><strong>${esc(s.name)}${s.level ? ` <span style="font-weight:normal;color:#94a3b8;font-size:smaller">- ${esc(s.level)}</span>` : ''}</strong><div class="sb-tags">${(s.keywords || []).map((k) => `<span class="sb-tag">${esc(k)}</span>`).join('')}</div></div>`).join('')}</div>`
      : '',
    resume.languages?.length
      ? `<div class="sb-section"><h3>Languages</h3>${(resume.languages || []).map((l) => `<p>${esc(l.language)}${l.fluency ? ` <span style="opacity:.7">- ${esc(l.fluency)}</span>` : ''}</p>`).join('')}</div>`
      : '',
    resume.interests?.length
      ? `<div class="sb-section"><h3>Interests</h3>${(resume.interests || []).map((i) => `<p>${esc(i.name)}</p>${i.keywords?.length ? `<div class="sb-tags" style="margin-bottom:4px">${i.keywords.map((k) => `<span class="sb-tag">${esc(k)}</span>`).join('')}</div>` : ''}`).join('')}</div>`
      : '',
  ]
    .filter(Boolean)
    .join('');

  return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(b?.name)} - ${esc(b?.label || 'Resume')}</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#333;line-height:1.6;font-size:14px;display:flex;min-height:100vh}
.sidebar{width:280px;min-width:280px;background:#1e293b;color:#e2e8f0;padding:36px 24px}
.sidebar h1{font-size:22px;font-weight:700;color:#fff;margin-bottom:4px}
.sidebar .label{color:#94a3b8;font-size:14px;margin-bottom:24px}
.sb-section{margin-bottom:20px}
.sb-section h3{font-size:11px;text-transform:uppercase;letter-spacing:1.2px;color:#64748b;margin-bottom:6px}
.sb-section p{font-size:13px;color:#cbd5e1;margin-bottom:2px}
.sb-section a{color:#38bdf8;text-decoration:none}
.sb-skill{margin-bottom:8px}
.sb-skill strong{font-size:13px;color:#e2e8f0;display:block;margin-bottom:4px}
.sb-tags{display:flex;flex-wrap:wrap;gap:4px}
.sb-tag{background:#334155;color:#cbd5e1;padding:2px 8px;border-radius:3px;font-size:11px}
.main{flex:1;padding:36px 40px;max-width:calc(100% - 280px)}
h2{font-size:14px;font-weight:700;color:#1e293b;margin-bottom:12px;padding-bottom:6px;border-bottom:2px solid #e2e8f0}
h3{font-size:15px;font-weight:600;color:#1e293b}
a{color:#2563eb;text-decoration:none}a:hover{text-decoration:underline}
.summary{color:#6b7280;margin-bottom:24px}
.section{margin-bottom:22px}
.entry{margin-bottom:16px}
.entry-header{display:flex;justify-content:space-between;align-items:baseline;flex-wrap:wrap}
.entry-meta{color:#9ca3af;font-size:13px}
.entry-org{color:#6b7280;font-size:13px}
ul{padding-left:18px;margin-top:6px}
li{margin-bottom:3px;color:#4b5563}
@media print{body{display:flex}.sidebar{width:240px;min-width:240px;background:#1e293b;-webkit-print-color-adjust:exact;print-color-adjust:exact}.main{padding:24px 28px}}
</style></head><body>
<aside class="sidebar">
${b?.image ? `<img src="${esc(b.image)}" alt="${esc(b.name)}" style="width:80px;height:80px;border-radius:50%;object-fit:cover;border:2px solid #334155;display:block;margin:0 auto 12px">` : ''}
${b?.name ? `<h1>${esc(b.name)}</h1>` : ''}
${b?.label ? `<p class="label">${esc(b.label)}</p>` : ''}
${sidebarSections}
</aside>
<main class="main">
${b?.summary ? `<p class="summary">${md(b.summary)}</p>` : ''}
${section(
  'Experience',
  (resume.work || [])
    .map(
      (w) => `<div class="entry">
<div class="entry-header"><h3>${esc(w.position)}</h3><span class="entry-meta">${dateRange(w.startDate, w.endDate)}</span></div>
<div class="entry-org">${link(w.url, w.name || '')}${w.location ? ` - ${esc(w.location)}` : ''}</div>
${w.description ? `<div style="font-size:12px;color:#9ca3af;font-style:italic">${md(w.description)}</div>` : ''}
${w.summary ? `<p style="color:#6b7280;margin-top:4px">${md(w.summary)}</p>` : ''}
${w.highlights?.length ? `<ul>${w.highlights.map((h) => `<li>${md(h)}</li>`).join('')}</ul>` : ''}
</div>`,
    )
    .join(''),
)}
${section(
  'Projects',
  (resume.projects || [])
    .map(
      (p) => `<div class="entry">
<div class="entry-header"><h3>${link(p.url, p.name || '')}${p.entity ? `<span style="color:#9ca3af;font-size:13px"> - ${esc(p.entity)}</span>` : ''}${p.type ? `<span style="color:#9ca3af;font-size:12px"> (${esc(p.type)})</span>` : ''}</h3>${p.startDate ? `<span class="entry-meta">${dateRange(p.startDate, p.endDate)}</span>` : ''}</div>
${p.roles?.length ? `<div style="font-size:12px;color:#9ca3af">Role: ${p.roles.map((r) => esc(r)).join(', ')}</div>` : ''}
${p.description ? `<p style="color:#6b7280;margin-top:4px">${md(p.description)}</p>` : ''}
${p.highlights?.length ? `<ul>${p.highlights.map((h) => `<li>${md(h)}</li>`).join('')}</ul>` : ''}
${p.keywords?.length ? `<div style="display:flex;flex-wrap:wrap;gap:4px;margin-top:6px">${p.keywords.map((k) => `<span class="sb-tag">${esc(k)}</span>`).join('')}</div>` : ''}
</div>`,
    )
    .join(''),
)}
${section(
  'Education',
  (resume.education || [])
    .map(
      (e) => `<div class="entry">
<div class="entry-header"><h3>${link(e.url, e.institution || '')}</h3><span class="entry-meta">${dateRange(e.startDate, e.endDate)}</span></div>
${e.studyType || e.area || e.score ? `<div class="entry-org">${esc(e.studyType)}${e.area ? ` in ${esc(e.area)}` : ''}${e.score ? ` (${esc(e.score)})` : ''}</div>` : ''}
${e.courses?.length ? `<div style="margin-top:4px;font-size:12px;color:#9ca3af">Courses: ${e.courses.map((c) => esc(c)).join(', ')}</div>` : ''}
</div>`,
    )
    .join(''),
)}
${section('Volunteer', (resume.volunteer || []).map((v) => `<div class="entry"><div class="entry-header"><h3>${esc(v.position)}</h3><span class="entry-meta">${dateRange(v.startDate, v.endDate)}</span></div><div class="entry-org">${link(v.url, v.organization || '')}</div>${v.summary ? `<p style="margin-top:4px;color:#6b7280">${md(v.summary)}</p>` : ''}${v.highlights?.length ? `<ul>${v.highlights.map((h) => `<li>${md(h)}</li>`).join('')}</ul>` : ''}</div>`).join(''))}
${section('Awards', (resume.awards || []).map((a) => `<div class="entry"><div class="entry-header"><h3>${esc(a.title)}</h3><span class="entry-meta">${esc(a.awarder)}</span></div>${a.summary ? `<p style="color:#6b7280;margin-top:4px">${md(a.summary)}</p>` : ''}</div>`).join(''))}
${section('Certificates', (resume.certificates || []).map((c) => `<div class="entry"><div class="entry-header"><h3>${link(c.url, c.name || '')}</h3><span class="entry-meta">${c.issuer || ''}</span></div></div>`).join(''))}
${section('Publications', (resume.publications || []).map((p) => `<div class="entry"><div class="entry-header"><h3>${link(p.url, p.name || '')}</h3><span class="entry-meta">${p.releaseDate || ''}</span></div>${p.publisher ? `<div class="entry-org">${esc(p.publisher)}</div>` : ''}${p.summary ? `<p style="color:#6b7280;margin-top:4px">${md(p.summary)}</p>` : ''}</div>`).join(''))}
${section('References', (resume.references || []).map((r) => `<div class="entry"><h3>${esc(r.name)}</h3>${r.reference ? `<p style="color:#6b7280;font-style:italic;margin-top:4px">"${md(r.reference)}"</p>` : ''}</div>`).join(''))}
</main></body></html>`;
}

export const sidebarTheme: ThemeDefinition = {
  id: 'sidebar',
  name: 'Sidebar',
  description: 'Two-column layout with dark sidebar for contact and skills',
  render,
};
