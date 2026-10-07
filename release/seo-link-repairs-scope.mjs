import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';import {existsSync,readFileSync} from 'node:fs';
export const LINK_BASE='7b4a62f08461e8b3b971067183036bd43c5b97e4';
export const LINK_PAYLOAD='494f7b75193904f631bd3a269e8dacb32e98df9e';
export const LINK_PAYLOAD_PATHS=["public-seo-context.mjs", "public-seo-link-repairs.mjs", "tests/public-seo-link-repairs.test.mjs"];
export const LINK_MAINTENANCE_PATHS=[".github/workflows/seo-link-repairs-proof.yml", "member-experience/public-preservation.mjs", "release/metrics-connection-scope.mjs", "release/seo-growth-scope.mjs", "release/seo-link-repairs-scope.mjs", "tests/seo-link-repairs-release.test.mjs"];
export const LINK_MANIFEST='release/seo-link-repairs.json';
export const LINK_PATHS=new Set([...LINK_PAYLOAD_PATHS,...LINK_MAINTENANCE_PATHS,LINK_MANIFEST]);
export const LINK_EXISTING=new Set(['public-seo-context.mjs','member-experience/public-preservation.mjs','release/metrics-connection-scope.mjs','release/seo-growth-scope.mjs']);
const git=(...a)=>execFileSync('git',a,{encoding:'utf8'}).trim();
const raw=(ref,p)=>git('rev-parse',ref+':'+p);
export function linkRecord(){const p=new URL('./seo-link-repairs.json',import.meta.url);return existsSync(p)?JSON.parse(readFileSync(p)):null;}
export function verifyApprovedLinkComposition(read=raw,boundaryRead=read){
 const c=linkRecord();if(!c)return null;assert.equal(c.proof,'TWO_OWNER_APPROVED_LINK_EDITS_V1');assert.equal(c.base,LINK_BASE);assert.equal(c.payloadSource,LINK_PAYLOAD);assert.match(c.maintenanceSource,/^[a-f0-9]{40}$/);assert.deepEqual(c.payloadPaths,LINK_PAYLOAD_PATHS);assert.deepEqual(c.maintenancePaths,LINK_MAINTENANCE_PATHS);
 assert.deepEqual(c.approval,{owner:'Matt O’Brien',date:'2026-10-07',instruction:'please and then delve into rest of website',review:'SST-SEO-Improvement-Review-2026-10-07.html',scope:'Exact urgent-support href correction and one existing-title CagriSema guide paragraph immediately before Sources and evidence. Clinical wording, metadata, factual check dates, homepage, Start Here, consent and member behaviour preserved.'});
 const head=git('rev-parse','HEAD');for(const r of [c.base,c.payloadSource,c.maintenanceSource])git('merge-base','--is-ancestor',r,head);
 const paths=(a,b)=>git('diff','--name-only',a,b).split('\n').filter(Boolean).sort();
 assert.deepEqual(paths(c.base,c.payloadSource),[...c.payloadPaths].sort());assert.deepEqual(paths(c.payloadSource,c.maintenanceSource),[...c.maintenancePaths].sort());assert.deepEqual(paths(c.maintenanceSource,head).filter(p=>LINK_PATHS.has(p)),[LINK_MANIFEST]);
 for(const p of [...c.payloadPaths,...c.maintenancePaths])assert.equal(read('HEAD',p),read(c.payloadPaths.includes(p)?c.payloadSource:c.maintenanceSource,p),'Coaching release source drift: Approved link '+(c.payloadPaths.includes(p)?'payload drift':'source drift')+(LINK_EXISTING.has(p)&&p!=='public-seo-context.mjs'?' / Metrics maintenance source drift':'')+': '+p);
 for(const p of ['wrangler.jsonc','worker-entry-v6.js','shift-coach/worker.mjs','shift-coach/release-manifest.json','.github/workflows/cloudflare-production-promote.yml','activation-measurement/assets.mjs','acquisition-activation/model.mjs','acquisition-activation/consent.mjs'])assert.equal(boundaryRead('HEAD',p),boundaryRead(c.base,p),'Coaching release source drift: Protected link-release boundary drift: '+p);
 return c;
}
let checkedHead=null;
function ensure(){if(!linkRecord())return false;const h=git('rev-parse','HEAD');if(checkedHead!==h){verifyApprovedLinkComposition();checkedHead=h;}return true;}
const mappedReaders=new WeakSet();
export function linkMarkHistoricalReader(out){mappedReaders.add(out);return out;}
export function linkHistoricalRead(read){if(!linkRecord()||mappedReaders.has(read))return read;verifyApprovedLinkComposition(read,raw);return linkMarkHistoricalReader((ref,p)=>read(ref==='HEAD'&&LINK_EXISTING.has(p)?LINK_BASE:ref,p));}
export function linkHistoricalRef(ref,p){return ref==='HEAD'&&LINK_EXISTING.has(p)&&ensure()?LINK_BASE:ref;}
export function linkHistoricalHead(){return ensure()?LINK_BASE:git('rev-parse','HEAD');}
export function linkChangedPath(status,p){if(!LINK_PATHS.has(p)||!ensure())return false;if(['public-seo-context.mjs','release/metrics-connection-scope.mjs','release/seo-growth-scope.mjs'].includes(p))assert(['A','M'].includes(status),'Unexpected approved-link file status: '+p);else assert.equal(status,p==='member-experience/public-preservation.mjs'?'M':'A','Unexpected approved-link file status: '+p);return true;}
export function linkPreflightPath(p){return LINK_PATHS.has(p)&&ensure();}
