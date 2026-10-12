import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {mkdtempSync,readFileSync,writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,dirname} from 'node:path';
import {createRequire} from 'node:module';

export const TREATMENT_ASSETS=Object.freeze([
 {path:'/assets/member-experience/treatment.mjs',type:/javascript/},
 {path:'/assets/member-experience/treatment.css',type:/text\/css/},
 {path:'/treatment-sw.js',type:/javascript/}
]);
const hash=s=>createHash('sha256').update(s).digest('hex');
export function assertTreatmentAsset(path,response,expected){
 const asset=TREATMENT_ASSETS.find(a=>a.path===path);assert(asset,'Unlisted treatment asset');
 assert.equal(typeof expected.body,'string');assert(expected.body.length,'Compiled asset is empty');assert.equal(typeof response.body,'string');
 assert.equal(expected.status,200);assert.match(expected.contentType,asset.type);assert.match(expected.cacheControl,/no-store/);
 assert.equal(response.status,200,path);assert.match(response.contentType,asset.type);assert.match(response.cacheControl,/no-store/);
 assert.equal(response.body,expected.body,path+' compiled source mismatch');
 return {path,status:response.status,pass:true,sha256:hash(response.body),expectedSha256:hash(expected.body)};
}
export async function compiledTreatmentAssets({cwd=process.cwd()}={}){
 const source=execFileSync('git',['rev-parse','HEAD'],{cwd,encoding:'utf8'}).trim();assert.match(source,/^[a-f0-9]{40}$/);
 const directory=mkdtempSync(join(tmpdir(),'shift-treatment-compiled-'));
 const env={...process.env,WRANGLER_SEND_METRICS:'false'};delete env.CLOUDFLARE_API_TOKEN;delete env.CLOUDFLARE_ACCOUNT_ID;delete env.GITHUB_TOKEN;
 const log=execFileSync(process.execPath,[join(cwd,'node_modules/wrangler/bin/wrangler.js'),'deploy','--dry-run','--config',join(cwd,'wrangler.jsonc'),'--outdir',directory],{cwd,env,encoding:'utf8',maxBuffer:8e6});
 writeFileSync(join(directory,'compile.log'),log);
 const scriptPath=join(directory,'worker.js'),bundleSha256=hash(readFileSync(scriptPath));
 const require=createRequire(join(cwd,'node_modules/wrangler/package.json'));
 const {Miniflare,convertV4MiniflareOptions}=require('miniflare');
 const options={modules:true,modulesRoot:dirname(scriptPath),scriptPath,compatibilityDate:'2026-08-09',compatibilityFlags:['nodejs_compat'],d1Databases:['DB'],bindings:{MEMBER_EXPERIENCE_V1_ENABLED:'true',MY_TREATMENT_ENABLED:'true'},outboundService:()=>new Response('External requests are disabled in this local asset proof',{status:503})};
 const mf=new Miniflare(typeof convertV4MiniflareOptions==='function'?convertV4MiniflareOptions(options):options),assets={};
 try{
  for(const {path} of TREATMENT_ASSETS){const r=await mf.dispatchFetch('https://shiftsometimber.co.uk'+path);const value={status:r.status,contentType:r.headers.get('content-type')||'',cacheControl:r.headers.get('cache-control')||'',body:await r.text()};assertTreatmentAsset(path,value,value);assets[path]=value;}
 }finally{await mf.dispose();}
 assert.equal(execFileSync('git',['rev-parse','HEAD'],{cwd,encoding:'utf8'}).trim(),source,'Source moved during compiled asset proof');
 return {source,bundleSha256,directory,assets,productionResources:0,scope:'Exact production-configured dry-run Worker responses on isolated local workerd; no source-string substitution'};
}
