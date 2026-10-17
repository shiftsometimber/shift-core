import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {immutableHistoryExecFileSync as execFileSync,withImmutableHistoryVerification,assertGitTrackedSourceVisible} from './immutable-git-facts.mjs';
import {freshDetachedSourceHead} from './fresh-food-source-head-20261016.mjs';
import {makeFreshCleanHint} from './fresh-food-source-clean-20261015.mjs';
import {readSeoNativeImmutableFacts} from './seo-native-immutable-facts-20261016.mjs';

const ledger='release/approved-runtime-composition.json',key='currentRuntimePreservation20261016';
const self='release/current-runtime-preservation-20261016.mjs';
const basis='a3e0ecca87c3a9a5894f25af7f9b0016c5393a4c',basisTree='da8daffa1d175bf5563261fd93b6b7c81a3c9389';
const accepted='c058780e1df1ac59968e08ac1959877ab80fd034',acceptedTree='9cd8f66667b4575464809308c1d134c3b7f4698f';
const sorted=a=>[...a].sort(),sha=value=>createHash('sha256').update(value).digest('hex');
const git=(...args)=>execFileSync('git',args,{encoding:'utf8',maxBuffer:64e6});
const currentHead=()=>freshDetachedSourceHead()??git('rev-parse','HEAD').trim();
const cleanHint=makeFreshCleanHint();
function clean(){if(cleanHint())return;assertGitTrackedSourceVisible('UK Grub preservation');assert.equal(git('diff','--no-renames','--name-only','HEAD','--').trim(),'');assert.equal(git('diff','--no-renames','--cached','--name-only','--').trim(),'');}
const difference=(a,b)=>git('diff','--no-renames','--name-only',a,b).trim().split('\n').filter(Boolean);
const policyOf=source=>{const match=/^const policy=(.*);$/m.exec(source);assert(match,'One exact immutable preservation policy required');return JSON.parse(match[1]);};
const reverse=(value,pairs)=>{for(const[before,after,kind]of[...pairs].reverse()){assert(after&&value.split(after).length===2,'One exact UK maintenance inverse required');if(kind==='prefix')assert(value.startsWith(after));if(kind==='suffix')assert(value.endsWith(after));value=value.replace(after,before);}return value;};

// Reconstruct both native trees without writing an object, changing a ref or
// replacing any Git fact. The complete path boundary is checked separately.
function entries(ref){
 const rows=git('ls-tree','-r','-z',ref).split('\0');assert.equal(rows.pop(),'');const result=new Map();
 for(const row of rows){const match=/^([0-7]{6}) (blob|commit) ([a-f0-9]{40})\t(.+)$/.exec(row);assert(match&&!result.has(match[4]));result.set(match[4],{mode:match[1],type:match[2],oid:match[3]});}
 return result;
}
function treeOf(rows){
 const root=new Map();
 for(const[path,row]of rows){const parts=path.split('/');assert(parts.every(p=>p&&p!=='.'&&p!=='..'));let at=root;for(const name of parts.slice(0,-1)){if(!at.has(name))at.set(name,new Map());assert(at.get(name)instanceof Map);at=at.get(name);}assert(!at.has(parts.at(-1)));at.set(parts.at(-1),row);}
 const encode=tree=>{
  const rows=[...tree].map(([name,row])=>row instanceof Map?{name,sort:Buffer.from(name+'/'),mode:'40000',oid:encode(row)}:{name,sort:Buffer.from(name),...row}).sort((a,b)=>Buffer.compare(a.sort,b.sort));
  const bytes=Buffer.concat(rows.map(row=>Buffer.concat([Buffer.from(row.mode+' '+row.name+'\0'),Buffer.from(row.oid,'hex')])));
  return createHash('sha1').update('tree '+bytes.length+'\0').update(bytes).digest('hex');
 };
 return encode(root);
}

export function withoutAcceptedUkGrubMaintenance(record,path,value){
 const pin=record.acceptedUkGrubPreservation20261017?.modules[path];if(!pin||sha(value)!==pin.afterSHA256)return value;
 const restored=reverse(value,pin.inversePairs);assert.equal(sha(restored),pin.beforeSHA256,'Whole original a3 maintenance bytes must restore');return restored;
}

