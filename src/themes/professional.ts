import type { ResumeSchema } from '../types/resume';
import type { ThemeDefinition } from './types';
import { esc, dateRange, section, link } from './helpers';

function render(resume: ResumeSchema): string {
  const b = resume.basics;
  return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(b?.name)} - ${esc(b?.label || 'Resume')}</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#374151;line-height:1.6;max-width:800px;margin:0 auto;padding:40px;font-size:14px}
h1{font-size:28px;font-weight:700;color:#1e3a5f}
h2{font-size:15px;font-weight:700;color:#1e3a5f;margin-bottom:12px;padding-bottom:6px;border-bottom:3px solid #2563eb}
h3{font-size:15px;font-weight:600;color:#1e3a5f}
a{color:#2563eb;text-decoration:none}a:hover{text-decoration:underline}
.header{border-left:4px solid #2563eb;padding-left:16px;margin-bottom:28px}
.label{color:#6b7280;font-size:16px;margin-top:2px}
.contact{display:flex;flex-wrap:wrap;gap:12px;margin-top:10px;font-size:13px;color:#6b7280}
.contact a{color:#2563eb}
.summary{color:#4b5563;margin-bottom:28px;padding:12px 16px;background:#f0f4ff;border-radius:6px;border-left:3px solid #2563eb}
.section{margin-bottom:24px}
.entry{margin-bottom:18px}
.entry-header{display:flex;justify-content:space-between;align-items:baseline;flex-wrap:wrap}
.entry-meta{color:#2563eb;font-size:13px;font-weight:500}
.entry-org{color:#6b7280;font-size:13px;margin-top:1px}
ul{padding-left:18px;margin-top:6px}
li{margin-bottom:3px;color:#4b5563}
li::marker{color:#2563eb}
.skills-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px}
.skill-group{background:#f8fafc;padding:10px 14px;border-radius:6px;border:1px solid #e5e7eb}
.skill-group h3{font-size:13px;color:#2563eb;margin-bottom:6px}
.skill-keywords{display:flex;flex-wrap:wrap;gap:4px}
.tag{background:#dbeafe;color:#1e3a5f;padding:2px 8px;border-radius:3px;font-size:11.5px}
@media print{body{padding:20px 24px}.summary{background:none;border:none;padding:0}.skill-group{border:1px solid #ddd}}
</style></head><body>
<div class="header">
${b?.image ? `<img src="${esc(b.image)}" alt="${esc(b.name)}" style="width:80px;height:80px;border-radius:50%;object-fit:cover;margin-bottom:12px">` : ''}
${b?.name ? `<h1>${esc(b.name)}</h1>` : ''}
${b?.label ? `<p class="label">${esc(b.label)}</p>` : ''}
<div class="contact">
${b?.email ? `<span>${esc(b.email)}</span>` : ''}
${b?.phone ? `<span>${esc(b.phone)}</span>` : ''}
${b?.location?.city ? `<span>${esc(b.location.city)}${b.location.region ? ', ' + esc(b.location.region) : ''}</span>` : ''}
${b?.url ? `<span>${link(b.url, b.url.replace(/^https?:\/\//, ''))}</span>` : ''}
${(b?.profiles || []).map((p) => `<span>${link(p.url, p.network || p.username || '')}</span>`).join('')}
</div></div>
${b?.summary ? `<div class="summary">${esc(b.summary)}</div>` : ''}
${section(
  'Experience',
  (resume.work || [])
    .map(
      (w) => `<div class="entry">
<div class="entry-header"><h3>${esc(w.position)}</h3><span class="entry-meta">${dateRange(w.startDate, w.endDate)}</span></div>
<div class="entry-org">${link(w.url, w.name || '')}${w.location ? ` | ${esc(w.location)}` : ''}</div>
${w.description ? `<div style="font-size:12px;color:#9ca3af;font-style:italic">${esc(w.description)}</div>` : ''}
${w.summary ? `<p style="color:#4b5563;margin-top:4px">${esc(w.summary)}</p>` : ''}
${w.highlights?.length ? `<ul>${w.highlights.map((h) => `<li>${esc(h)}</li>`).join('')}</ul>` : ''}
</div>`,
    )
    .join(''),
)}
${section(
  'Projects',
  (resume.projects || [])
    .map(
      (p) => `<div class="entry">
<div class="entry-header"><h3>${link(p.url, p.name || '')}${p.entity ? `<span style="color:#6b7280;font-size:13px"> - ${esc(p.entity)}</span>` : ''}${p.type ? `<span style="color:#9ca3af;font-size:12px"> (${esc(p.type)})</span>` : ''}</h3>${p.startDate ? `<span class="entry-meta">${dateRange(p.startDate, p.endDate)}</span>` : ''}</div>
${p.roles?.length ? `<div style="font-size:12px;color:#6b7280">Role: ${p.roles.map((r) => esc(r)).join(', ')}</div>` : ''}
${p.description ? `<p style="color:#4b5563;margin-top:4px">${esc(p.description)}</p>` : ''}
${p.highlights?.length ? `<ul>${p.highlights.map((h) => `<li>${esc(h)}</li>`).join('')}</ul>` : ''}
${p.keywords?.length ? `<div style="display:flex;flex-wrap:wrap;gap:4px;margin-top:6px">${p.keywords.map((k) => `<span class="tag">${esc(k)}</span>`).join('')}</div>` : ''}
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
${e.courses?.length ? `<div style="margin-top:4px;font-size:12px;color:#6b7280">Courses: ${e.courses.map((c) => esc(c)).join(', ')}</div>` : ''}
</div>`,
    )
    .join(''),
)}
${section('Skills', resume.skills?.length ? `<div class="skills-grid">${(resume.skills || []).map((s) => `<div class="skill-group"><h3>${esc(s.name)}${s.level ? ` <span style="font-weight:normal;color:#9ca3af;font-size:smaller">- ${esc(s.level)}</span>` : ''}</h3><div class="skill-keywords">${(s.keywords || []).map((k) => `<span class="tag">${esc(k)}</span>`).join('')}</div></div>`).join('')}</div>` : '')}
${section('Languages', resume.languages?.length ? `<div style="display:flex;gap:16px">${(resume.languages || []).map((l) => `<span class="tag">${esc(l.language)}${l.fluency ? ` - ${esc(l.fluency)}` : ''}</span>`).join('')}</div>` : '')}
${section('Volunteer', (resume.volunteer || []).map((v) => `<div class="entry"><div class="entry-header"><h3>${esc(v.position)}</h3><span class="entry-meta">${dateRange(v.startDate, v.endDate)}</span></div><div class="entry-org">${link(v.url, v.organization || '')}</div>${v.summary ? `<p style="margin-top:4px;color:#4b5563">${esc(v.summary)}</p>` : ''}${v.highlights?.length ? `<ul>${v.highlights.map((h) => `<li>${esc(h)}</li>`).join('')}</ul>` : ''}</div>`).join(''))}
${section('Awards', (resume.awards || []).map((a) => `<div class="entry"><div class="entry-header"><h3>${esc(a.title)}</h3><span class="entry-meta">${esc(a.awarder)}</span></div>${a.summary ? `<p style="color:#4b5563;margin-top:4px">${esc(a.summary)}</p>` : ''}</div>`).join(''))}
${section('Certificates', (resume.certificates || []).map((c) => `<div class="entry"><div class="entry-header"><h3>${link(c.url, c.name || '')}</h3><span class="entry-meta">${c.issuer || ''}</span></div></div>`).join(''))}
${section('Publications', (resume.publications || []).map((p) => `<div class="entry"><div class="entry-header"><h3>${link(p.url, p.name || '')}</h3><span class="entry-meta">${p.releaseDate || ''}</span></div>${p.publisher ? `<div class="entry-org">${esc(p.publisher)}</div>` : ''}${p.summary ? `<p style="color:#4b5563;margin-top:4px">${esc(p.summary)}</p>` : ''}</div>`).join(''))}
${section('Interests', (resume.interests || []).map((i) => `<div class="entry"><h3>${esc(i.name)}</h3>${i.keywords?.length ? `<div style="display:flex;flex-wrap:wrap;gap:4px;margin-top:4px">${i.keywords.map((k) => `<span class="tag">${esc(k)}</span>`).join('')}</div>` : ''}</div>`).join(''))}
${section('References', (resume.references || []).map((r) => `<div class="entry"><h3>${esc(r.name)}</h3>${r.reference ? `<p style="color:#4b5563;font-style:italic;margin-top:4px">"${esc(r.reference)}"</p>` : ''}</div>`).join(''))}
</body></html>`;
}

export const professionalTheme: ThemeDefinition = {
  id: 'professional',
  name: 'Professional',
  description: 'Blue accents with structured headers and card-style skills',
  render,
};
