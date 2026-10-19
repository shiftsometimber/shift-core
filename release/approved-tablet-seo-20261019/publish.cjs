const fs=require('fs'),assert=require('assert/strict'),cp=require('child_process');
const {organicApi,organicFormData,pages,asset,sha,get,phase}=require('/Users/shiftsometimberltd/SST/shift-bloods-blog-review-v1-20261018/release/approved-bloods-blogs-20261019/common.cjs');
const r=__dirname,read=n=>JSON.parse(fs.readFileSync(r+'/'+n)),save=(n,x)=>fs.writeFileSync(r+'/'+n,JSON.stringify(x,null,2));
const repo='/Users/shiftsometimberltd/SST/tablet-seo-release-20261019',branch='release/approved-tablet-seo-20261019';
function validate(prep,base,manifest,headers){
 assert.equal(prep.approval.instruction,'Deploy all');assert.equal(prep.base,base.id);
 assert.equal(Object.keys(manifest).length,897);
 const changed=Object.keys(manifest).filter(k=>manifest[k]!==base.files[k]).sort();
 assert.deepEqual(changed,['/foundayo.html','/wegovy.html','/weight-loss-tablets-for-men.html']);
 for(const c of prep.changes){const b=fs.readFileSync(r+'/'+c.file);assert.equal(sha(b),c.sha256);assert.equal(asset(b,'html'),c.hash);assert.equal(manifest[c.key],c.hash);const before=fs.readFileSync(r+'/origin-before-'+c.path.slice(1)+'.html');assert.equal(sha(before),c.beforeSha256);assert.equal(b.toString().split(c.insertionHtml).length,2);assert.equal(b.toString().replace(c.insertionHtml,''),before.toString());}
 assert.equal(sha(headers),prep.headersSHA256);return changed;
}
async function source(){const src=read('source-publication.json');assert(src.remoteVerified);const ref=cp.execFileSync('git',['ls-remote','origin','refs/heads/'+branch],{cwd:repo,encoding:'utf8'}).trim().split(/\s+/)[0];assert.equal(ref,src.head);return src;}
async function publish(stage){
 assert(['preview','production'].includes(stage));assert(!fs.existsSync(r+'/'+stage+'-intent.json'),'Reconcile existing attempt; no blind retry');
 const prep=read('preparation.json'),base=read('base-deployment.json'),manifest=read('approved-manifest.json'),headers=fs.readFileSync(r+'/_headers');
 const changed=validate(prep,base,manifest,headers),src=await source();
 if(stage==='production'){const qa=read('preview-browser-qa.json');assert.equal(qa.ok,true);assert.equal(qa.source,src.head);const prev=read('preview-verification.json');assert(prev.ok);assert.equal(prev.source,src.head);}
 const phaseBefore=await phase();assert.equal((await organicApi(pages)).canonical_deployment.id,base.id);
 const uploadFiles=prep.changes.map(c=>({key:c.hash,bytes:fs.readFileSync(r+'/'+c.file),contentType:'text/html; charset=utf-8'}));
 let publishManifest={...manifest},publishHeaders=headers;
 if(stage==='preview'){
  const wrapper=Buffer.from('<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="robots" content="noindex,nofollow"><title>Approved tablet copy responsive preview</title></head><body><h1>Approved three-page tablet release: responsive checks</h1>'+prep.changes.flatMap(c=>[390,1440].map(w=>'<h2>'+c.path+' at '+w+'px</h2><iframe title="'+c.path+' at '+w+'px" data-page="'+c.path+'" data-width="'+w+'" src="'+c.path+(c.path==='/foundayo'?'#foundayo-regulatory-update-20261019':'')+'" width="'+w+'" height="1000" style="display:block;border:1px solid #999"></iframe>')).join('')+'</body></html>');
  const h=asset(wrapper,'html');publishManifest['/__approved-tablet-qa.html']=h;uploadFiles.push({key:h,bytes:wrapper,contentType:'text/html; charset=utf-8'});
  publishHeaders=Buffer.concat([headers,Buffer.from('\n/*\n  X-Robots-Tag: noindex, nofollow\n')]);
 }
 const {jwt}=await organicApi(pages+'/upload-token');
 const missing=await organicApi('/pages/assets/check-missing',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+jwt},body:JSON.stringify({hashes:Object.values(publishManifest)})});
 assert(missing.every(h=>uploadFiles.some(f=>f.key===h)),'Retained asset unavailable');
 if(missing.length)await organicApi('/pages/assets/upload',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+jwt},body:JSON.stringify(uploadFiles.filter(f=>missing.includes(f.key)).map(f=>({key:f.key,value:f.bytes.toString('base64'),metadata:{contentType:f.contentType},base64:true})))});
 await organicApi('/pages/assets/upsert-hashes',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+jwt},body:JSON.stringify({hashes:Object.values(publishManifest)})});
 const phaseAtUse=await phase();assert.equal((await organicApi(pages)).canonical_deployment.id,base.id);await source();validate(prep,base,manifest,headers);
 const form=organicFormData();form.set('manifest',JSON.stringify(publishManifest));form.set('_headers',new Blob([publishHeaders],{type:'text/plain'}),'_headers');form.set('branch',stage==='production'?'main':branch);form.set('commit_hash',src.head);form.set('commit_dirty','false');form.set('commit_message','Publish Matt-approved three tablet SEO additions; retain all unrelated assets and headers');
 save(stage+'-intent.json',{at:new Date().toISOString(),stage,base:base.id,source:src.head,approval:prep.approval,changedPaths:changed,previewOnly:stage==='preview'?'/__approved-tablet-qa.html':null,phaseBefore,phaseAtUse});
 const deployment=await organicApi(pages+'/deployments',{method:'POST',body:form});save(stage+'-deployment.json',deployment);console.log(JSON.stringify({stage,id:deployment.id,url:deployment.url,latest:deployment.latest_stage}));
}
async function verify(stage){
 const d=read(stage+'-deployment.json'),src=read('source-publication.json'),prep=read('preparation.json'),baseline=read('base-deployment.json'),manifest=read('approved-manifest.json');
 const deployment=await organicApi(pages+'/deployments/'+d.id);save(stage+'-status.json',deployment);assert.equal(deployment.latest_stage.status,'success','Deployment not successful');
 const actual=Object.fromEntries(Object.entries(deployment.files).filter(([k])=>k!=='/__approved-tablet-qa.html'));assert.deepEqual(actual,manifest);
 const project=await organicApi(pages);assert.equal(project.canonical_deployment.id,stage==='production'?d.id:baseline.id);
 const origin=[];for(const c of prep.changes){const x=await get(d.url+c.key);assert.equal(sha(x.bytes),c.sha256);origin.push(x.receipt);}
 if(stage==='preview'){
  const x=await fetch(d.url+'/foundayo');assert(x.headers.get('x-robots-tag')?.includes('noindex'));
  save('preview-verification.json',{at:new Date().toISOString(),ok:true,source:src.head,deployment:d.id,url:d.url,origin,productionUnchanged:true,manifestExact:true,previewNoindex:true});console.log(JSON.stringify({ok:true,stage,id:d.id,url:d.url}));return;
 }
 const live=[],links=[];for(const c of prep.changes){
  const x=await get('https://shiftsometimber.co.uk'+c.path),s=x.bytes.toString();fs.writeFileSync(r+'/live-'+c.path.slice(1)+'.html',x.bytes);
  assert.equal(s.split(c.insertionHtml).length,2,'Approved copy missing/duplicated '+c.path);
  const canon=[...s.matchAll(/<link\b[^>]*rel=["']canonical["'][^>]*>/g)];assert.equal(canon.length,1);assert(canon[0][0].includes('https://shiftsometimber.co.uk'+c.path));
  for(const m of s.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/g))JSON.parse(m[1]);
  for(const m of c.insertionHtml.matchAll(/href="(\/[^"]+)"/g)){
   const u=new URL(m[1],'https://shiftsometimber.co.uk'),p=u.pathname;u.hash='';let z=links.find(y=>y.path===p);
   if(!z){const hit=await get(u.toString());z={path:p,receipt:hit.receipt,text:hit.bytes.toString()};links.push(z);}
   const id=new URL(m[1],'https://shiftsometimber.co.uk').hash.slice(1);if(id)assert(z.text.includes('id="'+id+'"')||z.text.includes("id='"+id+"'"),'Missing fragment '+id);
  }
  live.push(x.receipt);
 }
 const controls=[];for(const [p,before]of Object.entries(prep.controls)){const x=await get('https://shiftsometimber.co.uk'+p);fs.writeFileSync(r+'/control-after-'+(p==='/'?'home':p.slice(1).replaceAll('/','_'))+'.html',x.bytes);controls.push({path:p,identical:x.receipt.sha256===before.sha256,before:before.sha256,after:x.receipt.sha256});assert.equal(x.receipt.sha256,before.sha256,'Unexpected control changed '+p);for(const key of ['content-security-policy','strict-transport-security','x-content-type-options','referrer-policy','permissions-policy','x-frame-options'])assert.equal(x.receipt.headers[key],before.headers[key]);}
 assert(!Object.keys(deployment.files).some(k=>k.includes('__approved-tablet-qa')));
 save('production-verification.json',{at:new Date().toISOString(),ok:true,source:src.head,deployment:d.id,url:d.url,publicPages:live,origin,links:links.map(({text,...x})=>x),controls,changedAssets:3,retainedAssets:894,manifestExact:true,originalHeadersSHA256:sha(fs.readFileSync(r+'/_headers')),canonicalOwned:true,previewWrapperAbsent:true});
 console.log(JSON.stringify({ok:true,stage,id:d.id,pages:live.map(x=>x.url),links:links.length,controls:controls.map(x=>({path:x.path,identical:x.identical})),retainedAssets:894}));
}
(async()=>{const mode=process.argv[2];if(mode==='guard-test'){const p=read('preparation.json'),b=read('base-deployment.json'),m=read('approved-manifest.json'),h=fs.readFileSync(r+'/_headers');validate(p,b,m,h);let rejected=0;for(const fn of [()=>validate(p,b,{...m,'/index.html':'tampered'},h),()=>validate(p,b,m,Buffer.from('bad headers')),()=>{const q=structuredClone(p);q.changes[0].sha256='tampered';validate(q,b,m,h)}]){try{fn()}catch{rejected++}}assert.equal(rejected,3);save('guard-tests.json',{at:new Date().toISOString(),ok:true,exactScope:true,rejectedCases:['unexpected retained asset change','header mutation','candidate checksum mismatch']});console.log(JSON.stringify({ok:true,rejected}));}else if(mode?.startsWith('verify-'))await verify(mode.slice(7));else {assert(read('guard-tests.json').ok);await publish(mode)}})().catch(e=>{save((process.argv[2]||'unknown')+'-error.json',{at:new Date().toISOString(),message:e.message});console.error(e.stack);process.exitCode=1});

