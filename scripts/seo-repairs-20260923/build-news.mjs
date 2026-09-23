import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {ARTICLE_CORRECTIONS,SOURCE_DATES} from '../../editorial/seo-repairs-20260923/corrections.mjs';

export const digest = value=>createHash('sha256').update(value).digest('hex');
export function prepareNews(snapshot,modifiedAt){
 assert(/^2026-09-23T/.test(modifiedAt),'Candidate review date changed; refresh the dated review before publication');
 const seen=new Set(),dateSeen=new Set(),changes=[];
 const news=snapshot.news.map(row=>{
  const content=JSON.parse(row.content_package_json),sources=JSON.parse(row.source_evidence_json);let changed=false;
  const edit=ARTICLE_CORRECTIONS.find(x=>x.id===row.id);
  if(edit){
   assert.equal(content.seo.slug,edit.slug);assert(sources.some(x=>x.url===edit.source));seen.add(edit.id);
   Object.assign(content,{headline:edit.headline,standfirst:edit.standfirst,what_changed:edit.standfirst,article_markdown:edit.article_markdown,shift_take:edit.shift_take,why_it_matters_to_uk:'',known_facts:[{claim:edit.fact,source_url:edit.source}],unknowns:['The cited work does not establish individual treatment suitability or a change to UK guidance.'],safety:edit.safety,ticker_line:edit.headline});
   const titles={275:'How GLP-1 Medicines Are Designed to Last Longer | SHIFT',188:'GLP-1 Nutrition Preprint: Findings and Limits | SHIFT',223:'Nutrition During Incretin Treatment: Review Findings',217:'GIP Receptor Activation vs Blockade: Research | SHIFT'};
   content.seo={...content.seo,title:titles[row.id],description:edit.description};
   content.shift_brain={...content.shift_brain,summary:edit.standfirst,facts:[{fact:edit.fact,source_url:edit.source}]};
   content.editorial_correction={scope:'Source type, findings, limitations and source dates corrected',prepared_at:modifiedAt,independent_clinical_review:false};
   changed=true;
  }
  const revisedSources=sources.map(source=>{
   const date=SOURCE_DATES.find(x=>new RegExp('/'+x.pmid+'/?$').test(source.url||''));
   if(date){dateSeen.add(date.pmid);changed=true;const {pmid,...fields}=date;return {...source,...fields};}
   if(edit?.evidence_type&&source.url===edit.source)return {...source,evidence_type:edit.evidence_type,online_publication_date:edit.online_publication_date,metadata_checked_at:'2026-09-23'};
   return source;
  });
  if(!changed)return row;
  content.seo.dateModified=modifiedAt;
  const after={...row,content_package_json:JSON.stringify(content),source_evidence_json:JSON.stringify(revisedSources),updated_at:modifiedAt};
  // Preserve first SHIFT publication and review decisions; do not manufacture sign-off.
  for(const k of ['id','first_published_at','reviewed_at','created_at'])assert.equal(after[k],row[k]);
  assert.equal(JSON.parse(after.content_package_json).seo.slug,JSON.parse(row.content_package_json).seo.slug);
  changes.push({id:row.id,slug:content.seo.slug,before:row,after,beforeContentSha256:digest(row.content_package_json),afterContentSha256:digest(after.content_package_json),beforeSourceSha256:digest(row.source_evidence_json),afterSourceSha256:digest(after.source_evidence_json)});
  return after;
 });
 assert.equal(seen.size,4);assert.equal(dateSeen.size,11);
 return {news,articles:snapshot.articles,changes,modifiedAt};
}
const sqlQuote=value=>value==null?'NULL':"'"+String(value).replaceAll("'","''")+"'";
export function correctionSQL(changes,modifiedAt){
 assert(changes.length>=13&&changes.length<=16);
 const guards=changes.map(({before:r})=>'EXISTS(SELECT 1 FROM radar_events WHERE id='+Number(r.id)+" AND status='published' AND content_package_json="+sqlQuote(r.content_package_json)+' AND source_evidence_json='+sqlQuote(r.source_evidence_json)+' AND updated_at IS '+sqlQuote(r.updated_at)+' AND reviewed_at IS '+sqlQuote(r.reviewed_at)+')').join(' AND ');
 const values=field=>'CASE id '+changes.map(x=>'WHEN '+Number(x.id)+' THEN '+sqlQuote(x.after[field])).join(' ')+' ELSE '+field+' END';
 const update='UPDATE radar_events SET content_package_json='+values('content_package_json')+',source_evidence_json='+values('source_evidence_json')+',updated_at='+sqlQuote(modifiedAt)+' WHERE id IN('+changes.map(x=>Number(x.id)).join(',')+') AND '+guards+';';
 const detail=sqlQuote(JSON.stringify({scope:'Owner-requested informational editorial correction',candidate_modified_at:modifiedAt,ids:changes.map(x=>x.id),independent_clinical_review:false,publication_order_preserved:true}));
 const audit='INSERT INTO radar_audit(event_id,action,actor,detail_json) '+changes.map(x=>'SELECT '+Number(x.id)+",'editorial_correction','owner-authorised-seo-20260923',"+detail+' WHERE changes()='+changes.length).join(' UNION ALL ')+';';
 return '-- CANDIDATE ONLY. Not executed against production. One all-or-none guarded UPDATE.\n'+update+'\n'+audit+'\n';
}
if(process.argv[1]?.endsWith('/build-news.mjs')){
 const input=process.argv[2]||'seo-news-snapshot/published.json',out=process.argv[3]||'preview/seo-repairs/generated';
 const snapshot=JSON.parse(readFileSync(input,'utf8'));const candidate=prepareNews(snapshot,new Date().toISOString());
 mkdirSync(out,{recursive:true});
 writeFileSync(out+'/fixtures.mjs','export const news='+JSON.stringify(candidate.news)+';\nexport const articles='+JSON.stringify(candidate.articles)+';\n');
 writeFileSync(out+'/changes.json',JSON.stringify(candidate.changes,null,2));
 writeFileSync(out+'/candidate.sql',correctionSQL(candidate.changes,candidate.modifiedAt));
 writeFileSync(out+'/summary.json',JSON.stringify({candidate:true,productionWrites:0,changedRecords:candidate.changes.length,articleRewrites:4,sourceDateRecords:11,modifiedAt:candidate.modifiedAt,changes:candidate.changes.map(({id,slug,beforeContentSha256,afterContentSha256,beforeSourceSha256,afterSourceSha256})=>({id,slug,beforeContentSha256,afterContentSha256,beforeSourceSha256,afterSourceSha256}))},null,2));
 console.log('Prepared',candidate.changes.length,'guarded public records. Zero production writes.');
}
