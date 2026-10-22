import assert from 'node:assert/strict';import{readFileSync,writeFileSync,mkdirSync,existsSync}from'node:fs';import{execFileSync}from'node:child_process';import{createHash}from'node:crypto';
import{version,assetPath,suffix}from'./worker.mjs';
const script='shift-mytimber-menu-20261022',tag='approved-mytimber-menu-20261022',account='9e5386dcf455be34c582d93f8bfc79e6',zone='66ec3268950adcfc837b7b8b2f8356ed',root='/accounts/'+account+'/workers/scripts/'+script,routeRoot='/zones/'+zone+'/workers/routes',out='my-timber-menu-live-evidence';
const patterns=['shiftsometimber.co.uk'+assetPath+'*','www.shiftsometimber.co.uk'+assetPath+'*'],live='https://shiftsometimber.co.uk',preview='https://'+script+'.matobrien.workers.dev',dir=new URL('./',import.meta.url);
mkdirSync(out,{recursive:true});const save=(name,data)=>writeFileSync(out+'/'+name,typeof data==='string'?data:JSON.stringify(data,null,2)+'\n'),read=name=>JSON.parse(readFileSync(out+'/'+name)),git=(...args)=>execFileSync('git',args,{encoding:'utf8'}).trim(),hash=text=>createHash('sha256').update(text).digest('hex'),sort=routes=>[...routes].sort((a,b)=>a.id.localeCompare(b.id));
assert.equal(git('hash-object','previews/about-presentation/menu-client.mjs'),'63effabbf1dfb826ec8037af1b75642448581756','Approved Menu source changed');
assert(process.env.CLOUDFLARE_API_TOKEN);
async function api(resource,options={},missing=false){
 const method=options.method||'GET',body=typeof options.body==='string'?JSON.parse(options.body):null;
 assert(method==='GET'&&[routeRoot,root+'/settings'].includes(resource)||method==='PUT'&&resource===root||method==='POST'&&resource===root+'/subdomain'||method==='POST'&&resource===routeRoot&&patterns.includes(body?.pattern)&&body?.script===script||method==='DELETE'&&resource.startsWith(routeRoot+'/'),'Outside Menu release boundary');
 const response=await fetch('https://api.cloudflare.com/client/v4'+resource,{...options,headers:{Authorization:'Bearer '+process.env.CLOUDFLARE_API_TOKEN,...options.headers},signal:AbortSignal.timeout(30000)});
 if(missing&&response.status===404)return null;const data=await response.json();assert(response.ok&&data.success,'Cloudflare '+response.status+' '+JSON.stringify(data.errors));return data.result;
}
async function getAsset(origin){const response=await fetch(origin+assetPath+'?v=3',{signal:AbortSignal.timeout(30000)});assert.equal(response.status,200);return{response,text:await response.text()};}
async function ready(origin){let result;for(let n=0;n<8;n++){result=await getAsset(origin);if(result.response.headers.get('X-Shift-MyTimber-Menu')===version)break;await new Promise(resolve=>setTimeout(resolve,1500));}assert.equal(result.response.headers.get('X-Shift-MyTimber-Menu'),version);return result;}
async function rollback(){
 if(!existsSync(out+'/activation-plan.json')){console.log('No Menu public activation started');return;}
 const before=read('routes-before.json');for(const pattern of patterns){assert(!before.some(row=>row.pattern===pattern));const row=(await api(routeRoot)).find(row=>row.pattern===pattern);if(row){assert.equal(row.script,script,'Another owner changed the asset route');await api(routeRoot+'/'+row.id,{method:'DELETE'});}}
 const after=await api(routeRoot);for(const row of before)assert.deepEqual(after.find(x=>x.id===row.id),row);save('rollback.json',{ownedRoutesRestored:true,unrelatedRoutesPreserved:true,at:new Date().toISOString()});console.log('MYTIMBER_MENU_OWNED_ROUTES_RESTORED');
}
const command=process.argv[2];
if(command==='rollback')await rollback();
else if(command==='stage'){
 assert(process.env.GITHUB_TOKEN);const r=await fetch('https://api.github.com/repos/shiftsometimber/shift-core/actions/runs/39746566122',{headers:{Authorization:'Bearer '+process.env.GITHUB_TOKEN,Accept:'application/vnd.github+json'},signal:AbortSignal.timeout(20000)});assert.equal(r.status,200);const accepted=await r.json();assert.equal(accepted.head_sha,'4b05123832d1155c2b7115bb00a738289c8c783c');assert.equal(accepted.conclusion,'success');
 save('approved-preview.json',{run:39746566122,commit:accepted.head_sha,menuBlob:'63effabbf1dfb826ec8037af1b75642448581756',approval:'Matt: Mega, go live - then go to next now!, 22 October 2026 08:31 BST. Newsroom and My Timber Menu; no subsequent Menu hold found.'});
 const before=await api(routeRoot);save('routes-before.json',before);assert(!before.some(row=>row.script===script||patterns.includes(row.pattern)),'A scoped Menu route is already active');
 const original=await getAsset(live);save('asset-before.js',original.text);save('asset-before-headers.json',Object.fromEntries(original.response.headers));
 const settings=await api(root+'/settings',{},true);if(settings){assert(settings.tags?.includes(tag));assert.equal(settings.bindings.length,1);assert(settings.bindings.some(b=>b.name==='CORE'&&b.type==='service'&&b.service==='shift-core'));}
 const form=new FormData();form.append('metadata',JSON.stringify({main_module:'previews/my-timber-menu/worker.mjs',bindings:[{type:'service',name:'CORE',service:'shift-core'}],compatibility_date:'2026-08-09',observability:{enabled:false},tags:[tag]}));
 form.append('previews/my-timber-menu/worker.mjs',new Blob([readFileSync(new URL('worker.mjs',dir))],{type:'application/javascript+module'}),'previews/my-timber-menu/worker.mjs');
 form.append('previews/about-presentation/menu-client.mjs',new Blob([readFileSync(new URL('../about-presentation/menu-client.mjs',dir))],{type:'application/javascript+module'}),'previews/about-presentation/menu-client.mjs');
 save('upload.json',await api(root,{method:'PUT',body:form}));await api(root+'/subdomain',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({enabled:true,previews_enabled:false})});
 const candidate=await ready(preview);assert.equal(candidate.text,original.text+suffix,'Existing welcome asset bytes changed');save('staged-asset.js',candidate.text);assert.deepEqual(sort(await api(routeRoot)),sort(before));
 save('staged.json',{url:preview+'/member/dashboard',origin:preview,version,commit:git('rev-parse','HEAD'),productionRoutesOwned:0,sourceSha256:hash(original.text),candidateSha256:hash(candidate.text),existingAssetBytesPreserved:true,at:new Date().toISOString()});console.log('APPROVED_MENU_STAGED_WITH_EXISTING_WELCOME_ASSET_INTACT');
}else if(command==='activate'){
 const accepted=read('accepted.json'),staged=read('staged.json');assert.equal(accepted.production,false);assert.equal(accepted.browserPasses.length,4);assert.equal(accepted.commit,staged.commit);assert.deepEqual(sort(await api(routeRoot)),sort(read('routes-before.json')));save('staging-accepted.json',accepted);
 assert.equal((await getAsset(live)).text,readFileSync(out+'/asset-before.js','utf8'),'Welcome asset changed since staging');
 save('activation-plan.json',patterns);const owned=[];for(const pattern of patterns){owned.push(await api(routeRoot,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({pattern,script})}));save('owned-routes.json',owned);}
 const published=await ready(live);assert.equal(published.text,readFileSync(out+'/asset-before.js','utf8')+suffix);save('published-asset.js',published.text);
 const before=read('routes-before.json'),after=await api(routeRoot);for(const row of before)assert.deepEqual(after.find(x=>x.id===row.id),row);assert.equal(after.length,before.length+2);assert.deepEqual(sort(after.filter(row=>row.script===script)),sort(owned));save('routes-after.json',after);
 save('live.json',{url:live+'/member/dashboard',asset:live+assetPath,version,commit:git('rev-parse','HEAD'),ownedRoutes:owned,allPriorRoutesPreserved:before.length,existingAssetBytesPreserved:true,noMemberRouteOrAPIChanged:true,at:new Date().toISOString()});console.log('APPROVED_MENU_ASSET_LIVE');
}else throw Error('Use stage, activate or rollback');
