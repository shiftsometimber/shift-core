const fs=require('fs'),cp=require('child_process'),assert=require('assert/strict');
const c=require('/Users/shiftsometimberltd/SST/shift-bloods-blog-review-v1-20261018/release/approved-bloods-blogs-20261019/common.cjs'),r=__dirname;
const GH='/Users/shiftsometimberltd/SST/shift-master-finish-20261013-7KGzrW/github-cli-private-20261013/gh_2.102.0_macOS_arm64/bin/gh';
const PREFIX='repos/shiftsometimber/shift-core',branch='fix/my-timber-line-icons-20261024',sourcePath='release/my-timber-welcome-20261021/emoji-arrows-20261024';
const save=(n,v)=>fs.writeFileSync(r+'/'+n,Buffer.isBuffer(v)||typeof v==='string'?v:JSON.stringify(v,null,2)),read=n=>JSON.parse(fs.readFileSync(r+'/'+n));
const gh=(p,b,method)=>JSON.parse(cp.execFileSync(GH,['api',PREFIX+p,...(b?['--method',method||'POST','--input','-']:[])],{input:b?JSON.stringify(b):undefined,encoding:'utf8',timeout:30000,maxBuffer:6000000}));
const svg='<svg class="mtw-line-arrow" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false" style="display:inline-block;vertical-align:-.125em"><path d="M6 18 18 6M6 6h12v12"/></svg>';
function validate(){
 const base=read('base.json'),before=fs.readFileSync(r+'/before-dashboard.html'),after=fs.readFileSync(r+'/dashboard.html');
 assert.equal(c.asset(before,'html'),base.files['/member/dashboard.html']);
 assert.equal(before.toString().split('↗').length-1,3);
 assert.equal(after.toString().split(svg).length-1,3);
 assert(!after.toString().includes('↗'));
 assert.equal(after.toString().split(svg).join('↗'),before.toString(),'Exact inverse: only three arrow characters change');
 const manifest={...base.files,'/member/dashboard.html':c.asset(after,'html')};
 assert.deepEqual(Object.keys(base.files).filter(p=>base.files[p]!==manifest[p]),['/member/dashboard.html']);
 assert.equal(c.sha(fs.readFileSync(r+'/_headers')),read('scope-proof.json').headersSHA256);
 return {base,before,after,manifest};
}
async function prepare(){
 assert(!fs.existsSync(r+'/base.json'),'Reconcile existing preparation before replacing');
 const p=await c.organicApi(c.pages),d=p.canonical_deployment;
 assert.equal(d.id,'52dc4030-c4e6-4438-ac56-5f1f377b16de','Observed Pages baseline moved');
 const full=await c.organicApi(c.pages+'/deployments/'+d.id),files=(await c.organicApi(c.pages+'/deployments/'+d.id+'/files')).files;
 assert.equal(full.uses_functions,false);
 const old=await c.get(d.url+'/member/dashboard.html'); assert.equal(c.asset(old.bytes,'html'),files['/member/dashboard.html']);
 assert.equal(old.bytes.toString().split('↗').length-1,3);
 save('base.json',{id:d.id,url:d.url,productionBranch:p.production_branch,files,uses_functions:full.uses_functions});
 save('before-dashboard.html',old.bytes);save('dashboard.html',old.bytes.toString().split('↗').join(svg));
 const h=fs.readFileSync('/Users/shiftsometimberltd/SST/whatsapp-coverage-20261024/_headers');save('_headers',h);
 save('scope-proof.json',{at:new Date().toISOString(),path:'/member/dashboard.html',replacements:3,locations:['Illustrative meal card','Movement benefit','Google Play download label'],headersSHA256:c.sha(h),homepageUnchanged:true,authUnchanged:true,allLinksUnchanged:true,coreSourceAndWorkflowUnchanged:true,authority:'Matt: previous approved removal of emoji arrows, reiterated with live screenshot 24 October 2026'});
 const v=validate();save('manifest.json',v.manifest);
 save('local-checks.json',{pass:true,at:new Date().toISOString(),exactInverse:true,onlyChangedAsset:'/member/dashboard.html',replacements:3,preservedAssets:Object.keys(files).length-1,homepageUnchanged:true,headersSHA256:c.sha(h)});
 console.log(JSON.stringify(read('local-checks.json')));
}
async function source(){
 validate();assert(!fs.existsSync(r+'/source.json'));
 const base=gh('/git/ref/heads/main').object.sha,commit=gh('/git/commits/'+base),entries=[];
 for(const file of ['dashboard.html','before-dashboard.html','_headers','base.json','scope-proof.json','local-checks.json','release.cjs']){
  const blob=gh('/git/blobs',{content:fs.readFileSync(r+'/'+file).toString('base64'),encoding:'base64'});
  entries.push({path:sourcePath+'/'+file,mode:'100644',type:'blob',sha:blob.sha});
 }
 const tree=gh('/git/trees',{base_tree:commit.tree.sha,tree:entries}),next=gh('/git/commits',{message:'Replace three emoji-prone My Timber cover arrows with fixed SVG line icons',tree:tree.sha,parents:[base]});
 save('source-intent.json',{branch,commit:next.sha,base});
 gh('/git/refs',{ref:'refs/heads/'+branch,sha:next.sha});
 assert.equal(gh('/git/ref/heads/'+branch).object.sha,next.sha);
 save('source.json',{branch,commit:next.sha,base,paths:entries.map(x=>x.path)});
 console.log(JSON.stringify(read('source.json')));
}
function validateSource(){
 const s=read('source.json');assert.equal(gh('/git/ref/heads/'+s.branch).object.sha,s.commit);
 for(const f of ['dashboard.html','_headers','base.json','scope-proof.json','release.cjs']){
  const actual=gh('/contents/'+sourcePath+'/'+f+'?ref='+s.commit);
  assert(Buffer.from(actual.content,'base64').equals(fs.readFileSync(r+'/'+f)),f+' differs from committed source');
 }
 return s;
}
async function publish(stage){
 assert(['preview','production'].includes(stage));assert(!fs.existsSync(r+'/'+stage+'-intent.json'),'Reconcile transaction before retry');
 const v=validate(),s=validateSource();assert(read('local-checks.json').pass);
 if(stage==='production'){assert(read('preview-verification.json').pass);assert(read('preview-browser.json').pass);}
 const phase=await c.phase();assert.equal((await c.organicApi(c.pages)).canonical_deployment.id,v.base.id,'Pages baseline moved');
 const {jwt}=await c.organicApi(c.pages+'/upload-token'),headers={'Content-Type':'application/json',Authorization:'Bearer '+jwt},key=v.manifest['/member/dashboard.html'];
 const missing=await c.organicApi('/pages/assets/check-missing',{method:'POST',headers,body:JSON.stringify({hashes:Object.values(v.manifest)})});
 assert(missing.every(x=>x===key),'Unrelated asset missing');
 if(missing.length)await c.organicApi('/pages/assets/upload',{method:'POST',headers,body:JSON.stringify([{key,value:v.after.toString('base64'),base64:true,metadata:{contentType:'text/html; charset=utf-8'}}])});
 await c.organicApi('/pages/assets/upsert-hashes',{method:'POST',headers,body:JSON.stringify({hashes:Object.values(v.manifest)})});
 assert.equal((await c.organicApi('/pages/assets/check-missing',{method:'POST',headers,body:JSON.stringify({hashes:Object.values(v.manifest)})})).length,0);
 await c.phase();assert.equal((await c.organicApi(c.pages)).canonical_deployment.id,v.base.id);
 validate();
 const h=fs.readFileSync(r+'/_headers'),form=c.organicFormData();
 form.set('manifest',JSON.stringify(v.manifest));form.set('_headers',new Blob([stage==='preview'?Buffer.concat([h,Buffer.from('\n/*\n  X-Robots-Tag: noindex, nofollow\n')]):h]),'_headers');
 form.set('branch',stage==='production'?v.base.productionBranch:branch);form.set('commit_hash',s.commit);form.set('commit_dirty','false');form.set('commit_message','My Timber cover: clean line arrows');
 save(stage+'-intent.json',{at:new Date().toISOString(),base:v.base.id,source:s.commit,phase,changed:['/member/dashboard.html']});
 const d=await c.organicApi(c.pages+'/deployments',{method:'POST',body:form});
 save(stage+'-deployment.json',{id:d.id,url:d.url});console.log(JSON.stringify(read(stage+'-deployment.json')));
}
async function verify(stage){
 const v=validate(),d=read(stage+'-deployment.json'),actual=await c.organicApi(c.pages+'/deployments/'+d.id);
 assert.equal(actual.latest_stage.status,'success');assert.deepEqual(actual.files,v.manifest);
 assert.equal((await c.organicApi(c.pages)).canonical_deployment.id,stage==='production'?d.id:v.base.id);
 const q=await c.get(d.url+'/member/dashboard.html');assert(q.bytes.equals(v.after));
 const checks=[q.receipt];
 if(stage==='production'){
  for(const path of ['/member/dashboard','/my-timber']){
   const x=await c.get('https://shiftsometimber.co.uk'+path),html=x.bytes.toString();assert(!html.includes('↗'));assert.equal(html.split('class="mtw-line-arrow"').length-1,3);checks.push(x.receipt);
  }
 }
 save(stage+'-verification.json',{pass:true,at:new Date().toISOString(),id:d.id,source:read('source.json').commit,replacements:3,preservedAssets:Object.keys(v.base.files).length-1,manifestExact:true,checks});
 console.log(JSON.stringify({pass:true,stage,id:d.id,replacements:3}));
}
(async()=>{const mode=process.argv[2];if(mode==='prepare')await prepare();else if(mode==='source')await source();else if(mode.startsWith('verify-'))await verify(mode.slice(7));else await publish(mode)})().catch(e=>{console.error(e.stack);process.exitCode=1});
