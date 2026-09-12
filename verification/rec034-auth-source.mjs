import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
const base='b3b86d41d1283d08e7b1e464f72e7aa72fa5b082';
const name='frontend/member/my-timber-preview.html';
const original=execFileSync('git',['show',base+':'+name],{encoding:'utf8'});
const after=fs.readFileSync(name,'utf8');
const oldBlock=original.match(/<header class="sst-global-head">[\s\S]*?<nav class="sst-global-menu"[\s\S]*?<\/nav>/)?.[0];
assert.ok(oldBlock);
const normalized=after.replace(/<header data-header-v2[\s\S]*?<\/aside>/,oldBlock)
 .replace(/<style data-auth-header-base>[\s\S]*?<\/style>\n<link rel="stylesheet" href="\/assets\/header-navigation-v2.css" data-header-v2-style\/>\n/,'')
 .replace(/<script defer src="\/assets\/v42.js" data-auth-header-handler><\/script>\n/,'');
assert.equal(normalized,original,'non-navigation auth-shell bytes changed');
const changed=execFileSync('git',['diff','--name-only',base,'HEAD'],{encoding:'utf8'}).trim().split('\n');
const allowed=new Set([name,'my-timber-navigation-gate.mjs','.github/workflows/auth-header-release.yml','verification/rec034-auth-source.mjs','verification/rec034-auth-live.mjs','docs/rec034-auth-header.md']);
assert.ok(changed.every(p=>allowed.has(p)),JSON.stringify(changed));
for(const p of ['worker-entry-v6.js','wrangler.jsonc','member-login-fastpath-v1.js','member-register-fastpath-v2.js','frontend/member/api-adapter-v33d.js','frontend/member/turnstile-auth-v1.js']){
 assert.equal(fs.readFileSync(p,'utf8'),execFileSync('git',['show',base+':'+p],{encoding:'utf8'}),p+' changed');
}
fs.writeFileSync('auth-header-source-proof.json',JSON.stringify({base,changed,authAndNonNavigationBytesUnchanged:true,beforeSha256:createHash('sha256').update(original).digest('hex'),afterSha256:createHash('sha256').update(after).digest('hex')},null,2));
console.log('PASS: one navigation-only auth asset change; backend, config, authentication and all other bytes preserved.');
