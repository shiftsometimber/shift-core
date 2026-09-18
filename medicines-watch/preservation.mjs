export const TREATMENTS_ENTRY_START='<!-- SHIFT_MEDICINES_WATCH_ENTRY_START -->';
export const TREATMENTS_ENTRY_END='<!-- SHIFT_MEDICINES_WATCH_ENTRY_END -->';
export const TREATMENTS_ENTRY=TREATMENTS_ENTRY_START+'<style data-medicines-watch-entry-style>.sst-medicines-watch-entry{box-sizing:border-box;display:flex;align-items:center;justify-content:space-between;gap:24px;max-width:1180px;margin:32px auto;padding:24px;background:#050505;border:1px solid #707762;border-radius:18px;color:#E7E3DA;font-family:Arial,Helvetica,sans-serif}.sst-medicines-watch-entry h2{margin:0 0 8px;color:#E7E3DA;font-size:clamp(1.35rem,3vw,1.8rem);line-height:1.2}.sst-medicines-watch-entry p{margin:0;max-width:660px;color:#E7E3DA;font-size:1rem;line-height:1.5}.sst-medicines-watch-entry a{display:inline-flex;align-items:center;justify-content:center;flex-shrink:0;min-height:44px;padding:12px 18px;border:1px solid #707762;border-radius:999px;background:#E7E3DA;color:#454D39;font-size:1rem;font-weight:700;text-align:center;text-decoration:none}.sst-medicines-watch-entry a:hover{text-decoration:underline}.sst-medicines-watch-entry a:focus-visible{outline:3px solid #E7E3DA;outline-offset:4px}@media(max-width:700px){.sst-medicines-watch-entry{flex-direction:column;align-items:stretch;gap:18px;margin:24px 16px;padding:20px}.sst-medicines-watch-entry a{align-self:flex-start}}</style><section class="sst-medicines-watch-entry" data-medicines-watch-entry aria-labelledby="medicines-watch-entry-title"><div><h2 id="medicines-watch-entry-title">Medicines &amp; Peptides Watch</h2><p>UK authorisation, access and emerging evidence — with sources and review dates.</p></div><a href="/treatment-centre/medicines-watch">Explore the watch <span aria-hidden="true">&nbsp;→</span></a></section>'+TREATMENTS_ENTRY_END;

// Keep this module safe to import into the Worker for its entry markup.
// The verification caller supplies SHA-256; no Node modules enter that bundle.
const requireThat=(condition,message)=>{if(!condition)throw Error(message)};
const equal=(actual,expected,message)=>requireThat(actual===expected,message);

function normaliseTreatments(body,required){
 const html=body.toString('utf8');
 requireThat(Buffer.from(html).equals(body),'Treatment Centre must be valid UTF-8');
 const markers=html.match(/SHIFT_MEDICINES_WATCH_ENTRY_/g)||[];
 if(markers.length===0){
  requireThat(!required,'Treatment Centre is missing the Medicines Watch entry');
  return {body,entry:false};
 }
 equal(markers.length,2,'Treatment Centre has duplicate or malformed Medicines Watch markers');
 const start=html.indexOf(TREATMENTS_ENTRY_START),end=html.indexOf(TREATMENTS_ENTRY_END);
 requireThat(start>=0&&end>start,'Treatment Centre has malformed Medicines Watch markers');
 const block=html.slice(start,end+TREATMENTS_ENTRY_END.length);
 equal(block,TREATMENTS_ENTRY,'Treatment Centre Medicines Watch entry differs from approved source');
 return {body:Buffer.from(html.slice(0,start)+html.slice(end+TREATMENTS_ENTRY_END.length)),entry:true};
}

// Exact source-reviewed pre/post blocks. This is a preservation allowlist, not a wildcard.
export const TREATMENT_RELATED_LEGACY="<section data-shift-link-repair aria-label=\"Related existing guides\"><h2>Planning around treatment</h2><ul><li><a href=\"/articles/travelling-with-weight-loss-medication\">Travelling with weight-loss medication: sort the boring bits before the airport</a></li></ul></section>";
export const TREATMENT_RELATED_CURRENT="<section data-shift-link-repair aria-label=\"Related existing guides\"><h2>Compare the options Google is already finding</h2><ul><li><a href=\"/comparisons/medications/mounjaro-vs-saxenda\">Mounjaro vs Saxenda</a></li><li><a href=\"/comparisons/medications/mounjaro-vs-orlistat\">Mounjaro vs Orlistat</a></li><li><a href=\"/comparisons/medications/wegovy-vs-saxenda\">Wegovy vs Saxenda</a></li><li><a href=\"/guides/nhs-weight-loss-medication-pathways\">NHS weight-loss medication pathways</a></li></ul><h2>Planning around treatment</h2><ul><li><a href=\"/articles/travelling-with-weight-loss-medication\">Travelling with weight-loss medication: sort the boring bits before the airport</a></li></ul></section>";
function normaliseTreatmentRelatedGuide(body){
 const html=body.toString('utf8');
 requireThat(Buffer.from(html).equals(body),'Treatment Centre related guides must be valid UTF-8');
 // CSS selectors may mention this attribute many times; count section elements only.
 const markers=[...html.matchAll(/<section\b[^>]*\bdata-shift-link-repair(?:\s|>|=)[^>]*>/gi)];
 equal(markers.length,1,'Treatment Centre must contain exactly one Git-controlled related-guide section');
 const start=markers[0].index,close=html.indexOf('</section>',start);
 requireThat(close>start,'Treatment Centre related-guide section is malformed');
 const end=close+'</section>'.length,block=html.slice(start,end);
 requireThat(block===TREATMENT_RELATED_LEGACY||block===TREATMENT_RELATED_CURRENT,'Treatment Centre related-guide section differs from exact approved source');
 // Retain a fixed block at the same location; moving it changes the fingerprint.
 return {body:Buffer.from(html.slice(0,start)+TREATMENT_RELATED_LEGACY+html.slice(end)),relatedGuide:true,revision:block===TREATMENT_RELATED_CURRENT?'current':'legacy'};
}

