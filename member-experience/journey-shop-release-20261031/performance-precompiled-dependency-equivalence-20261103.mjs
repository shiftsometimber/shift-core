// Scoped equivalence for read-only public-service dependencies. Owned app targets remain strictly pinned.
import assert from 'node:assert/strict';import {createHash,webcrypto} from 'node:crypto';
import {SourceTextModule,SyntheticModule,createContext} from 'node:vm';
const hash=b=>createHash('sha256').update(b).digest('hex');
export async function provePrivatePassThrough(version,anchor){
 assert.equal(version.main_module,anchor.main,'Dependency entrypoint changed');
 assert(version.main_module.startsWith('aeo-geo/'),'Unrecognised public dependency wrapper');
 const modules=new Map(version.modules.map(m=>[m.name,m])),actual=Object.fromEntries(version.modules.filter(m=>!m.name.startsWith('aeo-geo/')).map(m=>[m.name,hash(Buffer.from(m.content_base64,'base64'))])),expected=Object.fromEntries(Object.entries(anchor.moduleHashes).filter(([name])=>!name.startsWith('aeo-geo/')));
 assert.deepEqual(actual,expected,'Private/non-AEO source graph changed; full requalification required');
 const calls=[],sentinel=new Response('private handler sentinel',{status:418}),original={fetch(request,env,ctx){calls.push({request,env,ctx});return sentinel;}};
 const context=createContext({Request,Response,Headers,URL,URLSearchParams,TextEncoder,TextDecoder,Uint8Array,ArrayBuffer,Buffer,atob,btoa,crypto:webcrypto,ReadableStream,TransformStream,CompressionStream,DecompressionStream,Blob,performance,console:{log(){},warn(){},error(){}},fetch(){throw Error('Public wrapper touched an external dependency for a private request')}});
 const loaded=new Map();
 function mod(path){
  if(loaded.has(path))return loaded.get(path);
  if(!path.startsWith('aeo-geo/')){
   assert(modules.has(path));const m=new SyntheticModule(['default'],function(){this.setExport('default',original)},{context,identifier:path});loaded.set(path,m);return m;
  }
  assert(modules.has(path),'Unpinned module '+path);const m=new SourceTextModule(Buffer.from(modules.get(path).content_base64,'base64').toString(),{context,identifier:path});loaded.set(path,m);return m;
 }
 const root=mod(version.main_module);await root.link(async(spec,ref)=>{assert(!spec.startsWith('node:'),'Unexpected native import in public wrapper');return mod(new URL(spec,'https://worker/'+ref.identifier).pathname.slice(1))});await root.evaluate();
 const rows=[];
 for(const path of ['/member/dashboard?view=app','/member/dashboard','/member/dashboard?timber=support','/member/dashboard?timber=stuff','/member/grub','/member/fit','/v1/me','/v1/profile','/v1/life-back/journey'])for(const method of ['GET','HEAD','POST'])for(const cookie of ['','sst_session=equivalence-invalid']){
  const req=new Request('https://shiftsometimber.co.uk'+path,{method,headers:cookie?{Cookie:cookie}:{}}),env=new Proxy({},{get(){throw Error('Public wrapper accessed private environment')}}),ctx={};
  const r=await root.namespace.default.fetch(req,env,ctx);assert.equal(r,sentinel,'Public wrapper modified private response');const call=calls.at(-1);assert.equal(call.request,req);assert.equal(call.env,env);assert.equal(call.ctx,ctx);
  rows.push({path,method,cookie:cookie?'synthetic':'none',exactPassThrough:true});
 }
 return {verified:true,version:version.id,previousDependencyVersion:anchor.version,at:new Date().toISOString(),privateModuleCount:Object.keys(expected).length,privateModuleGraphSHA256:hash(JSON.stringify(Object.entries(actual).sort(([a],[b])=>a.localeCompare(b)))),changedPublicModules:version.modules.filter(m=>m.name.startsWith('aeo-geo/')&&hash(Buffer.from(m.content_base64,'base64'))!==anchor.moduleHashes[m.name]).map(m=>m.name),rows,productionWrites:0};
}
