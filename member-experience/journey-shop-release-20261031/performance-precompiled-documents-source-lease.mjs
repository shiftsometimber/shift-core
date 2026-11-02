// Fresh read-only source lease for the release manager; never stages or deploys.
import {readFileSync,writeFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import assert from 'node:assert/strict';
const account='9e5386dcf455be34c582d93f8bfc79e6',manifest=JSON.parse(readFileSync('performance-precompiled-documents.json'));
const auth=readFileSync('/Users/shiftsometimberltd/Library/Preferences/.wrangler/config/default.toml','utf8');
const token=process.env.CLOUDFLARE_API_TOKEN||auth.match(/^oauth_token\s*=\s*"([^"\n]+)"/m)?.[1];assert(token);
let currentToken=token,refreshed=false;
async function cf(path){
 let r=await fetch('https://api.cloudflare.com/client/v4'+path,{headers:{Authorization:'Bearer '+currentToken},signal:AbortSignal.timeout(30000)});
 if(r.status===401&&!refreshed&&!process.env.CLOUDFLARE_API_TOKEN){
  refreshed=true;
  const refresh=spawnSync(process.execPath,['/Users/shiftsometimberltd/.npm/_npx/095711ed2bffd7f3/node_modules/wrangler/bin/wrangler.js','deployments','list','--name','shift-core'],{encoding:'utf8',timeout:60000});
  assert.equal(refresh.status,0,'Existing read-only credential refresh failed; exit '+refresh.status);
  const renewed=readFileSync('/Users/shiftsometimberltd/Library/Preferences/.wrangler/config/default.toml','utf8');
  currentToken=renewed.match(/^oauth_token\s*=\s*"([^"\n]+)"/m)?.[1];assert(currentToken);
  r=await fetch('https://api.cloudflare.com/client/v4'+path,{headers:{Authorization:'Bearer '+currentToken},signal:AbortSignal.timeout(30000)});
 }
 const j=await r.json();assert(r.ok&&j.success,'Read-only provider source guard failed: '+r.status+' '+JSON.stringify(j.errors));return j.result;
}
const report={at:new Date().toISOString(),kind:'PRECOMPILED_DOCUMENT_FRESH_SOURCE_LEASE',productionMutations:0,owners:[]};
for(const anchor of manifest.sourceOwners){
 const ep='/accounts/'+account+'/workers/scripts/'+anchor.name;
 const ds=await cf(ep+'/deployments'),d=[...ds.deployments].sort((a,b)=>b.created_on.localeCompare(a.created_on))[0],live=d.versions.filter(v=>v.percentage>0);
 assert.equal(live.length,1,'Concurrent traffic split detected: '+anchor.name);assert.equal(live[0].version_id,anchor.version,'Serving source advanced: '+anchor.name);assert.equal(live[0].percentage,100);
 const settings=await cf(ep+'/settings'),flags=Object.fromEntries((settings.bindings||[]).filter(b=>b.type==='plain_text'&&['MY_TIMBER_V6_RELEASE_ENABLED','WORK_V1_ENABLED','PROGRAMME_V1_ENABLED','MEMBER_EXPERIENCE_V1_ENABLED'].includes(b.name)).map(b=>[b.name,b.text]));
 assert(flags.WORK_V1_ENABLED!=='true'&&flags.PROGRAMME_V1_ENABLED!=='true','Dynamic dashboard feature activated');
 const rollout=(settings.bindings||[]).find(b=>b.name==='MY_TIMBER_V6_RELEASE_ENABLED');
 if(['shift-programme-member-20261023','shift-hq-member-comms-20261023'].includes(anchor.name))assert(rollout&&['secret_text','plain_text'].includes(rollout.type),'Expected inherited rollout switch absent');
 report.owners.push({name:anchor.name,deployment:d.id,version:anchor.version,percentage:100,flags,rolloutBinding:rollout?{type:rollout.type,valueRead:false}:null});
}
report.verified=true;writeFileSync('performance-precompiled-documents-source-lease.json',JSON.stringify(report,null,2)+'\n');
console.log('PRECOMPILED_DOCUMENT_FRESH_SOURCE_LEASE_PASSED',report.owners.map(o=>o.name+':'+o.version).join(' '));
