import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {assertOwned,sha} from './patch.mjs';
const dir='evidence/member-login-format';mkdirSync(dir,{recursive:true});
const pin=Object.freeze({
 source:'e44e549447e8ca360ce5924aa012fb11c47a1c52',run:'41335856790',
 originalDeploymentId:'8fb72f2c-904a-4172-bd01-0a0078a6dcdb',
 originalVersionId:'627e9a17-b1c4-4b7a-9701-a00b7670be8f',
 stagedVersionId:'69b2fc94-393f-451c-8662-198ec87f6c8b',
 beforeSHA256:'9efe65d9679d413dcb5f7c6647e6d0edd19e4b7030e03c123a5af9fdd473052f',
 afterSHA256:'3e1e091eb1d91a57a3a0ee92d2e83b44395015dd0f553b4e096223a2c65cd84a',
 otherModules:74
});
const account=process.env.CLOUDFLARE_ACCOUNT_ID,token=process.env.CLOUDFLARE_API_TOKEN;
assert.equal(account,'9e5386dcf455be34c582d93f8bfc79e6');assert(token,'Existing release credential required');
assert.equal(process.env.GITHUB_REF,'refs/heads/fix/member-login-password-format-20261101');
const git=(...args)=>execFileSync('git',args,{encoding:'utf8'}).trim();
assert.equal(git('rev-parse','HEAD'),process.env.GITHUB_SHA);
const save=(name,data)=>writeFileSync(dir+'/'+name+'.json',JSON.stringify(data,null,2));
const api=async(path,init={})=>{
 const r=await fetch('https://api.cloudflare.com/client/v4/accounts/'+account+path,{...init,headers:{Authorization:'Bearer '+token,'Content-Type':'application/json',...init.headers},signal:AbortSignal.timeout(60000)});
 const j=await r.json();assert(r.ok&&j.success,'Provider operation failed: '+r.status+' '+path+' '+JSON.stringify(j.errors));return j.result;
};
const current=async()=>{const d=await api('/workers/scripts/shift-core/deployments');return(d.deployments??d).toSorted((a,b)=>Date.parse(b.created_on)-Date.parse(a.created_on))[0];};
const version=id=>api('/workers/workers/shift-core/versions/'+id+'?include=modules');
const promote=id=>api('/workers/scripts/shift-core/deployments',{method:'POST',body:JSON.stringify({strategy:'percentage',versions:[{version_id:id,percentage:100}],annotations:{'workers/message':'My Timber sign-in format correction '+process.env.GITHUB_RUN_ID}})});
const receiptFile=dir+'/release.json';
async function rollback(){
 if(!existsSync(receiptFile))return;
 const r=JSON.parse(readFileSync(receiptFile)),active=await current();
 if(active.versions?.length===1&&active.versions[0].percentage===100&&active.versions[0].version_id===pin.stagedVersionId){
  await promote(pin.originalVersionId);assertOwned(await current(),pin.originalVersionId);r.rolledBack=true;
 }else{r.rollbackSkippedForNewerOwner=true;r.activeAtRollback=active.id;}
 save('release',r);
}
if(process.argv[2]==='rollback'){await rollback();process.exit(0);}
const support=['.github/workflows/member-login-format-release.yml','release/member-login-format/release.mjs','release/member-login-format/patch.mjs','scripts/verify-member-login-password-format.cjs'];
const sinceStaging=git('diff','--name-only',pin.source,'HEAD').split('\n').filter(Boolean);
assert(sinceStaging.every(path=>support.includes(path)),'Application source changed after successful staging');
assert.equal(git('diff','--name-only'),'','Source must be clean');
const original=await version(pin.originalVersionId),staged=await version(pin.stagedVersionId);
assert.equal(original.modules.length,pin.otherModules+1);assert.equal(staged.modules.length,original.modules.length);
const byName=modules=>new Map(modules.map(m=>[m.name,m]));
const originalMap=byName(original.modules),stagedMap=byName(staged.modules);assert.equal(stagedMap.size,originalMap.size);
for(const [name,module]of originalMap){
 const target=stagedMap.get(name);assert(target,'Missing serving module: '+name);assert.equal(target.content_type,module.content_type);
 const before=sha(Buffer.from(module.content_base64,'base64')),after=sha(Buffer.from(target.content_base64,'base64'));
 if(name==='worker.js'){assert.equal(before,pin.beforeSHA256);assert.equal(after,pin.afterSHA256);}
 else assert.equal(after,before,'Unrelated serving module changed: '+name);
}
for(const field of ['main_module','compatibility_date','compatibility_flags','assets','usage_model','bindings'])assert.deepEqual(staged[field],original[field],'Serving configuration changed: '+field);
assert.equal(staged.annotations?.['workers/tag'],'login-format-'+pin.run,'Exact owned staged version required');
assert.equal(staged.annotations?.['workers/message'],'Fix only My Timber login password validation; source '+pin.source);
const settings=await api('/workers/scripts/shift-core/settings');
const oldRule="form.elements.password.pattern=registering?'(?=.*[A-Z])(?=.*[\\\\p{P}\\\\p{S}]).{10,}':'';",newRule="if(registering){form.elements.password.pattern='(?=.*[A-Z])(?=.*[\\\\p{P}\\\\p{S}]).{10,}';form.elements.password.minLength=10}else{form.elements.password.removeAttribute('pattern');form.elements.password.removeAttribute('minlength')}form.elements.password.placeholder=registering?'At least 10 characters':'Your password';",oldAttr=" autocomplete=\"current-password\" minlength=\"10\" placeholder=\"At least 10 characters\" required",newAttr=" autocomplete=\"current-password\" placeholder=\"Your password\" required";
const repair=html=>html.replace(oldRule,newRule).replace(oldAttr,newAttr);
const clean=html=>html.replace(/<script\b[^>]*\bsrc=["']https:\/\/static.cloudflareinsights.com[^"']*["'][\s\S]*?<\/script>/gi,'').replace(/<script\b[^>]*>[\s\S]*?window\.__CF\$cv\$params[\s\S]*?<\/script>/gi,'');
const fetchText=async path=>{const r=await fetch('https://shiftsometimber.co.uk'+path,{headers:{'Cache-Control':'no-cache'},signal:AbortSignal.timeout(30000)});assert.equal(r.status,200,path);return{text:clean(await r.text()),type:r.headers.get('content-type')};};
const protectedPaths=['/','/about','/knowledge','/api-adapter-v33d.js','/member-shell-v33g.js','/assets/member-experience/session.mjs'];
const captureProtected=async()=>{const rows={};for(const path of protectedPaths){const r=await fetchText(path);rows[path]={sha256:sha(r.text),type:r.type};}return rows;};
const active=await current();
if(active.versions?.length===1&&active.versions[0].version_id===pin.stagedVersionId&&active.versions[0].percentage===100){
 const delivered=await fetchText('/member-login.html');assert(delivered.text.includes(newRule)&&!delivered.text.includes(oldRule));
 save('release',{source:pin.source,releaseSource:process.env.GITHUB_SHA,alreadyServing:true,httpVerified:true,browserVerification:'independent Mac pending',...pin});process.exit(0);
}
assertOwned(active,pin.originalVersionId);const beforeDeploymentId=active.id;
const beforeProtected=await captureProtected(),loginBefore=await fetchText('/member-login.html');
assert(loginBefore.text.includes(oldRule),'Live page does not match the reviewed login defect');
const expectedLogin=repair(loginBefore.text);assert.notEqual(expectedLogin,loginBefore.text);
const entryPaths=['/member-login','/member-register','/member/dashboard','/member/dashboard.html','/my-timber-preview'];
const expectedEntries={};for(const path of entryPaths){const before=await fetchText(path);expectedEntries[path]=repair(before.text);}
const receipt={at:new Date().toISOString(),source:pin.source,releaseSource:process.env.GITHUB_SHA,run:process.env.GITHUB_RUN_ID,
 originalDeploymentId:beforeDeploymentId,stagedOriginalDeploymentId:pin.originalDeploymentId,originalVersionId:pin.originalVersionId,stagedVersionId:pin.stagedVersionId,
 stagedRun:pin.run,stagingVerified:true,otherModulesPreserved:pin.otherModules,assetsPreserved:true,bindingsPreserved:true,
 routeChanges:false,customerDataAccess:false,databaseWrites:false,communicationsSent:false,deployed:false};
