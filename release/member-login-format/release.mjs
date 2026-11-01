import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {deriveLoginPatch,applyLoginPatch,assertOwned,assertSettings,sha} from './patch.mjs';
const dir='evidence/member-login-format';mkdirSync(dir,{recursive:true});
const baseSource='abc093c61ad4cdd832dc62bbffa25de668d58661',account=process.env.CLOUDFLARE_ACCOUNT_ID,token=process.env.CLOUDFLARE_API_TOKEN;
assert.equal(account,'9e5386dcf455be34c582d93f8bfc79e6');assert(token,'Existing release credential required');
assert.equal(process.env.GITHUB_REF,'refs/heads/fix/member-login-password-format-20261101');
const git=(...args)=>execFileSync('git',args,{encoding:'utf8'}).trim();
assert.equal(git('rev-parse','HEAD'),process.env.GITHUB_SHA);
const save=(name,data)=>writeFileSync(dir+'/'+name+'.json',JSON.stringify(data,null,2));
const api=async(path,init={})=>{
 const r=await fetch('https://api.cloudflare.com/client/v4/accounts/'+account+path,{...init,headers:{Authorization:'Bearer '+token,...(init.body instanceof FormData?{}:{'Content-Type':'application/json'}),...init.headers},signal:AbortSignal.timeout(60000)});
 const j=await r.json();assert(r.ok&&j.success,'Provider operation failed: '+r.status+' '+path+' '+JSON.stringify(j.errors));return j.result;
};
const current=async()=>{const d=await api('/workers/scripts/shift-core/deployments');return(d.deployments??d).toSorted((a,b)=>Date.parse(b.created_on)-Date.parse(a.created_on))[0];};
const getVersion=id=>api('/workers/workers/shift-core/versions/'+id+'?include=modules');
const promote=id=>api('/workers/scripts/shift-core/deployments',{method:'POST',body:JSON.stringify({strategy:'percentage',versions:[{version_id:id,percentage:100}],annotations:{'workers/message':'My Timber sign-in format correction '+process.env.GITHUB_RUN_ID}})});
const receiptFile=dir+'/release.json';
async function rollback(){
 if(!existsSync(receiptFile))return;
 const r=JSON.parse(readFileSync(receiptFile)),active=await current();
 if(active.versions?.length===1&&active.versions[0].percentage===100&&active.versions[0].version_id===r.stagedVersionId){
  await promote(r.originalVersionId);assertOwned(await current(),r.originalVersionId);r.rolledBack=true;
 }else{r.rollbackSkippedForNewerOwner=true;r.activeAtRollback=active.id;}
 save('release',r);
}
if(process.argv[2]==='rollback'){await rollback();process.exit(0);}
const allowed=['frontend/member/my-timber-preview.html','member-experience/session-state.mjs','tests/member-login-password-format.test.mjs','tests/member-auth-ui-v2.test.mjs','scripts/verify-member-login-password-format.cjs','release/member-login-format/patch.mjs','release/member-login-format/release.mjs','.github/workflows/member-login-format-release.yml'];
const changed=git('diff','--name-only',baseSource,'HEAD').split('\n').filter(Boolean).sort();
assert.deepEqual(changed,[...allowed].sort(),'Only the reviewed login repair and release proof may change');
assert.equal(git('diff','--name-only'),'','Source must be clean');
const compiledBefore=readFileSync(process.env.LOGIN_BASELINE_BUILD+'/worker.js','utf8'),compiledAfter=readFileSync(process.env.LOGIN_CANDIDATE_BUILD+'/worker.js','utf8');
const patch=deriveLoginPatch(compiledBefore,compiledAfter);
save('compiled-proof',{baseline:baseSource,source:process.env.GITHUB_SHA,beforeSHA256:patch.beforeSHA256,afterSHA256:patch.afterSHA256,exactInverse:true});
const oldRule="form.elements.password.pattern=registering?'(?=.*[A-Z])(?=.*[\\\\p{P}\\\\p{S}]).{10,}':'';",newRule="if(registering){form.elements.password.pattern='(?=.*[A-Z])(?=.*[\\\\p{P}\\\\p{S}]).{10,}';form.elements.password.minLength=10}else{form.elements.password.removeAttribute('pattern');form.elements.password.removeAttribute('minlength')}form.elements.password.placeholder=registering?'At least 10 characters':'Your password';",oldAttr=" autocomplete=\"current-password\" minlength=\"10\" placeholder=\"At least 10 characters\" required",newAttr=" autocomplete=\"current-password\" placeholder=\"Your password\" required";
const repair=html=>html.replace(oldRule,newRule).replace(oldAttr,newAttr);
const clean=html=>html.replace(/<script\b[^>]*\bsrc=["']https:\/\/static.cloudflareinsights.com[^"']*["'][\s\S]*?<\/script>/gi,'').replace(/<script\b[^>]*>[\s\S]*?window\.__CF\$cv\$params[\s\S]*?<\/script>/gi,'');
const fetchText=async path=>{const r=await fetch('https://shiftsometimber.co.uk'+path,{headers:{'Cache-Control':'no-cache'},signal:AbortSignal.timeout(30000)});assert.equal(r.status,200,path);return {text:clean(await r.text()),type:r.headers.get('content-type'),cache:r.headers.get('cache-control')};};
const protectedPaths=['/','/about','/knowledge','/api-adapter-v33d.js','/member-shell-v33g.js','/assets/member-experience/session.mjs'];
const captureProtected=async()=>{const rows={};for(const path of protectedPaths){const r=await fetchText(path);rows[path]={sha256:sha(r.text),type:r.type};}return rows;};
const originalDeployment=await current();assert.equal(originalDeployment.versions?.length,1);assert.equal(originalDeployment.versions[0].percentage,100);
const originalVersionId=originalDeployment.versions[0].version_id,original=await getVersion(originalVersionId);
assert(original.main_module&&original.modules?.length&&original.bindings?.length,'Complete serving version required');
const bundled=original.modules.find(m=>m.name==='worker.js');assert(bundled?.content_base64,'Serving bundle is required');
const originalCode=Buffer.from(bundled.content_base64,'base64');
if(originalCode.toString('utf8').includes(patch.newText)){
 execFileSync(process.execPath,['scripts/verify-member-login-password-format.cjs','--live'],{stdio:'inherit'});
 save('release',{at:new Date().toISOString(),source:process.env.GITHUB_SHA,alreadyServing:true,liveVerified:true,originalVersionId});process.exit(0);
}
const patched=applyLoginPatch(originalCode,patch);
writeFileSync('/tmp/member-login-format-patched.mjs',patched.code);execFileSync(process.execPath,['--check','/tmp/member-login-format-patched.mjs']);
const versions=await api('/workers/scripts/shift-core/versions'),latest=(versions.items??versions.versions??versions)[0];
assert.equal(latest.id,originalVersionId,'An unpromoted version is newer; refuse implicit asset/binding inheritance');
const settings=await api('/workers/scripts/shift-core/settings'),protectedBefore=await captureProtected(),loginBefore=await fetchText('/member-login.html');
assert(loginBefore.text.includes(oldRule),'Live sign-in does not match the reviewed failure');
const expectedLogin=repair(loginBefore.text);assert.notEqual(expectedLogin,loginBefore.text);
save('protected-before',protectedBefore);
const expectedModules=original.modules.map(m=>({...m,...(m===bundled?{content_base64:Buffer.from(patched.code).toString('base64')}:{})}));
const annotations={'workers/message':'Fix only My Timber login password validation; source '+process.env.GITHUB_SHA,'workers/tag':'login-format-'+process.env.GITHUB_RUN_ID};
const metadata={main_module:original.main_module,compatibility_date:settings.compatibility_date,compatibility_flags:settings.compatibility_flags||[],bindings:original.bindings.map(b=>({type:'inherit',name:b.name})),keep_assets:true,annotations};
for(const field of ['placement','limits','observability','logpush'])if(settings[field]!==undefined)metadata[field]=settings[field];
const form=new FormData();form.set('metadata',new Blob([JSON.stringify(metadata)],{type:'application/json'}),'metadata.json');
for(const module of expectedModules)form.set(module.name,new Blob([Buffer.from(module.content_base64,'base64')],{type:module.content_type||'application/javascript+module'}),module.name);
assert.equal((await current()).id,originalDeployment.id,'Serving deployment moved before staging');
const staged=await api('/workers/scripts/shift-core/versions?bindings_inheritance=strict',{method:'POST',body:form});
const receipt={at:new Date().toISOString(),source:process.env.GITHUB_SHA,run:process.env.GITHUB_RUN_ID,originalDeploymentId:originalDeployment.id,originalVersionId,stagedVersionId:staged.id,moduleProof:patched.proof,otherModulesPreserved:original.modules.length-1,assetsPreserved:true,bindingsPreserved:false,routeChanges:false,customerDataAccess:false,databaseWrites:false,communicationsSent:false,deployed:false};
save('release',receipt);
const verifyStored=async()=>{
 const stored=await getVersion(staged.id);
 const canonical=modules=>modules.map(m=>({name:m.name,content_type:m.content_type,sha256:sha(Buffer.from(m.content_base64,'base64'))})).sort((a,b)=>a.name.localeCompare(b.name));
 assert.deepEqual(canonical(stored.modules),canonical(expectedModules),'Every provider module must match the exact planned bytes');
 for(const field of ['main_module','compatibility_date','compatibility_flags','assets','usage_model','bindings'])assert.deepEqual(stored[field],original[field],'Serving configuration changed: '+field);
 return stored;
};
await verifyStored();receipt.bindingsPreserved=true;receipt.stagingVerified=true;save('release',receipt);
assertSettings(await api('/workers/scripts/shift-core/settings'),settings,annotations);
assert.equal((await current()).id,originalDeployment.id,'Serving deployment moved during staging');
assert.equal(process.env.LOGIN_FORMAT_PROMOTE,'ONLY_LOGIN_FORMAT','Explicit login-only release authority required');
try{
 receipt.promotionIntended=true;save('release',receipt);
 let promotionError;try{await promote(staged.id);}catch(e){promotionError=e;}
 const active=await current();assertOwned(active,staged.id);receipt.deployed=true;receipt.deploymentId=active.id;save('release',receipt);
 let loginAfter;for(let attempt=0;attempt<8;attempt++){loginAfter=await fetchText('/member-login.html');if(loginAfter.text===expectedLogin)break;await new Promise(resolve=>setTimeout(resolve,1500));}
 assert.equal(loginAfter.text,expectedLogin,'Only the two reviewed login format edits may appear in delivered HTML');
 for(const path of ['/member-login','/member-register','/member/dashboard']){
  const r=await fetchText(path);assert(r.text.includes(newRule)&&!r.text.includes(oldRule),path+' login repair absent');
 }
 assert.deepEqual(await captureProtected(),protectedBefore,'Protected public pages or application scripts changed');
 const stored=await verifyStored();assert.equal(stored.migration_tag,original.migration_tag,'Existing migration tag changed');
 assertSettings(await api('/workers/scripts/shift-core/settings'),settings,annotations);
 execFileSync(process.execPath,['scripts/verify-member-login-password-format.cjs','--live'],{stdio:'inherit'});
 assertOwned(await current(),staged.id);receipt.liveVerified=true;receipt.protectedPaths=protectedPaths;save('release',receipt);
 console.log('LOGIN_FORMAT_LIVE_VERIFIED '+JSON.stringify(receipt));
 if(promotionError)console.log('Provider ownership and live response independently confirmed after promotion response error.');
}catch(e){receipt.failure=String(e.message);save('release',receipt);await rollback();throw e;}
