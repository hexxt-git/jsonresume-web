import type { ResumeSchema } from '../types/resume';
import type { ThemeDefinition } from './types';
import { esc, dateRange, section, link } from './helpers';

function render(resume: ResumeSchema): string {
  const b = resume.basics;
  return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(b?.name)} - Resume</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Segoe UI',Roboto,sans-serif;color:#333;line-height:1.6;max-width:820px;margin:0 auto;padding:0;font-size:14px}
.hero{background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);color:#fff;padding:40px;border-radius:0 0 24px 24px}
.hero h1{font-size:32px;font-weight:800;margin-bottom:4px}
.hero .label{font-size:17px;opacity:.9;margin-bottom:14px}
.hero .contact{display:flex;flex-wrap:wrap;gap:14px;font-size:13px;opacity:.85}
.hero .contact a{color:#fff}
.content{padding:32px 40px}
h2{font-size:16px;font-weight:700;color:#764ba2;margin-bottom:14px;display:flex;align-items:center;gap:8px}
h2::before{content:"";display:block;width:4px;height:20px;background:linear-gradient(135deg,#667eea,#764ba2);border-radius:2px}
h3{font-size:15px;font-weight:600;color:#222}
a{color:#667eea;text-decoration:none}a:hover{text-decoration:underline}
.summary{color:#555;margin-bottom:28px;padding:14px 18px;background:#f8f7ff;border-radius:10px}
.section{margin-bottom:26px}
.entry{margin-bottom:18px;padding-left:12px;border-left:2px solid #e8e5f5}
.entry-header{display:flex;justify-content:space-between;align-items:baseline;flex-wrap:wrap}
.entry-meta{color:#667eea;font-size:13px;font-weight:500}
.entry-org{color:#888;font-size:13px}
ul{padding-left:18px;margin-top:6px}
li{margin-bottom:3px;color:#555}
.skills-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px}
.skill-card{background:linear-gradient(135deg,#f8f7ff,#f0edff);padding:12px 16px;border-radius:10px}
.skill-card h3{font-size:13px;color:#764ba2;margin-bottom:8px}
.tags{display:flex;flex-wrap:wrap;gap:5px}
.tag{background:#fff;color:#667eea;padding:3px 10px;border-radius:20px;font-size:11.5px;border:1px solid #e8e5f5}
.langs{display:flex;flex-wrap:wrap;gap:8px}
.lang-badge{background:linear-gradient(135deg,#667eea,#764ba2);color:#fff;padding:4px 14px;border-radius:20px;font-size:12px}
@media print{.hero{background:#667eea;border-radius:0;padding:24px 32px}.content{padding:20px 32px}.skill-card{border:1px solid #ddd;background:#f8f7ff}.tag{border:1px solid #ccc}}
</style></head><body>
<div class="hero">
${b?.name ? `<h1>${esc(b.name)}</h1>` : ''}
${b?.label ? `<p class="label">${esc(b.label)}</p>` : ''}
<div class="contact">
${b?.email ? `<span>${esc(b.email)}</span>` : ''}
${b?.phone ? `<span>${esc(b.phone)}</span>` : ''}
${b?.location?.city ? `<span>${esc(b.location.city)}${b.location.region ? ', ' + esc(b.location.region) : ''}</span>` : ''}
${(b?.profiles || []).map((p) => `<span>${link(p.url, p.network || p.username || '')}</span>`).join('')}
</div></div>
<div class="content">
${b?.summary ? `<div class="summary">${esc(b.summary)}</div>` : ''}
${section(
  'Experience',
  (resume.work || [])
    .map(
      (w) => `<div class="entry">
<div class="entry-header"><h3>${esc(w.position)}</h3><span class="entry-meta">${dateRange(w.startDate, w.endDate)}</span></div>
<div class="entry-org">${link(w.url, w.name || '')}${w.location ? ` - ${esc(w.location)}` : ''}</div>
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
${p.description ? `<p style="color:#555;margin-top:4px">${esc(p.description)}</p>` : ''}
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
${e.studyType || e.area ? `<div class="entry-org">${esc(e.studyType)}${e.area ? ` in ${esc(e.area)}` : ''}</div>` : ''}
</div>`,
    )
    .join(''),
)}
${section('Skills', resume.skills?.length ? `<div class="skills-grid">${(resume.skills || []).map((s) => `<div class="skill-card"><h3>${esc(s.name)}</h3><div class="tags">${(s.keywords || []).map((k) => `<span class="tag">${esc(k)}</span>`).join('')}</div></div>`).join('')}</div>` : '')}
${section('Languages', resume.languages?.length ? `<div class="langs">${(resume.languages || []).map((l) => `<span class="lang-badge">${esc(l.language)}${l.fluency ? ` - ${esc(l.fluency)}` : ''}</span>`).join('')}</div>` : '')}
${section('Volunteer', (resume.volunteer || []).map((v) => `<div class="entry"><div class="entry-header"><h3>${esc(v.position)}</h3><span class="entry-meta">${dateRange(v.startDate, v.endDate)}</span></div><div class="entry-org">${link(v.url, v.organization || '')}</div>${v.highlights?.length ? `<ul>${v.highlights.map((h) => `<li>${esc(h)}</li>`).join('')}</ul>` : ''}</div>`).join(''))}
${section('Awards', (resume.awards || []).map((a) => `<div class="entry"><div class="entry-header"><h3>${esc(a.title)}</h3><span class="entry-meta">${esc(a.awarder)}</span></div>${a.summary ? `<p style="color:#555;margin-top:4px">${esc(a.summary)}</p>` : ''}</div>`).join(''))}
${section('Certificates', (resume.certificates || []).map((c) => `<div class="entry"><div class="entry-header"><h3>${link(c.url, c.name || '')}</h3><span class="entry-meta">${c.issuer || ''}</span></div></div>`).join(''))}
${section('Publications', (resume.publications || []).map((p) => `<div class="entry"><div class="entry-header"><h3>${link(p.url, p.name || '')}</h3><span class="entry-meta">${p.releaseDate || ''}</span></div>${p.summary ? `<p style="color:#555;margin-top:4px">${esc(p.summary)}</p>` : ''}</div>`).join(''))}
${section('Interests', (resume.interests || []).map((i) => `<div class="entry"><h3>${esc(i.name)}</h3>${i.keywords?.length ? `<div class="tags" style="margin-top:4px">${i.keywords.map((k) => `<span class="tag">${esc(k)}</span>`).join('')}</div>` : ''}</div>`).join(''))}
${section('References', (resume.references || []).map((r) => `<div class="entry"><h3>${esc(r.name)}</h3>${r.reference ? `<p style="color:#555;font-style:italic;margin-top:4px">"${esc(r.reference)}"</p>` : ''}</div>`).join(''))}
</div></body></html>`;
}

export const creativeTheme: ThemeDefinition = {
  id: 'creative',
  name: 'Creative',
  description: 'Bold gradient header, colorful tags, rounded cards',
  render,
};
