import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFileSync,lstatSync,realpathSync} from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';

// Capture native functions during static module initialisation, before the
// existing synchronous historical comparison frames update builtin bindings.
// Qualification never accepts or calls a supplied reader.
const nativeExecFileSync=execFileSync,nativeReadFileSync=readFileSync,nativeLstatSync=lstatSync,nativeRealpathSync=realpathSync;
const nativeBufferEquals=Function.prototype.call.bind(Buffer.prototype.equals),nativeBufferFrom=Buffer.from.bind(Buffer);

const SHA=/^[a-f0-9]{40}$/;
const sorted=values=>[...values].sort();
const oid=bytes=>createHash('sha1').update('blob '+bytes.length+'\0').update(bytes).digest('hex');
const exactKeys=(object,keys,label)=>assert.deepEqual(Object.keys(object).sort(),keys.slice().sort(),label);
let activeQualification=null;
const contractKey=c=>createHash('sha256').update(JSON.stringify(c)).digest('hex');
const safePath=value=>{
 assert.equal(typeof value,'string','Repository path required');
 assert(value.length>0&&!value.startsWith('/')&&!value.includes('\\')&&!value.split('/').some(p=>p===''||p==='.'||p==='..'),'Unsafe repository path: '+value);
 return value;
};
const list=values=>{
 assert(Array.isArray(values),'Exact path list required');
 values.forEach(safePath);assert.equal(new Set(values).size,values.length,'Duplicate registered path');return sorted(values);
};
function repository(cwd){
 const overrides=Object.keys(process.env).filter(k=>/^GIT_(?:DIR|WORK_TREE|INDEX_FILE|OBJECT_DIRECTORY|ALTERNATE_OBJECT_DIRECTORIES|COMMON_DIR|CONFIG|CONFIG_PARAMETERS|CONFIG_COUNT|CONFIG_KEY_|CONFIG_VALUE_)/.test(k));
 assert.equal(overrides.length,0,'Git source overrides are forbidden: '+overrides.join(','));
 let commands=0;
 const run=(...args)=>{commands++;return nativeExecFileSync('git',['--no-optional-locks','--no-replace-objects',...args],{cwd,encoding:'utf8',maxBuffer:64*1024*1024,stdio:['ignore','pipe','pipe']});};
 const top=nativeRealpathSync(run('rev-parse','--show-toplevel').trim());
 assert.equal(nativeRealpathSync(cwd),top,'Run qualification from the actual checkout root');
 assert.equal(run('for-each-ref','--format=%(refname)','refs/replace').trim(),'','Replacement Git history is forbidden');
 const bytes=(ref,file)=>nativeExecFileSync('git',['--no-optional-locks','--no-replace-objects','show',ref+':'+safePath(file)],{cwd,maxBuffer:64*1024*1024,stdio:['ignore','pipe','pipe']});
 const blob=(ref,file)=>run('rev-parse',ref+':'+safePath(file)).trim();
 const changes=(a,b)=>run('diff','--no-renames','--name-status',a,b).trim().split('\n').filter(Boolean).map(line=>{
  const parts=line.split('\t');assert.equal(parts.length,2,'Renamed or malformed path rejected');
  assert(['A','M'].includes(parts[0]),'Only regular added/modified files are admitted: '+line);
  return{status:parts[0],path:safePath(parts[1])};
 });
 const ancestor=(a,b)=>run('merge-base','--is-ancestor',a,b);
 const tree=(ref,files)=>{
  const records=run('ls-tree','-rz',ref,'--',...files).split('\0').filter(Boolean),out=new Map();
  for(const record of records){const tab=record.indexOf('\t'),meta=record.slice(0,tab).split(' ');assert.equal(meta.length,3);out.set(record.slice(tab+1),{mode:meta[0],type:meta[1],oid:meta[2]});}
  return out;
 };
 const environment=()=>JSON.stringify(Object.entries(process.env).sort(([a],[b])=>a.localeCompare(b)));
 const dirs=run('rev-parse','--path-format=absolute','--git-dir','--git-common-dir').trim().split('\n');
 const metadata=new Set();
 for(const dir of dirs)for(const name of['HEAD','index','config','config.worktree','packed-refs','info/grafts','shallow'])metadata.add(path.join(dir,name));
 try{const ref=run('symbolic-ref','-q','HEAD').trim();for(const dir of dirs)metadata.add(path.join(dir,ref));}catch{}
 for(const line of run('config','--show-origin','--list').split('\n')){const origin=line.split('\t')[0];if(origin.startsWith('file:'))metadata.add(path.resolve(top,origin.slice(5)));}
 // Reuse deterministic hashes only after a fresh complete native read proves
 // actual byte equality. No timestamp, inode or earlier approval substitutes
 // for a current byte read; cached buffers never leave this repository closure.
 const authenticatedFiles=new Map();
 const nativeFile=file=>{
  const bytes=nativeReadFileSync(file),prior=authenticatedFiles.get(file);
  if(prior&&nativeBufferEquals(bytes,prior.bytes))return prior;
  const row={bytes,blob:oid(bytes),sha256:createHash('sha256').update(bytes).digest('hex')};
  authenticatedFiles.set(file,row);return row;
 };
 const digest=file=>{try{return nativeFile(file).sha256;}catch(e){if(e.code==='ENOENT')return null;throw e;}};
 const snapshot=()=>({environment:environment(),files:new Map([...metadata].map(file=>[file,digest(file)]))});
 const checkSnapshot=prior=>{assert.equal(environment(),prior.environment,'Native execution environment changed');assert.equal(nativeRealpathSync(cwd),top,'Actual checkout root changed');for(const[file,pin]of prior.files)assert.equal(digest(file),pin,'Native Git HEAD/config/index changed: '+file);};
 return{top,run,bytes,blob,changes,ancestor,tree,snapshot,checkSnapshot,nativeFile,commandCount:()=>commands};
}
function clean(repo,head){
 assert.equal(repo.run('rev-parse','HEAD').trim(),head,'Actual source HEAD moved');
 assert.equal(repo.run('-c','diff.autoRefreshIndex=false','diff','--no-ext-diff','--no-textconv','--no-renames','--patch','--binary','HEAD','--').length,0,'Tracked worktree source is dirty');
 assert.equal(repo.run('diff','--no-ext-diff','--cached','--name-only','--').trim(),'','Index source is dirty');
 const entries=repo.run('ls-files','-v','-z').split('\0').filter(Boolean);
 assert(!entries.some(e=>e[0]==='S'||/^[a-z]$/.test(e[0])),'Hidden assume-unchanged/skip-worktree files are forbidden');
}
function physical(repo,head,file,pin,tree,returnBytes=true){
 const entry=tree.get(file);
 assert(entry&&entry.mode==='100644'&&entry.type==='blob'&&entry.oid===pin,'Regular committed source required: '+file);
 const absolute=path.join(repo.top,file),stat=nativeLstatSync(absolute);
 assert(stat.isFile()&&!stat.isSymbolicLink(),'Regular physical source required: '+file);
 const authenticated=repo.nativeFile(absolute);
 assert.equal(authenticated.blob,pin,'Actual current source bytes changed: '+file);
 return returnBytes?nativeBufferFrom(authenticated.bytes):undefined;
}
function validateContract(c){
 exactKeys(c,['kind','base','payload','payloadBlobs','payloadStatuses','maintenancePaths','maintenanceExpected','generatedPaths','inversePath','receiptPath','authority'],'Exact finite successor contract required');
 assert.equal(c.kind,'EXACT_MY_TIMBER_JOINED_LOOK_20261024','Unknown successor kind');
 for(const ref of[c.base,c.payload])assert.match(ref,SHA,'Exact commit required');
 const payload=list(Object.keys(c.payloadBlobs)),maintenance=list(c.maintenancePaths),generated=list(c.generatedPaths);
 assert.deepEqual(Object.keys(c.payloadStatuses).sort(),payload,'Payload status coverage must be exact');
 assert(payload.length>0,'Empty runtime payload rejected');
 assert.equal(payload.some(p=>maintenance.includes(p)),false,'Payload and registration maintenance must be disjoint');
 assert.equal(payload.includes(c.receiptPath)||maintenance.includes(c.receiptPath),false,'Receipt must be a separate final commit');
 assert(generated.every(p=>maintenance.includes(p)),'Generated files must be registered maintenance');
 assert(maintenance.includes(c.inversePath)&&generated.includes(c.inversePath),'Full inverse file must be generated maintenance');
 assert.deepEqual(Object.keys(c.maintenanceExpected).sort(),maintenance.filter(p=>!generated.includes(p)),'Every non-generated maintenance byte must be pinned before commit');
 for(const pin of[...Object.values(c.payloadBlobs),...Object.values(c.maintenanceExpected)])assert.match(pin,SHA,'Exact Git blob pin required');
 for(const p of[c.inversePath,c.receiptPath])safePath(p);
 return c;
}
function readNativeReceipt(repo,c,head,tree){
 const bytes=physical(repo,head,c.receiptPath,tree.get(c.receiptPath)?.oid,tree);
 const receipt=JSON.parse(bytes.toString('utf8'));
 exactKeys(receipt,['kind','base','payload','registrationSource','payloadBlobs','maintenanceBlobs','authority'],'Exact final receipt fields required');
 assert.equal(receipt.kind,c.kind);assert.equal(receipt.base,c.base);assert.equal(receipt.payload,c.payload,'Forged payload commit rejected');
 assert.deepEqual(receipt.payloadBlobs,c.payloadBlobs,'Forged payload pins rejected');
 assert.deepEqual(receipt.authority,c.authority,'Successor authority record changed');
 assert.match(receipt.registrationSource,SHA,'Real registration commit required');
 assert.deepEqual(Object.keys(receipt.maintenanceBlobs).sort(),list(c.maintenancePaths),'Exact registration pin coverage required');
 for(const pin of Object.values(receipt.maintenanceBlobs))assert.match(pin,SHA);
 return receipt;
}

