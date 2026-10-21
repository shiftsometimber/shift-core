import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {main,style,client} from './content.mjs';

const directory=path.dirname(fileURLToPath(import.meta.url)), evidence='timber-mill-ci-evidence';
const account='9e5386dcf455be34c582d93f8bfc79e6',zone='66ec3268950adcfc837b7b8b2f8356ed';
const script='shift-timber-mill-preview-20261021',origin='https://'+script+'.matobrien.workers.dev';
const version='20261021-mill-v2-colours',source='46709814736969da302d007d169a24510d9bea6e';
mkdirSync(evidence,{recursive:true});
const save=(name,value)=>writeFileSync(path.join(evidence,name),typeof value==='string'?value:JSON.stringify(value,null,2)+'\n');
const git=(...args)=>execFileSync('git',args,{encoding:'utf8'}).trim();
assert.equal(git('merge-base',source,'HEAD'),source,'Approved source must remain an ancestor');
const allowed=new Set(['.github/workflows/timber-mill-preview-deploy-20261021.yml','previews/timber-mill/deploy-ci.mjs','previews/timber-mill/check-ci.cjs']);
assert(git('diff','--name-only',source,'HEAD').split('\n').every(name=>allowed.has(name)),'Unexpected source changes');
assert.equal(git('hash-object','previews/timber-mill/content.mjs'),'bf07539966ad50e38336cfa250913919bfe3e54f');
assert(process.env.CLOUDFLARE_API_TOKEN,'Existing deployment credential is unavailable');

async function api(resource,options={}){
  assert(resource==='/zones/'+zone+'/workers/routes'||resource==='/accounts/'+account+'/workers/scripts/'+script||resource==='/accounts/'+account+'/workers/scripts/'+script+'/settings');
  assert(!options.method||options.method==='GET'||(options.method==='PUT'&&resource==='/accounts/'+account+'/workers/scripts/'+script),'Only this preview worker can be written');
  const response=await fetch('https://api.cloudflare.com/client/v4'+resource,{...options,headers:{Authorization:'Bearer '+process.env.CLOUDFLARE_API_TOKEN,...options.headers},signal:AbortSignal.timeout(30000)});
  const body=await response.json();
  if(!response.ok||!body.success)throw new Error('Cloudflare '+response.status+' '+JSON.stringify(body.errors||[]));
  return body.result;
}
const before=await fetch(origin+'/shop',{signal:AbortSignal.timeout(25000)});
assert.equal(before.status,200);assert(['20261021-mill-v1',version].includes(before.headers.get('X-Shift-TimberMill-Version')),'Unknown preview owner');
const beforeHTML=await before.text();save('preview-before.html',beforeHTML);
const routes=await api('/zones/'+zone+'/workers/routes');save('routes-before.json',routes);
assert(!routes.some(route=>route.script===script),'Preview worker must own zero production routes');
const settings=await api('/accounts/'+account+'/workers/scripts/'+script+'/settings');
assert.equal(settings.bindings.length,1);assert(settings.bindings.some(b=>b.name==='CORE'&&b.type==='service'&&b.service==='shift-core'));
const form=new FormData();
form.append('metadata',JSON.stringify({main_module:'previews/timber-mill/worker.mjs',bindings:[{type:'service',name:'CORE',service:'shift-core'}],compatibility_date:'2026-08-09',observability:{enabled:false},tags:['timber-mill-preview-only-20261021']}));
for(const name of ['worker.mjs','content.mjs'])form.append('previews/timber-mill/'+name,new Blob([readFileSync(path.join(directory,name))],{type:'application/javascript+module'}),'previews/timber-mill/'+name);
if(before.headers.get('X-Shift-TimberMill-Version')===version&&beforeHTML.includes(main)&&beforeHTML.includes(style)&&await(await fetch(origin+'/shop/client.js')).text()===client){
  save('upload.json',{alreadyPresent:true,version,at:new Date().toISOString()});
}else save('upload.json',await api('/accounts/'+account+'/workers/scripts/'+script,{method:'PUT',body:form}));
let page,html;
for(let attempt=0;attempt<8;attempt++){
  page=await fetch(origin+'/shop',{signal:AbortSignal.timeout(25000)});html=await page.text();
  if(page.status===200&&page.headers.get('X-Shift-TimberMill-Version')===version)break;
  await new Promise(resolve=>setTimeout(resolve,2000));
}
assert.equal(page.status,200);assert.equal(page.headers.get('X-Shift-TimberMill-Version'),version);assert.equal(page.headers.get('X-Robots-Tag'),'noindex, nofollow');
assert(html.includes(main));assert(html.includes(style));assert(!html.includes('class="shop-test"'));
assert.equal(await(await fetch(origin+'/shop/client.js')).text(),client);
save('preview-after.html',html);
const after=await api('/zones/'+zone+'/workers/routes');save('routes-after.json',after);
assert.deepEqual([...after].sort((a,b)=>a.id.localeCompare(b.id)),[...routes].sort((a,b)=>a.id.localeCompare(b.id)),'Production route inventory changed');
save('staged.json',{url:origin+'/shop',version,approvedSource:source,releaseCommit:git('rev-parse','HEAD'),contentBlob:git('hash-object','previews/timber-mill/content.mjs'),productionRoutesOwned:0,productionRoutesUnchanged:true,at:new Date().toISOString()});
console.log(JSON.stringify({preview:origin+'/shop',version,productionRoutesOwned:0,productionRoutesUnchanged:true}));
