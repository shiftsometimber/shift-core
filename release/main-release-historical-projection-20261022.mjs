import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {
  MAIN_RELEASE_BASE,
  verifyMainReleaseReadinessExtension
} from './main-release-readiness-scope-20261021.mjs';

const git=(...args)=>execFileSync('git',['--no-replace-objects',...args],{encoding:'utf8',maxBuffer:64e6}).trimEnd();
const content=(ref,path)=>execFileSync('git',['--no-replace-objects','show',ref+':'+path],{encoding:'utf8',maxBuffer:64e6});
const blob=(ref,path)=>git('rev-parse',ref+':'+path);
let cached=null;

function exists(ref,path){return git('ls-tree',ref,'--',path).startsWith('100644 blob ')||git('ls-tree',ref,'--',path).startsWith('040000 tree ');}
function clean(){
  assert.equal(git('diff','--no-renames','--name-only','HEAD','--'),'','Current-main historical projection requires clean tracked source');
  assert.equal(git('diff','--no-renames','--cached','--name-only','--'),'','Current-main historical projection requires a clean index');
}
function state(){
  const actual=git('rev-parse','HEAD');
  clean();
  if(cached?.actual!==actual){
    const verified=verifyMainReleaseReadinessExtension();
    assert.equal(verified.actual,actual,'Current-main historical projection requires the verified release head');
    const changed=git('diff','--no-renames','--name-only',MAIN_RELEASE_BASE,actual).split('\n').filter(Boolean);
    cached=Object.freeze({actual,changed:new Set(changed)});
  }
  assert.equal(git('rev-parse','HEAD'),cached.actual,'Current-main historical projection source HEAD moved');
  return cached;
}
function affected(path,s){return s.changed.has(path)||[...s.changed].some(item=>item.startsWith(path+'/'));}
function authentic(value,ref,path,s){
  const resolved=ref==='HEAD'?s.actual:ref;
  if(value===blob(resolved,path)||value===content(resolved,path))return true;
  const expected=content(resolved,path),prefix='tree '+resolved+':'+path+'\n';
  return expected.startsWith(prefix)&&value===expected.replace(prefix,'tree '+ref+':'+path+'\n');
}

export function mainReleaseHistoricalReader(reader=null,{defaultReader=reader===null}={}){
  const s=state(),source=defaultReader?(ref,path)=>blob(ref==='HEAD'?s.actual:ref,path):reader;
  assert.equal(typeof source,'function','Current-main historical projection requires a reader');
  return(ref,path)=>{
    const current=ref==='HEAD'||ref===s.actual;
    if(current&&affected(path,s)&&exists(MAIN_RELEASE_BASE,path)){
      if(!defaultReader){
        assert(authentic(source('HEAD',path),'HEAD',path,s),'Current-main historical reader drift at HEAD: '+path);
        assert(authentic(source(s.actual,path),s.actual,path,s),'Current-main historical reader drift at raw HEAD: '+path);
      }
      return source(MAIN_RELEASE_BASE,path);
    }
    return source(defaultReader&&ref==='HEAD'?s.actual:ref,path);
  };
}

export function mainReleaseHistoricalAffected(path){
  const s=state();
  return affected(path,s)&&exists(MAIN_RELEASE_BASE,path);
}

export function mainReleaseHistoricalContent(reader=null,{defaultReader=reader===null}={}){
  const s=state(),source=defaultReader?(ref,path)=>content(ref==='HEAD'?s.actual:ref,path):reader;
  assert.equal(typeof source,'function','Current-main historical projection requires a content reader');
  return(ref,path)=>{
    const current=ref==='HEAD'||ref===s.actual;
    if(current&&affected(path,s)&&exists(MAIN_RELEASE_BASE,path)){
      if(!defaultReader){
        assert.equal(source('HEAD',path),content(s.actual,path),'Current-main historical content drift at HEAD: '+path);
        assert.equal(source(s.actual,path),content(s.actual,path),'Current-main historical content drift at raw HEAD: '+path);
      }
      return source(MAIN_RELEASE_BASE,path);
    }
    return source(defaultReader&&ref==='HEAD'?s.actual:ref,path);
  };
}

export function mainReleaseHistoricalFile(path,bytes){
  const s=state();
  assert.equal(bytes,content(s.actual,path),'Current-main historical fixture requires exact current bytes: '+path);
  return affected(path,s)&&exists(MAIN_RELEASE_BASE,path)?content(MAIN_RELEASE_BASE,path):bytes;
}

