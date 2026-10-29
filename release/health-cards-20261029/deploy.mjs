import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {cards,transformHTML,extractLinks,release} from './cards.mjs';
const account='9e5386dcf455be34c582d93f8bfc79e6',zone='66ec3268950adcfc837b7b8b2f8356ed',worker='shift-health-nutrition-20261027';
const dir='health-card-evidence';fs.mkdirSync(dir,{recursive:true});
const save=(name,value)=>fs.writeFileSync(dir+'/'+name+'.json',JSON.stringify(value,null,2));
const hash=v=>createHash('sha256').update(v).digest('hex');
async function cf(path,method='GET',body){const isForm=body instanceof FormData;const r=await fetch('https://api.cloudflare.com/client/v4'+path,{method,headers:{Authorization:'Bearer '+process.env.CLOUDFLARE_API_TOKEN,...(body&&!isForm?{'Content-Type':'application/json'}:{})},body:isForm?body:body?JSON.stringify(body):undefined,signal:AbortSignal.timeout(60000)});const j=await r.json();assert(r.ok&&j.success,'Cloudflare request failed '+method+' '+path+' '+JSON.stringify(j.errors?.map(x=>({code:x.code,message:x.message}))));return j.result;}
const routes=()=>cf('/zones/'+zone+'/workers/routes');
const active=async()=>{const r=await cf('/accounts/'+account+'/workers/scripts/'+worker+'/deployments');const d=r.deployments.sort((a,b)=>b.created_on.localeCompare(a.created_on))[0];assert.equal(d.versions.length,1);assert.equal(d.versions[0].percentage,100);return d;};
async function getPage(path='/shift-health'){const r=await fetch('https://shiftsometimber.co.uk'+path,{headers:{'Cache-Control':'no-cache'},signal:AbortSignal.timeout(45000)});assert.equal(r.status,200,path);return{r,html:await r.text()};}
function stripOwn(html,oldGrid){return html.replace(/<nav class="sst-health-grid shc-grid"[\s\S]*?<\/nav>/,()=>oldGrid).replace(/<style data-health-card-styles="20261029">[\s\S]*?<\/style><script type="application\/ld\+json">[\s\S]*?<\/script>/,'');}
let promoted=false,versionId,beforeDeployment;
try{
 const beforeRoutes=await routes();beforeDeployment=await active();const oldId=beforeDeployment.versions[0].version_id;
 const settings=await cf('/accounts/'+account+'/workers/scripts/'+worker+'/settings');
 const original=await cf('/accounts/'+account+'/workers/workers/'+worker+'/versions/'+oldId+'?include=modules');
 assert(original.modules?.length,'Provider did not return the active modules');
 const js=original.modules.filter(m=>/\.(js|mjs)$/.test(m.name));assert.equal(js.length,1,'Preserve only a known single-module predecessor');
 const oldMain=js[0].name;assert(!oldMain.includes('..')&&!oldMain.startsWith('/'));
 const baseline=await getPage(),{grid,links}=extractLinks(baseline.html),candidate=transformHTML(baseline.html);
 assert.equal(stripOwn(candidate,grid),baseline.html,'Only the nine-card grid and its scoped style/schema may change');
 assert.equal(transformHTML(candidate),candidate);assert.equal((candidate.match(/class="shc-card"/g)||[]).length,9);
 const homeBefore=await getPage('/');const mainBefore=homeBefore.html.match(/<main\b[\s\S]*?<\/main>/i)?.[0];assert(mainBefore,'Homepage main missing');
 fs.writeFileSync(dir+'/health-before.html',baseline.html);fs.writeFileSync(dir+'/health-candidate.html',candidate);
 save('before',{source:process.env.GITHUB_SHA,worker,deployment:beforeDeployment,routes:beforeRoutes,bindings:settings.bindings.map(x=>({name:x.name,type:x.type})),moduleHashes:original.modules.map(m=>({name:m.name,hash:hash(Buffer.from(m.content_base64,'base64'))})),homeMainSHA256:hash(mainBefore)});
 const prefix='release/health-cards-20261029/';
 const runtime=fs.readFileSync(prefix+'overlay.mjs','utf8').replaceAll('./original-health.mjs','./'+oldMain).replaceAll('./cards.mjs','./health-approved-cards.mjs').replaceAll('./cards/','./health-approved-assets/');
 const modules=[...original.modules,{name:'health-approved-overlay.mjs',content_type:'application/javascript+module',content_base64:Buffer.from(runtime).toString('base64')},{name:'health-approved-cards.mjs',content_type:'application/javascript+module',content_base64:fs.readFileSync(prefix+'cards.mjs').toString('base64')},...cards.map(c=>({name:'health-approved-assets/'+c.key+'.webp',content_type:'application/octet-stream',content_base64:fs.readFileSync(prefix+'assets/'+c.key+'.webp').toString('base64')}))];
 assert.equal(new Set(modules.map(m=>m.name)).size,modules.length,'New module names must be unique');
 const resources=original.resources?.script_runtime||{};
 const metadata={main_module:'health-approved-overlay.mjs',compatibility_date:resources.compatibility_date||settings.compatibility_date,compatibility_flags:resources.compatibility_flags||settings.compatibility_flags||[],bindings:settings.bindings.map(b=>b.type==='secret_text'?{type:'inherit',name:b.name,version_id:'latest'}:b),annotations:{'workers/message':'Matt approved nine photographic Health cards; preserve current Fertility fix and all other pages.','workers/commit_sha':process.env.GITHUB_SHA}};
 for(const k of ['usage_model','limits','placement','observability','tail_consumers','logpush','cache_options'])if(settings[k]!==undefined)metadata[k]=settings[k];
 if(settings.assets)metadata.keep_assets=true;
 if(settings.bindings.some(x=>x.type==='secret_text')){const versions=await cf('/accounts/'+account+'/workers/scripts/'+worker+'/versions');assert.equal(versions.items?.[0]?.id||versions[0]?.id,oldId,'Secrets may only inherit from the captured active version');}
 assert.equal((await active()).id,beforeDeployment.id,'Health owner changed before staging');
 const form=new FormData();form.set('metadata',new Blob([JSON.stringify(metadata)],{type:'application/json'}));for(const m of modules)form.set(m.name,new Blob([Buffer.from(m.content_base64,'base64')],{type:m.content_type||(/\.(js|mjs)$/.test(m.name)?'application/javascript+module':'application/octet-stream')}),m.name);
 const uploaded=await cf('/accounts/'+account+'/workers/scripts/'+worker+'/versions?bindings_inherit=strict','POST',form);versionId=uploaded.id;assert(versionId,'Staged version missing');
 const staged=await cf('/accounts/'+account+'/workers/workers/'+worker+'/versions/'+versionId+'?include=modules');
 assert.equal(staged.modules.length,modules.length);for(const m of modules){const received=staged.modules.find(x=>x.name===m.name);assert(received,'Provider module missing '+m.name);assert.equal(hash(Buffer.from(received.content_base64,'base64')),hash(Buffer.from(m.content_base64,'base64')),'Provider bytes differ '+m.name);}
 assert.equal((await active()).id,beforeDeployment.id,'Staging changed live traffic');assert.deepEqual(await routes(),beforeRoutes,'Routes changed during staging');
 const current=await getPage();assert.equal(current.html,baseline.html,'Hub changed while preparing; preserve the newer owner instead');
 save('staged',{source:process.env.GITHUB_SHA,versionId,previousVersion:oldId,modules:modules.map(m=>({name:m.name,sha256:hash(Buffer.from(m.content_base64,'base64'))})),destinations:links});
 await cf('/accounts/'+account+'/workers/scripts/'+worker+'/deployments','POST',{strategy:'percentage',versions:[{version_id:versionId,percentage:100}],annotations:{'workers/message':'Deploy Matt’s approved nine-card Health layout only'}});promoted=true;
 assert.equal((await active()).versions[0].version_id,versionId);
 let live;for(let i=0;i<10;i++){live=await getPage();if(live.r.headers.get('X-Shift-Health-Cards')===release)break;await new Promise(resolve=>setTimeout(resolve,2000));}
 assert.equal(live.r.headers.get('X-Shift-Health-Cards'),release,'Live response does not carry the approved card version');assert.equal(live.html,candidate,'Delivered HTML differs from the exact candidate');
 const checks=await Promise.all(cards.map(async c=>{const asset=await fetch('https://shiftsometimber.co.uk/shift-health/assets/cards-20261029/'+c.key+'.webp',{signal:AbortSignal.timeout(45000)});assert.equal(asset.status,200);assert.equal(hash(Buffer.from(await asset.arrayBuffer())),hash(fs.readFileSync(prefix+'assets/'+c.key+'.webp')));return{key:c.key,image:true};}));
 const destinations=await Promise.all(links.map(async link=>{const r=await fetch('https://shiftsometimber.co.uk'+link.href,{method:'HEAD',redirect:'follow',signal:AbortSignal.timeout(45000)});assert.equal(r.status,200,'Existing category destination failed '+link.href);return{href:link.href,status:r.status};}));
 assert.deepEqual(await routes(),beforeRoutes,'This release must add or alter zero routes');
 const homeAfter=await getPage('/');assert.equal(hash(homeAfter.html.match(/<main\b[\s\S]*?<\/main>/i)?.[0]||''),hash(mainBefore),'Homepage main changed');
 fs.writeFileSync(dir+'/health-live.html',live.html);const receipt={verified:true,source:process.env.GITHUB_SHA,worker,versionId,previousVersion:oldId,routeCount:beforeRoutes.length,routesChanged:0,homeMainPreserved:true,hubOuterBytesPreserved:true,checks,destinations,verifiedAt:new Date().toISOString()};save('receipt',receipt);console.log('HEALTH_CARD_RELEASE '+JSON.stringify(receipt));
}catch(error){
 save('failure',{message:error.message,promoted,versionId});
 if(promoted&&(await active()).versions[0].version_id===versionId){await cf('/accounts/'+account+'/workers/scripts/'+worker+'/deployments','POST',{strategy:'percentage',versions:[{version_id:beforeDeployment.versions[0].version_id,percentage:100}],annotations:{'workers/message':'Restore captured Health predecessor after nine-card verification failure'}});console.log('Restored only this release’s Health version; routes and data retained.');}
 throw error;
}
