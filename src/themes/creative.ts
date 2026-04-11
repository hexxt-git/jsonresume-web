import type { ResumeSchema } from '../types/resume';
import type { ThemeDefinition } from './types';
import { esc, md, dateRange, section, link } from './helpers';

function render(resume: ResumeSchema): string {
  const b = resume.basics;
  return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(b?.name)} - ${esc(b?.label || 'Resume')}</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Segoe UI',Roboto,-apple-system,sans-serif;color:#3d3d3d;line-height:1.6;max-width:800px;margin:0 auto;padding:48px 40px;font-size:calc(14px * var(--fs-mult, 1));background:#fafaf8}
h1{font-size:calc(28px * var(--fs-mult, 1));font-weight:700;color:#2d2d2d}
h2{font-size:calc(13px * var(--fs-mult, 1));font-weight:600;text-transform:uppercase;letter-spacing:1.8px;color:#6b7c5e;margin-bottom:14px;padding-bottom:8px;border-bottom:2px solid #6b7c5e}
h3{font-size:calc(15px * var(--fs-mult, 1));font-weight:600;color:#2d2d2d}
a{color:#5a6e4e;text-decoration:none}a:hover{text-decoration:underline}
.header{display:flex;align-items:center;gap:20px;margin-bottom:16px}
.header-text{flex:1}
.label{color:#777;font-size:calc(15px * var(--fs-mult, 1));margin-top:2px}
.contact{display:flex;flex-wrap:wrap;gap:14px;font-size:calc(13px * var(--fs-mult, 1));color:#888;margin-bottom:28px}
.contact a{color:#5a6e4e}
.summary{color:#555;margin-bottom:28px;padding:14px 18px;background:#f0efe8;border-radius:6px;line-height:1.7}
.section{margin-bottom:26px}
.entry{margin-bottom:18px;padding-left:14px;border-left:3px solid #d4d0c4}
.entry-header{display:flex;justify-content:space-between;align-items:baseline;flex-wrap:wrap;gap:4px}
.entry-meta{color:#6b7c5e;font-size:calc(13px * var(--fs-mult, 1));font-weight:500}
.entry-org{color:#888;font-size:calc(13px * var(--fs-mult, 1))}
ul{padding-left:18px;margin-top:6px}
li{margin-bottom:3px;color:#555}
li::marker{color:#6b7c5e}
.skills-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px}
.skill-card{background:#f0efe8;padding:12px 16px;border-radius:6px}
.skill-card h3{font-size:calc(13px * var(--fs-mult, 1));color:#5a6e4e;margin-bottom:6px}
.tags{display:flex;flex-wrap:wrap;gap:5px}
.tag{background:#e8e6dc;color:#4a4a4a;padding:3px 10px;border-radius:3px;font-size:calc(12px * var(--fs-mult, 1))}
.langs{display:flex;flex-wrap:wrap;gap:8px}
.lang{font-size:calc(13px * var(--fs-mult, 1));color:#555}
@media print{body{background:#fff;padding:20px 24px}.summary{background:#f8f8f6}.entry{border-left-color:#ccc}.skill-card{background:#f8f8f6}.tag{background:#eee}}
</style></head><body>
<div class="header">
${b?.image ? `<img src="${esc(b.image)}" alt="${esc(b.name)}" style="width:72px;height:72px;border-radius:50%;object-fit:cover;border:2px solid #d4d0c4">` : ''}
<div class="header-text">
${b?.name ? `<h1>${esc(b.name)}</h1>` : ''}
${b?.label ? `<p class="label">${esc(b.label)}</p>` : ''}
</div></div>
<div class="contact">
${b?.email ? `<span>${esc(b.email)}</span>` : ''}
${b?.phone ? `<span>${esc(b.phone)}</span>` : ''}
${b?.location?.city ? `<span>${esc(b.location.city)}${b.location.region ? ', ' + esc(b.location.region) : ''}</span>` : ''}
${b?.url ? `<span>${link(b.url, b.url.replace(/^https?:\/\//, ''))}</span>` : ''}
${(b?.profiles || []).map((p) => `<span>${link(p.url, p.network || p.username || '')}</span>`).join('')}
</div>
${b?.summary ? `<div class="summary">${md(b.summary)}</div>` : ''}
${section(
  'Experience',
  (resume.work || [])
    .map(
      (w) => `<div class="entry">
<div class="entry-header"><h3>${esc(w.position)}</h3><span class="entry-meta">${dateRange(w.startDate, w.endDate)}</span></div>
<div class="entry-org">${link(w.url, w.name || '')}${w.location ? ` - ${esc(w.location)}` : ''}</div>
${w.description ? `<div style="font-size:calc(12px * var(--fs-mult, 1));color:#999;font-style:italic">${md(w.description)}</div>` : ''}
${w.summary ? `<p style="color:#555;margin-top:4px">${md(w.summary)}</p>` : ''}
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
<div class="entry-header"><h3>${link(p.url, p.name || '')}${p.entity ? `<span style="color:#888;font-size:calc(13px * var(--fs-mult, 1))"> - ${esc(p.entity)}</span>` : ''}${p.type ? `<span style="color:#999;font-size:calc(12px * var(--fs-mult, 1))"> (${esc(p.type)})</span>` : ''}</h3>${p.startDate ? `<span class="entry-meta">${dateRange(p.startDate, p.endDate)}</span>` : ''}</div>
${p.roles?.length ? `<div style="font-size:calc(12px * var(--fs-mult, 1));color:#888">Role: ${p.roles.map((r) => esc(r)).join(', ')}</div>` : ''}
${p.description ? `<p style="color:#555;margin-top:4px">${md(p.description)}</p>` : ''}
${p.highlights?.length ? `<ul>${p.highlights.map((h) => `<li>${md(h)}</li>`).join('')}</ul>` : ''}
${p.keywords?.length ? `<div class="tags" style="margin-top:6px">${p.keywords.map((k) => `<span class="tag">${esc(k)}</span>`).join('')}</div>` : ''}
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
${e.courses?.length ? `<div style="margin-top:4px;font-size:calc(12px * var(--fs-mult, 1));color:#888">Courses: ${e.courses.map((c) => esc(c)).join(', ')}</div>` : ''}
</div>`,
    )
    .join(''),
)}
${section('Skills', resume.skills?.length ? `<div class="skills-grid">${(resume.skills || []).map((s) => `<div class="skill-card"><h3>${esc(s.name)}${s.level ? ` <span style="font-weight:normal;color:#888;font-size:calc(0.833em * var(--fs-mult, 1))">- ${esc(s.level)}</span>` : ''}</h3><div class="tags">${(s.keywords || []).map((k) => `<span class="tag">${esc(k)}</span>`).join('')}</div></div>`).join('')}</div>` : '')}
${section('Languages', resume.languages?.length ? `<div class="langs">${(resume.languages || []).map((l) => `<span class="lang">${esc(l.language)}${l.fluency ? ` (${esc(l.fluency)})` : ''}</span>`).join('')}</div>` : '')}
${section('Volunteer', (resume.volunteer || []).map((v) => `<div class="entry"><div class="entry-header"><h3>${esc(v.position)}</h3><span class="entry-meta">${dateRange(v.startDate, v.endDate)}</span></div><div class="entry-org">${link(v.url, v.organization || '')}</div>${v.summary ? `<p style="color:#555;margin-top:4px">${md(v.summary)}</p>` : ''}${v.highlights?.length ? `<ul>${v.highlights.map((h) => `<li>${md(h)}</li>`).join('')}</ul>` : ''}</div>`).join(''))}
${section('Awards', (resume.awards || []).map((a) => `<div class="entry"><div class="entry-header"><h3>${esc(a.title)}</h3><span class="entry-meta">${esc(a.awarder)}${a.date ? `, ${a.date}` : ''}</span></div>${a.summary ? `<p style="color:#555;margin-top:4px">${md(a.summary)}</p>` : ''}</div>`).join(''))}
${section('Certificates', (resume.certificates || []).map((c) => `<div class="entry"><div class="entry-header"><h3>${link(c.url, c.name || '')}</h3><span class="entry-meta">${c.issuer || ''}${c.date ? `, ${c.date}` : ''}</span></div></div>`).join(''))}
${section('Publications', (resume.publications || []).map((p) => `<div class="entry"><div class="entry-header"><h3>${link(p.url, p.name || '')}</h3><span class="entry-meta">${p.releaseDate || ''}</span></div>${p.publisher ? `<div class="entry-org">${esc(p.publisher)}</div>` : ''}${p.summary ? `<p style="color:#555;margin-top:4px">${md(p.summary)}</p>` : ''}</div>`).join(''))}
${section('Interests', (resume.interests || []).map((i) => `<div class="entry"><h3>${esc(i.name)}</h3>${i.keywords?.length ? `<div class="tags" style="margin-top:4px">${i.keywords.map((k) => `<span class="tag">${esc(k)}</span>`).join('')}</div>` : ''}</div>`).join(''))}
${section('References', (resume.references || []).map((r) => `<div class="entry"><h3>${esc(r.name)}</h3>${r.reference ? `<p style="color:#555;font-style:italic;margin-top:4px">"${md(r.reference)}"</p>` : ''}</div>`).join(''))}
</body></html>`;
}

export const creativeTheme: ThemeDefinition = {
  id: 'creative',
  name: 'Elegant',
  description: 'Warm earthy tones with sage accents on a cream background',
  render,
};
