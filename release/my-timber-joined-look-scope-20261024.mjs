import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFileSync,lstatSync,realpathSync} from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';

// Capture native functions during static module initialisation, before the
// existing synchronous historical comparison frames update builtin bindings.
// Qualification never accepts or calls a supplied reader.
const nativeExecFileSync=execFileSync,nativeReadFileSync=readFileSync,nativeLstatSync=lstatSync,nativeRealpathSync=realpathSync;

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
 const run=(...args)=>{commands++;return nativeExecFileSync('git',['--no-replace-objects',...args],{cwd,encoding:'utf8',maxBuffer:64*1024*1024,stdio:['ignore','pipe','pipe']});};
 const top=nativeRealpathSync(run('rev-parse','--show-toplevel').trim());
 assert.equal(nativeRealpathSync(cwd),top,'Run qualification from the actual checkout root');
 assert.equal(run('for-each-ref','--format=%(refname)','refs/replace').trim(),'','Replacement Git history is forbidden');
 const bytes=(ref,file)=>nativeExecFileSync('git',['--no-replace-objects','show',ref+':'+safePath(file)],{cwd,maxBuffer:64*1024*1024,stdio:['ignore','pipe','pipe']});
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
 const digest=file=>{try{return createHash('sha256').update(nativeReadFileSync(file)).digest('hex');}catch(e){if(e.code==='ENOENT')return null;throw e;}};
 const snapshot=()=>({environment:environment(),files:new Map([...metadata].map(file=>[file,digest(file)]))});
 const checkSnapshot=prior=>{assert.equal(environment(),prior.environment,'Native execution environment changed');assert.equal(nativeRealpathSync(cwd),top,'Actual checkout root changed');for(const[file,pin]of prior.files)assert.equal(digest(file),pin,'Native Git HEAD/config/index changed: '+file);};
 return{top,run,bytes,blob,changes,ancestor,tree,snapshot,checkSnapshot,commandCount:()=>commands};
}
function clean(repo,head){
 assert.equal(repo.run('rev-parse','HEAD').trim(),head,'Actual source HEAD moved');
 assert.equal(repo.run('diff','--no-ext-diff','--name-only','HEAD','--').trim(),'','Tracked worktree source is dirty');
 assert.equal(repo.run('diff','--no-ext-diff','--cached','--name-only','--').trim(),'','Index source is dirty');
 const entries=repo.run('ls-files','-v','-z').split('\0').filter(Boolean);
 assert(!entries.some(e=>e[0]==='S'||/^[a-z]$/.test(e[0])),'Hidden assume-unchanged/skip-worktree files are forbidden');
}
function physical(repo,head,file,pin,tree){
 const entry=tree.get(file);
 assert(entry&&entry.mode==='100644'&&entry.type==='blob'&&entry.oid===pin,'Regular committed source required: '+file);
 const absolute=path.join(repo.top,file),stat=nativeLstatSync(absolute);
 assert(stat.isFile()&&!stat.isSymbolicLink(),'Regular physical source required: '+file);
 const bytes=nativeReadFileSync(absolute);
 assert.equal(oid(bytes),pin,'Actual current source bytes changed: '+file);
 return bytes;
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
   assert(currentBytes.equals(actual),'Projection input must match qualified actual current bytes');
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
   for(const[file,pin]of Object.entries(pins))physical(repo,actualHead,file,pin,currentTree);
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
export const JOINED_LOOK_CONTRACT=deepFreeze({
  "kind": "EXACT_MY_TIMBER_JOINED_LOOK_20261024",
  "base": "2e1eaf56b2f4f446866841b915a96bc64d07e497",
  "payload": "37aa712983c8fff68ff74a78f45e4d086542709e",
  "payloadBlobs": {
    "frontend/member/member-progress-v1.js": "3f7ec13262b2fe2a800f04bdfce5c0c301f2f26f",
    "member-design.mjs": "aedd925f8425076639a40ff51c2032d8820502a3",
    "member-experience/app-experience.mjs": "e4e71d5f692ceb9070406dab5386e7f21208182a",
    "member-experience/chrome.mjs": "6310cc13dd827cb003999f9269f844b7a92d495b",
    "member-experience/quick-log.mjs": "cba0efa1963cf16e2f54dea7995b6157c17c59d5",
    "member-experience/tests/quick-log-browser.mjs": "4d90a4f5bc4be55ec54f92775caf846500c5a1e4",
    "member-experience/tests/quick-log.test.mjs": "f667469c396faeddc699e7359ba0dc751d8a016c",
    "preview/app-layout/presentation.mjs": "7712e65e973a35d29360a3db720562060c21c0ae",
    "preview/member-design/member-feedback-proof.cjs": "841201db4d1968d1d85d2b47ac8daf62ea463eb5",
    "preview/member-design/verify.cjs": "d78a373e7f2a20917e3562b705e377312a57163e",
    "preview/member-panel-layout/verify.cjs": "9e960d14fe709ad126618f5ee7512d3935d1c68e",
    "scripts/verify-my-timber-joined-look-20261024.mjs": "144037fb754c121ad2e0685561b55ce8b81df849",
    "tests/my-timber-joined-views-20261024.test.mjs": "340d45fa57bca37a5d1f4ba93b459dda4a0a6160"
  },
  "payloadStatuses": {
    "frontend/member/member-progress-v1.js": "M",
    "member-design.mjs": "M",
    "member-experience/app-experience.mjs": "A",
    "member-experience/chrome.mjs": "M",
    "member-experience/quick-log.mjs": "A",
    "member-experience/tests/quick-log-browser.mjs": "A",
    "member-experience/tests/quick-log.test.mjs": "A",
    "preview/app-layout/presentation.mjs": "M",
    "preview/member-design/member-feedback-proof.cjs": "M",
    "preview/member-design/verify.cjs": "M",
    "preview/member-panel-layout/verify.cjs": "M",
    "scripts/verify-my-timber-joined-look-20261024.mjs": "A",
    "tests/my-timber-joined-views-20261024.test.mjs": "A"
  },
  "maintenancePaths": [
    "member-experience/tests/weight-import-mapping-ui.test.mjs",
    "release/app-scope.mjs",
    "release/approved-news-ticker-frame-20261024.mjs",
    "release/approved-runtime-composition.mjs",
    "release/health-vision-scope-20261021.mjs",
    "release/member-design-scope.mjs",
    "release/member-recording-repair-20261024.mjs",
    "release/my-timber-joined-look-inverses-20261024.json",
    "release/my-timber-joined-look-scope-20261024.mjs"
  ],
  "maintenanceExpected": {
    "member-experience/tests/weight-import-mapping-ui.test.mjs": "658f6987024d9ca8bab3d5700fa24c9d383aebf0",
    "release/app-scope.mjs": "6aec44ca381912259785148c7821d13272c75056",
    "release/approved-news-ticker-frame-20261024.mjs": "223636e99e25d0d78d2064fc1fcab9739db7e04a",
    "release/approved-runtime-composition.mjs": "10877f644f57e58e87fa5e21a8fd1ef7a408e643",
    "release/health-vision-scope-20261021.mjs": "f81d0cd6c7a8230d47611bb46f1e7cb3e23d61b1",
    "release/member-design-scope.mjs": "8b98c99b5aa91ac12171152f665f99aff417140d",
    "release/member-recording-repair-20261024.mjs": "e63943205ee315b2808e5ca5e0480b87aaefc6f8"
  },
  "generatedPaths": [
    "release/my-timber-joined-look-inverses-20261024.json",
    "release/my-timber-joined-look-scope-20261024.mjs"
  ],
  "inversePath": "release/my-timber-joined-look-inverses-20261024.json",
  "receiptPath": "release/my-timber-joined-look-20261024.json",
  "authority": {
    "owner": "Matt",
    "scope": "Approved My Timber visual refinements and optional existing-endpoint quick logging",
    "publicHomepage": false,
    "clinicalActivation": false,
    "newMessaging": false,
    "newDeploymentLane": false
  }
});
export function qualifyJoinedSuccessor(actualHead){return activeFiniteSuccessorProof(JOINED_LOOK_CONTRACT,actualHead)||qualifyFiniteSuccessor(JOINED_LOOK_CONTRACT,actualHead===undefined?{}:{actualHead});}
export function withJoinedSuccessorQualification(callback,actualHead){return withFiniteSuccessorQualification(JOINED_LOOK_CONTRACT,callback,actualHead===undefined?{}:{actualHead});}
export function joinedLookPredecessorFile(file,currentBytes,actualHead){const proof=qualifyJoinedSuccessor(actualHead);return Object.freeze({head:proof.actualHead,legacyHead:proof.legacyHead,currentReaderAuthenticated:false,legacyComparisonOnly:true,bytes:proof.restoreFile(file,currentBytes)});}