save('release',receipt);save('protected-before',beforeProtected);
assert.equal(process.env.LOGIN_FORMAT_PROMOTE,'ONLY_LOGIN_FORMAT');
try{
 assert.equal((await current()).id,beforeDeploymentId,'Serving owner moved before promotion');
 assert.deepEqual(await api('/workers/scripts/shift-core/settings'),settings,'Settings changed before promotion');
 receipt.promotionIntended=true;save('release',receipt);
 let promotionError;try{await promote(pin.stagedVersionId);}catch(e){promotionError=e;}
 const deployed=await current();assertOwned(deployed,pin.stagedVersionId);receipt.deployed=true;receipt.deploymentId=deployed.id;save('release',receipt);
 let after;for(let attempt=0;attempt<8;attempt++){after=await fetchText('/member-login.html');if(after.text===expectedLogin)break;await new Promise(resolve=>setTimeout(resolve,1500));}
 assert.equal(after.text,expectedLogin,'Only the two reviewed login format edits may appear in the delivered document');
 for(const path of entryPaths){const r=await fetchText(path);assert.equal(r.text,expectedEntries[path],path+' differs from its own approved before-image and exact login repair');}
 assert.deepEqual(await captureProtected(),beforeProtected,'Protected public pages or application scripts changed');
 assert.deepEqual(await api('/workers/scripts/shift-core/settings'),settings,'Serving settings changed after promotion');
 const stored=await version(pin.stagedVersionId);assert.equal(stored.migration_tag,original.migration_tag,'Migration tag changed');
 assertOwned(await current(),pin.stagedVersionId);receipt.httpVerified=true;receipt.browserVerification='independent Mac pending';save('release',receipt);
 console.log('LOGIN_FORMAT_HTTP_VERIFIED '+JSON.stringify(receipt));
 if(promotionError)console.log('Provider ownership and live response independently confirmed after a promotion response error.');
}catch(e){receipt.failure=String(e.message);save('release',receipt);await rollback();throw e;}
