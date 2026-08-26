import { mkdir, readFile, writeFile, copyFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';

const out = process.argv[2] || '.evidence-desk-demo-dist';
await mkdir(`${out}/preview`, { recursive: true });
await mkdir(`${out}/rollback`, { recursive: true });
await mkdir(`${out}/phase-3`, { recursive: true });

const copy = 'c219e05c948e2d89bfe42d5b4b13f06b4d92d406d82043fd4fbbb561e6680452';
const baseline = '773b67fed65c5ef4f13be58248118c9abc6f7792acf35b84752a9e7d0da035d7';
const candidate = 'a00ff939edddb532a671562a86cf2b647445e216e13f6a8693f8cfa132be4475';
const css = `<style>:root{color-scheme:dark;--ink:#e9e6dc;--muted:#aaa99f;--bg:#080a08;--card:#121611;--line:#30382c;--lime:#c8f04b;--red:#ff806f;--amber:#ffc960}*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--ink);font:16px/1.55 system-ui,sans-serif}main{max-width:1100px;margin:auto;padding:40px 22px}h1{font-size:clamp(2rem,5vw,4.4rem);line-height:1}.eyebrow{color:var(--lime);font-weight:800;text-transform:uppercase;letter-spacing:.1em}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(245px,1fr));gap:14px}.card{background:var(--card);border:1px solid var(--line);border-radius:16px;padding:20px}.red{color:var(--red)}.amber{color:var(--amber)}.ok{color:var(--lime)}code{overflow-wrap:anywhere;color:#d9f58d}a{color:var(--lime)}table{border-collapse:collapse;width:100%;font-size:.92rem}th,td{border-bottom:1px solid var(--line);padding:10px;text-align:left;vertical-align:top}.banner{border:2px solid var(--red);border-radius:14px;padding:16px;background:#21110f}.pill{display:inline-block;border:1px solid var(--line);border-radius:999px;padding:5px 10px;margin:3px}.copy{border-left:4px solid var(--amber);padding:14px 18px;background:#17140d}</style>`;
const head = (title) => `<!doctype html><html lang="en-GB"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>${title}</title>${css}</head><body><main>`;
const foot = `</main></body></html>`;

await writeFile(`${out}/index.html`, `${head('Shift Evidence Desk — sealed staging demo')}
<p class="eyebrow">Shift Evidence Desk · R1.x staging demonstration</p><h1>The machine works.<br><span class="red">Publication does not.</span></h1>
<div class="banner"><strong>Environment: non-production / staging</strong><br>Specialist review: <strong>not obtained</strong> · Publication: <strong>disabled</strong></div>
<h2>NAION decision package</h2><div class="grid">
<section class="card"><h3>1 · Evidence</h3><p class="ok">Source snapshot persisted</p><p>MHRA · 5 February 2026 · semaglutide-specific · very rare NAION safety update.</p></section>
<section class="card"><h3>2 · Mapping</h3><p class="ok">Exact dependency</p><code>claim → /glp1-knowledge-centre.html → section 07</code></section>
<section class="card"><h3>3 · Copy lock</h3><p class="ok">SHA-256 bound</p><code>${copy}</code></section>
<section class="card"><h3>4 · Editorial</h3><p class="ok">Editorial accepted</p><p>Read-only packet and audit retained.</p></section>
<section class="card"><h3>5 · Specialist gates</h3><p class="red">Clinical: not obtained<br>Medicines-comms: not obtained</p></section>
<section class="card"><h3>6 · Preflight</h3><p class="red">FAIL CLOSED</p><p>Also awaiting page baseline/rollback acceptance and publication authority.</p></section>
<section class="card"><h3>7 · Shutdown</h3><p class="ok">Fetch killed · destinations killed</p><p>Web, newsletter, social, model and live polling remain off.</p></section>
<section class="card"><h3>8 · Rollback</h3><p class="ok">Byte-exact</p><code>${baseline}</code></section></div>
<h2>Demonstration surfaces</h2><p><a href="/preview/">Would-publish preview</a> · <a href="/rollback/">Rollback proof</a> · <a href="/phase-3/">Phase 3 map and first pages</a></p>
<p><span class="pill">Production off</span><span class="pill">R2 off</span><span class="pill">Wave 3 off</span><span class="pill">PR off</span></p>${foot}`);

const exact = `<p>The MHRA says semaglutide (Wegovy, Ozempic and Rybelsus) has, in very rare reports, been linked to a serious eye condition called non-arteritic anterior ischaemic optic neuropathy (NAION), which can affect vision. If you are taking semaglutide and notice a change in your eyesight — including sudden blindness or a rapid deterioration — urgently contact a doctor. Call NHS 111, attend eye casualty if one is available in your area, or go to A&amp;E if you cannot reach your GP or GLP-1 prescriber. This warning is specific to semaglutide; the MHRA says it is reviewing evidence about other GLP-1 agonists.</p>`;
await writeFile(`${out}/preview/index.html`, `${head('Would-publish preview — disabled')}<p class="eyebrow">Staging-only candidate · would publish</p><h1>GLP-1 Knowledge Centre</h1><div class="banner">Not live. Not clinically reviewed. Not medicines-communications approved. Publication disabled.</div><section class="copy"><p class="eyebrow">MHRA safety update · 5 February 2026</p><h2>Safety update: changes to eyesight</h2>${exact}<p><a href="https://www.gov.uk/government/publications/glp-1-medicines-for-weight-loss-and-diabetes-what-you-need-to-know/glp-1-medicines-for-weight-loss-and-diabetes-what-you-need-to-know">Read the MHRA guidance</a></p><p><strong>General information, not individual medical advice.</strong></p></section><p>Candidate page SHA-256: <code>${candidate}</code><br>Exact copy SHA-256: <code>${copy}</code></p><p><a href="/">Back to control desk</a></p>${foot}`);
await writeFile(`${out}/rollback/index.html`, `${head('Rollback proof')}<p class="eyebrow">Candidate containment</p><h1>Rollback is byte-exact.</h1><div class="grid"><section class="card"><h2>Baseline</h2><code>${baseline}</code></section><section class="card"><h2>Rollback</h2><code>${baseline}</code></section></div><p class="ok"><strong>PASS:</strong> candidate block absent after rollback; restored bytes equal captured baseline.</p><p>Candidate retained only as a non-production evidence artifact: <code>${candidate}</code>.</p><p><a href="/">Back to control desk</a></p>${foot}`);

const pages = [
  ['men-over-40','Men over 40','/articles/men-weight-loss-after-40','How weight management changes after 40','NHS Better Health','https://www.nhs.uk/better-health/lose-weight/'],
  ['practical-glp1','Practical GLP-1 support','/articles/exercise-on-glp1','How to build manageable movement while using prescribed GLP-1 treatment','NHS physical activity guidance','https://www.nhs.uk/live-well/exercise/physical-activity-guidelines-for-adults-aged-19-to-64/'],
  ['muscle-protein','Muscle and protein','/articles/protein-for-men-weight-management','How protein and strengthening fit a practical weight-management plan','SACN','https://www.gov.uk/government/collections/sacn-reports-and-position-statements'],
  ['plateaus-stopping','Plateaus and stopping','/articles/weight-loss-plateau-men','What a weight-loss plateau means and what to review next','NICE NG246','https://www.nice.org.uk/guidance/ng246'],
  ['nhs-explainers','NHS explainers','/guides/nhs-weight-loss-medication-pathways','How NHS weight-management routes and referrals work','NHS obesity treatment','https://www.nhs.uk/conditions/obesity/treatment/'],
  ['tools','Tools','/tools/bmi','Use BMI as a screening calculation, not a diagnosis or eligibility decision','NICE NG246','https://www.nice.org.uk/guidance/ng246'],
  ['life-back','Life Back','/articles/mens-mental-health-and-weight','Understand the relationship between weight, confidence and mental wellbeing without diagnosing causation','NHS Every Mind Matters','https://www.nhs.uk/every-mind-matters/']
];
let rows='';
for (const [slug,hub,url,intent,source,href] of pages) {
  rows += `<tr><td>${hub}</td><td><code>${url}</code></td><td>${intent}</td><td><a href="${href}">${source}</a></td><td><a href="/phase-3/${slug}.html">first page</a></td></tr>`;
  await writeFile(`${out}/phase-3/${slug}.html`, `${head(`${hub} — first page`)}<p class="eyebrow">Phase 3 · first-page staging draft</p><h1>${intent}</h1><div class="banner">Non-production educational draft. Written/researched editorially; no clinical-review claim. No personal medical advice.</div><p>This page owns one search intent only: <strong>${intent}</strong>.</p><h2>What the reader gets</h2><p>A plain-English explanation, practical next steps, clear limits, and a route back to the primary source. It does not diagnose, prescribe, promise an outcome or decide treatment eligibility.</p><h2>Evidence boundary</h2><p>Primary source: <a href="${href}">${source}</a>. Material claims remain subject to the Evidence Desk claim register and copy-required rule.</p><p>Planned production URL: <code>${url}</code></p><p><a href="/phase-3/">Back to Phase 3 map</a></p>${foot}`);
}
await writeFile(`${out}/phase-3/index.html`, `${head('Phase 3 map and first pages')}<p class="eyebrow">Phase 3 · staging only</p><h1>Seven hubs. One intent per URL.</h1><div class="banner">These are educational staging drafts, not the red NAION publication. Production, Wave 3 and public distribution remain off.</div><table><thead><tr><th>Hub</th><th>Owner URL</th><th>Single intent</th><th>Primary source</th><th>Draft</th></tr></thead><tbody>${rows}</tbody></table><p><a href="/">Back to control desk</a></p>${foot}`);

const preview = await readFile('evidence/evidence-desk/r17/glp1-knowledge-centre.r17-candidate.html');
const rollback = await readFile('evidence/evidence-desk/r17/glp1-knowledge-centre.r17-rollback.html');
if (createHash('sha256').update(preview).digest('hex') !== candidate) throw new Error('candidate drift');
if (createHash('sha256').update(rollback).digest('hex') !== baseline) throw new Error('rollback drift');
await copyFile('evidence/evidence-desk/r17/r17-manifest.json', `${out}/r17-manifest.json`);