/*
 * No reader, blob, diff, filesystem or authentication callbacks are accepted.
 * The generated production module closes over its generated contract.
 * A result authenticates actual successor facts. It never authenticates a
 * caller-supplied historical reader and never rewrites HEAD.
 */
function qualifyFiniteSuccessor(contract,options={}){
 exactKeys(options,Object.keys(options).filter(k=>['cwd','actualHead'].includes(k)),'Supplied readers or alternative fact providers are forbidden');
 const c=validateContract(structuredClone(contract)),repo=repository(options.cwd||process.cwd());
 const actualHead=repo.run('rev-parse','HEAD').trim();assert.match(actualHead,SHA);
 if(options.actualHead!==undefined)assert.equal(options.actualHead,actualHead,'Actual HEAD argument does not match Git');
 clean(repo,actualHead);
 const ownedPaths=[...Object.keys(c.payloadBlobs),...c.maintenancePaths,c.receiptPath];
 const currentTree=repo.tree(actualHead,ownedPaths);
 const receipt=readNativeReceipt(repo,c,actualHead,currentTree),registration=receipt.registrationSource;
 for(const[a,b]of[[c.base,c.payload],[c.payload,registration],[registration,actualHead]])repo.ancestor(a,b);
 const payloadChanges=repo.changes(c.base,c.payload);
 assert.deepEqual(payloadChanges.map(x=>x.path).sort(),Object.keys(c.payloadBlobs).sort(),'Extra runtime payload path rejected');
 for(const change of payloadChanges)assert.equal(change.status,c.payloadStatuses[change.path],'Payload path status changed');
 assert.deepEqual(repo.changes(c.payload,registration).map(x=>x.path).sort(),list(c.maintenancePaths),'Extra or missing registration maintenance path rejected');
 const tail=repo.changes(registration,actualHead);
 assert.deepEqual(tail,[{status:'A',path:c.receiptPath}],'Registration tail must add only the final receipt');
 assert.deepEqual(repo.changes(c.base,actualHead).map(x=>x.path).sort(),[...Object.keys(c.payloadBlobs),...c.maintenancePaths,c.receiptPath].sort(),'Unlisted source in successor');
 const currentPins={...c.payloadBlobs,...receipt.maintenanceBlobs};
 const payloadTree=repo.tree(c.payload,Object.keys(c.payloadBlobs)),registrationTree=repo.tree(registration,c.maintenancePaths);
 for(const[file,pin]of Object.entries(c.payloadBlobs)){
  assert.equal(payloadTree.get(file)?.oid,pin,'Frozen runtime payload changed: '+file);
  assert.equal(currentTree.get(file)?.oid,pin,'Current runtime payload changed: '+file);
  physical(repo,actualHead,file,pin,currentTree);
 }
 for(const[file,pin]of Object.entries(receipt.maintenanceBlobs)){
  assert.equal(registrationTree.get(file)?.oid,pin,'Registration receipt pin changed: '+file);
  assert.equal(currentTree.get(file)?.oid,pin,'Current registration bytes changed: '+file);
  if(Object.hasOwn(c.maintenanceExpected,file))assert.equal(pin,c.maintenanceExpected[file],'Unreviewed registration implementation bytes rejected: '+file);
  physical(repo,actualHead,file,pin,currentTree);
 }
 const inverseBytes=physical(repo,actualHead,c.inversePath,currentPins[c.inversePath],currentTree);
 const inverses=JSON.parse(inverseBytes.toString('utf8'));
 exactKeys(inverses,['kind','base','files'],'Exact full-file inverse record required');
 assert.equal(inverses.kind,c.kind);assert.equal(inverses.base,c.base);
 const modified=repo.changes(c.base,actualHead).filter(x=>x.status==='M').map(x=>x.path).sort();
 const originalTree=repo.tree(c.base,modified),originalBuffers=new Map();
 assert.deepEqual(Object.keys(inverses.files).sort(),modified,'Every changed predecessor file must have a full inverse');
 for(const[file,inverse]of Object.entries(inverses.files)){
  exactKeys(inverse,['originalBlob','originalBase64'],'Full original file bytes required');
  const original=Buffer.from(inverse.originalBase64,'base64');
  assert.equal(original.toString('base64'),inverse.originalBase64,'Canonical full-file inverse encoding required');
  assert.equal(oid(original),inverse.originalBlob,'Full original inverse bytes changed: '+file);
  assert.equal(inverse.originalBlob,originalTree.get(file)?.oid,'Inverse is not the immutable predecessor: '+file);
  originalBuffers.set(file,original);
 }
 clean(repo,actualHead);
 const receiptPin=currentTree.get(c.receiptPath).oid;
 const pins=Object.freeze({...currentPins,[c.receiptPath]:receiptPin});
 const predecessorPins=Object.freeze(Object.fromEntries(modified.map(file=>[file,originalTree.get(file).oid])));
 const nativeSnapshot=repo.snapshot();
 return Object.freeze({
  actualHead,head:actualHead,legacyHead:c.base,comparisonHead:c.base,payload:c.payload,registrationSource:registration,
  paths:Object.freeze(Object.keys(pins).sort()),pins,predecessorPins,
  currentFactsAuthenticated:true,currentReaderAuthenticated:false,legacyComparisonOnly:true,
  productionDeployed:false,
  nativeCommandCount:()=>repo.commandCount(),
  restoreFile(file,currentBytes){
   safePath(file);assert(Object.hasOwn(inverses.files,file),'Only an owned modified file may be projected: '+file);
   if(!activeQualification||activeQualification.proof.actualHead!==actualHead)this.assertCurrent();
   const actual=physical(repo,actualHead,file,pins[file],currentTree);
   assert(Buffer.isBuffer(currentBytes),'Projection requires the actual full current file bytes');
   assert(nativeBufferEquals(currentBytes,actual),'Projection input must match qualified actual current bytes');
   const restored=originalBuffers.get(file);assert.equal(oid(restored),originalTree.get(file).oid,'Predecessor inverse changed');
   return Buffer.from(restored);
  },
  comparisonValue(file,value){
   safePath(file);if(!Object.hasOwn(predecessorPins,file))return value;
   const identifier=value===pins[file],content=(typeof value==='string'||Buffer.isBuffer(value))&&oid(Buffer.from(value))===pins[file];
   if(!identifier&&!content)return value;
   const actual=physical(repo,actualHead,file,pins[file],currentTree),restored=this.restoreFile(file,actual);
   return identifier?predecessorPins[file]:Buffer.isBuffer(value)?restored:restored.toString('utf8');
  },
  assertCurrent(){
   repo.checkSnapshot(nativeSnapshot);clean(repo,actualHead);
   this.assertOwnedBytes();
  },
  assertOwnedBytes(){
   repo.checkSnapshot(nativeSnapshot);
   for(const[file,pin]of Object.entries(pins))physical(repo,actualHead,file,pin,currentTree,false);
  },
  assertBinding(actual){
   if(actual!==undefined)assert.equal(actual,actualHead,'Actual successor HEAD argument changed');
   repo.checkSnapshot(nativeSnapshot);
  }
 });
}
function activeFiniteSuccessorProof(contract,actualHead){
 if(!activeQualification)return null;
 assert.equal(contractKey(contract),activeQualification.key,'Qualification scope contract changed');
 if(actualHead!==undefined)assert.equal(actualHead,activeQualification.proof.actualHead,'Actual successor HEAD argument changed');
 activeQualification.proof.assertOwnedBytes();
 return activeQualification.proof;
}
function withFiniteSuccessorQualification(contract,callback,options={}){
 exactKeys(options,Object.keys(options).filter(k=>['cwd','actualHead'].includes(k)),'Supplied readers or alternative fact providers are forbidden');
 assert.equal(typeof callback,'function','Synchronous qualification callback required');
 const active=activeFiniteSuccessorProof(contract,options.actualHead);
 if(active)return callback(active);
 const proof=qualifyFiniteSuccessor(contract,options);activeQualification={key:contractKey(contract),proof};
 try{const value=callback(proof);assert(!value||typeof value.then!=='function','Finite qualification scope must be synchronous');return value;}
 finally{try{proof.assertCurrent();}finally{activeQualification=null;}}
}
function captureNativeRepository(cwd=process.cwd()){return repository(cwd);}
function gitBlobId(bytes){return oid(bytes);}