const SHIFT_HEALTH_TWITTER_IMAGE='<meta name="twitter:image" content="https://shiftsometimber.co.uk/assets/og-default.jpg">';
function normaliseShiftHealthTwitterImage(body){
 const html=body.toString('utf8');
 requireThat(Buffer.from(html).equals(body),'SHIFT Health must be valid UTF-8');
 const matches=html.split(SHIFT_HEALTH_TWITTER_IMAGE).length-1;
 requireThat(matches<=1,'SHIFT Health has duplicate approved Twitter images');
 return {body:Buffer.from(html.replace(SHIFT_HEALTH_TWITTER_IMAGE,'')),twitterImage:matches===1};
}

export function publicPageEvidence(path,status,input,{requireTreatmentsEntry=false,hash}={}){
 requireThat(typeof hash==='function','Public preservation requires a SHA-256 function');
 const body=Buffer.isBuffer(input)?input:Buffer.from(input);
 let preserved;
 if(path==='/treatment-centre'){
  const related=normaliseTreatmentRelatedGuide(body);
  const treatments=normaliseTreatments(related.body,requireTreatmentsEntry);
  preserved={body:treatments.body,entry:treatments.entry,relatedGuide:true,revision:related.revision,authoritySha256:hash(related.body),authorityBytes:related.body.length};
 }else preserved=path==='/shift-health'?normaliseShiftHealthTwitterImage(body):{body,entry:false};
 return {path,status,sha256:hash(body),bytes:body.length,preservedSha256:hash(preserved.body),preservedBytes:preserved.body.length,...(path==='/treatment-centre'?{treatmentsWatchEntry:preserved.entry,relatedGuide:preserved.relatedGuide,relatedGuideRevision:preserved.revision,authoritySha256:preserved.authoritySha256,authorityBytes:preserved.authorityBytes}:path==='/shift-health'?{shiftHealthTwitterImage:preserved.twitterImage}:{})};
}

export function assertPublicPagesPreserved(pages,baseline){
 equal(JSON.stringify(pages.map(x=>x.path)),JSON.stringify(baseline.map(x=>x.path)),'Public preservation paths changed');
 let entryAdded=false,authorityChanged=false;
 for(let i=0;i<pages.length;i++){
  const current=pages[i],before=baseline[i];
  equal(current.status,before.status,current.path+' response status changed');
  if(current.path==='/treatment-centre'){
   equal(current.treatmentsWatchEntry,true,'Treatment Centre is missing the approved Medicines Watch entry');
   equal(current.relatedGuide,true,'Treatment Centre is missing its Git-controlled related-guide section');
   equal(before.relatedGuide,true,'Treatment Centre baseline is missing its Git-controlled related-guide section');
   equal(current.preservedSha256,before.preservedSha256,'Treatment Centre content changed outside approved generated sections');
   equal(current.preservedBytes,before.preservedBytes,'Treatment Centre size changed outside approved generated sections');
   if(!before.treatmentsWatchEntry)entryAdded=true;
   else{
    equal(current.authoritySha256,before.authoritySha256,'Treatment Centre content changed outside the exact approved related-guide update');
    equal(current.authorityBytes,before.authorityBytes,'Treatment Centre size changed outside the exact approved related-guide update');
   }
   authorityChanged ||= current.relatedGuideRevision!==before.relatedGuideRevision;
   continue;
  }
  if(current.path==='/shift-health'){
   if(before.shiftHealthTwitterImage)equal(current.shiftHealthTwitterImage,true,'SHIFT Health is missing the approved Twitter image');
   equal(current.preservedSha256,before.preservedSha256,'SHIFT Health changed outside its approved Twitter image');
   equal(current.preservedBytes,before.preservedBytes,'SHIFT Health size changed outside its approved Twitter image');
   continue;
  }
  equal(current.sha256,before.sha256,current.path+' changed outside the approved Treatments addition');
  equal(current.bytes,before.bytes,current.path+' response size changed');
 }
 return entryAdded?'preserved_with_treatments_watch_entry':authorityChanged?'preserved_with_exact_authority_links':'identical';
}
