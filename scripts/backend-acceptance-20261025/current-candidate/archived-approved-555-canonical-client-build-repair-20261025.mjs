import fs from 'node:fs';import assert from 'node:assert/strict';import {createHash} from 'node:crypto';import {execFileSync} from 'node:child_process';
import vm from 'node:vm';
import {liveAppClient} from '/Users/shiftsometimberltd/SST/release-four-assertion-repair-20261025/app-layout-live.mjs';
import {memberImageViewerRuntime} from '/Users/shiftsometimberltd/SST/release-four-assertion-repair-20261025/shift-coach/member-image-viewer.mjs';
import {fitActiveEditAsset} from '/Users/shiftsometimberltd/SST/release-four-assertion-repair-20261025/shift-coach/fit-active-edit.mjs';
const root='/Users/shiftsometimberltd/SST/release-recovery-evidence-20261024',C='/Users/shiftsometimberltd/SST/release-four-assertion-repair-20261025',L=root+'/core-local-promotion-20261025';
const source='55585365538e22a5893e930bbaf70b8c99069d76',sha=x=>createHash('sha256').update(x).digest('hex'),git=(...a)=>execFileSync('git',['--no-optional-locks',...a],{cwd:C,encoding:'utf8'}).trim();
assert.equal(git('rev-parse','HEAD'),source);assert.equal(git('diff','--name-only','HEAD','--'),'');
const native=fitActiveEditAsset(liveAppClient)+memberImageViewerRuntime;assert.equal(sha(native),'95a6d37c781137b01fdc79bcd2d81b4f09f48e82c489e141705a04927de36585');
const originalPath=root+'/release-final-takeover-approved-runtime-bundle/worker.js',original=fs.readFileSync(originalPath,'utf8');assert.equal(sha(original),'c5996373bf39c09a73628a438938e69db286c320ac0f94c226a6743ef445218d');
for(const declaration of ['var liveAppClient = appClient + memberDesignClient;','var memberImageViewerRuntime ='])assert.equal(original.split(declaration).length,2);
assert.equal(original.split('export {').length,2);
const insertion='// Preserve exact native client serialization from frozen source '+source+'.\n'+'liveAppClient = '+JSON.stringify(liveAppClient)+';\nmemberImageViewerRuntime = '+JSON.stringify(memberImageViewerRuntime)+';\n';
const repaired=original.replace('export {',insertion+'export {');assert.equal(repaired.replace(insertion,''),original);
const repairPath=L+'/canonical-client-runtime/worker.js';fs.mkdirSync(L+'/canonical-client-runtime',{recursive:true});fs.writeFileSync(repairPath,repaired);
fs.writeFileSync(L+'/canonical-client-runtime/native-layout.mjs',native);
const section=(name)=>{const token='// '+name+'\n',start=original.indexOf(token);assert(start>=0);const end=original.indexOf('\n// ',start+token.length);assert(end>start);return original.slice(start,end);};
const appSection=section('app-layout-live.mjs'),fitSection=section('shift-coach/fit-active-edit.mjs').replace('import assert2 from "node:assert/strict";','');
const make=repair=>{const c={Request,Response,Headers,URL,assert2:assert,__name:x=>x,appClient:'original-fixture-client',memberDesignClient:'',memberImageViewerRuntime:'original-fixture-viewer',webToolsAsset:'/__fixture-tools.mjs',webToolsClient:'unchanged tools fixture',appPresentation:h=>h,memberDesignDocument:h=>h};vm.createContext(c);vm.runInContext(appSection+'\n'+fitSection+(repair?'\n'+insertion:''),c);return c;};
const a=make(false),b=make(true),results=[];
for(const path of ['/assets/my-timber-layout.mjs','/assets/my-timber-layout.mjs?source-proof=1']){
 const request=new Request('https://shiftsometimber.co.uk'+path),raw=await b.withAppLayout(request,new Response('fallback',{status:404})),response=await b.withFitActiveEdit(request,raw),body=await response.text();
 assert.equal(response.status,200);assert.equal(body,native);assert.match(response.headers.get('content-type'),/javascript/);assert.match(response.headers.get('cache-control'),/no-store/);assert.equal(response.headers.get('x-content-type-options'),'nosniff');
 results.push({path,method:'GET',passed:true,compiledHandlersExecuted:true,repairedSHA256:sha(body),nativeSHA256:sha(native),privacyHeadersPreserved:true});
}
for(const [method,path]of [['GET','/assets/my-timber-layout-launch.mjs'],['GET','/unrelated-compiled-asset.mjs'],['GET','/__fixture-tools.mjs'],['HEAD','/assets/my-timber-layout.mjs'],['POST','/assets/my-timber-layout.mjs']]){
 const run=async c=>{const request=new Request('https://shiftsometimber.co.uk'+path,{method});return c.withFitActiveEdit(request,await c.withAppLayout(request,new Response('untouched fallback',{status:404,headers:{'content-type':'text/plain','x-original':'preserved'}})));};
 const before=await run(a),after=await run(b);assert.equal(after.status,before.status);assert.equal(await after.text(),await before.text());assert.deepEqual([...after.headers],[...before.headers]);results.push({path,method,passed:true,unaffectedResponseIdentical:true});
}
assert.equal(sha(fs.readFileSync(L+'/live-independent-layout-after.mjs')),'0a4dfa8605720e54b0febb847291a6738b44a75965123f883927ee0b1ecece05');
execFileSync(process.execPath,['--input-type=module','--check'],{input:repaired,stdio:['pipe','pipe','pipe']});
 assert.equal(git('rev-parse','HEAD'),source);assert.equal(git('diff','--name-only','HEAD','--'),'');
 const proof={ok:true,source,sourceTree:git('rev-parse','HEAD^{tree}'),kind:'SOURCE_EQUIVALENT_CANONICAL_CLIENT_SERIALIZATION_BUILD_REPAIR',cause:'Bundler changes function.toString serialization; independent presentation explicitly requires original native byte hash.',baseBundleSHA256:sha(original),repairedBundleSHA256:sha(repaired),repairedBundleBytes:Buffer.byteLength(repaired),nativeClientSHA256:sha(native),nativeClientBytes:Buffer.byteLength(native),insertedBytes:Buffer.byteLength(insertion),insertedSHA256:sha(insertion),entirePriorCompiledBundleUnchanged:true,exactInverseToQualifiedBundle:true,onlyBindingsReplaced:['liveAppClient','memberImageViewerRuntime'],appFeaturesChanged:false,independentWorkerWrites:0,productionWrites:0,originalBrokenRuntimeReproducedInProduction:true,baselineBrokenAssetSHA256:'0a4dfa8605720e54b0febb847291a6738b44a75965123f883927ee0b1ecece05',testMethod:'Execute unchanged emitted app-layout and Fit response functions plus exact generated native literal assignments in isolated VM; no Worker bootstrap, network or production resources. Full local workerd bootstrap failed on unchanged baseline and is not claimed passed.',tests:results,at:new Date().toISOString()};
 fs.writeFileSync(L+'/canonical-client-build-repair-proof.json',JSON.stringify(proof,null,2)+'\n');console.log(JSON.stringify(proof));
