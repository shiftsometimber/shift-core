// Exact adoption of the independently tested reload harness; serving source is retained.
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
export const NAVIGATION_BASE='e9d8ca70c6cd969bbd02caee31deb1f8b12bb67f';
export const NAVIGATION_VERIFIER='68407a75bff92359082b7a1154866fc91bef94e7';
export const NAVIGATION_RUN=37680334004;
export const NAVIGATION_PAYLOAD_PATHS=['rendered-member-acceptance-support.mjs','tests/rendered-member-acceptance-support.test.mjs','tests/member-reload-browser.test.mjs'];
export const NAVIGATION_MAINTENANCE_PATHS=['release/app-scope.mjs','release/app-preflight.mjs','release/member-acceptance-scope.mjs','release/metrics-connection-scope.mjs','release/seo-link-repairs-scope.mjs','release/organic-followthrough-scope.mjs','release/member-reload-navigation-scope.mjs','tests/member-reload-navigation-scope.test.mjs'];
export const NAVIGATION_PATHS=new Set([...NAVIGATION_PAYLOAD_PATHS,...NAVIGATION_MAINTENANCE_PATHS,'release/app-manifest.json']);
const git=(...args)=>execFileSync('git',args,{encoding:'utf8'}).trim();
const rawRead=(ref,path)=>git('rev-parse',ref+':'+path);
export function navigationRecord(){return JSON.parse(readFileSync(new URL('./app-manifest.json',import.meta.url))).memberReloadNavigationComposition||null;}
let verifiedKey;
function validateNavigationHashes(c,read,head){
 for(const path of NAVIGATION_PAYLOAD_PATHS)assert.equal(read('HEAD',path),read(c.verifierSource,path),'Coaching release source drift: Tested reload harness drift: '+path);
 for(const path of NAVIGATION_MAINTENANCE_PATHS)assert.equal(read('HEAD',path),read(c.source,path),'Coaching release source drift: Metrics maintenance source drift / Reload adoption metadata source drift: '+path);
 assert.equal(read('HEAD','release/app-manifest.json'),read(head,'release/app-manifest.json'),'Coaching release source drift: Reload adoption manifest source drift');
 for(const path of ['.github/workflows/my-timber-final-production.yml','.github/workflows/cloudflare-production-promote.yml','my-timber-final-source-gate.mjs','health-passport/production-browser.mjs','health-passport/acceptance-diagnostics.mjs','tests/acceptance-diagnostics.test.mjs','worker-entry-v6.js','wrangler.jsonc','shift-coach/release-manifest.json'])assert.equal(read('HEAD',path),read(c.base,path),'Coaching release source drift: '+(path==='worker-entry-v6.js'?'Current Watch source drift / ':'')+'Reload adoption protected boundary drift: '+path);
}

export function validateNavigationAdoption(c=navigationRecord(),read=rawRead){
 if(!c)return null;
 const head=git('rev-parse','HEAD');const key=head+'|'+JSON.stringify(c);if(verifiedKey===key){if(read!==rawRead)validateNavigationHashes(c,read,head);return c;}
 assert.equal(c.proof,'EXACT_RELOAD_NAVIGATION_HARNESS_ADOPTION_V1');
 assert.equal(c.base,NAVIGATION_BASE);assert.equal(c.verifierSource,NAVIGATION_VERIFIER);assert.equal(c.run,NAVIGATION_RUN);
 assert.deepEqual(c.payloadPaths,NAVIGATION_PAYLOAD_PATHS);assert.deepEqual(c.maintenancePaths,NAVIGATION_MAINTENANCE_PATHS);
 assert.equal(c.servingSourceChanged,false);assert.equal(c.accountPermissionsChanged,false);assert.match(c.source,/^[a-f0-9]{40}$/);
 for(const ref of [c.base,c.verifierSource,c.source])git('merge-base','--is-ancestor',ref,'HEAD');
 const changed=git('diff','--name-only',c.base,c.source).split('\n').filter(Boolean).sort();
 assert.deepEqual(changed,[...NAVIGATION_PATHS].sort(),'Reload adoption changes outside the exact harness and release records');
 validateNavigationHashes(c,read,head);
 const previous=JSON.parse(execFileSync('git',['show',c.source+':release/app-manifest.json'],{encoding:'utf8'}));previous.memberReloadNavigationComposition.source=c.source;
 assert.deepEqual(JSON.parse(readFileSync(new URL('./app-manifest.json',import.meta.url))),previous,'Reload adoption manifest changed beyond its exact source pointer');
 if(read===rawRead)verifiedKey=key;return c;
}
const mapped=new WeakSet();
export const navigationReaderMapped=read=>mapped.has(read);
export function markNavigationReader(read){mapped.add(read);return read;}
export function navigationHistoricalRead(read){if(mapped.has(read))return read;const c=validateNavigationAdoption();return c?markNavigationReader((ref,path)=>read(ref==='HEAD'&&NAVIGATION_PATHS.has(path)?c.base:ref,path)):read;}
export function navigationHistoricalRef(ref,path){if(ref!=='HEAD'||!NAVIGATION_PATHS.has(path))return ref;const c=validateNavigationAdoption();return c?c.base:ref;}
export function navigationGitArgs(args){if(!['show','rev-parse'].includes(args[0])||!args[1]?.startsWith('HEAD:'))return args;const path=args[1].slice(5),ref=navigationHistoricalRef('HEAD',path);return ref==='HEAD'?args:[args[0],ref+':'+path,...args.slice(2)];}
export function assertNavigationReceipt(receipt){
 assert.equal(receipt.id,NAVIGATION_RUN);assert.equal(receipt.head_sha,NAVIGATION_VERIFIER);
 assert.equal(receipt.path,'.github/workflows/my-timber-final-production.yml');assert.equal(receipt.head_branch,'fix/member-reload-navigation-20261007');
 assert.equal(receipt.event,'push');assert.equal(receipt.status,'completed');assert.equal(receipt.conclusion,'success','Three consecutive live member journeys must pass before harness adoption');
}