export function withAcceptedUkGrubPreservation(c,head,compare){
 assert.equal(typeof compare,'function');clean();
 return withImmutableHistoryVerification(()=>{
  const fresh=()=>assert.equal(currentHead(),head,'Current-runtime preservation source drift: Raw HEAD changed during UK proof');fresh();
  try{
   assert.deepEqual(JSON.parse(git('show',head+':'+ledger))[key],c,'Actual current UK preservation ledger required');
   const leaf=c.acceptedUkGrubPreservation20261017;assert(leaf);assert.equal(leaf.kind,'EXACT_ACTUAL_ACCEPTED_UK_GRUB_PRESERVATION');
   for(const[name,value]of Object.entries({basisSource:basis,basisTree,acceptedSource:accepted,acceptedTree,acceptedRun:39075907078,recordKey:'grubUKCatalogue20261017'}))assert.equal(leaf[name],value);
   for(const[name,value]of Object.entries({originalProducerIsImmutableHistoricalWitness:true,originalAssertionsAndTimeoutsRetained:true,clinicalContractActivated:false,memberFeatureAcceptance:false,sourceVerdictsCached:false}))assert.equal(leaf[name],value,'Exact UK preservation scope required: '+name);
   for(const[ref,tree]of[[basis,basisTree],[accepted,acceptedTree]]){git('merge-base','--is-ancestor',ref,head);assert.equal(git('rev-parse',ref+'^{tree}').trim(),tree);}
   assert.deepEqual(sorted(Object.keys(leaf.modules)),['release/accepted-current-runtime-starting-point-20261017.mjs','release/growth-adopt-deployment.mjs','release/recipe-image-scope.mjs','shift-coach/recover-cancelled-release.mjs']);
   assert.deepEqual(sorted(Object.keys(leaf.newFiles)),['release/accepted-uk-grub-preservation-20261017.mjs','release/receipts/accepted-grub-uk-39075907078.json','tests/accepted-grub-uk-runtime-20261017.test.mjs','tests/accepted-uk-grub-preservation-20261017.test.mjs','tests/fixtures/accepted-grub-uk-runtime-20261017.json'],'Only five exact UK maintenance files are admitted');
   const before=entries(basis),oldOverlap=leaf.paths.filter(path=>before.has(path));
   assert.deepEqual(sorted(oldOverlap.filter(path=>c.acceptedGrubPreservation20261017.paths.includes(path))),['grub-expansion-authority-v1.mjs','member-experience/grub-intelligence.mjs','member-experience/grub-workspace.mjs','member-experience/tests/grub-everyday.test.mjs']);
   const maintenance=[...Object.keys(leaf.modules),...Object.keys(leaf.newFiles),self];
   const native=readSeoNativeImmutableFacts({head,base:basis,payload:c.source,maintenanceSource:c.maintenanceSource,paths:leaf.paths,maintenancePaths:maintenance,inversePaths:[...oldOverlap,...Object.keys(leaf.modules),self],ledger,includeModes:true});
   const producer=readSeoNativeImmutableFacts({head:accepted,base:accepted,payload:accepted,maintenanceSource:accepted,paths:leaf.paths,maintenancePaths:[],inversePaths:[],ledger});
   const requested=new Map([[head,new Set([...leaf.paths,...maintenance,ledger])],[c.source,new Set(leaf.paths)],[c.maintenanceSource,new Set(maintenance)],[basis,new Set([...oldOverlap,...Object.keys(leaf.modules),self,ledger])]]);
   const verifiedBlob=(ref,path)=>{const r=ref==='HEAD'?head:ref;if(r===accepted&&(leaf.paths.includes(path)||path===ledger))return producer.blob(r,path);if(requested.get(r)?.has(path))return native.blob(ref,path);return git('rev-parse',r+':'+path).trim();};
   const verifiedContent=(ref,path)=>{const r=ref==='HEAD'?head:ref;if(r===accepted&&(leaf.paths.includes(path)||path===ledger))return producer.content(r,path);if(requested.get(r)?.has(path))return native.content(ref,path);return git('show',r+':'+path);};
   assert.deepEqual(JSON.parse(verifiedContent(head,ledger))[key],c);
   const actualPolicy=policyOf(verifiedContent(head,self)),oldSource=verifiedContent(basis,self),oldPolicy=policyOf(oldSource),prior=JSON.parse(verifiedContent(basis,ledger))[key];
   const {maintenanceSource,...fixed}=c;assert.deepEqual(actualPolicy.record,fixed,'Actual private policy must bind the same current native ledger');
   assert.equal(sha(oldSource),leaf.beforePolicySHA256);assert.equal(verifiedBlob(basis,self),leaf.beforePolicyBlob);
   const restored=structuredClone(c);for(const name of['source','sourceTree','paths','maintenancePaths','maintenanceSource'])restored[name]=prior[name];delete restored.acceptedUkGrubPreservation20261017;
   assert.deepEqual(restored,prior,'Every original a3 record, approval, rollback and preservation leaf must remain exact');
   assert.equal(leaf.priorPayload,prior.source);assert.equal(leaf.priorPayloadTree,prior.sourceTree);
   assert.equal(git('rev-parse',prior.source+'^{tree}').trim(),prior.sourceTree);
   assert.deepEqual(sorted(difference('a32be98c67fe0ddb857017650fab02f996bc98e0',accepted)),sorted([...leaf.paths,ledger]),'Only the genuine forty-path UK source boundary is admitted');
   assert.equal(leaf.paths.length,39);assert.deepEqual(sorted(Object.keys(leaf.pathBlobs)),sorted(leaf.paths));
   assert.deepEqual(sorted(difference(prior.source,c.source)),sorted([...leaf.paths,ledger]),'The payload may extend only by the exact UK package');
   assert.equal(git('rev-list','--parents','-n','1',c.source).trim(),[c.source,basis,accepted].join(' '),'Only a3 and the genuine serving UK source may parent the payload');
   for(const path of leaf.paths){const id=leaf.pathBlobs[path];assert.equal(verifiedBlob(accepted,path),id);assert.equal(verifiedBlob(c.source,path),id);assert.equal(verifiedBlob(head,path),id,'Actual serving UK bytes must remain exact: '+path);}
   const acceptedLedger=JSON.parse(verifiedContent(accepted,ledger)),payload=JSON.parse(verifiedContent(c.source,ledger)),oldPayload=JSON.parse(verifiedContent(prior.source,ledger));
   assert.equal(Object.hasOwn(oldPayload,leaf.recordKey),false);assert.deepEqual(payload[leaf.recordKey],acceptedLedger[leaf.recordKey]);delete payload[leaf.recordKey];assert.deepEqual(payload,oldPayload,'Only the original UK registration may extend the payload ledger');
   for(const[path,pin]of Object.entries(leaf.modules)){
    assert.equal(verifiedBlob(basis,path),pin.beforeBlob);assert.equal(verifiedBlob(head,path),pin.afterBlob);
    assert.equal(sha(verifiedContent(basis,path)),pin.beforeSHA256);assert.equal(sha(verifiedContent(head,path)),pin.afterSHA256);
    assert.equal(withoutAcceptedUkGrubMaintenance(c,path,verifiedContent(head,path)),verifiedContent(basis,path),'Whole prior a3 module must restore: '+path);
   }
   for(const[path,pin]of Object.entries(leaf.newFiles)){assert.equal(git('ls-tree',basis,'--',path).trim(),'');assert.equal(verifiedBlob(head,path),pin.blob);assert.equal(sha(verifiedContent(head,path)),pin.sha256);}
   const restoredPolicy=structuredClone(actualPolicy);restoredPolicy.record=oldPolicy.record;
   for(const[path,pin]of Object.entries(leaf.modules))if(Object.hasOwn(oldPolicy.inverses,path)){
    const count=pin.inversePairs.length;assert.deepEqual(restoredPolicy.inverses[path].slice(-count),pin.inversePairs);restoredPolicy.inverses[path]=restoredPolicy.inverses[path].slice(0,-count);
   }
   assert.deepEqual(restoredPolicy,oldPolicy,'All earlier inverse prefixes and private policy fields must remain exact');
   let restoredSource=verifiedContent(head,self);const line=/^const policy=(.*);$/m.exec(restoredSource),oldLine=/^const policy=(.*);$/m.exec(oldSource);assert(line&&oldLine);restoredSource=restoredSource.replace(line[0],oldLine[0]);restoredSource=reverse(restoredSource,leaf.policyCodeInversePairs);assert.equal(restoredSource,oldSource,'The complete previous preservation module must restore');
   const changed=[...new Set([...leaf.paths,...Object.keys(leaf.modules),...Object.keys(leaf.newFiles),self,ledger])];
   assert.deepEqual(sorted(difference(basis,head)),sorted(changed),'Every unrelated a3 source path must remain exact');
   const now=entries(head);assert.equal(treeOf(now),git('rev-parse',head+'^{tree}').trim(),'Complete actual native source tree required');
   for(const path of changed){if(before.has(path))now.set(path,before.get(path));else now.delete(path);}assert.equal(treeOf(now),basisTree,'The whole combined source must reverse exactly to qualified a3');
   const projected=new Set([...oldOverlap.filter(path=>c.acceptedGrubPreservation20261017.paths.includes(path)),...Object.keys(leaf.modules)]);let active=true;
   assert.deepEqual(sorted(projected),leaf.historicalProjectionPaths,'Only the four original Grub overlaps and three provider modules may project');
   const lookup=kind=>(ref,path)=>{assert(active,'UK historical comparison has finished');fresh();try{if((ref==='HEAD'||ref===head)&&projected.has(path)){
    // Current values have been authenticated above in this same fresh proof.
    // Recheck the current aliases on every historical comparison; no accepted
    // callback output or source verdict is cached across calls.
    assert.equal(verifiedBlob('HEAD',path),verifiedBlob(head,path));assert.equal(verifiedContent('HEAD',path),verifiedContent(head,path));
    return kind==='blob'?verifiedBlob(basis,path):verifiedContent(basis,path);
   }return kind==='blob'?verifiedBlob(ref,path):verifiedContent(ref,path);}finally{fresh();}};
   try{return compare(Object.freeze({recordKey:leaf.recordKey,priorRecord:prior,historicalBlob:lookup('blob'),historicalContent:lookup('content')}));}finally{active=false;}
  }finally{fresh();clean();}
 });
}
