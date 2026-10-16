import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {ensureQueryRedaction} from './release/query-log-redaction.mjs';
const config='wrangler.hq-management.jsonc';
const cli=(...args)=>execFileSync(process.execPath,['node_modules/wrangler/bin/wrangler.js',...args,'--config',config],{encoding:'utf8',maxBuffer:4e6});
const latest=list=>list.toSorted((a,b)=>Date.parse(b.created_on)-Date.parse(a.created_on))[0];
mkdirSync('b1-runtime-release',{recursive:true});
if(process.argv.includes('--rollback')){
 const receipt=JSON.parse(readFileSync('b1-runtime-release/owned-hq-deployment.json'));
 const active=latest(JSON.parse(cli('deployments','list','--json')));assert.equal(active.versions[0].version_id,receipt.versionId,'Another HQ deployment moved; do not roll it back');
 if(receipt.before?.versions?.[0]?.version_id)cli('rollback',receipt.before.versions[0].version_id,'--message','Restore owned HQ endpoint release after verification failure');
 else cli('delete','--force');
 console.log('Rolled back only the owned HQ endpoint Worker; public runtime untouched.');
}else{
 let before=null;try{before=latest(JSON.parse(cli('deployments','list','--json')))||null}catch(e){const message=String(e.stdout||'')+String(e.stderr||'');assert(message.includes('10007'),'Cannot capture HQ rollback baseline');}
 writeFileSync('b1-runtime-release/hq-deployment-before.json',JSON.stringify(before,null,2));
 const output=cli('deploy','--keep-vars');writeFileSync('b1-runtime-release/hq-deploy.log',output);
 const ids=[...output.matchAll(/Current Version ID:\s*([a-f0-9-]{36})/g)];assert.equal(ids.length,1);
 const versionId=ids[0][1],active=latest(JSON.parse(cli('deployments','list','--json')));assert.equal(active.versions.length,1);assert.equal(active.versions[0].version_id,versionId);
 writeFileSync('b1-runtime-release/owned-hq-deployment.json',JSON.stringify({source:process.env.GITHUB_SHA,run:process.env.GITHUB_RUN_ID,versionId,deploymentId:active.id,before,publicRuntimeChanged:false},null,2));
 const privacy=await ensureQueryRedaction({accountId:process.env.CLOUDFLARE_ACCOUNT_ID,token:process.env.CLOUDFLARE_API_TOKEN,script:'shift-hq-management'});
 writeFileSync('b1-runtime-release/query-log-redaction.json',JSON.stringify(privacy,null,2));
 console.log('PASS owned HQ endpoints deployed; public runtime untouched.');
}
