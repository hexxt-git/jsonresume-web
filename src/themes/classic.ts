import type { ResumeSchema } from '../types/resume';
import type { ThemeDefinition } from './types';
import { esc, dateRange, section, link } from './helpers';

function render(resume: ResumeSchema): string {
  const b = resume.basics;
  return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(b?.name)} - Resume</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:Georgia,'Times New Roman',serif;color:#333;line-height:1.65;max-width:780px;margin:0 auto;padding:48px 40px;font-size:14px}
h1{font-size:30px;font-weight:700;color:#1a1a1a;text-align:center;margin-bottom:4px}
h2{font-size:16px;font-weight:700;color:#1a1a1a;margin-bottom:12px;padding-bottom:6px;border-bottom:2px solid #1a1a1a}
h3{font-size:14px;font-weight:700;color:#1a1a1a}
a{color:#2c5282;text-decoration:none}a:hover{text-decoration:underline}
.label{text-align:center;color:#555;font-size:15px;font-style:italic;margin-bottom:12px}
.contact{text-align:center;color:#666;font-size:13px;margin-bottom:10px}
.contact span+span::before{content:" | "}
.divider{border:none;border-top:1px solid #ccc;margin:20px 0}
.summary{text-align:justify;color:#444;margin-bottom:28px}
.section{margin-bottom:24px}
.entry{margin-bottom:16px}
.entry-header{display:flex;justify-content:space-between;align-items:baseline;flex-wrap:wrap}
.entry-meta{color:#666;font-size:13px;font-style:italic}
.entry-org{color:#555;font-size:13px;margin-top:1px}
ul{padding-left:20px;margin-top:6px}
li{margin-bottom:3px;color:#444}
.skills-list{columns:2;column-gap:32px}
.skill-item{break-inside:avoid;margin-bottom:8px}
.skill-item h3{font-size:13px;display:inline}
.skill-item span{color:#555;font-size:13px}
.languages span+span::before{content:" | "}
.languages{color:#555;font-size:13px}
@media print{body{padding:16px 20px;font-size:12px}.section{margin-bottom:14px}.entry{margin-bottom:10px}}
</style></head><body>
${b?.name ? `<h1>${esc(b.name)}</h1>` : ''}
${b?.label ? `<p class="label">${esc(b.label)}</p>` : ''}
<div class="contact">
${[
  b?.email,
  b?.phone,
  b?.location?.city ? `${b.location.city}${b.location.region ? ', ' + b.location.region : ''}` : '',
  ...(b?.profiles || []).map((p) =>
    p.url
      ? `<a href="${esc(p.url)}">${esc(p.network || p.username || '')}</a>`
      : esc(p.network || ''),
  ),
]
  .filter(Boolean)
  .map((s) => `<span>${s}</span>`)
  .join('')}
</div>
<hr class="divider">
${b?.summary ? `<p class="summary">${esc(b.summary)}</p>` : ''}
${section(
  'Professional Experience',
  (resume.work || [])
    .map(
      (w) => `<div class="entry">
<div class="entry-header"><h3>${esc(w.position)}${w.name ? `, ${link(w.url, w.name)}` : ''}</h3><span class="entry-meta">${dateRange(w.startDate, w.endDate)}</span></div>
${w.location ? `<div class="entry-org">${esc(w.location)}</div>` : ''}
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
${p.description ? `<p style="color:#444;margin-top:4px">${esc(p.description)}</p>` : ''}
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
${e.studyType || e.area ? `<div class="entry-org">${esc(e.studyType)}${e.area ? ` in ${esc(e.area)}` : ''}${e.score ? ` - GPA: ${esc(e.score)}` : ''}</div>` : ''}
</div>`,
    )
    .join(''),
)}
${section('Skills', resume.skills?.length ? `<div class="skills-list">${(resume.skills || []).map((s) => `<div class="skill-item"><h3>${esc(s.name)}: </h3><span>${(s.keywords || []).map((k) => esc(k)).join(', ')}</span></div>`).join('')}</div>` : '')}
${section('Languages', resume.languages?.length ? `<div class="languages">${(resume.languages || []).map((l) => `<span>${esc(l.language)}${l.fluency ? ` (${esc(l.fluency)})` : ''}</span>`).join('')}</div>` : '')}
${section('Volunteer Experience', (resume.volunteer || []).map((v) => `<div class="entry"><div class="entry-header"><h3>${esc(v.position)}, ${link(v.url, v.organization || '')}</h3><span class="entry-meta">${dateRange(v.startDate, v.endDate)}</span></div>${v.highlights?.length ? `<ul>${v.highlights.map((h) => `<li>${esc(h)}</li>`).join('')}</ul>` : ''}</div>`).join(''))}
${section('Awards', (resume.awards || []).map((a) => `<div class="entry"><div class="entry-header"><h3>${esc(a.title)}</h3><span class="entry-meta">${esc(a.awarder)}${a.date ? `, ${a.date}` : ''}</span></div>${a.summary ? `<p style="color:#444;margin-top:4px">${esc(a.summary)}</p>` : ''}</div>`).join(''))}
${section('Certificates', (resume.certificates || []).map((c) => `<div class="entry"><div class="entry-header"><h3>${link(c.url, c.name || '')}</h3><span class="entry-meta">${c.issuer || ''}${c.date ? `, ${c.date}` : ''}</span></div></div>`).join(''))}
${section('Publications', (resume.publications || []).map((p) => `<div class="entry"><div class="entry-header"><h3>${link(p.url, p.name || '')}</h3><span class="entry-meta">${p.releaseDate || ''}</span></div>${p.publisher ? `<div class="entry-org">${esc(p.publisher)}</div>` : ''}${p.summary ? `<p style="color:#444;margin-top:4px">${esc(p.summary)}</p>` : ''}</div>`).join(''))}
${section('Interests', (resume.interests || []).map((i) => `<div class="entry"><h3>${esc(i.name)}</h3>${i.keywords?.length ? `<p style="color:#555;font-size:13px">${i.keywords.map((k) => esc(k)).join(', ')}</p>` : ''}</div>`).join(''))}
${section('References', (resume.references || []).map((r) => `<div class="entry"><h3>${esc(r.name)}</h3>${r.reference ? `<p style="color:#444;font-style:italic;margin-top:4px">"${esc(r.reference)}"</p>` : ''}</div>`).join(''))}
</body></html>`;
}

export const classicTheme: ThemeDefinition = {
  id: 'classic',
  name: 'Classic',
  description: 'Traditional serif typography with formal structure',
  render,
};
