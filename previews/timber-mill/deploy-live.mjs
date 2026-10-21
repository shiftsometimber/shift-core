import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {main,style,client} from './content.mjs';

const directory=path.dirname(fileURLToPath(import.meta.url)),out='timber-mill-live-evidence';
const account='9e5386dcf455be34c582d93f8bfc79e6',zone='66ec3268950adcfc837b7b8b2f8356ed',script='shift-timber-mill-presentation-20261021';
const preview='https://shift-timber-mill-preview-20261021.matobrien.workers.dev',live='https://shiftsometimber.co.uk',version='20261021-mill-v2-colours';
const approvedSource='46709814736969da302d007d169a24510d9bea6e',acceptedPreviewCommit='b84f91ae61cd67ba33fa3f636e09a5c4e8a6b6b8',acceptedPreviewRun=39686044395;
const patterns=['shiftsometimber.co.uk/shop*','www.shiftsometimber.co.uk/shop*'],routeRoot='/zones/'+zone+'/workers/routes',scriptRoot='/accounts/'+account+'/workers/scripts/'+script,serviceRoot='/accounts/'+account+'/workers/services/'+script;
mkdirSync(out,{recursive:true});
const save=(name,value)=>writeFileSync(path.join(out,name),typeof value==='string'?value:JSON.stringify(value,null,2)+'\n');
const read=name=>JSON.parse(readFileSync(path.join(out,name)));
const git=(...args)=>execFileSync('git',args,{encoding:'utf8'}).trim();
const allowed=new Set(['.github/workflows/timber-mill-preview-deploy-20261021.yml','.github/workflows/timber-mill-live-20261021.yml','previews/timber-mill/deploy-ci.mjs','previews/timber-mill/check-ci.cjs','previews/timber-mill/deploy-live.mjs','previews/timber-mill/check-live.cjs','previews/timber-mill/prior-release-receipt.json']);
assert.equal(git('merge-base',approvedSource,'HEAD'),approvedSource);
assert(git('diff','--name-only',approvedSource,'HEAD').split('\n').every(name=>allowed.has(name)),'Runtime differs from approved source');
assert.equal(git('hash-object','previews/timber-mill/content.mjs'),'bf07539966ad50e38336cfa250913919bfe3e54f');
assert.equal(git('hash-object','previews/timber-mill/worker.mjs'),'6dea2b731a371f80af0b3b665bd3a46882bb2cdc');
assert(process.env.CLOUDFLARE_API_TOKEN,'Existing deployment credential unavailable');

async function api(resource,options={},missing=false){
  const method=options.method||'GET';
  const json=options.body&&typeof options.body==='string'?JSON.parse(options.body):null;
  const permitted=method==='GET'&&(resource===routeRoot||resource===scriptRoot+'/settings'||resource===serviceRoot)||method==='PUT'&&resource===scriptRoot||method==='POST'&&resource===routeRoot&&patterns.includes(json?.pattern)&&json?.script===script||method==='DELETE'&&resource.startsWith(routeRoot+'/');
  assert(permitted,'API request outside this exact page release');
  const response=await fetch('https://api.cloudflare.com/client/v4'+resource,{...options,headers:{Authorization:'Bearer '+process.env.CLOUDFLARE_API_TOKEN,...options.headers},signal:AbortSignal.timeout(30000)});
  if(missing&&response.status===404)return null;
  const body=await response.json();if(!response.ok||!body.success)throw new Error('Cloudflare '+response.status+' '+JSON.stringify(body.errors||[]));return body.result;
}
const currentRoutes=()=>api(routeRoot);
const sorted=rows=>[...rows].sort((a,b)=>a.id.localeCompare(b.id));
const extract=(html,tag)=>html.replace(/<main\b[\s\S]*?<\/main>/g,'').match(new RegExp('<'+tag+'\\b[\\s\\S]*?</'+tag+'>','g'));

async function rollback(){
  if(!existsSync(out+'/activation-plan.json')){console.log('No Timber Mill route activation was started');return;}
  const plan=read('activation-plan.json');
  for(const row of [...plan].reverse()){
    assert(patterns.includes(row.pattern)&&row.before===null,'Unexpected rollback plan');
    const found=(await currentRoutes()).find(route=>route.pattern===row.pattern);
    if(!found)continue;
    assert.equal(found.script,script,'Refusing to replace another owner during rollback');
    await api(routeRoot+'/'+found.id,{method:'DELETE'});
  }
  const routes=await currentRoutes(),before=read('routes-before.json');
  for(const old of before)assert.deepEqual(routes.find(x=>x.id===old.id),old,'Unrelated route changed during rollback');
  assert(!routes.some(x=>x.script===script));save('rollback.json',{at:new Date().toISOString(),restored:true});console.log('TIMBER_MILL_OWNED_ROUTES_ROLLED_BACK');
}

