import type { ResumeSchema } from '../types/resume';
import type { ThemeDefinition } from './types';
import { esc, dateRange, section, link } from './helpers';

function render(resume: ResumeSchema): string {
  const b = resume.basics;
  return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(b?.name)} - Resume</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#0f172a;color:#cbd5e1;line-height:1.6;max-width:800px;margin:0 auto;padding:48px 40px;font-size:14px}
h1{font-size:28px;font-weight:700;color:#f1f5f9}
h2{font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:1.5px;color:#38bdf8;margin-bottom:14px;padding-bottom:6px;border-bottom:1px solid #1e293b}
h3{font-size:15px;font-weight:600;color:#e2e8f0}
a{color:#38bdf8;text-decoration:none}a:hover{text-decoration:underline}
.label{color:#94a3b8;font-size:16px;margin-bottom:14px}
.contact{display:flex;flex-wrap:wrap;gap:14px;font-size:13px;color:#64748b;margin-bottom:28px}
.contact a{color:#38bdf8}
.summary{color:#94a3b8;margin-bottom:28px;padding:14px 18px;background:#1e293b;border-radius:8px;border-left:3px solid #38bdf8}
.section{margin-bottom:26px}
.entry{margin-bottom:18px}
.entry-header{display:flex;justify-content:space-between;align-items:baseline;flex-wrap:wrap}
.entry-meta{color:#38bdf8;font-size:13px}
.entry-org{color:#64748b;font-size:13px}
ul{padding-left:18px;margin-top:6px}
li{margin-bottom:3px;color:#94a3b8}
li::marker{color:#38bdf8}
.skills-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px}
.skill-card{background:#1e293b;padding:12px 16px;border-radius:8px;border:1px solid #334155}
.skill-card h3{font-size:13px;color:#38bdf8;margin-bottom:8px}
.tags{display:flex;flex-wrap:wrap;gap:5px}
.tag{background:#334155;color:#e2e8f0;padding:3px 10px;border-radius:4px;font-size:12px}
.langs{display:flex;flex-wrap:wrap;gap:8px}
.lang{background:#334155;color:#38bdf8;padding:3px 12px;border-radius:4px;font-size:12px;border:1px solid #475569}
@media print{body{background:#fff;color:#333}h1,h3{color:#111}h2{color:#2563eb;border-bottom-color:#ddd}.summary{background:#f8f9fa;color:#555;border-left-color:#2563eb}.entry-meta,.skill-card h3,li::marker,a{color:#2563eb}.entry-org{color:#666}.skill-card{background:#f8f9fa;border-color:#ddd}.tag{background:#eee;color:#333}.lang{background:#eee;color:#2563eb;border-color:#ddd}li{color:#444}}
</style></head><body>
${b?.name ? `<h1>${esc(b.name)}</h1>` : ''}
${b?.label ? `<p class="label">${esc(b.label)}</p>` : ''}
<div class="contact">
${b?.email ? `<span>${esc(b.email)}</span>` : ''}
${b?.phone ? `<span>${esc(b.phone)}</span>` : ''}
${b?.location?.city ? `<span>${esc(b.location.city)}${b.location.region ? ', ' + esc(b.location.region) : ''}</span>` : ''}
${(b?.profiles || []).map((p) => `<span>${link(p.url, p.network || p.username || '')}</span>`).join('')}
</div>
${b?.summary ? `<div class="summary">${esc(b.summary)}</div>` : ''}
${section(
  'Experience',
  (resume.work || [])
    .map(
      (w) => `<div class="entry">
<div class="entry-header"><h3>${esc(w.position)}</h3><span class="entry-meta">${dateRange(w.startDate, w.endDate)}</span></div>
<div class="entry-org">${link(w.url, w.name || '')}${w.location ? ` | ${esc(w.location)}` : ''}</div>
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
${p.description ? `<p style="color:#94a3b8;margin-top:4px">${esc(p.description)}</p>` : ''}
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
${section('Languages', resume.languages?.length ? `<div class="langs">${(resume.languages || []).map((l) => `<span class="lang">${esc(l.language)}${l.fluency ? ` - ${esc(l.fluency)}` : ''}</span>`).join('')}</div>` : '')}
${section('Volunteer', (resume.volunteer || []).map((v) => `<div class="entry"><div class="entry-header"><h3>${esc(v.position)}</h3><span class="entry-meta">${dateRange(v.startDate, v.endDate)}</span></div><div class="entry-org">${link(v.url, v.organization || '')}</div>${v.highlights?.length ? `<ul>${v.highlights.map((h) => `<li>${esc(h)}</li>`).join('')}</ul>` : ''}</div>`).join(''))}
${section('Awards', (resume.awards || []).map((a) => `<div class="entry"><div class="entry-header"><h3>${esc(a.title)}</h3><span class="entry-meta">${esc(a.awarder)}</span></div>${a.summary ? `<p style="color:#94a3b8;margin-top:4px">${esc(a.summary)}</p>` : ''}</div>`).join(''))}
${section('Certificates', (resume.certificates || []).map((c) => `<div class="entry"><div class="entry-header"><h3>${link(c.url, c.name || '')}</h3><span class="entry-meta">${c.issuer || ''}</span></div></div>`).join(''))}
${section('Publications', (resume.publications || []).map((p) => `<div class="entry"><div class="entry-header"><h3>${link(p.url, p.name || '')}</h3><span class="entry-meta">${p.releaseDate || ''}</span></div>${p.summary ? `<p style="color:#94a3b8;margin-top:4px">${esc(p.summary)}</p>` : ''}</div>`).join(''))}
${section('Interests', (resume.interests || []).map((i) => `<div class="entry"><h3>${esc(i.name)}</h3>${i.keywords?.length ? `<div class="tags" style="margin-top:4px">${i.keywords.map((k) => `<span class="tag">${esc(k)}</span>`).join('')}</div>` : ''}</div>`).join(''))}
${section('References', (resume.references || []).map((r) => `<div class="entry"><h3>${esc(r.name)}</h3>${r.reference ? `<p style="color:#94a3b8;font-style:italic;margin-top:4px">"${esc(r.reference)}"</p>` : ''}</div>`).join(''))}
</body></html>`;
}

export const darkTheme: ThemeDefinition = {
  id: 'dark',
  name: 'Dark',
  description: 'Dark navy background with cyan accents',
  render,
};
