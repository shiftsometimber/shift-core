import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
export const APP_BASE='8c6902c8e0c6a53863282c6c4378f82ec1a70f6f';
export const APP_APPROVED='7cc35d6fbeb489446f1b1c84dbb55b77ab0f27c9';
export const APP_HASHES=JSON.parse(readFileSync(new URL('./app-manifest.json',import.meta.url))).sha256;
export const APP_PATHS=new Set([...Object.keys(APP_HASHES),'release/app-manifest.json','release/app-scope.mjs','release/growth-scope.mjs']);
export function validateAppSource(){
 const git=(...args)=>execFileSync('git',args,{encoding:'utf8'}).trim();
 git('merge-base','--is-ancestor',APP_BASE,'HEAD');
 const changed=git('diff','--name-only',APP_BASE,'HEAD').split('\n').filter(Boolean);
 assert(changed.every(p=>APP_PATHS.has(p)),'Unapproved files in app release: '+changed.filter(p=>!APP_PATHS.has(p)).join(','));
 for(const [p,sha]of Object.entries(APP_HASHES))assert.equal(createHash('sha256').update(execFileSync('git',['show','HEAD:'+p])).digest('hex'),sha,'App release drift: '+p);
 for(const p of ['presentation.mjs','screens.mjs','tabs.mjs'])assert.equal(git('rev-parse','HEAD:preview/app-layout/'+p),git('rev-parse',APP_APPROVED+':preview/app-layout/'+p),'Approved app design changed: '+p);
 assert.equal(git('diff',APP_BASE,'HEAD','--','wrangler.jsonc','worker-entry-v6.js','member-experience','my-timber-pwa','migrations'),'','Protected runtime, data and PWA source changed');
}