if(process.argv[2]==='rollback')await rollback();else{
  assert.equal(process.argv[2],'release');
  assert(process.env.GITHUB_TOKEN,'Read-only acceptance lookup credential unavailable');
  const gate=await fetch('https://api.github.com/repos/shiftsometimber/shift-core/actions/runs/'+acceptedPreviewRun,{headers:{Authorization:'Bearer '+process.env.GITHUB_TOKEN,Accept:'application/vnd.github+json'},signal:AbortSignal.timeout(20000)});assert.equal(gate.status,200);
  const receipt=await gate.json();assert.equal(receipt.head_sha,acceptedPreviewCommit);assert.equal(receipt.conclusion,'success','All hosted preview checks must pass first');
  save('preview-acceptance.json',{run:acceptedPreviewRun,commit:acceptedPreviewCommit,conclusion:receipt.conclusion,url:receipt.html_url});
  const staged=await fetch(preview+'/shop',{signal:AbortSignal.timeout(25000)}),stagedHTML=await staged.text();assert.equal(staged.status,200);assert.equal(staged.headers.get('X-Shift-TimberMill-Version'),version);assert(stagedHTML.includes(main)&&stagedHTML.includes(style));assert.equal(await(await fetch(preview+'/shop/client.js')).text(),client);
  const original=await fetch(live+'/shop',{signal:AbortSignal.timeout(25000)});assert.equal(original.status,200);save('live-before.html',await original.text());
  const routes=await currentRoutes();save('routes-before.json',routes);
  assert(!routes.some(x=>x.script===script),'This exact service is already active; inspect its receipt instead of re-running');
  assert(!routes.some(x=>/^(?:https?:\/\/)?(?:www\.)?shiftsometimber\.co\.uk\/shop/.test(x.pattern)),'Unexpected existing shop route owner');
  const existing=await api(scriptRoot+'/settings',{},true);
  if(existing){
    const prior=JSON.parse(readFileSync(path.join(directory,'prior-release-receipt.json'),'utf8'));
    assert.equal(prior.approvedSource,approvedSource);assert.equal(prior.upload.id,script);assert.equal(prior.rollback.restored,true);
    const metadata=await api(serviceRoot);save('owned-service-before.json',metadata);
    assert.equal(metadata.default_environment.script.etag,prior.upload.etag,'Concurrent Worker content change');
    assert.equal(existing.bindings.length,1);assert(existing.bindings.some(b=>b.name==='CORE'&&b.type==='service'&&b.service==='shift-core'));
  }
  const form=new FormData();form.append('metadata',JSON.stringify({main_module:'previews/timber-mill/worker.mjs',bindings:[{type:'service',name:'CORE',service:'shift-core'}],compatibility_date:'2026-08-09',observability:{enabled:false},tags:['approved-timber-mill-20261021']}));
  for(const name of ['worker.mjs','content.mjs'])form.append('previews/timber-mill/'+name,new Blob([readFileSync(path.join(directory,name))],{type:'application/javascript+module'}),'previews/timber-mill/'+name);
  save('upload.json',await api(scriptRoot,{method:'PUT',body:form}));
  const plan=patterns.map(pattern=>({pattern,before:null}));save('activation-plan.json',plan);const applied=[];
  for(const pattern of patterns){
    assert(!(await currentRoutes()).some(x=>x.pattern===pattern),'Concurrent shop route change');
    const route=await api(routeRoot,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({pattern,script})});applied.push(route);save('activated-routes.json',applied);
  }
  let response,html;
  for(let attempt=0;attempt<8;attempt++){
    response=await fetch(live+'/shop',{signal:AbortSignal.timeout(25000)});html=await response.text();
    if(response.status===200&&response.headers.get('X-Shift-TimberMill-Version')===version)break;
    await new Promise(resolve=>setTimeout(resolve,2000));
  }
  assert.equal(response.status,200);assert.equal(response.headers.get('X-Shift-TimberMill-Version'),version);assert.equal(response.headers.get('X-Robots-Tag'),null);assert(html.includes(main)&&html.includes(style));assert(!html.includes('class="shop-test"'));assert.equal(await(await fetch(live+'/shop/client.js')).text(),client);save('live-after.html',html);
  const originalHTML=readFileSync(out+'/live-before.html','utf8');for(const tag of ['header','footer'])assert.deepEqual(extract(html,tag),extract(originalHTML,tag),'Shared '+tag+' changed');
  for(const host of ['shiftsometimber.co.uk','www.shiftsometimber.co.uk'])for(const scheme of ['http','https'])for(const pathname of ['/shop','/shop/','/shop.html']){
    const url=scheme+'://'+host+pathname+'?item=heavyweight-tee&colour=black',r=await fetch(url,{signal:AbortSignal.timeout(25000)});assert.equal(r.status,200);assert.equal(r.headers.get('X-Shift-TimberMill-Version'),version);assert.equal(r.headers.get('X-Robots-Tag'),null);const body=await r.text();assert(body.includes('alt="Heavyweight Tee in Black"'));
  }
  const after=await currentRoutes();save('routes-after.json',after);for(const old of routes)assert.deepEqual(after.find(x=>x.id===old.id),old,'Unrelated production route changed');
  assert.equal(after.length,routes.length+2);const owned=after.filter(x=>x.script===script),identity=row=>({id:row.id,pattern:row.pattern,script:row.script});assert.deepEqual(sorted(owned).map(identity),sorted(applied).map(identity));assert(owned.every(row=>row.request_limit_fail_open!==true));
  save('live.json',{url:live+'/shop',version,approvedSource,releaseCommit:git('rev-parse','HEAD'),previewRun:acceptedPreviewRun,ownedRoutes:applied,unrelatedRoutesPreserved:routes.length,at:new Date().toISOString()});console.log(JSON.stringify({live:live+'/shop',version,unrelatedRoutesPreserved:routes.length,ownedRoutes:2}));
}
