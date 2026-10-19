const fs=require('node:fs'),crypto=require('node:crypto'),assert=require('node:assert/strict'),{execFileSync}=require('node:child_process');
const repo='/Users/shiftsometimberltd/SST/bloods-social-20261019',proof='/Users/shiftsometimberltd/SST/bloods-social-20261019-evidence';
const origin='https://api.cloudflare.com/client/v4',account='/accounts/9e5386dcf455be34c582d93f8bfc79e6',script=account+'/workers/scripts/shift-bloods-public';
const token=fs.readFileSync('/Users/shiftsometimberltd/Library/Preferences/.wrangler/config/default.toml','utf8').match(/^oauth_token\s*=\s*"([^"]+)"/m)[1];
const expectedCommit='5622b3eb1e0bb1211c9e8f2a442e1caeab11672e',expectedDeployment='3283e816-635d-4915-beeb-2ad05c18fd07';
const originals={'shift-bloods-marketing-worker.mjs':'8a7e94006e92030734effe82d3d756a7e66a2152','shift-bloods-public.mjs':'868129058f266319147d344e3ab40318180d901c'},candidates={...originals,'shift-bloods-marketing-worker.mjs':'a300dfac43f90dd4d40b42e2ad36e1577d844b0a'};
const hash=b=>crypto.createHash('sha256').update(b).digest('hex'),blob=b=>crypto.createHash('sha1').update('blob '+b.length+'\0').update(b).digest('hex');
async function api(path,method='GET',body){const r=await fetch(origin+path,{method,headers:{Authorization:'Bearer '+token,...(body&&!(body instanceof FormData)?{'Content-Type':'application/json'}:{})},...(body?{body:body instanceof FormData?body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(30000)});const j=await r.json();if(!r.ok||!j.success)throw Error('Provider '+r.status+' '+JSON.stringify(j.errors));return j.result;}
async function source(){const r=await fetch(origin+script,{headers:{Authorization:'Bearer '+token},signal:AbortSignal.timeout(30000)});assert(r.ok,'Provider source unavailable');const form=await r.formData(),out={};for(const [n,x]of form)out[n]=Buffer.from(typeof x==='string'?x:await x.arrayBuffer());return out;}
function exactModules(modules,expected){assert.deepEqual(Object.keys(modules).sort(),Object.keys(expected).sort());for(const [n,b]of Object.entries(modules))assert.equal(blob(b),expected[n],'Unexpected source '+n);}
function settingsValue(s){const x={...s};delete x.annotations;return x;}
function uploadForm(modules,settings){const f=new FormData(),m={...settingsValue(settings),main_module:'shift-bloods-marketing-worker.mjs',observability:{enabled:false}};f.append('metadata',JSON.stringify(m));for(const [name,bytes]of Object.entries(modules))f.append(name,new Blob([bytes],{type:'application/javascript+module'}),name);return f;}
async function active(){const d=await api(script+'/deployments');assert(d.deployments?.length,'No current deployment');const a=d.deployments[0];assert.equal(a.versions.length,1);assert.equal(a.versions[0].percentage,100);return a;}
async function ownedRoutes(){const z=await api('/zones?name=shiftsometimber.co.uk');assert.equal(z.length,1);return(await api('/zones/'+z[0].id+'/workers/routes')).filter(x=>x.script==='shift-bloods-public').sort((a,b)=>a.id.localeCompare(b.id));}
function save(n,x){fs.writeFileSync(proof+'/'+n,JSON.stringify(x,null,2)+'\n',{mode:0o600});}
(async()=>{
 assert.equal(execFileSync('git',['-C',repo,'rev-parse','HEAD'],{encoding:'utf8'}).trim(),expectedCommit);
 assert.equal(execFileSync('git',['-C',repo,'status','--porcelain','--untracked-files=no'],{encoding:'utf8'}),'');
 const remote=execFileSync('git',['-C',repo,'ls-remote','origin','refs/heads/feat/shift-bloods-public-20261018'],{encoding:'utf8',timeout:30000}).split(/\s/)[0];assert.equal(remote,expectedCommit,'Source branch changed');
 fs.mkdirSync(proof,{recursive:true,mode:0o700});assert(!fs.existsSync(proof+'/upload-intent.json'),'Prior upload must be reconciled, never replayed');
 const before=await active();assert.equal(before.id,expectedDeployment,'Serving router changed');
 const settings=await api(script+'/settings');assert.equal(settings.compatibility_date,'2026-08-09');assert.deepEqual(settings.bindings,[{name:'PAGES_ORIGIN',type:'plain_text',text:'https://projectshift.pages.dev'}]);
 const old=await source();exactModules(old,originals);const next={};for(const n of Object.keys(candidates))next[n]=fs.readFileSync(repo+'/'+n);exactModules(next,candidates);
 const routes=await ownedRoutes();assert.equal(routes.length,8,'Expected original eight routes');
 save('before.json',{at:new Date().toISOString(),source:expectedCommit,deployment:before,settings:settingsValue(settings),routes,modules:Object.fromEntries(Object.entries(old).map(([n,b])=>[n,{gitBlob:blob(b),sha256:hash(b)}]))});
 for(const [n,b]of Object.entries(old))fs.writeFileSync(proof+'/rollback-'+n,b,{mode:0o600});
 // Repeat mutable baseline checks immediately before the one bounded upload.
 assert.equal((await active()).id,before.id);assert.deepEqual(await ownedRoutes(),routes);assert.deepEqual(settingsValue(await api(script+'/settings')),settingsValue(settings));exactModules(await source(),originals);
 save('upload-intent.json',{at:new Date().toISOString(),source:expectedCommit,expectedPreviousDeployment:before.id,allowedPaths:Object.keys(candidates),runtimeDiff:'Twitter card insertion on four public indexable Bloods pages only',routesChanged:false,pagesAssetsChanged:false,coreChanged:false,privacyChanged:false});
 const uploaded=await api(script,'PUT',uploadForm(next,settings));save('upload-result.json',{at:new Date().toISOString(),id:uploaded.id,deployment_id:uploaded.deployment_id});
 const after=await active();save('after-deployment.json',after);
 try{
  assert.notEqual(after.id,before.id);exactModules(await source(),candidates);assert.deepEqual(settingsValue(await api(script+'/settings')),settingsValue(settings));assert.deepEqual(await ownedRoutes(),routes);
  save('provider-proof.json',{at:new Date().toISOString(),pass:true,source:expectedCommit,previousDeployment:before.id,deployment:after.id,version:after.versions[0].version_id,percentage:100,sourceModulesExact:true,settingsPreserved:true,eightRoutesPreserved:true,pagesAssetsChanged:false,coreChanged:false,homepageChanged:false,privacyChanged:false,liveBrowserAcceptance:'pending'});
  console.log(JSON.stringify({pass:true,source:expectedCommit,deployment:after.id,version:after.versions[0].version_id,sourceModulesExact:true,settingsPreserved:true,routesPreserved:routes.length,liveBrowserAcceptance:'pending'}));
 }catch(e){
  if((await active()).id!==after.id)throw Error('Verification failed; serving version changed, so unowned rollback prohibited: '+e.message);
  const rollback=await api(script,'PUT',uploadForm(old,settings));exactModules(await source(),originals);save('owned-rollback.json',{at:new Date().toISOString(),reason:e.message,result:{id:rollback.id,deployment_id:rollback.deployment_id},sourceRestored:true});throw e;
 }
})().catch(e=>{console.error(e.message);process.exitCode=1;});
