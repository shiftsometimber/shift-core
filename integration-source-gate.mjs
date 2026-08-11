import fs from 'node:fs';
const files=['personal-platform-v1.js','member-commissioning-v1.js','knowledge-graph-v1.js','radar-integration-v1.js','radar-public-v1.js','radar-e2e-staging.mjs','shift-ai-v3.js','worker-entry-v6.js','migrations/002_personal_knowledge_radar.sql'];
let failed=false;
for(const f of files){if(!fs.existsSync(f)){console.error('Missing integration file:',f);failed=true}}
const personal=fs.readFileSync('personal-platform-v1.js','utf8');
const commissioning=fs.readFileSync('member-commissioning-v1.js','utf8');
const graph=fs.readFileSync('knowledge-graph-v1.js','utf8');
const radar=fs.readFileSync('radar-integration-v1.js','utf8');
const radarPublic=fs.readFileSync('radar-public-v1.js','utf8');
const e2e=fs.readFileSync('radar-e2e-staging.mjs','utf8');
const ai=fs.readFileSync('shift-ai-v3.js','utf8');
const entry=fs.readFileSync('worker-entry-v6.js','utf8');
const migration=fs.readFileSync('migrations/002_personal_knowledge_radar.sql','utf8');
const requiredPersonal=['/v1/shift/context','/v1/shift/today','/v1/shift/recommend','/v1/grub/plan','/v1/grub/conundrum','/v1/fit/plan','/v1/hydration/plan','/v1/plan/print'];
for(const x of requiredPersonal)if(!personal.includes(x)){console.error('Missing personal route:',x);failed=true}
for(const x of ['/v1/shift/commissioning','Run full member commissioning','/v1/grub/plan','/v1/fit/plan','/v1/hydration/plan','/v1/grub/conundrum','/v1/shift/recommend','/v1/shift/knowledge/search','/v1/shift-ai/chat'])if(!commissioning.includes(x)){console.error('Missing commissioning contract:',x);failed=true}
for(const x of ['/v1/shift/knowledge/related','/v1/shift/knowledge/search','/v1/hq/knowledge-graph/ingest','health_knowledge_requires_verified_provenance','ensureGraphSchema'])if(!graph.includes(x)){console.error('Missing Knowledge Graph contract:',x);failed=true}
for(const x of ['/v1/radar/ingest','/v1/hq/radar/queue','/v1/hq/radar/medicines','/v1/hq/radar/forward','/v1/hq/radar/publication-jobs','verifyEvidence','package_ready','radar_publication_jobs'])if(!radar.includes(x)){console.error('Missing Radar contract:',x);failed=true}
for(const x of ['/v1/radar/ticker','/v1/radar/cards'])if(!radarPublic.includes(x)){console.error('Missing public Radar contract:',x);failed=true}
if(!radarPublic.includes('v1\\/radar\\/medicines\\/')){console.error('Missing public Radar medicine dossier contract');failed=true}
for(const x of ['https://staging.test/site-publish','https://staging.test/brain-ingest','https://staging.test/search-refresh','refresh_sitemap','refresh_internal_search','submit_changed_urls','existing_page_updates','comparisons'])if(!e2e.includes(x)){console.error('Staged adapter E2E is missing boundary/assertion:',x);failed=true}
if(!entry.includes('memberCommissioningRoute')||!entry.includes('personalRoutes')||!entry.includes('knowledgeRoutes')||!entry.includes('radarPublicRoutes')||!entry.includes('radarRoutes')||!entry.includes('runRadarFreshness')){console.error('Production entry point is not fully wired');failed=true}
if(!ai.includes('ACTIVE SHIFT PLANS')||!ai.includes("FROM shift_plans WHERE user_id=? AND status='active'")){console.error('Shift AI is not connected to active plans');failed=true}
if(/CREATE TABLE IF NOT EXISTS shift_members\b/.test(migration)){console.error('Prototype shift_members identity table must not be introduced');failed=true}
for(const x of ['shift_knowledge_nodes','shift_knowledge_edges','shift_recommendation_log','radar_events','radar_medicines','radar_freshness_claims','radar_publication_jobs','radar_forward_milestones'])if(!migration.includes(x)){console.error('Missing additive schema:',x);failed=true}
if(failed)process.exit(1);
console.log('Shift master integration source gate passed.');