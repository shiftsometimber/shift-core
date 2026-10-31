import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {latestDeployment} from './runtime-rollback-guard.mjs';
import {retirePublicShedNavigation,BLOODS_NAVIGATION_RETIREMENT} from '../public-bloods/shift-bloods-public.mjs';

const dir='bloods-navigation-retirement-proof',cfg='public-bloods/wrangler.jsonc';
mkdirSync(dir,{recursive:true});
const cli=(...args)=>execFileSync(process.execPath,['node_modules/wrangler/bin/wrangler.js',...args,'--config',cfg],{encoding:'utf8',maxBuffer:4e6});
const selected=()=>latestDeployment(JSON.parse(cli('deployments','list','--json')));
const hash=b=>createHash('sha256').update(b).digest('hex');
async function providerVersion(id){const r=await fetch('https://api.cloudflare.com/client/v4/accounts/'+process.env.CLOUDFLARE_ACCOUNT_ID+'/workers/workers/shift-bloods-public/versions/'+id+'?include=modules',{headers:{Authorization:'Bearer '+process.env.CLOUDFLARE_API_TOKEN},signal:AbortSignal.timeout(45000)});const d=await r.json();assert(r.ok&&d.success,'Bloods provider version unavailable '+JSON.stringify(d.errors));assert.equal(d.result.id,id);return d.result;}
const clean=s=>s.replace(/<script\b[^>]*\bsrc=["']https:\/\/static.cloudflareinsights.com[^"']*["'][\s\S]*?<\/script>/gi,'').replace(/<script\b[^>]*>[\s\S]*?window\.__CF\$cv\$params[\s\S]*?<\/script>/gi,'');
const withoutRetirement=s=>s.replace(/<style\\b[^>]*data-shift-navigation-retirement[^>]*>[\\s\\S]*?<\\/style>/gi,'').replace(/<script\\b[^>]*data-shift-navigation-retirement[^>]*>[\\s\\S]*?<\\/script>/gi,'');
const paths=['/shift-health','/shift-health/blood-tests','/shift-health/blood-tests/baseline','/shift-health/blood-tests/advanced','/shift-health/blood-tests/complete','/shift-health/blood-tests/baseline/your-test','/shift-health/blood-tests/advanced/your-test','/shift-health/blood-tests/complete/your-test','/shift-health/blood-tests/about','/shift-health/blood-tests/my-timber-example'];
async function pages(){const out={};for(const p of paths){const r=await fetch('https://shiftsometimber.co.uk'+p,{headers:{'Cache-Control':'no-cache'},signal:AbortSignal.timeout(20000)});assert.equal(r.status,200,p);out[p]={html:clean(await r.text()),headers:Object.fromEntries(r.headers)};}return out;}

const before=selected();assert.equal(before.versions.length,1,'Bloods must have one serving version');assert.equal(before.versions[0].percentage,100);
const previous=before.versions[0].version_id,old=await providerVersion(previous);
writeFileSync(dir+'/provider-before.json',JSON.stringify(old));writeFileSync(dir+'/deployment-before.json',JSON.stringify(before));
const oldMap=Object.fromEntries(old.modules.map(m=>[m.name,Buffer.from(m.content_base64,'base64').toString()]));
assert.deepEqual(Object.keys(oldMap).sort(),['public-response-policy.mjs','shift-bloods-marketing-worker.mjs','shift-bloods-public.mjs']);
const local=name=>readFileSync('public-bloods/'+name,'utf8');
const restoredPublic=local('shift-bloods-public.mjs').split('// This public surface is served by the isolated shift-bloods-public Worker')[0].trimEnd();
assert.equal(restoredPublic,oldMap['shift-bloods-public.mjs'].trimEnd(),'Bloods public source moved beyond this exact retirement addition');
const restoredWorker=local('shift-bloods-marketing-worker.mjs')
 .replace(',retirePublicShedNavigation','')
 .split('\n').filter(line=>!line.includes('html=retirePublicShedNavigation(html)')&&!line.includes("headers.set('X-Shift-Navigation-Policy'")).join('\n').trimEnd();
assert.equal(restoredWorker,oldMap['shift-bloods-marketing-worker.mjs'].trimEnd(),'Bloods worker moved beyond this exact retirement addition');
assert.equal(local('public-response-policy.mjs').trimEnd(),oldMap['public-response-policy.mjs'].trimEnd());

