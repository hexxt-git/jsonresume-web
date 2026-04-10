import type { ResumeSchema } from '../types/resume';
import type { ThemeDefinition } from './types';
import { esc, md, dateRange, section, link } from './helpers';

function render(resume: ResumeSchema): string {
  const b = resume.basics;
  return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(b?.name)} - ${esc(b?.label || 'Resume')}</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#333;line-height:1.6;max-width:800px;margin:0 auto;padding:48px 40px;font-size:14px}
h1{font-size:28px;font-weight:600;color:#111;margin-bottom:4px}
h2{font-size:14px;font-weight:600;text-transform:uppercase;letter-spacing:1.5px;color:#999;margin-bottom:16px;padding-bottom:8px;border-bottom:1px solid #eee}
h3{font-size:15px;font-weight:600;color:#111}
a{color:#333;text-decoration:none}a:hover{text-decoration:underline}
.label{color:#666;font-size:16px;margin-bottom:16px}
.contact{display:flex;flex-wrap:wrap;gap:16px;color:#666;font-size:13px;margin-bottom:32px}
.contact a{color:#666}
.summary{color:#555;margin-bottom:32px;line-height:1.7}
.section{margin-bottom:28px}
.entry{margin-bottom:20px}
.entry-header{display:flex;justify-content:space-between;align-items:baseline;flex-wrap:wrap;gap:4px}
.entry-meta{color:#999;font-size:13px;white-space:nowrap}
.entry-org{color:#666;font-size:13px}
ul{padding-left:18px;margin-top:6px}
li{margin-bottom:4px;color:#555}
.skills-grid{display:flex;flex-wrap:wrap;gap:20px}
.skill-group h3{font-size:13px;margin-bottom:6px}
.skill-keywords{display:flex;flex-wrap:wrap;gap:6px}
.skill-tag{background:#f5f5f5;padding:3px 10px;border-radius:3px;font-size:12px;color:#555}
.languages{display:flex;flex-wrap:wrap;gap:16px}
.lang{font-size:13px;color:#555}
@media print{body{padding:20px 24px;font-size:12px}h1{font-size:22px}.section{margin-bottom:16px}.entry{margin-bottom:12px}}
</style></head><body>
${b?.image ? `<img src="${esc(b.image)}" alt="${esc(b.name)}" style="width:80px;height:80px;border-radius:50%;object-fit:cover;margin-bottom:12px">` : ''}
${b?.name ? `<h1>${esc(b.name)}</h1>` : ''}
${b?.label ? `<p class="label">${esc(b.label)}</p>` : ''}
<div class="contact">
${b?.email ? `<span>${esc(b.email)}</span>` : ''}
${b?.phone ? `<span>${esc(b.phone)}</span>` : ''}
${b?.location?.city ? `<span>${esc(b.location.city)}${b.location.region ? ', ' + esc(b.location.region) : ''}</span>` : ''}
${b?.url ? `<span>${link(b.url, b.url.replace(/^https?:\/\//, ''))}</span>` : ''}
${(b?.profiles || []).map((p) => `<span>${link(p.url, p.network ? `${p.network}` : p.username || '')}</span>`).join('')}
</div>
${b?.summary ? `<p class="summary">${md(b.summary)}</p>` : ''}
${section(
  'Experience',
  (resume.work || [])
    .map(
      (w) => `<div class="entry">
<div class="entry-header"><h3>${esc(w.position)}</h3><span class="entry-meta">${dateRange(w.startDate, w.endDate)}</span></div>
<div class="entry-org">${link(w.url, w.name || '')}${w.location ? ` - ${esc(w.location)}` : ''}</div>
${w.description ? `<div style="font-size:12px;color:#888;font-style:italic">${md(w.description)}</div>` : ''}
${w.summary ? `<p style="margin-top:6px;color:#555">${md(w.summary)}</p>` : ''}
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
<div class="entry-header"><h3>${link(p.url, p.name || '')}${p.entity ? `<span style="color:#888;font-size:13px"> - ${esc(p.entity)}</span>` : ''}${p.type ? `<span style="color:#999;font-size:12px"> (${esc(p.type)})</span>` : ''}</h3>${p.startDate ? `<span class="entry-meta">${dateRange(p.startDate, p.endDate)}</span>` : ''}</div>
${p.roles?.length ? `<div style="font-size:12px;color:#888">Role: ${p.roles.map((r) => esc(r)).join(', ')}</div>` : ''}
${p.description ? `<p style="margin-top:4px;color:#555">${md(p.description)}</p>` : ''}
${p.highlights?.length ? `<ul>${p.highlights.map((h) => `<li>${md(h)}</li>`).join('')}</ul>` : ''}
${p.keywords?.length ? `<div style="display:flex;flex-wrap:wrap;gap:4px;margin-top:6px">${p.keywords.map((k) => `<span class="skill-tag">${esc(k)}</span>`).join('')}</div>` : ''}
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
${e.studyType || e.area ? `<div class="entry-org">${esc(e.studyType)}${e.area ? ` in ${esc(e.area)}` : ''}${e.score ? ` (${esc(e.score)})` : ''}</div>` : ''}
${e.courses?.length ? `<div style="margin-top:4px;font-size:12px;color:#666">Courses: ${e.courses.map((c) => esc(c)).join(', ')}</div>` : ''}
</div>`,
    )
    .join(''),
)}
${section(
  'Skills',
  resume.skills?.length
    ? `<div class="skills-grid">${(resume.skills || [])
        .map(
          (s) => `<div class="skill-group">
<h3>${esc(s.name)}${s.level ? ` <span style="font-weight:normal;color:#999;font-size:smaller">- ${esc(s.level)}</span>` : ''}</h3>
<div class="skill-keywords">${(s.keywords || []).map((k) => `<span class="skill-tag">${esc(k)}</span>`).join('')}</div>
</div>`,
        )
        .join('')}</div>`
    : '',
)}
${section('Languages', resume.languages?.length ? `<div class="languages">${(resume.languages || []).map((l) => `<span class="lang">${esc(l.language)}${l.fluency ? ` (${esc(l.fluency)})` : ''}</span>`).join('')}</div>` : '')}
${section(
  'Volunteer',
  (resume.volunteer || [])
    .map(
      (v) => `<div class="entry">
<div class="entry-header"><h3>${esc(v.position)}</h3><span class="entry-meta">${dateRange(v.startDate, v.endDate)}</span></div>
<div class="entry-org">${link(v.url, v.organization || '')}</div>
${v.summary ? `<p style="margin-top:6px;color:#555">${md(v.summary)}</p>` : ''}
${v.highlights?.length ? `<ul>${v.highlights.map((h) => `<li>${md(h)}</li>`).join('')}</ul>` : ''}
</div>`,
    )
    .join(''),
)}
${section(
  'Awards',
  (resume.awards || [])
    .map(
      (a) => `<div class="entry">
<div class="entry-header"><h3>${esc(a.title)}</h3><span class="entry-meta">${esc(a.awarder)}${a.date ? ` - ${a.date}` : ''}</span></div>
${a.summary ? `<p style="margin-top:4px;color:#555">${md(a.summary)}</p>` : ''}
</div>`,
    )
    .join(''),
)}
${section(
  'Certificates',
  (resume.certificates || [])
    .map(
      (c) => `<div class="entry">
<div class="entry-header"><h3>${link(c.url, c.name || '')}</h3><span class="entry-meta">${c.date || ''}${c.issuer ? ` - ${esc(c.issuer)}` : ''}</span></div>
</div>`,
    )
    .join(''),
)}
${section(
  'Publications',
  (resume.publications || [])
    .map(
      (p) => `<div class="entry">
<div class="entry-header"><h3>${link(p.url, p.name || '')}</h3><span class="entry-meta">${p.releaseDate || ''}</span></div>
${p.publisher ? `<div class="entry-org">${esc(p.publisher)}</div>` : ''}
${p.summary ? `<p style="margin-top:4px;color:#555">${md(p.summary)}</p>` : ''}
</div>`,
    )
    .join(''),
)}
${section(
  'Interests',
  (resume.interests || [])
    .map(
      (i) => `<div class="entry">
<h3>${esc(i.name)}</h3>
${i.keywords?.length ? `<div class="skill-keywords" style="margin-top:4px">${i.keywords.map((k) => `<span class="skill-tag">${esc(k)}</span>`).join('')}</div>` : ''}
</div>`,
    )
    .join(''),
)}
${section(
  'References',
  (resume.references || [])
    .map(
      (r) => `<div class="entry">
<h3>${esc(r.name)}</h3>
${r.reference ? `<p style="margin-top:4px;color:#555;font-style:italic">"${md(r.reference)}"</p>` : ''}
</div>`,
    )
    .join(''),
)}
</body></html>`;
}

export const modernTheme: ThemeDefinition = {
  id: 'modern',
  name: 'Modern',
  description: 'Clean sans-serif, generous whitespace, minimal decoration',
  render,
};
