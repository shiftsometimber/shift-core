const fs=require('node:fs'),assert=require('node:assert/strict'),cp=require('node:child_process');
const {organicApi,organicFormData,pages,asset,sha,get,phase,part}=require('/Users/shiftsometimberltd/SST/shift-bloods-blog-review-v1-20261018/release/approved-bloods-blogs-20261019/common.cjs');
const r=__dirname,repo='/Users/shiftsometimberltd/SST/seo-public-links-20261019',branch='fix/public-link-targets-20261019';
const read=n=>JSON.parse(fs.readFileSync(r+'/'+n)),save=(n,x)=>fs.writeFileSync(r+'/'+n,JSON.stringify(x,null,2)+'\n');
function validate(scope,base,manifest,headers){
 assert.equal(scope.path,'/future-medicines-comparison');assert.equal(scope.key,scope.path+'.html');
 assert.equal(scope.from,'/guides/mounjaro-ultimate-uk-guide');assert.equal(scope.to,'/mounjaro');
 assert.equal(scope.baseDeployment,base.id);assert.equal(base.uses_functions,false);
 assert.equal(Object.keys(base.files).length,897);assert.equal(Object.keys(manifest).length,897);
 assert.deepEqual(Object.keys(manifest).filter(k=>manifest[k]!==base.files[k]),[scope.key]);
 const before=fs.readFileSync(r+'/before.html'),candidate=fs.readFileSync(r+'/candidate.html');
 assert.equal(asset(before,'html'),base.files[scope.key]);assert.equal(sha(before),scope.beforeSHA256);
 assert.equal(sha(candidate),scope.candidateSHA256);assert.equal(asset(candidate,'html'),manifest[scope.key]);
 const a=before.toString(),b=candidate.toString();assert.equal(a.split(scope.old).length,2);
 assert.equal(b,a.replace(scope.old,scope.new));assert.equal(b.includes(scope.from),false);
 for(const tag of ['head','header','footer'])assert.equal(part(a,tag),part(b,tag));
 assert.equal(sha(headers),read('preparation.json').headersSHA256);
 return {before,candidate};
}
async function source(){const s=read('source-publication.json');const actual=cp.execFileSync('git',['ls-remote','origin','refs/heads/'+branch],{cwd:repo,encoding:'utf8',timeout:30000}).split(/\s/)[0];assert.equal(actual,s.head);return s;}
async function prepare(){
 assert(!fs.existsSync(r+'/production-intent.json'));
 const s=read('scope.json'),base=read('base-deployment.json');assert.equal((await organicApi(pages)).canonical_deployment.id,base.id);
 const actual=await organicApi(pages+'/deployments/'+base.id);assert.deepEqual(actual.files,base.files);
 const manifest={...base.files,[s.key]:asset(fs.readFileSync(r+'/candidate.html'),'html')};save('manifest.json',manifest);
 const headers=fs.readFileSync(r+'/_headers'),controls={};
 for(const p of ['/','/start-here','/programme','/sitemap.xml','/robots.txt','/assets/my-timber-pwa.css']){
  const x=await get('https://shiftsometimber.co.uk'+p);controls[p]=x.receipt;
 }
 const target=await get('https://shiftsometimber.co.uk/mounjaro');
 const original=await get('https://shiftsometimber.co.uk'+s.path);fs.writeFileSync(r+'/live-before.html',original.bytes);
 const phaseProof=await phase();assert.equal((await organicApi(pages)).canonical_deployment.id,base.id);
 save('preparation.json',{at:new Date().toISOString(),base:base.id,headersSHA256:sha(headers),controls,target:target.receipt,original:original.receipt,phaseProof,changedAssets:1,retainedAssets:896,scope:s});
 validate(s,base,manifest,headers);console.log(JSON.stringify({prepared:true,base:base.id,changedAssets:1,retainedAssets:896,phaseProof}));
}
function guardTest(){
 const s=read('scope.json'),b=read('base-deployment.json'),m=read('manifest.json'),h=fs.readFileSync(r+'/_headers');validate(s,b,m,h);
 let rejected=0;for(const fn of [()=>validate(s,b,{...m,'/index.html':'tampered'},h),()=>validate(s,b,m,Buffer.from('changed headers')),()=>validate({...s,candidateSHA256:'tampered'},b,m,h),()=>validate({...s,baseDeployment:'stale'},b,m,h)]){try{fn()}catch{rejected++}}
 assert.equal(rejected,4);save('guard-tests.json',{at:new Date().toISOString(),pass:true,rejected:4,cases:['unrelated asset changed','cache rules changed','candidate changed','stale baseline']});console.log(JSON.stringify({pass:true,rejected}));
}
async function publish(stage){
 assert(['preview','production'].includes(stage));assert(!fs.existsSync(r+'/'+stage+'-intent.json'),'Existing attempt must be reconciled');
 assert(read('guard-tests.json').pass);const s=read('scope.json'),base=read('base-deployment.json'),manifest=read('manifest.json'),headers=fs.readFileSync(r+'/_headers');
 const {candidate}=validate(s,base,manifest,headers),src=await source();
 if(stage==='production'){const v=read('preview-verification.json'),b=read('preview-browser-qa.json');assert(v.pass&&b.pass);assert.equal(v.source,src.head);assert.equal(b.source,src.head);}
 const phaseBefore=await phase();assert.equal((await organicApi(pages)).canonical_deployment.id,base.id);
 const {jwt}=await organicApi(pages+'/upload-token');
 const auth={'Content-Type':'application/json',Authorization:'Bearer '+jwt};
 const missing=await organicApi('/pages/assets/check-missing',{method:'POST',headers:auth,body:JSON.stringify({hashes:Object.values(manifest)})});
 assert(missing.every(h=>h===manifest[s.key]),'A retained asset is missing');
 if(missing.length)await organicApi('/pages/assets/upload',{method:'POST',headers:auth,body:JSON.stringify([{key:manifest[s.key],value:candidate.toString('base64'),metadata:{contentType:'text/html; charset=utf-8'},base64:true}])});
 await organicApi('/pages/assets/upsert-hashes',{method:'POST',headers:auth,body:JSON.stringify({hashes:Object.values(manifest)})});
 const phaseAtUse=await phase();assert.equal((await organicApi(pages)).canonical_deployment.id,base.id);await source();validate(s,base,manifest,headers);
 if(stage==='production')for(const [p,control]of Object.entries(read('preparation.json').controls)){const x=await get('https://shiftsometimber.co.uk'+p);assert.equal(x.receipt.sha256,control.sha256,'Control changed before publication: '+p);assert.deepEqual(x.receipt.headers,control.headers,'Headers changed before publication: '+p);}
 const form=organicFormData();form.set('manifest',JSON.stringify(manifest));form.set('_headers',new Blob([stage==='preview'?Buffer.concat([headers,Buffer.from('\n/*\n  X-Robots-Tag: noindex, nofollow\n')]):headers],{type:'text/plain'}),'_headers');form.set('branch',stage==='production'?'main':branch);form.set('commit_hash',src.head);form.set('commit_dirty','false');form.set('commit_message','Repair one broken Mounjaro comparison link; preserve 896 other assets and cache rules');
 save(stage+'-intent.json',{at:new Date().toISOString(),source:src.head,base:base.id,changedPaths:[s.key],phaseBefore,phaseAtUse});
 const d=await organicApi(pages+'/deployments',{method:'POST',body:form});save(stage+'-deployment.json',{id:d.id,url:d.url,latest_stage:d.latest_stage});console.log(JSON.stringify({stage,id:d.id,url:d.url,status:d.latest_stage.status}));
}
async function verify(stage){
 const d=read(stage+'-deployment.json'),src=read('source-publication.json'),s=read('scope.json'),b=read('base-deployment.json'),m=read('manifest.json'),p=read('preparation.json');
 const actual=await organicApi(pages+'/deployments/'+d.id);assert.equal(actual.latest_stage.status,'success');assert.deepEqual(actual.files,m);
 assert.equal((await organicApi(pages)).canonical_deployment.id,stage==='preview'?b.id:d.id);
 const x=await get(d.url+s.path);assert.equal(sha(x.bytes),s.candidateSHA256);
 if(stage==='preview'){assert((await fetch(d.url+s.path)).headers.get('x-robots-tag')?.includes('noindex'));save('preview-verification.json',{at:new Date().toISOString(),pass:true,source:src.head,id:d.id,url:d.url,manifestExact:true,productionUnchanged:true,sourceBytesExact:true});return;}
 const live=await get('https://shiftsometimber.co.uk'+s.path);fs.writeFileSync(r+'/live-after.html',live.bytes);
 const before=fs.readFileSync(r+'/live-before.html','utf8'),after=live.bytes.toString();assert.equal(after,before.replace(s.old,s.new),'Live response differs beyond exact target change');
 const controls=[];for(const [u,control]of Object.entries(p.controls)){const z=await get('https://shiftsometimber.co.uk'+u);assert.equal(z.receipt.sha256,control.sha256,u);assert.deepEqual(z.receipt.headers,control.headers);controls.push({path:u,bodyPreserved:true,headersPreserved:true});}
 const target=await get('https://shiftsometimber.co.uk/mounjaro');
 save('production-verification.json',{at:new Date().toISOString(),pass:true,source:src.head,id:d.id,url:d.url,manifestExact:true,changedAssets:1,retainedAssets:896,live:live.receipt,target:target.receipt,controls,clinicalCopyPreserved:true,homepagePreserved:true,analyticsPreserved:true,cacheRulesPreserved:true,workerRuntimeChanged:false});console.log(JSON.stringify({pass:true,id:d.id,changedAssets:1,retainedAssets:896,controls:controls.length}));
}
(async()=>{const mode=process.argv[2];if(mode==='prepare')await prepare();else if(mode==='guard-test')guardTest();else if(mode?.startsWith('verify-'))await verify(mode.slice(7));else await publish(mode);})().catch(e=>{save((process.argv[2]||'unknown')+'-error.json',{at:new Date().toISOString(),error:e.message});console.error(e.message);process.exitCode=1;});
