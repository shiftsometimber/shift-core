// Replace only this release's programme factory at zero traffic. Never alter
// another owner's deployment or module, and never retry an unknown upload.
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const state=JSON.parse(readFileSync('journey-shop-publication-state.json')),source=JSON.parse(readFileSync('source-release.json')),s=state.owners[0];
assert.equal(s.name,'shift-programme-member-20261023');
const auth=readFileSync('/Users/shiftsometimberltd/Library/Preferences/.wrangler/config/default.toml','utf8'),token=process.env.CLOUDFLARE_API_TOKEN||auth.match(/^oauth_token\s*=\s*"([^"\n]+)"/m)?.[1];assert(token);
const base='/accounts/9e5386dcf455be34c582d93f8bfc79e6/workers/';
async function cf(path,method='GET',body){const multi=body instanceof FormData,r=await fetch('https://api.cloudflare.com/client/v4'+base+path,{method,headers:{Authorization:'Bearer '+token,...(body&&!multi?{'Content-Type':'application/json'}:{})},body:multi?body:body?JSON.stringify(body):undefined,signal:AbortSignal.timeout(55000)}),j=await r.json();assert(r.ok&&j.success,JSON.stringify(j.errors));return j.result;}
const active=async()=>[...(await cf('scripts/'+s.name+'/deployments')).deployments].sort((a,b)=>b.created_on.localeCompare(a.created_on))[0];
const before=await active();assert.equal(before.id,s.currentDeployment);assert.equal(before.versions.find(v=>v.percentage===100).version_id,s.previousVersion);assert(before.versions.some(v=>v.version_id===s.versionId&&v.percentage===0),'Only an owned zero-traffic candidate may be replaced');
const getVersion=id=>cf('workers/'+s.name+'/versions/'+id+'?include=modules');
const hashes=modules=>Object.fromEntries(modules.map(m=>[m.name,createHash('sha256').update(Buffer.from(m.content_base64,'base64')).digest('hex')]));
const v=await getVersion(s.versionId);assert.deepEqual(hashes(v.modules),s.moduleHashes);
const settings=await cf('scripts/'+s.name+'/settings'),bundle=readFileSync('bundle-programme.mjs'),module=v.modules.find(m=>m.name==='journey-shop-release-20261031/programme.mjs');assert(module);module.content_base64=bundle.toString('base64');
const extra=v.bindings.filter(b=>b.name.startsWith('MY_TIMBER_PUBLIC_'));assert.equal(extra.length,3);
const metadata={main_module:v.main_module,compatibility_date:v.compatibility_date,compatibility_flags:v.compatibility_flags,bindings:[...v.bindings.filter(b=>!b.name.startsWith('MY_TIMBER_PUBLIC_')).map(b=>({type:'inherit',name:b.name})),...extra],keep_assets:true,annotations:{'workers/message':'Matt-approved Journey/Shop '+source.commit+'; retain serving baseline','workers/tag':'journey-shop-'+source.commit.slice(0,12)}};
for(const key of ['usage_model','limits','placement','cache_options','observability','tail_consumers','logpush']){const x=v[key]??v.resources?.script_runtime?.[key]??settings[key];if(x!==undefined)metadata[key]=x;}
const form=new FormData();form.set('metadata',new Blob([JSON.stringify(metadata)],{type:'application/json'}),'metadata.json');for(const m of v.modules)form.set(m.name,new Blob([Buffer.from(m.content_base64,'base64')],{type:m.content_type||'application/javascript+module'}),m.name);
assert(!s.pendingReplacement,'Inspect the previous upload outcome before retrying');
s.pendingReplacement={source:source.commit,attemptedAt:new Date().toISOString()};writeFileSync('journey-shop-publication-state.json',JSON.stringify(state,null,2)+'\n');
const uploaded=await cf('scripts/'+s.name+'/versions?bindings_inheritance=strict','POST',form);
state.replacedCandidates=[...(state.replacedCandidates||[]),{source:state.source,version:s.versionId,ordinaryTrafficPercent:0}];
s.versionId=uploaded.id;state.source=source.commit;s.bundleSHA256=createHash('sha256').update(bundle).digest('hex');s.moduleHashes=hashes(v.modules);delete s.pendingReplacement;writeFileSync('journey-shop-publication-state.json',JSON.stringify(state,null,2)+'\n');
const actual=await getVersion(s.versionId);assert.deepEqual(hashes(actual.modules),s.moduleHashes);const sorted=b=>[...b].sort((a,b)=>a.name.localeCompare(b.name));assert.deepEqual(sorted(actual.bindings),sorted(s.bindings));assert.equal(actual.compatibility_date,s.compatibilityDate);assert.deepEqual(actual.compatibility_flags,s.compatibilityFlags);assert.deepEqual(actual.assets??actual.resources?.script_runtime?.assets,s.assets);assert.equal((await active()).id,before.id);
s.stagedVerifiedAt=new Date().toISOString();writeFileSync('journey-shop-publication-state.json',JSON.stringify(state,null,2)+'\n');console.log('SCOPED_REPLACEMENT_VERIFIED',s.name,s.versionId,source.commit);
