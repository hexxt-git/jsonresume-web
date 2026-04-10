import type { ResumeSchema } from '../types/resume';
import type { ThemeDefinition } from './types';
import { esc, dateRange, section, link } from './helpers';

function render(resume: ResumeSchema): string {
  const b = resume.basics;
  return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(b?.name)} - Resume</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#333;line-height:1.4;max-width:780px;margin:0 auto;padding:24px 28px;font-size:11.5px}
h1{font-size:20px;font-weight:700;color:#111;display:inline}
h2{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1.2px;color:#111;margin-bottom:6px;padding-bottom:3px;border-bottom:1.5px solid #111}
h3{font-size:12px;font-weight:600;color:#111}
a{color:#333;text-decoration:none}a:hover{text-decoration:underline}
.header{margin-bottom:12px}
.header-line{display:flex;align-items:baseline;gap:12px;flex-wrap:wrap}
.label{color:#555;font-size:13px}
.contact{color:#666;font-size:10.5px;margin-top:4px}
.contact span+span::before{content:" | "}
.summary{color:#444;margin-bottom:14px;font-size:11.5px}
.section{margin-bottom:12px}
.entry{margin-bottom:8px}
.entry-header{display:flex;justify-content:space-between;align-items:baseline}
.entry-meta{color:#888;font-size:10.5px;white-space:nowrap}
.entry-sub{color:#555;font-size:11px}
ul{padding-left:14px;margin-top:2px}
li{margin-bottom:1px;color:#444}
.skills-row{display:flex;flex-wrap:wrap;gap:4px 16px;font-size:11px}
.skills-row strong{font-weight:600}
.skills-row span{color:#555}
.tags{display:flex;flex-wrap:wrap;gap:3px;margin-top:2px}
.tag{background:#eee;padding:1px 6px;border-radius:2px;font-size:10px;color:#555}
@media print{body{padding:12px 16px;font-size:10.5px}.section{margin-bottom:8px}.entry{margin-bottom:5px}}
</style></head><body>
<div class="header">
<div class="header-line">${b?.name ? `<h1>${esc(b.name)}</h1>` : ''}${b?.label ? `<span class="label">${esc(b.label)}</span>` : ''}</div>
<div class="contact">
${[
  b?.email,
  b?.phone,
  b?.location?.city ? `${b.location.city}${b.location.region ? ', ' + b.location.region : ''}` : '',
  b?.url?.replace(/^https?:\/\//, ''),
  ...(b?.profiles || []).map((p) =>
    p.url ? `<a href="${esc(p.url)}">${esc(p.network || p.username || '')}</a>` : '',
  ),
]
  .filter(Boolean)
  .map((s) => `<span>${s}</span>`)
  .join('')}
</div></div>
${b?.summary ? `<p class="summary">${esc(b.summary)}</p>` : ''}
${section(
  'Experience',
  (resume.work || [])
    .map(
      (w) => `<div class="entry">
<div class="entry-header"><h3>${esc(w.position)} ${w.name ? `at ${link(w.url, w.name)}` : ''}</h3><span class="entry-meta">${dateRange(w.startDate, w.endDate)}</span></div>
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
<div class="entry-header"><h3>${link(p.url, p.name || '')}</h3>${p.startDate ? `<span class="entry-meta">${dateRange(p.startDate, p.endDate)}</span>` : ''}</div>
${p.highlights?.length ? `<ul>${p.highlights.map((h) => `<li>${esc(h)}</li>`).join('')}</ul>` : ''}
</div>`,
    )
    .join(''),
)}
${section(
  'Education',
  (resume.education || [])
    .map(
      (e) => `<div class="entry">
<div class="entry-header"><h3>${esc(e.institution)}</h3><span class="entry-meta">${dateRange(e.startDate, e.endDate)}</span></div>
${e.studyType || e.area ? `<div class="entry-sub">${esc(e.studyType)}${e.area ? ` in ${esc(e.area)}` : ''}</div>` : ''}
</div>`,
    )
    .join(''),
)}
${section('Skills', resume.skills?.length ? `<div class="skills-row">${(resume.skills || []).map((s) => `<div><strong>${esc(s.name)}:</strong> <span>${(s.keywords || []).map((k) => esc(k)).join(', ')}</span></div>`).join('')}</div>` : '')}
${section('Languages', resume.languages?.length ? `<div style="font-size:11px;color:#555">${(resume.languages || []).map((l) => `${esc(l.language)}${l.fluency ? ` (${esc(l.fluency)})` : ''}`).join(' | ')}</div>` : '')}
${section('Volunteer', (resume.volunteer || []).map((v) => `<div class="entry"><div class="entry-header"><h3>${esc(v.position)} at ${link(v.url, v.organization || '')}</h3><span class="entry-meta">${dateRange(v.startDate, v.endDate)}</span></div>${v.highlights?.length ? `<ul>${v.highlights.map((h) => `<li>${esc(h)}</li>`).join('')}</ul>` : ''}</div>`).join(''))}
${section('Awards', (resume.awards || []).map((a) => `<div class="entry"><div class="entry-header"><h3>${esc(a.title)}</h3><span class="entry-meta">${esc(a.awarder)}</span></div></div>`).join(''))}
${section('Certificates', (resume.certificates || []).map((c) => `<div class="entry"><div class="entry-header"><h3>${link(c.url, c.name || '')}</h3><span class="entry-meta">${c.issuer || ''}</span></div></div>`).join(''))}
${section('Publications', (resume.publications || []).map((p) => `<div class="entry"><div class="entry-header"><h3>${link(p.url, p.name || '')}</h3><span class="entry-meta">${p.releaseDate || ''}</span></div></div>`).join(''))}
${section('Interests', (resume.interests || []).map((i) => `<div class="entry"><h3 style="display:inline">${esc(i.name)}: </h3><span style="color:#555;font-size:11px">${(i.keywords || []).join(', ')}</span></div>`).join(''))}
${section('References', (resume.references || []).map((r) => `<div class="entry"><h3>${esc(r.name)}</h3></div>`).join(''))}
</body></html>`;
}

export const compactTheme: ThemeDefinition = {
  id: 'compact',
  name: 'Compact',
  description: 'Dense layout optimized to fit on one printed page',
  render,
};
