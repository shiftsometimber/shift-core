// Prove exact-current public member document delivery without touching production.
import {readFileSync,writeFileSync} from 'node:fs';
import {preparePrecompiledMemberCandidate} from './performance-precompiled-documents-prepare.mjs';
import {gunzipSync} from 'node:zlib';
import {SourceTextModule,SyntheticModule,createContext} from 'node:vm';
import assert from 'node:assert/strict';
import {createHash,webcrypto} from 'node:crypto';
const digest=b=>createHash('sha256').update(b).digest('hex');
const raw=readFileSync('performance-precompiled-current-source-20261103.json'),capture=JSON.parse(raw);assert(capture.verified);
const sourceOwners=capture.owners.map(a=>{
 const bytes=readFileSync(a.sourceFile),j=JSON.parse(a.sourceFile.endsWith('.gz')?gunzipSync(bytes):bytes),v=j.version||j;
 assert.equal(v.id,a.version,'Captured immutable source changed');
 const moduleHashes=Object.fromEntries(v.modules.map(m=>[m.name,digest(Buffer.from(m.content_base64,'base64'))]));
 assert.deepEqual(moduleHashes,a.moduleHashes);
 return {name:a.name,version:v,deployment:{id:a.currentDeployment,versions:a.distribution}};
}),owners=new Map(sourceOwners.map(o=>[o.name,o]));
const publicSources=JSON.parse(readFileSync('performance-public-screen-sources.json'));
const routeOwners={
 '/member/dashboard?view=app':'shift-hq-member-comms-20261023',
 '/member/dashboard':'shift-hq-member-comms-20261023',
 '/member/dashboard?timber=support':'shift-hq-member-comms-20261023',
 '/member/dashboard?timber=stuff':'shift-hq-member-comms-20261023',
 '/member/grub':'shift-programme-member-20261023',
 '/member/fit':'shift-programme-member-20261023'
};
let scenario='anonymous';
const databaseCalls=[],publicReads=[],serviceCalls=[],instances=new Map();
const allowedSessionSQL='SELECT u.*,s.id session_id,s.expires_at,s.revoked_at FROM user_sessions s JOIN users u ON u.id=s.user_id WHERE s.token_hash=?';
const reservedSessionSQL='SELECT u.email,m.source,s.expires_at,s.revoked_at FROM user_sessions s JOIN users u ON u.id=s.user_id JOIN member_status m ON m.user_id=u.id WHERE s.token_hash=?';
assert(capture.verified);
const fakeUsers={
 reservedA:{id:910005,email:'my-timber-v6-dan@example.invalid',source:'my_timber_release_test_v6',session_id:810005,expires_at:'2099-01-01T00:00:00.000Z',revoked_at:null},
 reservedB:{id:910006,email:'my-timber-v6-lee@example.invalid',source:'my_timber_release_test_v6',session_id:810006,expires_at:'2099-01-01T00:00:00.000Z',revoked_at:null},
 memberA:{id:910001,email:'precompile-a@example.invalid',first_name:'STATIC_PRIVATE_SENTINEL_A',last_name:'Offline fixture A',session_id:810001,expires_at:'2099-01-01T00:00:00.000Z',revoked_at:null},
 memberB:{id:910002,email:'precompile-b@example.invalid',first_name:'STATIC_PRIVATE_SENTINEL_B',last_name:'Offline fixture B',session_id:810002,expires_at:'2099-01-01T00:00:00.000Z',revoked_at:null},
 expired:{id:910003,email:'expired@example.invalid',first_name:'STATIC_PRIVATE_SENTINEL_EXPIRED',session_id:810003,expires_at:'2000-01-01T00:00:00.000Z',revoked_at:null},
 revoked:{id:910004,email:'revoked@example.invalid',first_name:'STATIC_PRIVATE_SENTINEL_REVOKED',session_id:810004,expires_at:'2099-01-01T00:00:00.000Z',revoked_at:'2026-01-01T00:00:00.000Z'}
};
const mockDB={prepare(sql){
 databaseCalls.push({scenario,sql});
 const stmt={bind(){return stmt},async first(){assert([allowedSessionSQL,reservedSessionSQL].includes(sql),'Unexpected account lookup: '+sql);return fakeUsers[scenario]?{source:'offline-ordinary-member',...fakeUsers[scenario]}:null},
 async all(){throw Error('No account-data reads permitted')},
 async run(){assert.equal(sql,'UPDATE user_sessions SET last_used_at=? WHERE id=?');return{meta:{changes:1}}}};
 return stmt;
}};
const voidConsole={log(){},warn(){},error(){}};
async function instance(name){
 if(instances.has(name))return instances.get(name);
 const owner=owners.get(name);assert(owner,'Unexpected service '+name);
 const files=new Map(owner.version.modules.map(m=>[m.name,Buffer.from(m.content_base64,'base64').toString()])),loaded=new Map();
 const context=createContext({
  performance,process:{env:{},nextTick:process.nextTick,version:process.version},
  Request,Response,Headers,URL,URLSearchParams,TextEncoder,TextDecoder,Uint8Array,ArrayBuffer,
  crypto:webcrypto,atob,btoa,Buffer,console:voidConsole,setTimeout,clearTimeout,setInterval,clearInterval,
  ReadableStream,TransformStream,AbortController,AbortSignal,Blob,DecompressionStream,CompressionStream,
  fetch:async(input,init)=>{
   const req=new Request(input,init),u=new URL(req.url),key=u.pathname+u.search;
   assert.equal(u.origin,'https://projectshift.pages.dev','Unexpected external dependency');
   assert.equal(req.method,'GET');assert(!u.pathname.startsWith('/v1/'));
   assert(!req.headers.has('Authorization'),'Do not forward bearer authorisation to a public template');
   const saved=publicSources[key];assert(saved,'Unpinned public source '+key);
   publicReads.push({scenario,key});return new Response(saved.html,{status:saved.status,headers:saved.headers});
  },
  HTMLRewriter:class{on(){return this}transform(r){return r}}
 });
 function mod(path){if(loaded.has(path))return loaded.get(path);assert(files.has(path),'Missing module '+path);const m=new SourceTextModule(files.get(path),{context,identifier:path});loaded.set(path,m);return m;}
 const root=mod(owner.version.main_module);
 await root.link(async(spec,ref)=>{
  if(spec.startsWith('node:')||(!spec.startsWith('.')&&!files.has(spec))){
   const ns=await import(spec),keys=Object.keys(ns);return new SyntheticModule(keys,function(){for(const k of keys)this.setExport(k,ns[k])},{context});
  }
  return mod(new URL(spec,'https://worker/'+ref.identifier).pathname.slice(1));
 });
 await root.evaluate();
 const env=Object.fromEntries(owner.version.bindings.filter(b=>b.type==='plain_text').map(b=>[b.name,b.text]));
 // The rollout switch is an inherited secret_text binding: its value is deliberately not read.
 // Compile the true branch only; exact public live HTML must match, and the runtime delegates the false branch unchanged.
 if(owner.version.bindings.some(b=>b.name==='MY_TIMBER_V6_RELEASE_ENABLED'&&b.type==='secret_text'))env.MY_TIMBER_V6_RELEASE_ENABLED='true';
 env.DB=mockDB;
 assert(env.WORK_V1_ENABLED!=='true'&&env.PROGRAMME_V1_ENABLED!=='true','Dynamic dashboard injection requires a separate implementation');
 for(const b of owner.version.bindings.filter(b=>b.type==='service'))env[b.name]={fetch:async req=>{
  serviceCalls.push({scenario,from:name,to:b.service,path:new URL(req.url).pathname});return(await instance(b.service)).fetch(req);
 }};
 const i={fetch:req=>root.namespace.default.fetch(req,env,{waitUntil(){}})};instances.set(name,i);return i;
}
const cookies=[
 ['anonymous',''],
 ['reservedA','sst_session=offline-reserved-A'],
 ['reservedB','sst_session=offline-reserved-B; shift_app_view=1'],
 ['invalid','sst_session=offline-invalid'],
 ['memberA','sst_session=offline-active-A'],
 ['memberB','sst_session=offline-active-B; shift_app_view=1'],
 ['expired','sst_session=offline-expired; shift_app_view=1'],
 ['revoked','sst_session=offline-revoked'],
 ['memberA','sst_session=offline-active-A; shift_app_view=0']
];
const report={at:new Date().toISOString(),kind:'EXACT_CURRENT_MEMBER_DOCUMENT_PRECOMPILATION_PROOF',productionMutations:0,
 sourceBaselineSHA256:digest(raw),sourceOwners:sourceOwners.map(o=>({name:o.name,main:o.version.main_module,version:o.deployment.versions.find(v=>v.percentage===100).version_id,moduleHashes:Object.fromEntries(o.version.modules.map(m=>[m.name,digest(Buffer.from(m.content_base64,'base64'))]))})),
 routes:[],databaseCalls,publicReads,serviceCalls,limitations:['Offline account fixtures are source proof, not a signed-in production acceptance.','Actual Safari/iPhone and production speed qualification remain required.']};
