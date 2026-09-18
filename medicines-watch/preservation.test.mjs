import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {TREATMENTS_ENTRY,TREATMENTS_ENTRY_START,TREATMENTS_ENTRY_END,publicPageEvidence as fingerprint,assertPublicPagesPreserved} from './preservation.mjs';
const publicPageEvidence=(path,status,body,options={})=>fingerprint(path,status,body,{...options,hash:input=>createHash('sha256').update(input).digest('hex')});

const paths=['/','/start-here','/programme','/shift-health','/treatment-centre','/about','/explore-knowledge','/shop','/work-with-us','/member-login','/turnstile-auth-v1.js?v=timeout-20260912'];
const relatedGuide='<section data-shift-link-repair aria-label="Related existing guides"><h2>Planning around treatment</h2><ul><li><a href="/articles/travelling-with-weight-loss-medication">Travelling with weight-loss medication</a></li></ul></section>';
const treatment='<html><main><h1>Treatments</h1><p>Existing approved content.</p>'+relatedGuide+'</main></html>';
const withEntry=treatment.replace('</main>',TREATMENTS_ENTRY+'</main>');
const evidence=(entry=false)=>paths.map(path=>publicPageEvidence(path,200,path==='/treatment-centre'?(entry?withEntry:treatment):'Unchanged '+path,{requireTreatmentsEntry:entry}));

test('permits only the exact Treatments addition and retains raw hashes and sizes',()=>{
 const before=evidence(),after=evidence(true),old=before[4],now=after[4];
 assert.equal(assertPublicPagesPreserved(after,before),'preserved_with_treatments_watch_entry');
 assert.notEqual(now.sha256,old.sha256);
 assert.equal(now.bytes-old.bytes,Buffer.byteLength(TREATMENTS_ENTRY));
 assert.equal(now.preservedSha256,old.preservedSha256);
 assert.equal(now.preservedBytes,old.preservedBytes);
 assert.equal(now.relatedGuide,true);
 assert.equal(assertPublicPagesPreserved(after,after),'identical');
});

test('Git-controlled Treatment Centre related links may change while surrounding content stays hash-locked',()=>{
 const before=evidence(),nextGuide=relatedGuide.replace('</ul>','<li><a href="/comparisons/medications/mounjaro-vs-saxenda">Mounjaro vs Saxenda</a></li></ul>'),after=evidence(true);
 after[4]=publicPageEvidence('/treatment-centre',200,withEntry.replace(relatedGuide,nextGuide),{requireTreatmentsEntry:true});
 assert.equal(assertPublicPagesPreserved(after,before),'preserved_with_treatments_watch_entry');
 assert.equal(after[4].relatedGuide,true);
 assert.equal(after[4].preservedSha256,before[4].preservedSha256);
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

test('permits only the exact approved SHIFT Health Twitter image addition',()=>{
 const tag='<meta name="twitter:image" content="https://shiftsometimber.co.uk/assets/og-default.jpg">';
 const before=evidence(),after=evidence(true),index=paths.indexOf('/shift-health');
 after[index]=publicPageEvidence('/shift-health',200,'Unchanged /shift-health'+tag);
 assert.equal(assertPublicPagesPreserved(after,before),'preserved_with_treatments_watch_entry');
 assert.equal(after[index].shiftHealthTwitterImage,true);
 assert.equal(after[index].preservedSha256,before[index].preservedSha256);
 for(const invalid of [tag+tag,tag.replace('og-default.jpg','wrong.jpg'),'<meta content="https://shiftsometimber.co.uk/assets/og-default.jpg" name="twitter:image">']){
  assert.throws(()=>{const changed=evidence(true);changed[index]=publicPageEvidence('/shift-health',200,'Unchanged /shift-health'+invalid);assertPublicPagesPreserved(changed,before)},/duplicate|missing|changed outside/);
 }
 const removed=evidence(true);removed[index]=publicPageEvidence('/shift-health',200,'Unchanged /shift-health');
 assert.throws(()=>assertPublicPagesPreserved(removed,after),/missing/);
});

test('missing or duplicated Treatment Centre related-guide sections are rejected',()=>{
 const noGuide=treatment.replace(relatedGuide,'');
 assert.throws(()=>publicPageEvidence('/treatment-centre',200,noGuide),/related-guide/);
 assert.throws(()=>publicPageEvidence('/treatment-centre',200,treatment.replace('</main>',relatedGuide+'</main>')),/exactly one/);
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
