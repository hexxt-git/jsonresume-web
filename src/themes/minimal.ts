import type { ResumeSchema } from '../types/resume';
import type { ThemeDefinition } from './types';
import { esc, dateRange, section, link } from './helpers';

function render(resume: ResumeSchema): string {
  const b = resume.basics;
  return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(b?.name)} - ${esc(b?.label || 'Resume')}</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#222;line-height:1.55;max-width:720px;margin:0 auto;padding:48px 40px;font-size:14px}
h1{font-size:24px;font-weight:700;margin-bottom:2px}
h2{font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:2px;color:#222;margin:24px 0 10px}
h3{font-size:14px;font-weight:600}
a{color:inherit;text-decoration:underline;text-decoration-color:#ccc;text-underline-offset:2px}a:hover{text-decoration-color:#222}
.meta{color:#777;font-size:13px}
.contact{color:#777;font-size:13px;margin-bottom:4px}
.summary{color:#555;margin:16px 0 0}
.entry{margin-bottom:14px}
.entry-row{display:flex;justify-content:space-between;align-items:baseline;flex-wrap:wrap}
.sub{color:#555;font-size:13px}
ul{padding-left:18px;margin-top:4px}
li{margin-bottom:2px;color:#444}
.skills-inline{color:#555}
.skills-inline strong{color:#222;font-weight:600}
@media print{body{padding:20px 24px;font-size:12.5px}h2{margin:16px 0 8px}}
</style></head><body>
${b?.image ? `<img src="${esc(b.image)}" alt="${esc(b.name)}" style="width:80px;height:80px;border-radius:50%;object-fit:cover;margin-bottom:12px">` : ''}
${b?.name ? `<h1>${esc(b.name)}</h1>` : ''}
${b?.label ? `<div class="meta">${esc(b.label)}</div>` : ''}
<div class="contact">${[b?.email, b?.phone, b?.location?.city ? `${b.location.city}${b.location.region ? ', ' + b.location.region : ''}` : '', b?.url ? link(b.url, b.url.replace(/^https?:\/\//, '')) : '', ...(b?.profiles || []).map((p) => (p.url ? `<a href="${esc(p.url)}">${esc(p.network || p.username || '')}</a>` : ''))].filter(Boolean).join(' / ')}</div>
${b?.summary ? `<p class="summary">${esc(b.summary)}</p>` : ''}
${section(
  'Experience',
  (resume.work || [])
    .map(
      (w) => `<div class="entry">
<div class="entry-row"><h3>${esc(w.position)}${w.name ? `, ${link(w.url, w.name)}` : ''}</h3><span class="meta">${dateRange(w.startDate, w.endDate)}</span></div>
${w.location ? `<div class="sub">${esc(w.location)}</div>` : ''}
${w.description ? `<div style="font-size:12px;color:#999;font-style:italic">${esc(w.description)}</div>` : ''}
${w.summary ? `<p style="color:#444;margin-top:4px">${esc(w.summary)}</p>` : ''}
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
<div class="entry-row"><h3>${link(p.url, p.name || '')}${p.entity ? `<span style="color:#777;font-size:13px"> - ${esc(p.entity)}</span>` : ''}${p.type ? `<span style="color:#999;font-size:12px"> (${esc(p.type)})</span>` : ''}</h3>${p.startDate ? `<span class="meta">${dateRange(p.startDate, p.endDate)}</span>` : ''}</div>
${p.roles?.length ? `<div style="font-size:12px;color:#777">Role: ${p.roles.map((r) => esc(r)).join(', ')}</div>` : ''}
${p.description ? `<div class="sub">${esc(p.description)}</div>` : ''}
${p.highlights?.length ? `<ul>${p.highlights.map((h) => `<li>${esc(h)}</li>`).join('')}</ul>` : ''}
${p.keywords?.length ? `<div style="display:flex;flex-wrap:wrap;gap:4px;margin-top:4px">${p.keywords.map((k) => `<span style="background:#f0f0f0;padding:2px 8px;border-radius:3px;font-size:11px;color:#555">${esc(k)}</span>`).join('')}</div>` : ''}
</div>`,
    )
    .join(''),
)}
${section(
  'Education',
  (resume.education || [])
    .map(
      (e) => `<div class="entry">
<div class="entry-row"><h3>${link(e.url, e.institution || '')}</h3><span class="meta">${dateRange(e.startDate, e.endDate)}</span></div>
${e.studyType || e.area ? `<div class="sub">${esc(e.studyType)}${e.area ? ` in ${esc(e.area)}` : ''}${e.score ? ` (${esc(e.score)})` : ''}</div>` : ''}
${e.courses?.length ? `<div style="margin-top:4px;font-size:12px;color:#777">Courses: ${e.courses.map((c) => esc(c)).join(', ')}</div>` : ''}
</div>`,
    )
    .join(''),
)}
${section('Skills', resume.skills?.length ? (resume.skills || []).map((s) => `<p class="skills-inline"><strong>${esc(s.name)}${s.level ? ` <span style="font-weight:normal;color:#999;font-size:smaller">- ${esc(s.level)}</span>` : ''}:</strong> ${(s.keywords || []).map((k) => esc(k)).join(', ')}</p>`).join('') : '')}
${section('Languages', resume.languages?.length ? `<p class="skills-inline">${(resume.languages || []).map((l) => `${esc(l.language)}${l.fluency ? ` (${esc(l.fluency)})` : ''}`).join(', ')}</p>` : '')}
${section('Volunteer', (resume.volunteer || []).map((v) => `<div class="entry"><div class="entry-row"><h3>${esc(v.position)}, ${link(v.url, v.organization || '')}</h3><span class="meta">${dateRange(v.startDate, v.endDate)}</span></div>${v.summary ? `<div class="sub">${esc(v.summary)}</div>` : ''}${v.highlights?.length ? `<ul>${v.highlights.map((h) => `<li>${esc(h)}</li>`).join('')}</ul>` : ''}</div>`).join(''))}
${section('Awards', (resume.awards || []).map((a) => `<div class="entry"><div class="entry-row"><h3>${esc(a.title)}</h3><span class="meta">${esc(a.awarder)}${a.date ? `, ${a.date}` : ''}</span></div>${a.summary ? `<div class="sub">${esc(a.summary)}</div>` : ''}</div>`).join(''))}
${section('Certificates', (resume.certificates || []).map((c) => `<div class="entry"><div class="entry-row"><h3>${link(c.url, c.name || '')}</h3><span class="meta">${c.issuer || ''}${c.date ? `, ${c.date}` : ''}</span></div></div>`).join(''))}
${section('Publications', (resume.publications || []).map((p) => `<div class="entry"><div class="entry-row"><h3>${link(p.url, p.name || '')}</h3><span class="meta">${p.releaseDate || ''}</span></div>${p.publisher ? `<div class="sub">${esc(p.publisher)}</div>` : ''}${p.summary ? `<div class="sub">${esc(p.summary)}</div>` : ''}</div>`).join(''))}
${section('Interests', (resume.interests || []).map((i) => `<p class="skills-inline"><strong>${esc(i.name)}:</strong> ${(i.keywords || []).map((k) => esc(k)).join(', ')}</p>`).join(''))}
${section('References', (resume.references || []).map((r) => `<div class="entry"><h3>${esc(r.name)}</h3>${r.reference ? `<p class="sub" style="font-style:italic;margin-top:2px">"${esc(r.reference)}"</p>` : ''}</div>`).join(''))}
</body></html>`;
}

export const minimalTheme: ThemeDefinition = {
  id: 'minimal',
  name: 'Minimal',
  description: 'No colors or borders, pure text hierarchy through size and weight',
  render,
};