const manifest={format:1,proof:report.kind,verified:true,requiredRuntimeFlags:{MY_TIMBER_V6_RELEASE_ENABLED:'true'},createdAt:report.at,sourceOwners:report.sourceOwners,documents:{}};
function uiCookie(cookie,app){const base=cookie.split(';').map(s=>s.trim()).filter(s=>s&&!s.startsWith('shift_app_view=')).join('; ');return [base,app?'shift_app_view=1':cookie.includes('shift_app_view=0')?'shift_app_view=0':''].filter(Boolean).join('; ');}
for(const [path,name]of Object.entries(routeOwners)){
 const variants={};
 for(const app of [false,true]){
  let baselineBody,baselineHeaders;const rows=[];
  for(const [label,originalCookie]of cookies){
   const cookie=uiCookie(originalCookie,app);scenario=label;
   const r=await(await instance(name)).fetch(new Request('https://shiftsometimber.co.uk'+path,{headers:cookie?{Cookie:cookie}:{}}));
   assert.equal(r.status,200);const html=await r.text();assert.match(r.headers.get('content-type'),/text\/html/);assert(!html.includes('STATIC_PRIVATE_SENTINEL_'));assert.match(r.headers.get('Cache-Control'),/no-store/);
   const stable=Object.fromEntries([...r.headers].filter(([k])=>!['date','cf-ray','server','server-timing','alt-svc','nel','report-to','connection','transfer-encoding','content-length','content-encoding','etag','last-modified'].includes(k)));
   if(baselineBody===undefined){baselineBody=html;baselineHeaders=stable;}else{assert.equal(digest(html),digest(baselineBody),'Account-dependent markup '+path+' app='+app+' '+label);assert.deepEqual(stable,baselineHeaders);}
   rows.push({scenario:label,appView:app,sha256:digest(html),bytes:Buffer.byteLength(html)});
  }
  const live=await fetch('https://shiftsometimber.co.uk'+path,{headers:{'Accept-Encoding':'identity',...(app?{Cookie:'shift_app_view=1'}:{})},signal:AbortSignal.timeout(30000)}),liveBody=await live.text();assert.equal(live.status,200);assert.equal(digest(liveBody),digest(baselineBody),'Exact live HTML advanced '+path+' app='+app);
  variants[app?'app':'base']={html:baselineBody,headers:baselineHeaders,sha256:digest(baselineBody)};
  report.routes.push({path,appView:app,sha256:digest(baselineBody),bytes:Buffer.byteLength(baselineBody),accountComparisons:rows,liveMatched:true});
  console.log('EXACT_CURRENT_DOCUMENT_VARIANT_PROVED',path,'app='+app,digest(baselineBody));
 }
 const e={...variants.base,owner:name};if(variants.app.sha256!==e.sha256||JSON.stringify(variants.app.headers)!==JSON.stringify(e.headers))e.appView=variants.app;manifest.documents[path]=e;
}
assert(!databaseCalls.some(c=>/INSERT|DELETE/.test(c.sql)));
const originalCalls=serviceCalls.length,originalDB=databaseCalls.length;
const runtime=readFileSync('performance-precompiled-documents-runtime.mjs','utf8');
const prepared=[];
for(const name of ['shift-programme-member-20261023','shift-hq-member-comms-20261023']){
 const owner=owners.get(name),candidate=preparePrecompiledMemberCandidate(owner.version,manifest,name,{runtime});
 prepared.push({name,previousVersion:candidate.previousVersion,previousMain:candidate.previousMain,main:candidate.main_module,addedModuleHashes:candidate.addedModuleHashes,changedOriginalModules:candidate.changedOriginalModules});
 owner.version={...owner.version,main_module:candidate.main_module,modules:candidate.modules};
}
instances.clear();
const candidateRows=[];
for(const [path,name]of Object.entries(routeOwners))for(const app of [false,true])for(const [label,originalCookie]of cookies){
 const cookie=uiCookie(originalCookie,app);scenario=label;
 const r=await(await instance(name)).fetch(new Request('https://shiftsometimber.co.uk'+path,{headers:cookie?{Cookie:cookie}:{}}));
 assert.equal(r.status,200);const html=await r.text(),entry=app&&manifest.documents[path].appView?manifest.documents[path].appView:manifest.documents[path];assert.equal(digest(html),entry.sha256,'Assembled UI variant differs');
 assert.equal(r.headers.get('X-My-Timber-Document-Delivery'),'precompiled-20261103');assert.equal(r.headers.get('Cache-Control'),'no-store, private');
 candidateRows.push({path,appView:app,scenario:label,sha256:digest(html)});
}
assert.equal(serviceCalls.length,originalCalls,'Compiled document still calls an upstream service');
assert.equal(databaseCalls.length,originalDB,'Compiled document still reads account data');
report.assembledCandidate={verified:true,prepared,routes:candidateRows,serviceCalls:0,databaseCalls:0,productionMutations:0};

report.verified=true;report.memberRecordsRead=0;report.realSessionMutations=0;
writeFileSync('performance-precompiled-documents-proof.json',JSON.stringify(report,null,2)+'\n');
writeFileSync('performance-precompiled-documents.json',JSON.stringify(manifest)+'\n');
console.log('PRECOMPILED_DOCUMENT_PROOF_PASSED',report.routes.length,'routes',cookies.length,'states each','DB fixture operations',databaseCalls.length);