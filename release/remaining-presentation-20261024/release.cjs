const fs=require('fs'),path=require('path'),cp=require('child_process'),assert=require('assert/strict');
const c=require('/Users/shiftsometimberltd/SST/shift-bloods-blog-review-v1-20261018/release/approved-bloods-blogs-20261019/common.cjs'),phase=require('../seo-followup-20261024/production-phase.cjs');
const r=__dirname,root=path.resolve(r,'../..'),d='/Users/shiftsometimberltd/SST/website-review-evidence-20261023/remaining-presentation-20261024',a='/accounts/9e5386dcf455be34c582d93f8bfc79e6',z='/zones/66ec3268950adcfc837b7b8b2f8356ed';
const cfg={
 bloods:{name:'shift-bloods-public',stage:'shift-review-bloods-stage-20261024',url:'/shift-health/blood-tests'},
 shop:{name:'shift-timber-mill-presentation-20261021',stage:'shift-review-shop-stage-20261024',url:'/shop'}
};
const save=(n,v)=>fs.writeFileSync(d+'/'+n+'.json',JSON.stringify(v,null,2)),read=n=>JSON.parse(fs.readFileSync(d+'/'+n+'.json'));
const git=(...args)=>cp.execFileSync('git',args,{cwd:root,encoding:'utf8'}).trim();
async function snapshot(){const versions={};for(const name of ['shift-core',...Object.values(cfg).map(x=>x.name)])versions[name]=(await c.organicApi(a+'/workers/scripts/'+name+'/deployments')).deployments[0];return {versions,routes:await c.organicApi(z+'/workers/routes'),pages:(await c.organicApi(c.pages)).canonical_deployment.id};}
function payload(k){
 const x=cfg[k],b=read(x.name+'/before'),after=fs.readFileSync(r+'/'+x.name+'/main.mjs');
 for(const m of b.modules)assert.equal(c.sha(fs.readFileSync(d+'/'+x.name+'/'+m.name)),m.sha);
 assert.equal(c.sha(fs.readFileSync(r+'/'+x.name+'/before-main.mjs')),b.modules.find(m=>m.name===b.main).sha);
 return {x,b,modules:b.modules.map(m=>({...m,bytes:m.name===b.main?after:fs.readFileSync(d+'/'+x.name+'/'+m.name)}))};
}
async function guard(){
 assert.equal(git('status','--porcelain'),'');const head=git('rev-parse','HEAD');
 assert(git('ls-remote','origin','refs/heads/fix/website-review-20261023').startsWith(head+'\t'));
 assert(git('diff','--name-only','00c400eb5','HEAD').split('\n').filter(Boolean).every(x=>x.startsWith('release/remaining-presentation-20261024/')||x==='release/website-review-20261023/STATUS.md'));
 cp.execFileSync(process.execPath,['--test',r+'/test.mjs'],{stdio:'inherit'});
 return {head,phase:await phase()};
}
const preservedSettings=s=>Object.fromEntries(['compatibility_date','compatibility_flags','usage_model','placement','logpush','tags','tail_consumers','bindings'].filter(k=>s[k]!==undefined).map(k=>[k,s[k]]));
async function upload(k,stage){
 const {x,b,modules}=payload(k),meta={...preservedSettings(b.settings),main_module:b.main};
 const f=c.organicFormData();
 if(stage){
  meta.main_module='review-preview.mjs';
  const harness='import runtime from '+JSON.stringify('./'+b.main)+';export default {async fetch(request,env,ctx){const u=new URL(request.url);if(["GET","HEAD"].includes(request.method)&&(u.pathname.startsWith("/assets/")||["/consent-v4a.js","/analytics-bootstrap-v1.js","/analytics-events-v31b.js","/analytics-v3a.js","/consent-v3a.js","/site.webmanifest"].includes(u.pathname)))return Response.redirect("https://shiftsometimber.co.uk"+u.pathname+u.search,302);const response=await runtime.fetch(request,env,ctx);const h=new Headers(response.headers);h.set("X-Robots-Tag","noindex,nofollow");return new Response(response.body,{status:response.status,headers:h});}};';
  f.append('review-preview.mjs',new(require('buffer').File)([harness],'review-preview.mjs',{type:'application/javascript+module'}),'review-preview.mjs');
 }
 f.append('metadata',JSON.stringify(meta));
 for(const m of modules)f.append(m.name,new(require('buffer').File)([m.bytes],m.name,{type:m.type||'application/javascript+module'}),m.name);
 return c.organicApi(a+'/workers/scripts/'+(stage?x.stage:x.name),{method:'PUT',body:f});
}
async function bodyVerify(k,origin,stage=false){
 const {x}=payload(k),actual=await c.get(origin+x.url),before=fs.readFileSync(d+'/'+k+(stage&&k==='bloods'?'-runtime-before.html':'-before.html'),'utf8');
 const html=actual.bytes.toString();
 if(k==='bloods'){
  const added='<script src="/consent-v4a.js" defer></script>';assert.equal(html.split(added).length-1,1);
  assert.equal(html.replace(added,''),before,'Bloods exact inverse must preserve all content');
 }else{
  const additions=['<link rel="apple-touch-icon" sizes="180x180" href="/assets/apple-touch-shift-s-20261020.png">','<link rel="manifest" href="/site.webmanifest">'];
  let inverse=html;for(const added of additions){assert.equal(html.split(added).length-1,1);inverse=inverse.replace(added,'');}
  assert.equal(inverse,before,'Shop exact inverse must preserve all content and catalogue');
 }
 const head=await fetch(origin+x.url,{method:'HEAD'});assert.equal(head.status,200);
 return actual.receipt;
}
(async()=>{
 const mode=process.argv[2],key=process.argv[3];
 if(mode==='capture-live'){
  assert(!fs.existsSync(d+'/estate-before.json'));const s=await snapshot();
  for(const [k,x]of Object.entries(cfg)){assert.deepEqual(s.versions[x.name],read(x.name+'/before').deployment);const got=await c.get('https://shiftsometimber.co.uk'+x.url);fs.writeFileSync(d+'/'+k+(stage&&k==='bloods'?'-runtime-before.html':'-before.html'),got.bytes);}
  const home=await c.get('https://shiftsometimber.co.uk/');save('estate-before',{...s,homeSHA:c.sha(home.bytes)});console.log('Before-image recorded; no change');return;
 }
 if(mode==='verify-stage'){
  const x=cfg[key],s=read(key+'-stage-deployment');const receipt=await bodyVerify(key,s.origin,true);
  save(key+'-stage-verification',{pass:true,at:new Date().toISOString(),source:s.source,receipt});console.log(key+' exact stage inverse verified');return;
 }
 if(mode==='verify-production'){
  const state=read('estate-before'),s=await snapshot(),receipts=[];
  assert.deepEqual(s.routes,state.routes);assert.equal(s.pages,state.pages);assert.deepEqual(s.versions['shift-core'],state.versions['shift-core']);assert.deepEqual((await c.organicApi(a+'/workers/scripts/shift-public-presentation-batch-20261022/deployments')).deployments[0],read('bloods-parent-before'));
  for(const [k,x]of Object.entries(cfg)){
   const dep=read(k+'-production-deployment');assert.equal(s.versions[x.name].id,dep.deployment.id);
   const settings=await c.organicApi(a+'/workers/scripts/'+x.name+'/settings');
   assert.deepEqual(preservedSettings(settings),preservedSettings(read(x.name+'/before').settings));
   receipts.push(await bodyVerify(k,'https://shiftsometimber.co.uk'));
  }
  assert.equal(c.sha((await c.get('https://shiftsometimber.co.uk/')).bytes),state.homeSHA);
  for(const p of ['/cart','/checkout'])await c.get('https://shiftsometimber.co.uk'+p,404);
  save('production-verification',{pass:true,at:new Date().toISOString(),receipts,coreUnchanged:true,pagesUnchanged:true,routesUnchanged:true,bindingsAndSettingsUnchanged:true,homepageHTMLUnchanged:true,purchasingClosed:true});console.log('Both production exact inverses and unchanged estate verified');return;
 }
 if(mode==='close-preview'){
  assert(read('production-verification').pass);assert(read('production-browser').pass);
  for(const x of Object.values(cfg))await c.organicApi(a+'/workers/scripts/'+x.stage+'/subdomain',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({enabled:false,previews_enabled:false})});
  save('closeout',{pass:true,at:new Date().toISOString(),previewDisabled:true});console.log('Preview hosts closed');return;
 }
 const g=await guard(),x=cfg[key];assert(x);
 if(mode==='stage'){
  assert(!fs.existsSync(d+'/'+key+'-stage-intent.json'));save(key+'-stage-intent',g);
  const uploadResult=await upload(key,true);save(key+'-stage-upload',uploadResult);
  await c.organicApi(a+'/workers/scripts/'+x.stage+'/subdomain',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({enabled:true,previews_enabled:false})});
  const sub=await c.organicApi(a+'/workers/subdomain');save(key+'-stage-deployment',{source:g.head,origin:'https://'+x.stage+'.'+sub.subdomain+'.workers.dev'});
  console.log(JSON.stringify(read(key+'-stage-deployment')));return;
 }
 if(mode==='production'){
  assert(!fs.existsSync(d+'/'+key+'-production-intent.json'),'Reconcile existing attempt');
  assert(read(key+'-stage-verification').pass);assert(read('stage-browser').pass);assert.equal(read(key+'-stage-deployment').source,g.head);
  const state=read('estate-before'),s=await snapshot();assert.deepEqual(s.routes,state.routes);assert.equal(s.pages,state.pages);assert.deepEqual(s.versions['shift-core'],state.versions['shift-core']);assert.deepEqual((await c.organicApi(a+'/workers/scripts/shift-public-presentation-batch-20261022/deployments')).deployments[0],read('bloods-parent-before'));
  assert.deepEqual(s.versions[x.name],read(x.name+'/before').deployment,'Other publisher changed target component');
  save(key+'-production-intent',g);const result=await upload(key,false);save(key+'-production-upload',result);
  const deployment=(await c.organicApi(a+'/workers/scripts/'+x.name+'/deployments')).deployments[0];
  const expected=result.deployment_id;assert.equal(deployment.id,expected,'Provider deployment has not converged; reconcile before retry');
  save(key+'-production-deployment',{source:g.head,name:x.name,deployment,at:new Date().toISOString()});console.log(JSON.stringify({name:x.name,deployment:deployment.id,source:g.head}));return;
 }
 if(mode==='rollback'){
  const dep=read(key+'-production-deployment'),s=await snapshot();assert.equal(s.versions[x.name].id,dep.deployment.id,'Refuse rollback of newer owner');
  const old=read(x.name+'/before').deployment;save(key+'-rollback-intent',{at:new Date().toISOString(),from:dep.deployment.id,to:old.versions});
  const out=await c.organicApi(a+'/workers/scripts/'+x.name+'/deployments',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({strategy:'percentage',versions:old.versions})});save(key+'-rollback',out);return;
 }
 throw Error('Unknown mode');
})().catch(e=>{console.error(e.stack);process.exitCode=1});
