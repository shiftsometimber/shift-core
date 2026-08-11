import fs from 'node:fs';
const files=['personal-platform-v1.js','radar-integration-v1.js','shift-ai-v3.js','worker-entry-v6.js','migrations/002_personal_knowledge_radar.sql'];
let failed=false;
for(const f of files){if(!fs.existsSync(f)){console.error('Missing integration file:',f);failed=true}}
const personal=fs.readFileSync('personal-platform-v1.js','utf8');
const radar=fs.readFileSync('radar-integration-v1.js','utf8');
const ai=fs.readFileSync('shift-ai-v3.js','utf8');
const entry=fs.readFileSync('worker-entry-v6.js','utf8');
const migration=fs.readFileSync('migrations/002_personal_knowledge_radar.sql','utf8');
const requiredPersonal=['/v1/shift/context','/v1/shift/today','/v1/shift/recommend','/v1/grub/plan','/v1/grub/conundrum','/v1/fit/plan','/v1/hydration/plan','/v1/plan/print'];
for(const x of requiredPersonal)if(!personal.includes(x)){console.error('Missing personal route:',x);failed=true}
for(const x of ['/v1/radar/ingest','/v1/hq/radar/queue','/v1/hq/radar/medicines','verifyEvidence'])if(!radar.includes(x)){console.error('Missing Radar contract:',x);failed=true}
if(!entry.includes('personalRoutes')||!entry.includes('radarRoutes')||!entry.includes('runRadarFreshness')){console.error('Production entry point is not fully wired');failed=true}
if(!ai.includes('ACTIVE SHIFT PLANS')||!ai.includes("FROM shift_plans WHERE user_id=? AND status='active'")){console.error('Shift AI is not connected to active plans');failed=true}
if(/CREATE TABLE IF NOT EXISTS shift_members\b/.test(migration)){console.error('Prototype shift_members identity table must not be introduced');failed=true}
for(const x of ['shift_knowledge_nodes','shift_recommendation_log','radar_events','radar_medicines','radar_freshness_claims'])if(!migration.includes(x)){console.error('Missing additive schema:',x);failed=true}
if(failed)process.exit(1);
console.log('Shift master integration source gate passed.');
