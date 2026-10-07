import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {existsSync,readFileSync} from 'node:fs';
export const METRICS_BASE='a5cca19e89abc04ac8ecb063fcafb4f66004f504';
export const METRICS_PAYLOAD='82214a6b0219d2ef1c876aedcbc960cb526118fb';
export const METRICS_PAYLOAD_PATHS=['acquisition-activation/ai-referrals.test.mjs','acquisition-activation/client.mjs','acquisition-activation/model.mjs'];
export const METRICS_MAINTENANCE_PATHS=['acquisition-activation/metrics-release.test.mjs','release/app-scope.mjs','release/fit-300-scope.mjs','release/metrics-connection-scope.mjs','release/seo-growth-scope.mjs','scripts/b1-release-scope.mjs','shift-coach/release-contract.mjs'];
export const METRICS_MANIFEST='release/metrics-connection.json';
export const METRICS_PATHS=new Set([...METRICS_PAYLOAD_PATHS,...METRICS_MAINTENANCE_PATHS,METRICS_MANIFEST]);
export const METRICS_EXISTING=new Set(['release/app-scope.mjs','release/fit-300-scope.mjs','release/seo-growth-scope.mjs','scripts/b1-release-scope.mjs','shift-coach/release-contract.mjs']);
const manifestPath=new URL('./metrics-connection.json',import.meta.url);
export function metricsRecord(){return existsSync(manifestPath)?JSON.parse(readFileSync(manifestPath,'utf8')):null;}
export function validateMetricsConnection(c){
 assert(c,'Exact metrics connection receipt required');
 assert.equal(c.proof,'CONSENTED_AI_ATTRIBUTION_EXACT_V1');
 assert.equal(c.base,METRICS_BASE);assert.equal(c.payloadSource,METRICS_PAYLOAD);
 assert.match(c.maintenanceSource,/^[a-f0-9]{40}$/);
 assert.deepEqual(c.payloadPaths,METRICS_PAYLOAD_PATHS);
 assert.deepEqual(c.maintenancePaths,METRICS_MAINTENANCE_PATHS);
 assert.equal(c.productionWrites,false);assert.equal(c.publicCopyChanged,false);
 assert.equal(c.consentChanged,false);assert.equal(c.thirdPartyCollectionChanged,false);
 assert.deepEqual(c.authority,{owner:'Matt',instruction:'We need to connect all metrics and then ensure we are doing as much as we can re; SEO for google/search engines and AI',date:'2026-10-07',scope:'Bounded first-party AI source classification and exact release reconciliation only; no new public wording, external communication or cost.'});
 return c;
}
const rawGit=(...a)=>execFileSync('git',a,{encoding:'utf8'}).trim();
// Cache only immutable object identities. Resolve HEAD afresh for each verification;
// never cache supplied readers, which can intentionally expose source drift.
const immutableCache=new Map();
const immutableGit=(...args)=>{const key=JSON.stringify([process.cwd(),...args]);if(!immutableCache.has(key))immutableCache.set(key,rawGit(...args));return immutableCache.get(key);};
const rawRead=(ref,p)=>rawGit('rev-parse',ref+':'+p);
export function verifyMetricsConnection(c=metricsRecord(),read=rawRead){
 if(!c)return null;validateMetricsConnection(c);
 const head=rawGit('rev-parse','HEAD');
 const sourceRead=read===rawRead?(ref,p)=>immutableGit('rev-parse',(ref==='HEAD'?head:ref)+':'+p):read;
 for(const ref of [c.base,c.payloadSource,c.maintenanceSource])immutableGit('merge-base','--is-ancestor',ref,head);
 const paths=(from,to)=>immutableGit('diff','--name-only',from,to).split('\n').filter(Boolean).sort();
 assert.deepEqual(paths(c.base,c.payloadSource),c.payloadPaths,'Unrelated metrics payload change');
 assert.deepEqual(paths(c.payloadSource,c.maintenanceSource).filter(p=>p!==METRICS_MANIFEST),c.maintenancePaths,'Unrelated metrics maintenance change');
 assert.deepEqual(paths(c.maintenanceSource,head).filter(p=>METRICS_PATHS.has(p)),[METRICS_MANIFEST],'Metrics receipt changed outside its exact final file');
 for(const p of c.payloadPaths)assert.equal(sourceRead('HEAD',p),sourceRead(c.payloadSource,p),'Coaching release source drift: Metrics payload source drift: '+p);
 for(const p of c.maintenancePaths)assert.equal(sourceRead('HEAD',p),sourceRead(c.maintenanceSource,p),'Coaching release source drift: Metrics maintenance source drift: '+p);
 for(const p of ['activation-measurement/assets.mjs','acquisition-activation/consent.mjs','frontend/member/api-adapter-v33d.js','wrangler.jsonc','.github/workflows/cloudflare-production-promote.yml','shift-coach/release-manifest.json','worker-entry-v6.js','shift-coach/worker.mjs']){
  assert.equal(sourceRead('HEAD',p),sourceRead(c.base,p),'Protected metrics boundary drift: '+p);
 }
 return {base:c.base,payload:c.payloadSource,maintenance:c.maintenanceSource,publicCopyChanged:false,consentChanged:false,thirdPartyCollectionChanged:false};
}
let verified=false;
function ensure(){if(!metricsRecord())return false;if(!verified){verifyMetricsConnection();verified=true;}return true;}
export function metricsHistoricalRead(read){
 return (ref,p)=>read(ref==='HEAD'&&METRICS_EXISTING.has(p)&&ensure()?METRICS_BASE:ref,p);
}
export function metricsHistoricalRef(ref,p){
 return ref==='HEAD'&&METRICS_EXISTING.has(p)&&ensure()?METRICS_BASE:ref;
}
export function metricsChangedPath(status,path){
 if(!METRICS_PATHS.has(path)||!ensure())return false;
 const added=[METRICS_MANIFEST,'release/metrics-connection-scope.mjs','acquisition-activation/ai-referrals.test.mjs','acquisition-activation/metrics-release.test.mjs'].includes(path);
 // This verifier was added after COACH_BASE, but is modified from METRICS_BASE.
 if(path==='release/seo-growth-scope.mjs')assert(['A','M'].includes(status),'Unexpected metrics change status: '+path);
 else assert.equal(status,added?'A':'M','Unexpected metrics change status: '+path);return true;
}
