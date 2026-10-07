import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';import {existsSync,readFileSync} from 'node:fs';
export const ORGANIC_BASE="bf3af86de87f0a04568805a2372b4e5124a325c5";
export const ORGANIC_PAYLOAD="351738995ce8bb0fa191f57cc6e291a31019ae8b";
export const ORGANIC_PAYLOAD_PATHS=["public-seo-context.mjs", "public-seo-organic-link-data.mjs", "public-seo-organic-links.mjs", "tests/public-seo-organic-links.test.mjs"];
export const ORGANIC_MAINTENANCE_PATHS=[".github/workflows/organic-followthrough-proof.yml", "member-experience/public-preservation.mjs", "release/organic-followthrough-scope.mjs", "release/seo-link-repairs-scope.mjs", "tests/organic-followthrough-release.test.mjs", "release/organic-followthrough-20261007.md", "release/organic-followthrough-live.mjs", "tests/organic-followthrough-live.test.mjs"];
export const ORGANIC_MANIFEST='release/organic-followthrough.json';
export const ORGANIC_PATHS=new Set([...ORGANIC_PAYLOAD_PATHS,...ORGANIC_MAINTENANCE_PATHS,ORGANIC_MANIFEST]);
const EXISTING=new Set(['public-seo-context.mjs','member-experience/public-preservation.mjs','release/seo-link-repairs-scope.mjs']);
const APPROVAL={"owner": "Matt O’Brien", "date": "2026-10-07", "instruction": "Approved.", "scope": "Nine exact current public alias anchors and removal of only /treatments/compare from the sitemap; existing redirects and archive exclusions retained. No clinical-copy, homepage, Start Here, consent, event, member or commercial changes."};
const git=(...a)=>execFileSync('git',a,{encoding:'utf8'}).trim();
const raw=(ref,p)=>git('rev-parse',ref+':'+p);
const cache=new Map();
const immutable=(...a)=>{const key=JSON.stringify([process.cwd(),...a]);if(!cache.has(key))cache.set(key,git(...a));return cache.get(key);};
export function organicRecord(){const p=new URL('./organic-followthrough.json',import.meta.url);return existsSync(p)?JSON.parse(readFileSync(p)):null;}
export function verifyOrganicComposition(read=raw,boundaryRead=read){
 const c=organicRecord();if(!c)return null;
 assert.equal(c.proof,'APPROVED_PUBLIC_ALIAS_FOLLOWTHROUGH_V1');assert.equal(c.base,ORGANIC_BASE);assert.equal(c.payloadSource,ORGANIC_PAYLOAD);assert.match(c.maintenanceSource,/^[a-f0-9]{40}$/);
 assert.deepEqual(c.payloadPaths,ORGANIC_PAYLOAD_PATHS);assert.deepEqual(c.maintenancePaths,ORGANIC_MAINTENANCE_PATHS);assert.deepEqual(c.approval,APPROVAL);
 const head=git('rev-parse','HEAD'),resolved=(ref,p)=>immutable('rev-parse',(ref==='HEAD'?head:ref)+':'+p);if(read===raw)read=resolved;if(boundaryRead===raw)boundaryRead=resolved;
 for(const ref of [c.base,c.payloadSource,c.maintenanceSource])immutable('merge-base','--is-ancestor',ref,head);
 const paths=(a,b)=>immutable('diff','--name-only',a,b).split('\n').filter(Boolean).sort();
 assert.deepEqual(paths(c.base,c.payloadSource),[...c.payloadPaths].sort());
 assert.deepEqual(paths(c.payloadSource,c.maintenanceSource),[...c.maintenancePaths].sort());
 assert.deepEqual(paths(c.maintenanceSource,head).filter(p=>ORGANIC_PATHS.has(p)),[ORGANIC_MANIFEST]);
 for(const p of [...c.payloadPaths,...c.maintenancePaths])assert.equal(read('HEAD',p),read(c.payloadPaths.includes(p)?c.payloadSource:c.maintenanceSource,p),'Coaching release source drift: Organic '+(c.payloadPaths.includes(p)?'payload drift':'maintenance source drift')+(p==='member-experience/public-preservation.mjs'?' / Metrics maintenance source drift':'')+': '+p);
 for(const p of ['wrangler.jsonc','worker-entry-v6.js','shift-coach/worker.mjs','shift-coach/release-manifest.json','.github/workflows/cloudflare-production-promote.yml','activation-measurement/assets.mjs','acquisition-activation/model.mjs','acquisition-activation/consent.mjs','public-seo-link-repairs.mjs','release/seo-link-repairs.json'])assert.equal(boundaryRead('HEAD',p),boundaryRead(c.base,p),'Organic release boundary drift: '+p);
 return c;
}
let checked=null;function ensure(){if(!organicRecord())return false;const head=git('rev-parse','HEAD');if(checked!==head){verifyOrganicComposition();checked=head;}return true;}
const mapped=new WeakSet();
export function organicHistoricalRead(read,verifyReader=false){if(!organicRecord()||mapped.has(read))return read;if(verifyReader)verifyOrganicComposition(read,raw);else ensure();const out=(ref,p)=>read(ref==='HEAD'&&EXISTING.has(p)?ORGANIC_BASE:ref,p);mapped.add(out);return out;}
export function organicHistoricalRef(ref,p){return ref==='HEAD'&&EXISTING.has(p)&&ensure()?ORGANIC_BASE:ref;}
export function organicHistoricalHead(){return ensure()?ORGANIC_BASE:git('rev-parse','HEAD');}
export function organicChangedPath(status,p){if(!ORGANIC_PATHS.has(p)||!ensure())return false;if(EXISTING.has(p))assert(['A','M'].includes(status),'Unexpected organic existing file status: '+p);else assert.equal(status,'A','Unexpected organic new file status: '+p);return true;}
export function organicPreflightPath(p){return ORGANIC_PATHS.has(p)&&ensure();}
