import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {existsSync,readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
export const ORIGINAL_GP_SOURCE='fd2782d745295ee9fd80a28ed7eae642aedc566d';
export const ORIGINAL_GP_TREE='4663a5fd968343c29e70322d148e7dc8d598f094';
export const ORIGINAL_GP_BLOBS=Object.freeze({'hq-management-entry.mjs':'f14b4245a0b8a7db2b59ee993e4f30ddb080700d','hq-management-api.mjs':'0fe7b82f4a082d575c09ecf9034962251898cabf'});
const rawGit=args=>execFileSync('git',['--no-replace-objects',...args],{encoding:'utf8',maxBuffer:64e6});
const fileState=path=>existsSync(path)?createHash('sha256').update(readFileSync(path)).digest('hex'):null;
function transportState(git,state){
 assert.equal(git(['for-each-ref','refs/replace','--format=%(refname)']).trim(),'','Original GP provenance rejects replacement objects');
 const graft=git(['rev-parse','--git-path','info/grafts']).trim();assert.equal(state(graft),null,'Original GP provenance rejects graft metadata');
 return {head:git(['rev-parse','HEAD']).trim(),tree:git(['rev-parse','HEAD^{tree}']).trim(),refs:git(['for-each-ref','--format=%(refname) %(objectname)']),tracked:git(['status','--porcelain','--untracked-files=no']),staged:git(['diff','--cached','--name-status']),index:state(git(['rev-parse','--git-path','index']).trim()),fetchHead:state(git(['rev-parse','--git-path','FETCH_HEAD']).trim())};
}
// Object availability only. Actual source admission remains the unchanged finite/ancestry/payload proofs.
export function ensureCombinedOriginalGpSource({git=rawGit,state=fileState}={}){
 const before=transportState(git,state);let fetched=false;
 try{git(['cat-file','-e',ORIGINAL_GP_SOURCE+'^{commit}']);}
 catch(error){
  if(error.status!==128)throw error;
  const origin=git(['remote','get-url','origin']).trim();
  assert(['https://github.com/shiftsometimber/shift-core','https://github.com/shiftsometimber/shift-core.git','git@github.com:shiftsometimber/shift-core.git'].includes(origin),'Only the established shift-core origin can supply the exact original GP object');
  git(['fetch','--no-tags','--no-write-fetch-head','origin',ORIGINAL_GP_SOURCE]);fetched=true;
 }
 assert.equal(git(['cat-file','-t',ORIGINAL_GP_SOURCE]).trim(),'commit','Original GP source object must be a commit');
 assert.equal(git(['rev-parse',ORIGINAL_GP_SOURCE+'^{tree}']).trim(),ORIGINAL_GP_TREE,'Exact original GP tree required');
 for(const [path,expected]of Object.entries(ORIGINAL_GP_BLOBS))assert.equal(git(['rev-parse',ORIGINAL_GP_SOURCE+':'+path]).trim(),expected,'Exact original GP path/blob required: '+path);
 assert.deepEqual(transportState(git,state),before,'Immutable GP object transport must preserve HEAD/tree/refs/index/tracked/staged/FETCH_HEAD');
 return Object.freeze({source:ORIGINAL_GP_SOURCE,tree:ORIGINAL_GP_TREE,fetched,sourceAdmission:false,refsChanged:false});
}
