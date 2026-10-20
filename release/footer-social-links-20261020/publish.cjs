const c=require('/Users/shiftsometimberltd/SST/shift-bloods-blog-review-v1-20261018/release/approved-bloods-blogs-20261019/common.cjs');
const fs=require('fs'),path=require('path'),assert=require('assert/strict'),cp=require('child_process');
const r=__dirname,load=n=>JSON.parse(fs.readFileSync(r+'/'+n)),save=(n,x)=>fs.writeFileSync(r+'/'+n,JSON.stringify(x,null,2));
const GH='/Users/shiftsometimberltd/SST/shift-master-finish-20261013-7KGzrW/github-cli-private-20261013/gh_2.102.0_macOS_arm64/bin/gh';
function validate(){
 const b=load('baseline.json'),next=load('manifest-candidate.json'),changes=load('changes.json'),source=load('source-publication.json');assert.equal(changes.length,10);assert.equal(c.sha(fs.readFileSync(r+'/_headers')),b.headersSHA256);
 const allowed=new Set(changes.map(x=>x.path));for(const[p,h]of Object.entries(b.files))if(!allowed.has(p))assert.equal(next[p],h,p);assert.equal(Object.keys(next).length,Object.keys(b.files).length+1);
 for(const x of changes){const bytes=fs.readFileSync(r+'/after/'+x.file);assert.equal(c.sha(bytes),x.sha256,x.path);assert.equal(c.asset(bytes,path.extname(x.path).slice(1)),next[x.path],x.path);if(x.before)assert.equal(c.sha(fs.readFileSync(r+'/before/'+x.file)),x.beforeSHA256);}
 assert.equal(JSON.parse(cp.execFileSync(GH,['api','repos/shiftsometimber/shift-core/git/ref/heads/'+source.branch],{encoding:'utf8',timeout:30000})).object.sha,source.head);
 return {b,next,changes,source};
}
async function publish(stage){
 const{b,next,changes,source}=validate();assert(['preview','production'].includes(stage));assert(!fs.existsSync(r+'/'+stage+'-intent.json'),'Reconcile existing transaction');assert.equal((await c.organicApi(c.pages)).canonical_deployment.id,b.id,'Production moved; reconcile');
 assert(load('candidate-browser/receipt.json').pass);
 if(stage==='production')assert(load('preview-verification.json').pass);
 const phase=await c.phase(),{jwt}=await c.organicApi(c.pages+'/upload-token'),auth={'Content-Type':'application/json',Authorization:'Bearer '+jwt},known=new Map(changes.map(x=>[next[x.path],x]));
 const missing=await c.organicApi('/pages/assets/check-missing',{method:'POST',headers:auth,body:JSON.stringify({hashes:Object.values(next)})});assert(missing.every(x=>known.has(x)),'Unrelated provider asset missing');
 if(missing.length)await c.organicApi('/pages/assets/upload',{method:'POST',headers:auth,body:JSON.stringify(missing.map(key=>{const x=known.get(key);return {key,value:fs.readFileSync(r+'/after/'+x.file).toString('base64'),base64:true,metadata:{contentType:x.path.endsWith('.js')?'application/javascript; charset=utf-8':'text/html; charset=utf-8'}}}))});
 await c.organicApi('/pages/assets/upsert-hashes',{method:'POST',headers:auth,body:JSON.stringify({hashes:Object.values(next)})});assert.equal((await c.organicApi('/pages/assets/check-missing',{method:'POST',headers:auth,body:JSON.stringify({hashes:Object.values(next)})})).length,0);
 await c.phase();assert.equal((await c.organicApi(c.pages)).canonical_deployment.id,b.id);validate();
 const form=c.organicFormData();form.set('manifest',JSON.stringify(next));form.set('_headers',new Blob([fs.readFileSync(r+'/_headers')]),'_headers');form.set('branch',stage==='production'?b.branch:source.branch);form.set('commit_hash',source.head);form.set('commit_dirty','false');form.set('commit_message','Add approved Instagram, Facebook, X and YouTube links to the shared footer');
 save(stage+'-intent.json',{at:new Date().toISOString(),base:b.id,source:source.head,phase,scope:changes.map(x=>x.path)});const d=await c.organicApi(c.pages+'/deployments',{method:'POST',body:form});save(stage+'-deployment.json',{id:d.id,url:d.url,stage:d.latest_stage});console.log(JSON.stringify(load(stage+'-deployment.json')));
}
async function verify(stage){
 const{b,next,changes,source}=validate(),d=load(stage+'-deployment.json'),actual=await c.organicApi(c.pages+'/deployments/'+d.id);assert.equal(actual.latest_stage.status,'success');assert.deepEqual(actual.files,next);assert.equal((await c.organicApi(c.pages)).canonical_deployment.id,stage==='production'?d.id:b.id);
 const checks=[];for(const x of changes){const z=await c.get(d.url+x.path.replace(/\.html$/,''));assert.equal(z.receipt.sha256,x.sha256,x.path);checks.push(z.receipt);}
 if(stage==='production'){const client=await c.get('https://shiftsometimber.co.uk/assets/footer-social-links-v1.js?v=20261020');assert.equal(client.receipt.sha256,changes.find(x=>x.path==='/assets/footer-social-links-v1.js').sha256);checks.push(client.receipt);}
 save(stage+'-verification.json',{pass:true,at:new Date().toISOString(),id:d.id,url:d.url,source:source.head,checks,unrelatedAssetsPreserved:Object.keys(b.files).length-changes.filter(x=>x.before).length,manifestExact:true,headersSHA256:b.headersSHA256});console.log(JSON.stringify({pass:true,stage,id:d.id,checks:checks.length}));
}
(async()=>{const mode=process.argv[2];if(mode.startsWith('verify-'))await verify(mode.slice(7));else await publish(mode);})().catch(e=>{console.error(e);process.exitCode=1});
