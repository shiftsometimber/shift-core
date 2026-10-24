const fs=require('fs'),cp=require('child_process'),assert=require('assert/strict'),path=require('path');
const c=require('/Users/shiftsometimberltd/SST/shift-bloods-blog-review-v1-20261018/release/approved-bloods-blogs-20261019/common.cjs');
const phase=require('../seo-followup-20261024/production-phase.cjs');
const r=__dirname,root=path.resolve(r,'../..'),d='/Users/shiftsometimberltd/SST/website-review-evidence-20261023/ticker-latest-20261024';
const a='/accounts/9e5386dcf455be34c582d93f8bfc79e6',z='/zones/66ec3268950adcfc837b7b8b2f8356ed',name='shift-latest-news-ticker-20261024';
const asset='/assets/public-news-ticker-v1.js',routes=['shiftsometimber.co.uk'+asset+'*'];
const redundant={id:'64914f44ac43455fb2a6e77aed11f002',pattern:'shiftsometimber.co.uk/assets/v42.js*',script:'shift-core',request_limit_fail_open:false};
const git=(...args)=>cp.execFileSync('git',args,{cwd:root,encoding:'utf8'}).trim();
fs.mkdirSync(d,{recursive:true});
const save=(n,v)=>fs.writeFileSync(d+'/'+n+'.json',JSON.stringify(v,null,2)),read=n=>JSON.parse(fs.readFileSync(d+'/'+n+'.json'));
async function snap(){return {routes:await c.organicApi(z+'/workers/routes'),core:(await c.organicApi(a+'/workers/scripts/shift-core/deployments')).deployments[0]};}
async function guard(){
 assert.equal(git('status','--porcelain'),'');
 const head=git('rev-parse','HEAD');
 assert(git('ls-remote','origin','refs/heads/fix/website-review-20261023').startsWith(head+'\t'));
 const changed=git('diff','--name-only','3b879f357','HEAD').split('\n').filter(Boolean);
 assert(changed.every(p=>p.startsWith('release/ticker-latest-20261024/')||p==='release/website-review-20261023/STATUS.md'));
 assert(fs.readFileSync(r+'/worker.mjs','utf8').includes(JSON.stringify(fs.readFileSync(r+'/public-news-ticker-v1.js','utf8'))));
 cp.execFileSync(process.execPath,['--test',r+'/test.mjs'],{stdio:'inherit'});
 return {head,phase:await phase()};
}
async function verify(origin,stage){
 const actual=await c.get(origin+asset+'?v=public-news-20260917-r4');
 assert(actual.bytes.equals(fs.readFileSync(r+'/public-news-ticker-v1.js')));
 const got=await fetch(origin+asset+'?v=public-news-20260917-r4',{method:'HEAD'});assert.equal(got.status,200);assert.equal(got.headers.get('x-shift-ticker-release'),'latest-published-newsroom-v2');
 const old=read('before-live');
 assert.equal(c.sha((await c.get('https://shiftsometimber.co.uk/')).bytes),old.homeSHA,'Homepage HTML must stay identical');
 assert.equal((await fetch('https://shiftsometimber.co.uk/cart')).status,404);
 assert.equal((await fetch('https://shiftsometimber.co.uk/checkout')).status,404);
 if(stage==='production'){
  const ss=await snap();assert.deepEqual(ss.core,read('before').core);
  assert.equal(ss.routes.filter(x=>x.script===name).length,1);
  assert.deepEqual(ss.routes.filter(x=>x.script!==name),read('before').routes.filter(x=>x.id!==redundant.id),'All non-redundant prior route owners retained');
  assert.equal(c.sha((await c.get('https://shiftsometimber.co.uk/assets/v42.js')).bytes),read('v42-before').sha,'Redundant route response unchanged');
 }
 const result={pass:true,at:new Date().toISOString(),asset:actual.receipt,homepageHTMLUnchanged:true,purchaseClosed:true};
 save(stage+'-verification',result);console.log(JSON.stringify(result));
}
(async()=>{
 const mode=process.argv[2];
 if(mode.startsWith('verify-')){const stage=mode.slice(7),s=read(stage==='production'?'production-deployment':'stage');await verify(stage==='production'?'https://shiftsometimber.co.uk':s.origin,stage);return;}
 if(mode==='rollback'){
  await phase();const before=read('before'),now=await snap();assert.deepEqual(now.core,before.core);
  for(const item of now.routes.filter(x=>x.script===name)){assert(routes.includes(item.pattern));await c.organicApi(z+'/workers/routes/'+item.id,{method:'DELETE'});}
  const rs=(await snap()).routes;if(!rs.some(x=>x.pattern===redundant.pattern))await c.organicApi(z+'/workers/routes',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({pattern:redundant.pattern,script:redundant.script})});
  const normal=xs=>xs.map(({id,...x})=>x).sort((a,b)=>a.pattern.localeCompare(b.pattern));assert.deepEqual(normal((await snap()).routes),normal(before.routes));save('rollback',{at:new Date().toISOString(),pass:true});return;
 }
 const g=await guard();
 if(mode==='stage'){
  assert(!fs.existsSync(d+'/stage-intent.json'),'Reconcile existing stage intent');
  const before=await snap();assert(!before.routes.some(x=>x.script===name||routes.includes(x.pattern)));
  save('before',before);
  const home=await c.get('https://shiftsometimber.co.uk/'),old=await c.get('https://shiftsometimber.co.uk'+asset);
  save('before-live',{homeSHA:c.sha(home.bytes),asset:old.receipt});fs.writeFileSync(d+'/before-client.js',old.bytes);
  save('stage-intent',g);
  const f=c.organicFormData();f.append('metadata',JSON.stringify({main_module:'worker.mjs',compatibility_date:'2026-08-09',bindings:[{type:'service',name:'CORE',service:'shift-core'}],tags:['approved-latest-news-ticker-20261024']}));
  f.append('worker.mjs',new (require('buffer').File)([fs.readFileSync(r+'/worker.mjs')],'worker.mjs',{type:'application/javascript+module'}),'worker.mjs');
  save('upload',await c.organicApi(a+'/workers/scripts/'+name,{method:'PUT',body:f}));
  await c.organicApi(a+'/workers/scripts/'+name+'/subdomain',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({enabled:true,previews_enabled:false})});
  const sub=await c.organicApi(a+'/workers/subdomain');save('stage',{head:g.head,origin:'https://'+name+'.'+sub.subdomain+'.workers.dev'});
  console.log(JSON.stringify(read('stage')));return;
 }
 if(mode==='production'){
  assert(!fs.existsSync(d+'/production-intent.json'),'Reconcile existing production intent');
  assert(read('stage-verification').pass);assert(read('stage-browser').pass);assert.equal(read('stage').head,g.head);
  assert.deepEqual(await snap(),read('before'),'Concurrent route/Core changes; rebase first');
  save('production-intent',g);
  const before=read('before');
  assert.deepEqual(before.routes.find(x=>x.id===redundant.id),redundant);
  const root=before.routes.find(x=>x.pattern==='shiftsometimber.co.uk/*');assert(root&&root.script==='shift-core'&&!root.request_limit_fail_open);
  const prefix=redundant.pattern.slice(0,-1);
  // Prove every possibly overlapping simple-prefix route is either the redundant
  // rule or a same-Core ancestor. No intermediate different owner can win.
  const intersecting=before.routes.filter(x=>{
    const p=x.pattern;assert(!p.includes('*')||p.endsWith('*')&&p.indexOf('*')===p.length-1,'Unexpected wildcard form; manual proof required');
    const fixed=p.endsWith('*')?p.slice(0,-1):p;
    return prefix.startsWith(fixed)||fixed.startsWith(prefix);
  });
  assert(intersecting.every(x=>x.script==='shift-core'&&!x.request_limit_fail_open&&prefix.startsWith(x.pattern.replace(/\*$/,''))),'Overlapping route semantics differ');
  const old=await c.get('https://shiftsometimber.co.uk/assets/v42.js');save('v42-before',{sha:c.sha(old.bytes),receipt:old.receipt});
  save('redundant-route-proof',{at:new Date().toISOString(),removed:redundant,unchangedFallback:root,intersecting,authority:'Necessary capacity for approved ticker; no request owner or response change'});
  await phase();assert.deepEqual(await snap(),before);
  save('redundant-route-remove-intent',{at:new Date().toISOString(),route:redundant});
  await c.organicApi(z+'/workers/routes/'+redundant.id,{method:'DELETE'});
  save('redundant-route-removed',{at:new Date().toISOString()});
  for(const pattern of routes){
   await phase();assert.deepEqual((await snap()).core,read('before').core);
   const created=await c.organicApi(z+'/workers/routes',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({pattern,script:name})});
   save('route-'+routes.indexOf(pattern),created);
  }
  save('production-deployment',{head:g.head,name,version:(await c.organicApi(a+'/workers/scripts/'+name+'/deployments')).deployments[0],at:new Date().toISOString()});
  console.log(JSON.stringify(read('production-deployment')));return;
 }
 if(mode==='close-preview'){
  assert(read('production-verification').pass);assert(read('production-browser').pass);
  await c.organicApi(a+'/workers/scripts/'+name+'/subdomain',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({enabled:false,previews_enabled:false})});
  save('closeout',{at:new Date().toISOString(),pass:true,previewDisabled:true});return;
 }
 throw new Error('Unknown mode');
})().catch(e=>{console.error(e.stack);process.exitCode=1;});
