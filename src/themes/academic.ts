import type { ResumeSchema } from '../types/resume';
import type { ThemeDefinition } from './types';
import { esc, dateRange, section, link } from './helpers';

function render(resume: ResumeSchema): string {
  const b = resume.basics;
  return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(b?.name)} - CV</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Computer Modern Serif','CMU Serif',Georgia,'Times New Roman',serif;color:#222;line-height:1.5;max-width:720px;margin:0 auto;padding:48px 56px;font-size:13.5px;text-align:justify}
h1{font-size:24px;font-weight:400;text-align:center;margin-bottom:2px;letter-spacing:2px;text-transform:uppercase}
h2{font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;padding-bottom:2px;border-bottom:1px solid #222}
h3{font-size:13.5px;font-weight:700;color:#222}
a{color:#222;text-decoration:none;border-bottom:0.5px solid #999}a:hover{border-bottom-color:#222}
.header{text-align:center;margin-bottom:24px}
.label{font-style:italic;color:#555;font-size:14px;margin-bottom:8px}
.contact{font-size:12px;color:#555}
.contact span+span::before{content:" \\00b7 "}
.section{margin-bottom:18px}
.entry{margin-bottom:12px}
.entry-header{display:flex;justify-content:space-between;align-items:baseline}
.entry-meta{font-style:italic;color:#555;font-size:12.5px;white-space:nowrap}
.entry-org{font-style:italic;color:#555;font-size:13px}
ul{padding-left:20px;margin-top:4px}
li{margin-bottom:2px}
.skills-list{margin-bottom:4px}
.skills-list dt{font-weight:700;font-size:13px;float:left;clear:left;width:100px;margin-bottom:4px}
.skills-list dd{margin-left:108px;margin-bottom:4px;color:#444}
.publications .entry{padding-left:24px;text-indent:-24px}
@media print{body{padding:24px 40px;font-size:12px}}
</style></head><body>
<div class="header">
${b?.name ? `<h1>${esc(b.name)}</h1>` : ''}
${b?.label ? `<p class="label">${esc(b.label)}</p>` : ''}
<div class="contact">
${[
  b?.email,
  b?.phone,
  b?.location?.city ? `${b.location.city}${b.location.region ? ', ' + b.location.region : ''}` : '',
  ...(b?.profiles || []).map((p) =>
    p.url ? `<a href="${esc(p.url)}">${esc(p.network || p.username || '')}</a>` : '',
  ),
]
  .filter(Boolean)
  .map((s) => `<span>${s}</span>`)
  .join('')}
</div></div>
${b?.summary ? `${section('Summary', `<p>${esc(b.summary)}</p>`)}` : ''}
${section(
  'Employment',
  (resume.work || [])
    .map(
      (w) => `<div class="entry">
<div class="entry-header"><h3>${esc(w.position)}, ${link(w.url, w.name || '')}</h3><span class="entry-meta">${dateRange(w.startDate, w.endDate)}</span></div>
${w.location ? `<div class="entry-org">${esc(w.location)}</div>` : ''}
${w.summary ? `<p style="margin-top:4px">${esc(w.summary)}</p>` : ''}
${w.highlights?.length ? `<ul>${w.highlights.map((h) => `<li>${esc(h)}</li>`).join('')}</ul>` : ''}
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
${e.studyType || e.area ? `<div class="entry-org">${esc(e.studyType)}${e.area ? ` in ${esc(e.area)}` : ''}${e.score ? `, GPA: ${esc(e.score)}` : ''}</div>` : ''}
${e.courses?.length ? `<p style="margin-top:4px;font-size:12.5px">Courses: ${e.courses.map((c) => esc(c)).join(', ')}</p>` : ''}
</div>`,
    )
    .join(''),
)}
${section('Publications', resume.publications?.length ? `<div class="publications">${(resume.publications || []).map((p) => `<div class="entry">${link(p.url, p.name || '')}${p.publisher ? `. <em>${esc(p.publisher)}</em>` : ''}${p.releaseDate ? ` (${p.releaseDate})` : ''}${p.summary ? `. ${esc(p.summary)}` : ''}</div>`).join('')}</div>` : '')}
${section(
  'Projects',
  (resume.projects || [])
    .map(
      (p) => `<div class="entry">
<div class="entry-header"><h3>${link(p.url, p.name || '')}</h3>${p.startDate ? `<span class="entry-meta">${dateRange(p.startDate, p.endDate)}</span>` : ''}</div>
${p.description ? `<p style="margin-top:2px">${esc(p.description)}</p>` : ''}
${p.highlights?.length ? `<ul>${p.highlights.map((h) => `<li>${esc(h)}</li>`).join('')}</ul>` : ''}
</div>`,
    )
    .join(''),
)}
${section('Technical Skills', resume.skills?.length ? `<dl class="skills-list">${(resume.skills || []).map((s) => `<dt>${esc(s.name)}</dt><dd>${(s.keywords || []).map((k) => esc(k)).join(', ')}</dd>`).join('')}</dl>` : '')}
${section('Languages', resume.languages?.length ? `<p>${(resume.languages || []).map((l) => `${esc(l.language)}${l.fluency ? ` (${esc(l.fluency)})` : ''}`).join(', ')}</p>` : '')}
${section('Awards & Honors', (resume.awards || []).map((a) => `<div class="entry"><div class="entry-header"><h3>${esc(a.title)}</h3><span class="entry-meta">${esc(a.awarder)}${a.date ? `, ${a.date}` : ''}</span></div>${a.summary ? `<p style="margin-top:2px">${esc(a.summary)}</p>` : ''}</div>`).join(''))}
${section('Certificates', (resume.certificates || []).map((c) => `<div class="entry"><div class="entry-header"><h3>${link(c.url, c.name || '')}</h3><span class="entry-meta">${c.issuer || ''}${c.date ? `, ${c.date}` : ''}</span></div></div>`).join(''))}
${section('Volunteer', (resume.volunteer || []).map((v) => `<div class="entry"><div class="entry-header"><h3>${esc(v.position)}, ${link(v.url, v.organization || '')}</h3><span class="entry-meta">${dateRange(v.startDate, v.endDate)}</span></div>${v.highlights?.length ? `<ul>${v.highlights.map((h) => `<li>${esc(h)}</li>`).join('')}</ul>` : ''}</div>`).join(''))}
${section('Interests', (resume.interests || []).map((i) => `<p><strong>${esc(i.name)}:</strong> ${(i.keywords || []).map((k) => esc(k)).join(', ')}</p>`).join(''))}
${section('References', (resume.references || []).map((r) => `<div class="entry"><h3>${esc(r.name)}</h3>${r.reference ? `<blockquote style="margin:4px 0 0 16px;font-style:italic;color:#555">"${esc(r.reference)}"</blockquote>` : ''}</div>`).join(''))}
</body></html>`;
}

export const academicTheme: ThemeDefinition = {
  id: 'academic',
  name: 'Academic',
  description: 'LaTeX-inspired serif layout with justified text',
  render,
};
