import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {mkdtempSync,mkdirSync,writeFileSync,readFileSync,existsSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {ensureCombinedOriginalGpSource,ORIGINAL_GP_SOURCE,ORIGINAL_GP_TREE,ORIGINAL_GP_BLOBS} from '../release/combined-original-gp-object-20261014.mjs';

function nativeFixture(t,{treePresent=false,firstBlobPresent=false}={}){
 const root=mkdtempSync(join(tmpdir(),'shift-gp-complete-'));t.after(()=>rmSync(root,{recursive:true,force:true}));
 const origin=join(root,'origin'),client=join(root,'client');mkdirSync(origin);mkdirSync(client);
 const run=(cwd,args,options={})=>execFileSync('git',['--no-replace-objects',...args],{cwd,encoding:'utf8',stdio:['pipe','pipe','pipe'],...options});
 for(const directory of [origin,client]){
  run(directory,['init','-q']);run(directory,['config','user.name','Fixture']);run(directory,['config','user.email','fixture@example.invalid']);
 }
 const files=Object.keys(ORIGINAL_GP_BLOBS);
 for(const [i,path]of files.entries())writeFileSync(join(origin,path),'Exact fixture target '+i+'\n');
 run(origin,['add','--',...files]);run(origin,['commit','-qm','Target fixture']);
 writeFileSync(join(client,'baseline'),'Independent baseline\n');run(client,['add','baseline']);run(client,['commit','-qm','Baseline fixture']);
 const target=run(origin,['rev-parse','HEAD']).trim(),tree=run(origin,['rev-parse','HEAD^{tree}']).trim();
 const blobs=files.map(path=>run(origin,['rev-parse','HEAD:'+path]).trim());
 const copy=(type,id)=>run(client,['hash-object','-w','-t',type,'--stdin'],{input:run(origin,['cat-file',type,id],{encoding:null})}).trim();
 assert.equal(copy('commit',target),target);
 if(treePresent)assert.equal(copy('tree',tree),tree);
 if(firstBlobPresent)assert.equal(copy('blob',blobs[0]),blobs[0]);
 run(client,['remote','add','origin',pathToFileURL(origin).href]);
 const mappings=new Map([[ORIGINAL_GP_SOURCE,target],[ORIGINAL_GP_TREE,tree],...Object.values(ORIGINAL_GP_BLOBS).map((id,i)=>[id,blobs[i]])]);
 const calls=[];
 // Only fixture identities/origin are translated. Every availability, type,
 // fetch, HEAD/ref/index/FETCH_HEAD and file-state operation uses native Git.
 const git=args=>{
  calls.push([...args]);
  if(args[0]==='remote'&&args[1]==='get-url'){
   assert.equal(run(client,args).trim(),pathToFileURL(origin).href);
   return 'https://github.com/shiftsometimber/shift-core.git\n';
  }
  const mapped=args.map(value=>{for(const [pin,native]of mappings)if(value===pin||value.startsWith(pin+'^')||value.startsWith(pin+':'))return native+value.slice(pin.length);return value;});
  const result=run(client,mapped),trimmed=result.trim();
  for(const [pin,native]of mappings)if(trimmed===native)return pin+'\n';
  return result;
 };
 const state=path=>{const absolute=resolve(client,path);return existsSync(absolute)?createHash('sha256').update(readFileSync(absolute)).digest('hex'):null;};
 return{git,state,calls,run,client,target,tree,blobs};
}
test('native commit-only store is incomplete; ordinary exact fetch restores the pinned tree and blobs without moving source state',t=>{
 const f=nativeFixture(t);
 assert.equal(f.run(f.client,['cat-file','-e',f.target+'^{commit}']),'');
 assert.throws(()=>f.run(f.client,['rev-parse',f.target+'^{tree}']),e=>e.status===128);
 const r=ensureCombinedOriginalGpSource(f);
 assert.equal(r.fetched,true);assert.equal(r.sourceAdmission,false);assert.equal(r.refsChanged,false);
 assert.deepEqual(f.calls.filter(a=>a[0]==='fetch'),[['fetch','--no-tags','--no-write-fetch-head','origin',ORIGINAL_GP_SOURCE]]);
 assert.equal(f.run(f.client,['rev-parse',f.target+'^{tree}']).trim(),f.tree);
 for(const blob of f.blobs)assert.equal(f.run(f.client,['cat-file','-t',blob]).trim(),'blob');
 assert.equal(ensureCombinedOriginalGpSource(f).fetched,false);
});
test('native commit and tree with a missing protected blob still require complete original-object transport',t=>{
 const f=nativeFixture(t,{treePresent:true,firstBlobPresent:true});
 assert.equal(f.run(f.client,['rev-parse',f.target+'^{tree}']).trim(),f.tree);
 assert.throws(()=>f.run(f.client,['cat-file','-e',f.blobs[1]]),e=>e.status===1||e.status===128);
 assert.equal(ensureCombinedOriginalGpSource(f).fetched,true);
 for(const blob of f.blobs)assert.equal(f.run(f.client,['cat-file','-t',blob]).trim(),'blob');
});
test('incomplete post-fetch closure remains rejected rather than becoming source admission',t=>{
 const f=nativeFixture(t),git=args=>args[0]==='fetch'?'':f.git(args);
 assert.throws(()=>ensureCombinedOriginalGpSource({...f,git}),/object|available|revision|original/i);
});