function deepFreeze(value){if(value&&typeof value==='object'){for(const child of Object.values(value))deepFreeze(child);Object.freeze(value);}return value;}
export const JOINED_LOOK_CONTRACT=deepFreeze({"kind":"EXACT_MY_TIMBER_JOINED_LOOK_20261024","base":"2daf52de65e94d979917a187cb1a44e6fcf10137","payload":"d4c95b3209323df0cdf7bad569c8f72d08c6944a","payloadBlobs":{"frontend/member/member-progress-v1.js":"3f7ec13262b2fe2a800f04bdfce5c0c301f2f26f","member-design.mjs":"aedd925f8425076639a40ff51c2032d8820502a3","member-experience/app-experience.mjs":"e4e71d5f692ceb9070406dab5386e7f21208182a","member-experience/chrome.mjs":"6310cc13dd827cb003999f9269f844b7a92d495b","member-experience/quick-log.mjs":"cba0efa1963cf16e2f54dea7995b6157c17c59d5","member-experience/tests/quick-log-browser.mjs":"4d90a4f5bc4be55ec54f92775caf846500c5a1e4","member-experience/tests/quick-log.test.mjs":"f667469c396faeddc699e7359ba0dc751d8a016c","preview/app-layout/presentation.mjs":"7712e65e973a35d29360a3db720562060c21c0ae","preview/member-design/member-feedback-proof.cjs":"841201db4d1968d1d85d2b47ac8daf62ea463eb5","preview/member-design/verify.cjs":"d78a373e7f2a20917e3562b705e377312a57163e","preview/member-panel-layout/verify.cjs":"9e960d14fe709ad126618f5ee7512d3935d1c68e","scripts/verify-my-timber-joined-look-20261024.mjs":"144037fb754c121ad2e0685561b55ce8b81df849","tests/my-timber-joined-views-20261024.test.mjs":"340d45fa57bca37a5d1f4ba93b459dda4a0a6160"},"payloadStatuses":{"frontend/member/member-progress-v1.js":"M","member-design.mjs":"M","member-experience/app-experience.mjs":"A","member-experience/chrome.mjs":"M","member-experience/quick-log.mjs":"A","member-experience/tests/quick-log-browser.mjs":"A","member-experience/tests/quick-log.test.mjs":"A","preview/app-layout/presentation.mjs":"M","preview/member-design/member-feedback-proof.cjs":"M","preview/member-design/verify.cjs":"M","preview/member-panel-layout/verify.cjs":"M","scripts/verify-my-timber-joined-look-20261024.mjs":"A","tests/my-timber-joined-views-20261024.test.mjs":"A"},"maintenancePaths":[".github/workflows/cloudflare-production-promote.yml","medicine-commerce-v1.js","medicines-watch/credibility.mjs","medicines-watch/credibility.test.mjs","medicines-watch/industry.mjs","medicines-watch/overdue-registry-access-renewal.test.mjs","medicines-watch/reviews/2026-10-18-approved-zenagamtide-switch.json","medicines-watch/scheduler.test.mjs","medicines-watch/te8105-asc36-renewal.test.mjs","member-experience/tests/weight-import-mapping-ui.test.mjs","public-purchase-basket.mjs","release/app-client-proof.mjs","release/app-live-http.mjs","release/app-scope.mjs","release/approved-independent-presentation-client-20261025.mjs","release/approved-news-ticker-frame-20261024.mjs","release/approved-runtime-composition.mjs","release/canonical-runtime-build.mjs","release/combined-original-gp-object-20261014.mjs","release/health-vision-scope-20261021.mjs","release/immutable-git-facts.mjs","release/independent-presentation-preservation.mjs","release/member-design-scope.mjs","release/member-recording-repair-20261024.mjs","release/member-runtime-deploy.mjs","release/my-shift-release-scope-20261024.mjs","release/my-timber-joined-look-inverses-20261024.json","release/my-timber-joined-look-scope-20261024.mjs","release/recorded-week-navigation-outer-frame-20261018.mjs","release/testosterone-scope-20261021.mjs","release/website-editorial-scope-20261018.mjs","shift-coach/public-trust-repair.mjs","shift-coach/public-trust-repair.test.mjs","shift-coach/release.test.mjs","tests/app-client-proof.test.mjs","tests/approved-news-ticker-frame-20261024.test.mjs","tests/b1-release-scope.test.mjs","tests/canonical-runtime-build.test.mjs","tests/combined-original-gp-object-20261014.test.mjs","tests/home-speed-green.test.mjs","tests/independent-presentation-preservation.test.mjs","tests/joined-native-byte-reuse-20261025.test.mjs","tests/late-watch-composition.test.mjs","tests/member-details-release.test.mjs","tests/member-recording-repair-admission-20261024.test.mjs","tests/native-restored-source-stats-20261025.test.mjs","tests/purchase-basket.test.mjs","tests/recorded-week-navigation-preservation-20261018.test.mjs","worker-entry-v6.js"],"maintenanceExpected":{".github/workflows/cloudflare-production-promote.yml":"b8b30ebd01a4f9163f70b1d299841c03803ecb55","medicine-commerce-v1.js":"305fd65c29ca635f3f54a3682ff0029b7e7fac70","medicines-watch/credibility.mjs":"befa1ba1016ff1733f3cc9ce06d76f7bd077c186","medicines-watch/credibility.test.mjs":"5d40e7fdcf8e8f7a1a1c27b17faacfaa92c31569","medicines-watch/industry.mjs":"1796dd89e9aa581f45748d5d9d4de067b2aec2a1","medicines-watch/overdue-registry-access-renewal.test.mjs":"0eda1b70400c36e5445fc106096a7cb881e07336","medicines-watch/reviews/2026-10-18-approved-zenagamtide-switch.json":"b9340819c1f663439718208aa39b6d856be398b9","medicines-watch/te8105-asc36-renewal.test.mjs":"70d87b5e9a1206636ebfe76d7de8efb619f9c3da","member-experience/tests/weight-import-mapping-ui.test.mjs":"658f6987024d9ca8bab3d5700fa24c9d383aebf0","public-purchase-basket.mjs":"ef14697e8c08019c34f53a5b8f7a97533c49ac65","release/app-client-proof.mjs":"6a7d9defa3f018299a09d0b4189138ec6d0d3bf1","release/app-live-http.mjs":"aa1f309e768d48b6852b82dc0b6ea250c0988fc6","release/app-scope.mjs":"6aec44ca381912259785148c7821d13272c75056","release/approved-independent-presentation-client-20261025.mjs":"6f5881c8d6787f7f38ed5136e9197a04f24f9128","release/approved-news-ticker-frame-20261024.mjs":"8dc057d931a8e5d9dae70e473665aaf931218430","release/approved-runtime-composition.mjs":"10877f644f57e58e87fa5e21a8fd1ef7a408e643","release/canonical-runtime-build.mjs":"913a2cf6e16735051471c2e26036a5b8ae9842c9","release/combined-original-gp-object-20261014.mjs":"cddbe4430c3d4f66d7f4a63b752f3b12789b54b6","release/health-vision-scope-20261021.mjs":"6d3a527207f13d2afc6eee39ad9077a7999635a3","release/immutable-git-facts.mjs":"3f88391636f095fa21290ede946d8e2f18da5a5e","release/independent-presentation-preservation.mjs":"24fe3d73be900a792882be78e47bcf0ffaa3a680","release/member-design-scope.mjs":"8b98c99b5aa91ac12171152f665f99aff417140d","release/member-recording-repair-20261024.mjs":"db7a645b57b42de3d4496542acf43d68d5347ac1","release/member-runtime-deploy.mjs":"988003feeb72dd04cbaf7258c6a3e6a50784734c","release/my-shift-release-scope-20261024.mjs":"54c0fd7a0f7ea5f96e336e920e7d9045af05d497","release/recorded-week-navigation-outer-frame-20261018.mjs":"ca72d494fe184454f2ead322799f338cace09ce5","release/testosterone-scope-20261021.mjs":"21ab2ba6b67467aec92d666e18f5c8d2026f6088","release/website-editorial-scope-20261018.mjs":"b9215815c96d3387eaac2ec752c84f0be9ed3138","shift-coach/public-trust-repair.mjs":"9101679625e729041c98516eb02544e6930d324a","shift-coach/public-trust-repair.test.mjs":"038c5dd82edb6039dff84ceff49343c6c581e6f6","shift-coach/release.test.mjs":"91f65a6146fe347ddd88f77de87010b191ba071e","tests/app-client-proof.test.mjs":"3941a29d52582f0a31a69bfcc3c56801e31c9e9f","tests/approved-news-ticker-frame-20261024.test.mjs":"55277adc34404774b0dcbbc72a21cd34967317cd","tests/canonical-runtime-build.test.mjs":"8b9edf9ec6c2f5d175879a43de78cb2ba36b8117","tests/combined-original-gp-object-20261014.test.mjs":"c9aa5890ac7ca86e570b91e9e7932b137343f224","tests/independent-presentation-preservation.test.mjs":"3f9d1058556a06571643d9729f114320df3dfe33","tests/joined-native-byte-reuse-20261025.test.mjs":"78902ef8428ff754d9d79f0d687e94e96207112f","tests/late-watch-composition.test.mjs":"636f279c31c591d5e9d2ae0593e69219ef5f7ab3","tests/member-details-release.test.mjs":"145863f8207eef11f7ab0b5b914d073c9d4b5cbc","tests/member-recording-repair-admission-20261024.test.mjs":"df9bd0992c08d2125fa1159dabb720a9b29dbe88","tests/native-restored-source-stats-20261025.test.mjs":"1dfbf84d8d9f5569d718d345399237aaca2d4817","tests/purchase-basket.test.mjs":"d16aa90ae4b73a2b4a0ee4ddfbceea293952565a","tests/recorded-week-navigation-preservation-20261018.test.mjs":"70d95c71c321360f8694257b8dd6924bca0478d3","worker-entry-v6.js":"4434faf74942037dc8ef88699e4b4260af9722c3","medicines-watch/scheduler.test.mjs":"a126f4478470720d5248c4e548b1a508852fc984","tests/b1-release-scope.test.mjs":"7ce3b4f9dae496260e0d1021f6b4ff89c809a140","tests/home-speed-green.test.mjs":"50810e542e0e02168a6bbefa4bbdaa67d957eb2b"},"generatedPaths":["release/my-timber-joined-look-inverses-20261024.json","release/my-timber-joined-look-scope-20261024.mjs"],"inversePath":"release/my-timber-joined-look-inverses-20261024.json","receiptPath":"release/my-timber-joined-look-20261024.json","authority":{"owner":"Matt","scope":"Approved My Timber visual refinements and optional existing-endpoint quick logging; Matt-approved Core canonical build/staged promotion and owned rollback receipt repair; application payload unchanged; Matt-approved published Newsroom SSR indexability repair only; no article copy, homepage or member application change","publicHomepage":false,"clinicalActivation":false,"newMessaging":false,"newDeploymentLane":false,"medicinesEvidenceCorrection":{"instruction":"Matt18October16:28BST Deploy; continued fixanddeploy25October","approvedPR":1379,"approvedSource":"8b53e773fd4c02ef14ac40dc1dfea3362553d791","cardSHA256":"f76e2362a6545494635bafa008e41485392b1c5e99253fb97668f609d6a45452","exactSixPaths":["medicines-watch/credibility.mjs","medicines-watch/credibility.test.mjs","medicines-watch/industry.mjs","medicines-watch/overdue-registry-access-renewal.test.mjs","medicines-watch/reviews/2026-10-18-approved-zenagamtide-switch.json","medicines-watch/te8105-asc36-renewal.test.mjs"],"clinicalApproval":null,"wholeProgrammeReviewRenewed":false,"sourceReviewDate":"2026-10-18","monitorSuccessSeeded":false,"otherProgrammeSourceOrReviewDatesChanged":false},"preservedAlreadyServingSource":{"source":"2c0595fca78f380e35942e14f7589f6f3cd6eb5b","providerVersion":"3c06f999-7001-4478-9057-8816671a19ee","providerDeployment":"ea340366-7634-4cb5-b9f3-036cc436d908","scope":"Preserve exact4alreadyapproved/deployedbasketfiles; no newbasketimplementation or checkoutacceptanceclaim","paths":["medicine-commerce-v1.js","public-purchase-basket.mjs","tests/purchase-basket.test.mjs","worker-entry-v6.js"]},"originalIntegrationCaseEnvelope":{"scope":"Both complete original cases run inside existing closed native and immutable-history contexts. Every original assertion body, supplied callback and fresh HEAD read is byte unchanged; source/index/config/environment/replacement/mutation fences preserved. No verifier function modified.","paths":["tests/late-watch-composition.test.mjs"],"assertionsRemoved":0,"assertionBodies":[{"name":"real release composition keeps prior ownership and all fresh-reader drift checks","bodySHA256":"41b7dff24aa745ef9ae3fbcbfd47e85a8d23d5a208cf0c688532599a5b5e85ad","bodyByteUnchanged":true},{"name":"real biomarker composition retains previous verified runtime and rejects all fresh-reader drift","bodySHA256":"c54dc724b24d3861327a6055897bd0c499b2e2c926e2b34f781004fb3c83f05a","bodyByteUnchanged":true}],"closedModuleLoad":{"exports":"Same native approved-runtime-composition module; same named bindings","initialisation":"Synchronous native Node createRequire within existing native and immutable-history contexts","completeOriginalFileExactInverse":true,"assertionsAndCallbacksChanged":false,"verifierFunctionsChanged":false,"diagnosticReceipt":"zenagamtide-closed-module-load-diagnostic-20261025.json"}},"originalSchedulerTestBeforeImage":{"source":"2c0595fca78f380e35942e14f7589f6f3cd6eb5b","runtimeBlob":"4434faf74942037dc8ef88699e4b4260af9722c3","beforeRuntimeBlob":"cc2d7dd76a495c88c2a42575a61dc62a7e9babed","paths":["medicines-watch/scheduler.test.mjs"],"scope":"Test-only inverse of exact three already-serving basket fetch additions; original scheduler assertions and execution of actual handler unchanged; no production runtime edit"},"originalB1TestEnvelope":{"basis":"Matt: Retain the underlying safety assertions, mutation checks and current-source protection.","scope":"Test-only native module loading and synchronous original assertion bodies inside existing withMemberRecordingQualification, retaining its Joined and immutable-history boundaries and fresh file-pin validation. No cache implementation or supplied-reader/assertion result is added or shared.","path":"shift-coach/release.test.mjs","beforeSource":"3a401235d1a6ae26374dfe33611c0cd9eda93b91","beforeBlob":"023ab5a0ed37819e37408b05a4dd1f8f09318353","beforeFileSHA256":"1bc3b5ef8604b066d05e15dc2c234dfe83ab7259abc3d2c761dd66103b447bb0","completeOriginalFileExactInverse":true,"assertionsOrCallbackTextChanged":false,"synchronousOriginalTests":["read-only article closeout cannot be changed, deleted or widened by repinning","merged article composition preserves exact baseline bytes and rejects unexpected statuses","merged My Health Plan member asset is retained exactly and cannot be widened by repinning","every coaching and release integration source has an exact pin; any drift fails","the exact current Watch files remain pinned and historical review bytes are only used for named integrations","launch preserves privacy and purpose gates; exact owner acceptance never claims independent review","production path keeps the existing rollback/deploy checks and checks launch before any production work","composed book release accepts only exact named additions and modifications; unrelated paths and deletion fail","missing reviewed preview history is fetched by its exact immutable identity and still fails if unavailable","retained current-main continuity alias cannot be silently widened by repinning","merged health safety corrections and their evidence remain independently pinned","merged living Health Plan test is an exact addition and cannot be silently changed by repinning","merged public-copy receipts are exact additions with independently immutable bytes","current-shell Health Plan mount preserves only the exact named dashboard changes","live homepage verifier reverses only exact catalogue text before its strict banner check"],"asyncOriginalTestsUnchanged":["already-live catalogue copy is reversed before strict homepage banner preservation","bounded member evidence rejects drift of every proven file, extra paths and a temporary production workflow","bounded member evidence requires the exact successful run, source, workflow, branch and event","latest registry-wave proof and exact composed Watch bytes remain mandatory","reload evidence rejects every changed verifier and requires the restored original workflow","reload evidence requires its own completed successful live source, branch, workflow and event"],"configurationCasesRetainOriginalBodies":true,"productionVerifierFunctionsChanged":false,"publicCopyChanged":false,"deploymentAuthorityBroadened":false,"rollbackAuthorityBroadened":false,"existingOwnerQualification":"withMemberRecordingQualification","noNewCacheImplementation":true,"profileReference":"b1-private-cpu-profile-20261026.json","profileSource":"22a2189f3b31544ef4e0cf85d5d267cd0226ec55","ownedReadBatch":{"beforeSource":"f806aa2e0d20f1dc62514fc89f74f80b118d7bc9","path":"release/member-recording-repair-20261024.mjs","beforeBlob":"143cd952ff0a7451f9f03ce4b9b1fb7bec022a36","completeBeforeImageInverse":true,"profileReference":"b1-private-member-cpu-profile-20261026.json","scope":"Only three private, synchronous native file loops share one already-authenticated Joined proof. Every original per-file mode, native physical read, blob and expected-pin assertion remains. Full owned bytes plus Git HEAD/config/index/environment are checked before and after each loop. No supplied reader, validation result, source timestamp, new cache, unscoped reuse, deployment or rollback authority added.","originalTickerChecksUnchanged":true,"currentFileReadsRetained":true,"productionVerifierFunctionsChanged":true}},"tickerHistoricalFixtureBoundary":{"basis":"Preserve original historical assertions and current-source protection; no drift waiver.","beforeSource":"11ada061abafa41ed7b85d2967064594885bca63","path":"tests/approved-news-ticker-frame-20261024.test.mjs","beforeBlob":"a030138c2a7a33b1a6a13daa803252b48b5f6a79","fullOriginalFileInverse":true,"originalTestCallbackOrAssertionTextChanged":true,"scopedOriginalTests":["reviewed scheduler test pin projects only exact current bytes after native admission","historical editorial workflow fixture retains actual caller authentication and every original inverse"],"exactHistoricalPaths":["medicines-watch/scheduler.test.mjs",".github/workflows/cloudflare-production-promote.yml"],"nativeBeforeImageRequired":true,"actualPinAndForeignInputAssertionsAdded":true,"actualCurrentMutationTestsUnchanged":true,"productionFunctionChangedByThisRepair":false,"failureReceipt":"b1-owned-read-batch-medicines-checks-20261026.json","originalAssertionsRetained":true,"scope":"Only three historical comparison operands explicitly consume the existing native UI before-image. The actual current scheduler pin continues into the unchanged native Member comparison; raw Git readers and every foreign-input/callback assertion are unchanged.","rawGitReaderUnchanged":true,"actualMemberComparisonUnchanged":true,"priorScopedReaderPrototype":"bc01422a27e39167e06623e76516dcc198142bb0: 27/28; exact retained failed fixture showed historical pin cannot replace actual Member input."},"nativeB1RuntimeFixtureBoundary":{"basis":"Preserve every original deploy-order/rollback assertion through an exact current-source-authenticated original wrapper fixture; actual production wrapper and workflow remain unchanged.","beforeSource":"bc01422a27e39167e06623e76516dcc198142bb0","path":"tests/b1-release-scope.test.mjs","beforeBlob":"828a59b1c67f7d702480aa74a2986054fffdcf36","scopedOriginalTest":"gates, fresh source check, rollback capture and exactly one deploy remain ordered","originalCallbackAndAssertionTextChanged":true,"projectedRuntimePath":"release/member-runtime-deploy.mjs","nativeCurrentBytesAndFullOriginalBeforeImageRequired":true,"newBoundedMaintenancePath":"tests/b1-release-scope.test.mjs","newFullInverseBase":"2daf52de65e94d979917a187cb1a44e6fcf10137","newFullInverseBlob":"828a59b1c67f7d702480aa74a2986054fffdcf36","noProductionWorkflowOrWrapperChange":true,"failureReceipt":"b1-owned-read-batch-checks-20261026.json","originalAssertionsRetainedUnchanged":true,"scope":"Only the original deployWrapper fixture declaration authenticates actual complete wrapper bytes through the native full before-image; original readFileSync, test callback registration, all deploy-order/stock/rollback assertions and actual production files are unchanged."},"nativeBasketHomeCssFixtureBoundary":{"basis":"Retain the original whole-page CSS byte count/hash, main, CSS and no-DB/no-background assertions while separately proving the already-serving basket append. No homepage or navigation modification.","beforeSource":"a1198f0d2e69ad5b5db18349a2286a3eee95267c","path":"tests/home-speed-green.test.mjs","beforeBlob":"4cc2abe822472caf43f627bb3c2a2ec78476b1ff","fullOriginalFileBeforeImage":true,"originalAssertionsOrExpectedHashChanged":false,"exactAlreadyServingBasketModuleBlob":"ef14697e8c08019c34f53a5b8f7a97533c49ac65","exactScript":"<script defer src=\"/assets/shift-purchase-basket-v1.js\"></script>","exactScriptCount":1,"exactFinalBodyPositionRequired":true,"completeResponseRoundTripRequired":true,"originalPageBytes":204467,"originalPageSHA256":"b42cf70b2319ad34bc7e615b1a351be780a1acf7f7d5d8d9dc65d3f09efb203e","providerBaselineVersion":"3c06f999-7001-4478-9057-8816671a19ee","diagnosisReceipt":"b1-home-css-basket-diagnostic-20261026.json","publicRuntimeChanged":false,"newProductionOrRollbackAuthority":false}}});
export function qualifyJoinedSuccessor(actualHead){return activeFiniteSuccessorProof(JOINED_LOOK_CONTRACT,actualHead)||qualifyFiniteSuccessor(JOINED_LOOK_CONTRACT,actualHead===undefined?{}:{actualHead});}
export function withJoinedSuccessorQualification(callback,actualHead){return withFiniteSuccessorQualification(JOINED_LOOK_CONTRACT,callback,actualHead===undefined?{}:{actualHead});}
export function joinedLookPredecessorFile(file,currentBytes,actualHead){const proof=qualifyJoinedSuccessor(actualHead);return Object.freeze({head:proof.actualHead,legacyHead:proof.legacyHead,currentReaderAuthenticated:false,legacyComparisonOnly:true,bytes:proof.restoreFile(file,currentBytes)});}
