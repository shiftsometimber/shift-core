import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {TREATMENTS_ENTRY,TREATMENTS_ENTRY_START,TREATMENTS_ENTRY_END,publicPageEvidence as fingerprint,assertPublicPagesPreserved} from './preservation.mjs';
const publicPageEvidence=(path,status,body,options={})=>fingerprint(path,status,body,{...options,hash:input=>createHash('sha256').update(input).digest('hex')});

const paths=['/','/start-here','/programme','/shift-health','/treatment-centre','/about','/explore-knowledge','/shop','/work-with-us','/member-login','/turnstile-auth-v1.js?v=timeout-20260912'];
const treatment='<html><main><h1>Treatments</h1><p>Existing approved content.</p></main></html>';
const withEntry=treatment.replace('</main>',TREATMENTS_ENTRY+'</main>');
const evidence=(entry=false)=>paths.map(path=>publicPageEvidence(path,200,path==='/treatment-centre'?(entry?withEntry:treatment):'Unchanged '+path,{requireTreatmentsEntry:entry}));

test('permits only the exact Treatments addition and retains raw hashes and sizes',()=>{
 const before=evidence(),after=evidence(true),old=before[4],now=after[4];
 assert.equal(assertPublicPagesPreserved(after,before),'preserved_with_treatments_watch_entry');
 assert.notEqual(now.sha256,old.sha256);
 assert.equal(now.bytes-old.bytes,Buffer.byteLength(TREATMENTS_ENTRY));
 assert.equal(now.preservedSha256,old.sha256);
 assert.equal(now.preservedBytes,old.bytes);
 assert.equal(assertPublicPagesPreserved(after,after),'identical');
});

test('unrelated Treatment Centre changes still fail',()=>{
 const after=evidence(true);
 after[4]=publicPageEvidence('/treatment-centre',200,withEntry.replace('Existing approved content.','Changed content.'),{requireTreatmentsEntry:true});
 assert.throws(()=>assertPublicPagesPreserved(after,evidence()),/content changed outside/);
});

test('every other public page and the login asset remain byte-exact',()=>{
 for(let i=0;i<paths.length;i++){
  if(paths[i]==='/treatment-centre')continue;
  const after=evidence(true);
  after[i]=publicPageEvidence(paths[i],200,'Unchanged '+paths[i]+TREATMENTS_ENTRY);
  assert.throws(()=>assertPublicPagesPreserved(after,evidence()),/changed outside/);
 }
});

test('missing, duplicate, reversed, malformed or altered entries are rejected',()=>{
 assert.throws(()=>publicPageEvidence('/treatment-centre',200,treatment,{requireTreatmentsEntry:true}),/missing/);
 for(const block of [TREATMENTS_ENTRY+TREATMENTS_ENTRY,TREATMENTS_ENTRY_START,TREATMENTS_ENTRY_END,TREATMENTS_ENTRY_END+TREATMENTS_ENTRY_START,TREATMENTS_ENTRY.replace('<!-- SHIFT_MEDICINES_WATCH_ENTRY_START -->','<!--SHIFT_MEDICINES_WATCH_ENTRY_START-->'),TREATMENTS_ENTRY.replace('Explore the watch','Unexpected wording')]){
  assert.throws(()=>publicPageEvidence('/treatment-centre',200,treatment.replace('</main>',block+'</main>'),{requireTreatmentsEntry:true}),/markers|differs/);
 }
 assert.throws(()=>assertPublicPagesPreserved(evidence(),evidence()),/missing/);
});

test('future releases cannot move an existing entry or change preservation paths',()=>{
 const after=evidence(true);
 after[4]=publicPageEvidence('/treatment-centre',200,TREATMENTS_ENTRY+treatment,{requireTreatmentsEntry:true});
 assert.throws(()=>assertPublicPagesPreserved(after,evidence(true)),/changed outside/);
 assert.throws(()=>assertPublicPagesPreserved(evidence(true).slice(1),evidence()),/paths changed/);
});
