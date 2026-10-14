import {COMBINED_FINITE_MAINTENANCE,COMBINED_FINITE_RECORD} from '../release/combined-finite-scope-20261014.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {ensureCombinedOriginalGpSource,ORIGINAL_GP_SOURCE,ORIGINAL_GP_TREE,ORIGINAL_GP_BLOBS} from '../release/combined-original-gp-object-20261014.mjs';
function fixture({missing=false,origin='https://github.com/shiftsometimber/shift-core.git',tree=ORIGINAL_GP_TREE,blob,replace='',graft=null,fetchDrift=false,unexpectedStatus=false}={}){
 const calls=[];let fetched=false;
 const git=args=>{calls.push(args);const [op,...a]=args;
  if(op==='for-each-ref')return a[0]==='refs/replace'?replace:'refs/heads/main aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa\n';
  if(op==='status'||op==='diff')return '';
  if(op==='rev-parse'&&a[0]==='--git-path')return '/fixture/'+a[1];
  if(op==='rev-parse'&&a[0]==='HEAD')return (fetched&&fetchDrift?'b':'a').repeat(40);
  if(op==='rev-parse'&&a[0]==='HEAD^{tree}')return 'c'.repeat(40);
  if(op==='remote')return origin;
  if(op==='cat-file'&&a[0]==='-e'){if(missing&&!fetched){const e=new Error('missing immutable object');e.status=unexpectedStatus?1:128;throw e;}return '';}
  if(op==='fetch'){assert.deepEqual(args,['fetch','--no-tags','--no-write-fetch-head','origin',ORIGINAL_GP_SOURCE]);fetched=true;return '';}
  if(op==='cat-file'&&a[0]==='-t')return 'commit';
  if(op==='rev-parse'&&a[0]===ORIGINAL_GP_SOURCE+'^{tree}')return tree;
  if(op==='rev-parse'&&a[0].startsWith(ORIGINAL_GP_SOURCE+':'))return blob??ORIGINAL_GP_BLOBS[a[0].slice(41)];
  throw new Error('Unexpected provenance transport query: '+JSON.stringify(args));
 };
 return {git,state:path=>path.endsWith('info/grafts')?graft:null,calls};
}
test('only one missing approved immutable object is fetched without changing refs or file state',()=>{
 const f=fixture({missing:true}),r=ensureCombinedOriginalGpSource(f);assert.equal(r.fetched,true);assert.equal(r.source,ORIGINAL_GP_SOURCE);assert.equal(r.sourceAdmission,false);assert.equal(f.calls.filter(a=>a[0]==='fetch').length,1);
});
test('present original object is checked exactly without reading origin or fetching',()=>{
 const f=fixture(),r=ensureCombinedOriginalGpSource(f);assert.equal(r.fetched,false);assert.equal(f.calls.some(a=>a[0]==='remote'||a[0]==='fetch'),false);
});
test('wrong origin, unexpected Git failure, wrong tree/path and transport drift cannot become provenance',()=>{
 for(const options of [{missing:true,origin:'https://github.com/other/shift-core.git'},{missing:true,unexpectedStatus:true},{tree:'d'.repeat(40)},{blob:'e'.repeat(40)},{missing:true,fetchDrift:true},{replace:'refs/replace/anything'},{graft:'digest'}])assert.throws(()=>ensureCombinedOriginalGpSource(fixture(options)));
});
test('actual admitted source retains immutable GP provenance and raw Git source state',()=>{
 const r=ensureCombinedOriginalGpSource();assert.equal(r.source,ORIGINAL_GP_SOURCE);assert.equal(r.tree,ORIGINAL_GP_TREE);assert.equal(typeof r.fetched,'boolean');assert.equal(r.sourceAdmission,false);assert.equal(r.refsChanged,false);assert.equal(ensureCombinedOriginalGpSource().fetched,false);
});

test('historical path admission includes exactly the current registered maintenance, including the two original-GP transport paths',()=>{assert.deepEqual([...COMBINED_FINITE_MAINTENANCE].sort(),[...COMBINED_FINITE_RECORD.maintenancePaths].sort());for(const path of ['release/combined-original-gp-object-20261014.mjs','tests/combined-original-gp-object-20261014.test.mjs'])assert.equal(COMBINED_FINITE_MAINTENANCE.includes(path),true);});
