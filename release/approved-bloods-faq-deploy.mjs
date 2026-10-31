import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {latestDeployment} from './runtime-rollback-guard.mjs';
import {addApprovedHomeTestFaq,NHS_HOME_TEST_FAQ} from '../public-bloods/shift-bloods-public.mjs';
const dir='october-release-proof/bloods',cfg='public-bloods/wrangler.jsonc',oldVersion='7125bb73-f7dc-4da2-a968-a03969692905';
mkdirSync(dir,{recursive:true});
const cli=(...args)=>execFileSync(process.execPath,['node_modules/wrangler/bin/wrangler.js',...args,'--config',cfg],{encoding:'utf8',maxBuffer:4e6});
const selected=()=>latestDeployment(JSON.parse(cli('deployments','list','--json')));
const hash=b=>createHash('sha256').update(b).digest('hex');
async function version(id){const r=await fetch('https://api.cloudflare.com/client/v4/accounts/'+process.env.CLOUDFLARE_ACCOUNT_ID+'/workers/workers/shift-bloods-public/versions/'+id+'?include=modules',{headers:{Authorization:'Bearer '+process.env.CLOUDFLARE_API_TOKEN},signal:AbortSignal.timeout(45000)});assert(r.ok);const d=await r.json();assert(d.success);assert.equal(d.result.id,id);return d.result;}
const clean=s=>s.replace(/<script\b[^>]*\bsrc=["']https:\/\/static.cloudflareinsights.com[^"']*["'][\s\S]*?<\/script>/gi,'').replace(/<script\b[^>]*>[\s\S]*?window\.__CF\$cv\$params[\s\S]*?<\/script>/gi,'');
const paths=['/shift-health','/shift-health/blood-tests','/shift-health/blood-tests/baseline','/shift-health/blood-tests/advanced','/shift-health/blood-tests/complete','/shift-health/blood-tests/baseline/your-test','/shift-health/blood-tests/advanced/your-test','/shift-health/blood-tests/complete/your-test','/shift-health/blood-tests/about','/shift-health/blood-tests/my-timber-example'];
async function pages(){const out={};for(const p of paths){const r=await fetch('https://shiftsometimber.co.uk'+p,{headers:{'Cache-Control':'no-cache'},signal:AbortSignal.timeout(20000)});assert.equal(r.status,200,p);out[p]=clean(await r.text());}return out;}
const before=selected();assert.equal(before.versions.length,1);assert.equal(before.versions[0].version_id,oldVersion);assert.equal(before.versions[0].percentage,100);
const old=await version(oldVersion);writeFileSync(dir+'/provider-before.json',JSON.stringify(old));writeFileSync(dir+'/deployment-before.json',JSON.stringify(before));
const oldMap=Object.fromEntries(old.modules.map(m=>[m.name,Buffer.from(m.content_base64,'base64').toString()]));
assert.deepEqual(Object.keys(oldMap).sort(),['public-response-policy.mjs','shift-bloods-marketing-worker.mjs','shift-bloods-public.mjs']);
const local=name=>readFileSync('public-bloods/'+name,'utf8');
assert.equal(local('public-response-policy.mjs').trimEnd(),oldMap['public-response-policy.mjs'].trimEnd());
assert.equal(local('shift-bloods-public.mjs').split("// Matt's exact Version1 FAQ")[0].trimEnd(),oldMap['shift-bloods-public.mjs'].trimEnd());
const restored=local('shift-bloods-marketing-worker.mjs').replace(',addApprovedHomeTestFaq','').split('\n').filter(l=>!l.includes('html=addApprovedHomeTestFaq(html)')).join('\n');
assert.equal(restored.trimEnd(),oldMap['shift-bloods-marketing-worker.mjs'].trimEnd(),'Only the exact FAQ import and root call may change');
const original=await pages(),root='/shift-health/blood-tests';assert(original[root].includes('Ordering is closed and no payment can be taken.'));
assert(!original[root].includes(NHS_HOME_TEST_FAQ));const expected=addApprovedHomeTestFaq(original[root]);assert.notEqual(expected,original[root]);writeFileSync(dir+'/pages-before.json',JSON.stringify(original));writeFileSync(dir+'/expected.html',expected);
let owned=null;
try{
 const sr=await fetch('https://api.cloudflare.com/client/v4/accounts/'+process.env.CLOUDFLARE_ACCOUNT_ID+'/workers/scripts/shift-bloods-public/settings',{headers:{Authorization:'Bearer '+process.env.CLOUDFLARE_API_TOKEN},signal:AbortSignal.timeout(45000)});assert(sr.ok);const sj=await sr.json();assert(sj.success);const settings=sj.result;
 const metadata={main_module:old.main_module,compatibility_date:settings.compatibility_date,compatibility_flags:settings.compatibility_flags||[],bindings:old.bindings.map(b=>({type:'inherit',name:b.name})),annotations:{'workers/message':'Exact owner-approved NHS Home Test FAQ; ordering closed'}};
 for(const key of ['placement','limits','observability','logpush'])if(settings[key]!==undefined)metadata[key]=settings[key];
 const form=new FormData();form.set('metadata',new Blob([JSON.stringify(metadata)],{type:'application/json'}),'metadata.json');for(const name of Object.keys(oldMap))form.set(name,new Blob([local(name)],{type:'application/javascript+module'}),name);
 assert.equal(selected().id,before.id,'Bloods moved before upload');
 const ur=await fetch('https://api.cloudflare.com/client/v4/accounts/'+process.env.CLOUDFLARE_ACCOUNT_ID+'/workers/scripts/shift-bloods-public/versions?bindings_inheritance=strict',{method:'POST',headers:{Authorization:'Bearer '+process.env.CLOUDFLARE_API_TOKEN},body:form,signal:AbortSignal.timeout(45000)});const uj=await ur.json();assert(ur.ok&&uj.success,'Bloods staged upload failed: '+JSON.stringify(uj.errors));owned=uj.result.id;assert.match(owned,/^[a-f0-9-]{36}$/);writeFileSync(dir+'/staged-version.json',JSON.stringify({version:owned,source:process.env.GITHUB_SHA}));
 const staged=await version(owned);assert.deepEqual(staged.bindings,old.bindings);assert.equal(staged.compatibility_date,old.compatibility_date);assert.deepEqual(staged.modules.map(m=>m.name).sort(),Object.keys(oldMap).sort());
 for(const m of staged.modules)assert.equal(hash(Buffer.from(m.content_base64,'base64')),hash(Buffer.from(local(m.name))),m.name);
 assert.equal(selected().id,before.id,'Bloods moved during staging');
 writeFileSync(dir+'/promotion-intent.json',JSON.stringify({owned,previous:oldVersion,before:before.id}));
 cli('versions','deploy',owned+'@100%','--yes');
 const active=selected();assert.equal(active.versions.length,1);assert.equal(active.versions[0].version_id,owned);assert.equal(active.versions[0].percentage,100);
 const after=await pages();assert.equal(after[root],expected);for(const p of paths.filter(p=>p!==root))assert.equal(after[p],original[p],p);
 assert.equal(after[root].split(NHS_HOME_TEST_FAQ).length,2);assert.equal(after[root].replace(NHS_HOME_TEST_FAQ,''),original[root]);
 const head=await fetch('https://shiftsometimber.co.uk'+root,{method:'HEAD',signal:AbortSignal.timeout(20000)});assert.equal(head.status,200);assert.equal(await head.text(),'');
 const post=await fetch('https://shiftsometimber.co.uk'+root,{method:'POST',signal:AbortSignal.timeout(20000)});assert.equal(post.status,404);
 writeFileSync(dir+'/verification.json',JSON.stringify({verified:true,source:process.env.GITHUB_SHA,version:owned,deployment:active.id,previous:oldVersion,exactFaqOnly:true,unchangedPages:paths.filter(p=>p!==root),head:200,post:404},null,2));
 console.log(JSON.stringify({bloodsVerified:true,version:owned,deployment:active.id}));
}catch(error){
 const current=selected();if(owned&&current.versions.length===1&&current.versions[0].version_id===owned){cli('versions','deploy',oldVersion+'@100%','--yes');assert.equal(selected().versions[0].version_id,oldVersion);writeFileSync(dir+'/rollback.json',JSON.stringify({restored:oldVersion,failed:owned}));}
 throw error;
}
