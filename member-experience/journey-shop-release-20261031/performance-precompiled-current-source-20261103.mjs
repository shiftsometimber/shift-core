import assert from 'node:assert/strict';import {readFileSync,writeFileSync} from 'node:fs';import {gzipSync,gunzipSync} from 'node:zlib';import {createHash} from 'node:crypto';import {spawnSync} from 'node:child_process';
const account='9e5386dcf455be34c582d93f8bfc79e6',prior=JSON.parse(readFileSync('performance-precompiled-documents.json')),hash=b=>createHash('sha256').update(b).digest('hex');
let token=readFileSync('/Users/shiftsometimberltd/Library/Preferences/.wrangler/config/default.toml','utf8').match(/^oauth_token\s*=\s*"([^"\n]+)"/m)[1],refreshed=false;
async function cf(p){let r=await fetch('https://api.cloudflare.com/client/v4'+p,{headers:{Authorization:'Bearer '+token},signal:AbortSignal.timeout(55000)});if(r.status===401&&!refreshed){refreshed=true;const a=spawnSync(process.execPath,['/Users/shiftsometimberltd/.npm/_npx/095711ed2bffd7f3/node_modules/wrangler/bin/wrangler.js','deployments','list','--name','shift-core'],{encoding:'utf8',timeout:60000});assert.equal(a.status,0);token=readFileSync('/Users/shiftsometimberltd/Library/Preferences/.wrangler/config/default.toml','utf8').match(/^oauth_token\s*=\s*"([^"\n]+)"/m)[1];r=await fetch('https://api.cloudflare.com/client/v4'+p,{headers:{Authorization:'Bearer '+token},signal:AbortSignal.timeout(55000)});}const j=await r.json();assert(r.ok&&j.success,r.status+' '+JSON.stringify(j.errors));return j.result}
const result={at:new Date().toISOString(),kind:'CURRENT_SOURCE_REBASE_CAPTURE',productionMutations:0,owners:[]};
for(const anchor of prior.sourceOwners){
 const ds=await cf('/accounts/'+account+'/workers/scripts/'+anchor.name+'/deployments'),d=ds.deployments.sort((a,b)=>b.created_on.localeCompare(a.created_on))[0],live=d.versions.filter(v=>v.percentage>0);assert.equal(live.length,1);assert.equal(live[0].percentage,100);
 let path,version;
 if(live[0].version_id===anchor.version){path=anchor.name==='shift-mytimber-support-20261023'?'performance-current-dependency-shift-mytimber-support-20261023.json':'performance-static-text-current-'+anchor.name+'.json.gz';version=path.endsWith('.gz')?JSON.parse(gunzipSync(readFileSync(path))):JSON.parse(readFileSync(path)).version;}
 else{version=await cf('/accounts/'+account+'/workers/workers/'+anchor.name+'/versions/'+live[0].version_id+'?include=modules');path='performance-precompiled-current-'+anchor.name+'-'+live[0].version_id+'.json.gz';writeFileSync(path,gzipSync(JSON.stringify(version)));}
 assert.equal(version.id,live[0].version_id);
 const moduleHashes=Object.fromEntries(version.modules.map(m=>[m.name,hash(Buffer.from(m.content_base64,'base64'))]));
 const changed=Object.keys(moduleHashes).filter(n=>moduleHashes[n]!==anchor.moduleHashes[n]),removed=Object.keys(anchor.moduleHashes).filter(n=>!(n in moduleHashes));
 result.owners.push({name:anchor.name,version:version.id,main:version.main_module,currentDeployment:d.id,distribution:d.versions,sourceFile:path,moduleHashes,changed,removed});
 console.log('CURRENT_SOURCE_CAPTURED',anchor.name,version.id,'changed modules',changed.length,'removed',removed.length);
 if(changed.length<15)for(const m of version.modules.filter(m=>changed.includes(m.name)&&Buffer.from(m.content_base64,'base64').length<5000))console.log('CHANGED_PUBLIC_SOURCE',anchor.name,m.name,Buffer.from(m.content_base64,'base64').toString());
}
result.verified=true;writeFileSync('performance-precompiled-current-source-20261103.json',JSON.stringify(result,null,2)+'\n');console.log('CURRENT_SOURCE_REBASE_CAPTURE_PASSED');
