// Verify browser payloads emitted by the exact production Wrangler build before deployment.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),vm=require('node:vm'),crypto=require('node:crypto'),{execFileSync}=require('node:child_process');
function compiledGuidance(bundle){
 const marker='// public-tool-guidance.mjs',at=bundle.indexOf(marker);assert(at>=0,'Production build has no guidance module');
 const end=bundle.indexOf('\n// ',at+marker.length),module=bundle.slice(at+marker.length,end<0?undefined:end);
 const server=vm.createContext({__name:(target,value)=>Object.defineProperty(target,'name',{value,configurable:true})});
 vm.runInContext(module+'\nthis.transform=improveToolGuidance;',server,{timeout:1000});
 assert.equal(typeof server.transform,'function');return server.transform;
}
function verifyBrowserPayload(html,pathname){
 const matches=[...html.matchAll(/<script data-tool-guidance-client>([\s\S]*?)<\/script>/g)];assert.equal(matches.length,1,'Exactly one guidance client required: '+pathname);
 const callbacks={},state={form:{dataset:{},querySelector:()=>null,querySelectorAll:()=>[],addEventListener:(name,fn)=>callbacks[name]=fn,checkValidity:()=>true},result:{style:{setProperty:(name,value)=>state.display=value},querySelector:()=>null,append:()=>{}},panels:{},tabs:['nhs','scenarios','gp'].map(tab=>({dataset:{tab},disabled:false})),print:{textContent:'Print GP report',disabled:false}};
 const node=()=>({dataset:{},append:()=>{},textContent:'',href:''});
 const document={readyState:'complete',getElementById:id=>id==='nhsEligibility'?{textContent:'Needs a previously saved browser profile'}:id==='gpReport'?{textContent:'No legacy questionnaire profile'}:id.startsWith('tab-')?(state.panels[id]||=( {hidden:false} )):id.endsWith('Form')?state.form:id.endsWith('R')?state.result:null,createElement:node,querySelector:()=>({}),querySelectorAll:selector=>selector==='button'?[state.print]:state.tabs};
 const browser=vm.createContext({document,MutationObserver:class{observe(){}},queueMicrotask:fn=>fn()});
 // No server bundler helper exists in this browser context.
 vm.runInContext(matches[0][1],browser,{timeout:1000});
 if(pathname==='/decision-centre'){assert(state.tabs.every(t=>t.disabled));assert(state.print.disabled);assert(Object.values(state.panels).every(p=>p.hidden));}
 else{assert.equal(state.display,'none');assert.equal(typeof callbacks.submit,'function');callbacks.submit();assert.equal(state.display,'block');callbacks.input();assert.equal(state.display,'none');}
 return {path:pathname,passed:true,standaloneBrowserScript:true,noBundlerGlobals:true,pendingAndStaleResultHidden:pathname!=='/decision-centre',missingProfileControlsDisabled:pathname==='/decision-centre'};
}
async function main(){
 const dir=path.resolve(process.argv[2]||'b1-runtime-release/tool-guidance-build'),build=path.join(dir,'worker');fs.mkdirSync(build,{recursive:true});
 const output=execFileSync(process.execPath,['node_modules/wrangler/bin/wrangler.js','deploy','--config','wrangler.jsonc','--dry-run','--outdir',build],{encoding:'utf8',maxBuffer:8e6});
 fs.writeFileSync(path.join(dir,'wrangler-dry-run.txt'),output);
 const files=fs.readdirSync(build).filter(f=>/\.(?:m?js)$/.test(f));const worker=files.map(f=>({file:f,source:fs.readFileSync(path.join(build,f),'utf8')})).find(f=>f.source.includes('// public-tool-guidance.mjs'));assert(worker,'Actual production Worker bundle required');
 const transform=compiledGuidance(worker.source),fixture=path.join(dir,'pages');fs.mkdirSync(fixture,{recursive:true});
 const {paths}=require('./verify-tool-page-schema.cjs'),checks=[];
 for(const pathname of paths){
  const response=await fetch('https://shiftsometimber.co.uk'+pathname,{headers:{'Cache-Control':'no-cache'},signal:AbortSignal.timeout(30000)});assert.equal(response.status,200);
  const html=transform(await response.text(),pathname);checks.push(verifyBrowserPayload(html,pathname));
  fs.writeFileSync(path.join(fixture,pathname.slice(1).replaceAll('/','-')+'.html'),html);
 }
 const receipt={kind:'actual_production_build_browser_payload_proof',source:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),checkedAt:new Date().toISOString(),buildMode:'Exact production Wrangler configuration with --dry-run; no deployment',workerSha256:crypto.createHash('sha256').update(worker.source).digest('hex'),workerBytes:Buffer.byteLength(worker.source),checks,productionWritesPerformed:false};
 fs.writeFileSync(path.join(dir,'build-proof.json'),JSON.stringify(receipt,null,2));console.log(JSON.stringify(receipt));
}
module.exports={compiledGuidance,verifyBrowserPayload};
if(require.main===module)main().catch(error=>{console.error('::error::Production-built guidance FAILED: '+error.stack);process.exitCode=1;});