const original=await pages(),expected={};
for(const p of paths){expected[p]=retirePublicShedNavigation(original[p].html);}
const root='/shift-health/blood-tests';
assert.notEqual(expected[root],original[root].html,'Bloods root already contains the retirement policy; reconcile instead of replaying');
assert(!expected[root].includes('The Timber Shed'));assert(!/<span\b[^>]*\bsst-shed-teaser\b/i.test(expected[root]));
writeFileSync(dir+'/pages-before.json',JSON.stringify(original));writeFileSync(dir+'/pages-expected.json',JSON.stringify(expected));
let owned=null;
try{
 const sr=await fetch('https://api.cloudflare.com/client/v4/accounts/'+process.env.CLOUDFLARE_ACCOUNT_ID+'/workers/scripts/shift-bloods-public/settings',{headers:{Authorization:'Bearer '+process.env.CLOUDFLARE_API_TOKEN},signal:AbortSignal.timeout(45000)});const sj=await sr.json();assert(sr.ok&&sj.success,'Bloods settings unavailable');const settings=sj.result;
 const metadata={main_module:old.main_module,compatibility_date:settings.compatibility_date,compatibility_flags:settings.compatibility_flags||[],bindings:old.bindings.map(b=>({type:'inherit',name:b.name})),annotations:{'workers/message':'Retire the approved Timber Shed teaser on the isolated Bloods public owner'}};
 for(const key of ['placement','limits','observability','logpush'])if(settings[key]!==undefined)metadata[key]=settings[key];
 const form=new FormData();form.set('metadata',new Blob([JSON.stringify(metadata)],{type:'application/json'}),'metadata.json');for(const name of Object.keys(oldMap))form.set(name,new Blob([local(name)],{type:'application/javascript+module'}),name);
 assert.equal(selected().id,before.id,'Bloods owner moved before staging');
 const ur=await fetch('https://api.cloudflare.com/client/v4/accounts/'+process.env.CLOUDFLARE_ACCOUNT_ID+'/workers/scripts/shift-bloods-public/versions?bindings_inheritance=strict',{method:'POST',headers:{Authorization:'Bearer '+process.env.CLOUDFLARE_API_TOKEN},body:form,signal:AbortSignal.timeout(45000)});const uj=await ur.json();assert(ur.ok&&uj.success,'Bloods staged upload failed '+JSON.stringify(uj.errors));owned=uj.result.id;assert.match(owned,/^[a-f0-9-]{36}$/);
 const staged=await providerVersion(owned);assert.deepEqual(staged.bindings,old.bindings);assert.equal(staged.compatibility_date,old.compatibility_date);assert.deepEqual(staged.modules.map(m=>m.name).sort(),Object.keys(oldMap).sort());
 for(const m of staged.modules)assert.equal(hash(Buffer.from(m.content_base64,'base64')),hash(Buffer.from(local(m.name))),m.name);
 assert.equal(selected().id,before.id,'Bloods owner moved during staging');
 writeFileSync(dir+'/promotion-intent.json',JSON.stringify({owned,previous,before:before.id,source:process.env.GITHUB_SHA}));
 cli('versions','deploy',owned+'@100%','--yes');
 const active=selected();assert.equal(active.versions.length,1);assert.equal(active.versions[0].version_id,owned);assert.equal(active.versions[0].percentage,100);
 const after=await pages();
 for(const p of paths){assert.equal(withoutRetirement(after[p].html),withoutRetirement(expected[p]),p+' changed beyond the exact retired teaser and guard');if(p!=='/shift-health')assert.equal(after[p].headers['x-shift-navigation-policy'],'approved-20261031',p+' retirement header');}
 const body=after[root].html;
 assert.equal((body.match(/data-shift-navigation-retirement=/g)||[]).length,2);assert(body.includes(BLOODS_NAVIGATION_RETIREMENT));assert(!body.includes('The Timber Shed'));assert(!/<span\b[^>]*\bsst-shed-teaser\b/i.test(body));
 assert(/<link\b[^>]*\brel=["']canonical["'][^>]*\bhref=["']https:\/\/shiftsometimber\.co\.uk\/shift-health\/blood-tests["']/i.test(body));
 assert(!/<meta\b[^>]*(?:name=["']robots["'][^>]*content=["'][^"']*noindex|content=["'][^"']*noindex[^"']*["'][^>]*name=["']robots["'])/i.test(body));
 for(const name of ['content-security-policy','strict-transport-security','x-frame-options'])assert(after[root].headers[name],name);
 const head=await fetch('https://shiftsometimber.co.uk'+root,{method:'HEAD',signal:AbortSignal.timeout(20000)});assert.equal(head.status,200);assert.equal(await head.text(),'');
 const post=await fetch('https://shiftsometimber.co.uk'+root,{method:'POST',signal:AbortSignal.timeout(20000)});assert.equal(post.status,404);
 writeFileSync(dir+'/verification.json',JSON.stringify({verified:true,source:process.env.GITHUB_SHA,version:owned,deployment:active.id,previous,paths,htmlAndRenderedGuard:true,indexable:true,securityHeaders:true,head:200,post:404},null,2));
 console.log(JSON.stringify({bloodsNavigationVerified:true,version:owned,deployment:active.id,previous}));
}catch(error){
 const current=selected();if(owned&&current.versions.length===1&&current.versions[0].version_id===owned){cli('versions','deploy',previous+'@100%','--yes');assert.equal(selected().versions[0].version_id,previous);writeFileSync(dir+'/rollback.json',JSON.stringify({restored:previous,failed:owned}));}
 throw error;
}

