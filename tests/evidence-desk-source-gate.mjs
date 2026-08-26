import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const module=readFileSync(new URL('../evidence-desk-v1.js',import.meta.url),'utf8');
const entry=readFileSync(new URL('../worker-entry-v6.js',import.meta.url),'utf8');
const migration=readFileSync(new URL('../migrations/007_shift_evidence_desk.sql',import.meta.url),'utf8');
const adapter=readFileSync(new URL('../evidence-adapter-mhra-glp1-v1.js',import.meta.url),'utf8');
const r12Entry=readFileSync(new URL('../evidence-desk-r12-entry.js',import.meta.url),'utf8');
const r12Config=readFileSync(new URL('../wrangler.evidence-desk-r12.template.jsonc',import.meta.url),'utf8');

for(const required of [
  'evidence_desk_sources','evidence_desk_snapshots','evidence_desk_facts','evidence_desk_claims',
  'evidence_desk_claim_dependencies','evidence_desk_page_dependencies','evidence_desk_events',
  'evidence_desk_packages','evidence_desk_decisions','evidence_desk_notifications'
])assert.match(module,new RegExp(required),`missing ${required}`);

assert.match(module,/previous\.structured_hash===structuredHash\?'no_material_change'/);
assert.match(module,/mapping_required/);
assert.match(module,/no_publication_justified/);
assert.match(module,/medicines_communications_review_required/);
assert.match(module,/qualified_reviewer_role_required/);
assert.match(module,/social_eligible=0/);
assert.match(module,/newsletter_eligible=0/);
assert.match(module,/website_publish_enabled=0/);
assert.match(module,/nothing_needs_decision/);
assert.match(module,/non_production_commissioning_only/);
assert.match(module,/mhra_glp1_r11_commissioned/);
assert.match(adapter,/mhra_adapter_identity_mismatch/);
assert.match(adapter,/mhra_adapter_response_too_large/);
assert.match(adapter,/redirect:'error'/);
assert.match(module,/mode:'read_only'/);
assert.match(module,/capabilities:\{compose:false,approve:false,publish:false,newsletter:false,social:false,model:false\}/);
assert.match(module,/EVIDENCE_DESK_COMMISSION_TOKEN/);
assert.match(r12Entry,/evidenceDeskRoutes/);
assert.match(r12Config,/__EVIDENCE_R12_D1_DATABASE_ID__/);
assert.match(r12Config,/"EVIDENCE_DESK_ENV": "non-production"/);
assert.doesNotMatch(r12Config,/"ai"\s*:/);
assert.doesNotMatch(module,/\.AI\.run\(/);
assert.doesNotMatch(adapter,/\.AI\.run\(/);
assert.doesNotMatch(module,/SHIFT_SITE_PUBLISH_ENDPOINT/);
assert.doesNotMatch(module,/\bfacebook\b|\binstagram\b|\blinkedin\b|\btwitter\b|https:\/\/x\.com/i);
assert.ok(/evidenceDeskRoutes/.test(entry)||/evidenceDeskRoutes/.test(r12Entry),'Evidence Desk has no Worker entry');
assert.ok(/runEvidenceDeskScheduled/.test(entry)||/runEvidenceDeskScheduled/.test(r12Entry),'Evidence Desk has no scheduled entry');
assert.match(migration,/VALUES\(1,0,0,0,0,0,0\)/);

console.log('Evidence Desk source gate PASS: claim mapping, explicit decisions and all publication destinations remain fail-closed.');
