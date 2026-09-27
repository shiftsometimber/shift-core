import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {archiveBatch} from '../editorial/uk-archive-20260913.mjs';
import {verifyEvidence,isRelevantRadarRow} from '../radar-integration-v1.js';

const batchId='REC-036-UK-archive-20260913';
const authorities=new Map([
 ['NHS England',['www.england.nhs.uk','digital.nhs.uk','www.nhs.uk']],
 ['MHRA',['www.gov.uk']],['NICE',['www.nice.org.uk']],
 ['Department of Health and Social Care',['www.gov.uk']],
 ['Welsh Government',['www.gov.wales']],['Scottish Government',['www.gov.scot']],
 ['Department of Health Northern Ireland',['www.health-ni.gov.uk']],
 ['Mental Health UK',['mentalhealth-uk.org']],['UCL',['www.ucl.ac.uk']]
]);
const normalise=value=>String(value||'').replace(/\/$/,'');
const slugSet=new Set();
for(const article of archiveBatch){
 assert.ok(['UK','England','Scotland','Wales','Northern Ireland'].includes(article.region));
 assert.ok(article.date>='2025-03-13'&&article.date<='2026-09-13');
 assert.ok(authorities.get(article.authority)?.includes(new URL(article.evidence[0].url).hostname));
 assert.ok(article.evidence.every(s=>new URL(s.url).protocol==='https:'&&[1,2].includes(s.source_tier)));
 assert.equal(verifyEvidence(article.evidence).verified,true);
 assert.ok(isRelevantRadarRow({headline:article.headline,region:article.region,regulator:article.authority}));
 assert.ok(article.body.split(/\s+/).length>=175,article.slug+' too short');
 assert.ok(article.content.seo.description.length>=70);
 assert.ok(article.content.article_markdown.includes('UK archive review'));
 assert.deepEqual(article.content.destinations,['medicine_news','knowledge_links','search','sitemap']);
 assert.ok(!slugSet.has(article.content.seo.slug));slugSet.add(article.content.seo.slug);
}
assert.equal(archiveBatch.length,16);
if(!process.argv.includes('--remote')){
 console.log('PASS: 16 original UK archive packages; source, date, evidence, relevance and web-only destination checks.');
 process.exit(0);
}
const account=process.env.CLOUDFLARE_ACCOUNT_ID,token=process.env.CLOUDFLARE_API_TOKEN;
assert.equal(account,'9e5386dcf455be34c582d93f8bfc79e6');assert.ok(token);
const database='88f40aed-cb23-4372-8c94-8a73f48bc847';
async function query(sql,params=[]){
 const response=await fetch(`https://api.cloudflare.com/client/v4/accounts/${account}/d1/database/${database}/query`,{method:'POST',headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:JSON.stringify({sql,params})});
 const body=await response.json();assert.ok(response.ok&&body.success,JSON.stringify(body.errors));
 for(const result of body.result||[])assert.notEqual(result.success,false);
 return body.result?.[0]||{};
}
const existing=(await query('SELECT * FROM radar_events')).results||[];
const beforeCounts=(await query("SELECT region,status,COUNT(*) count FROM radar_events GROUP BY region,status")).results;
const prepared=[],skipped=[];
for(const article of archiveBatch){
 const eventKey=createHash('sha256').update(batchId+'|'+article.slug).digest('hex');
 const urls=new Set(article.evidence.map(s=>normalise(s.url)));
 const matches=existing.filter(row=>row.event_key===eventKey||JSON.parse(row.content_package_json||'{}').seo?.slug===article.content.seo.slug||JSON.parse(row.source_evidence_json||'[]').some(s=>urls.has(normalise(s.url))));
 // A shared contextual source is not the article's original report.
 const exact=matches.filter(row=>row.event_key===eventKey||JSON.parse(row.content_package_json||'{}').seo?.slug===article.content.seo.slug||JSON.parse(row.source_evidence_json||'[]').some(s=>normalise(s.url)===normalise(article.evidence[0].url)));
 assert.ok(exact.length<=1,`Ambiguous original-source match: ${article.slug}`);
 let row=exact[0];
 if(row&&['approved','published','hold','withdrawn','rejected','publish_failed'].includes(row.status)){skipped.push({id:row.id,status:row.status,slug:article.slug});continue;}
 if(row)assert.ok(['detected','verified','needs_more_evidence','ready_for_review'].includes(row.status));
 const now=new Date().toISOString(), verification=verifyEvidence(article.evidence);
 const evidence=article.evidence.map(s=>({...s,retrieved_at:now}));
 const content={...article.content,archive:{batch:batchId,original_source_date:article.date,reviewed_on:'2026-09-13'},seo:{...article.content.seo,datePublished:now,dateModified:now}};
 const note='UK-only archive requested by owner. Original reporting and source dates reviewed 13 September 2026. Prepared for the existing HQ approval/publication flow; no approval or publication performed by this importer.';
 if(row){
  const change=await query("UPDATE radar_events SET headline=?,region=?,regulator=?,event_type='uk_archive_review',status='ready_for_review',confidence_score=?,clinical=?,requires_review=1,source_evidence_json=?,verification_json=?,medicine_patch_json='{}',content_package_json=?,review_note=?,updated_at=? WHERE id=? AND status=? AND updated_at=?",[article.headline,article.region,article.authority,verification.confidence,/MHRA|NICE/.test(article.authority)?1:0,JSON.stringify(evidence),JSON.stringify(verification),JSON.stringify(content),note,now,row.id,row.status,row.updated_at]);
  assert.equal(change.meta?.changes,1,'Queue changed while preparing draft');
 }else{
  await query("INSERT INTO radar_events(event_key,status,headline,region,regulator,event_type,relevance_score,urgency_score,confidence_score,clinical,requires_review,source_evidence_json,verification_json,medicine_patch_json,content_package_json,review_note,created_at,updated_at) VALUES(?,'ready_for_review',?,?,?,'uk_archive_review',80,45,?,?,1,?,?,'{}',?,?,?,?)",[eventKey,article.headline,article.region,article.authority,verification.confidence,/MHRA|NICE/.test(article.authority)?1:0,JSON.stringify(evidence),JSON.stringify(verification),JSON.stringify(content),note,now,now]);
  row=(await query('SELECT id FROM radar_events WHERE event_key=?',[eventKey])).results[0];
 }
 await query('INSERT INTO radar_audit(event_id,action,actor,detail_json,created_at) VALUES(?,?,?,?,?)',[row.id,'archive_draft_prepared','codex_archive_preparation',JSON.stringify({batch:batchId,original_source_date:article.date,destinations:content.destinations,previous:exact[0]||null,verification,approval_performed:false,publication_performed:false}),now]);
 prepared.push({id:row.id,headline:article.headline,slug:content.seo.slug,region:article.region,original_source_date:article.date,status:'ready_for_review'});
}
const afterCounts=(await query("SELECT region,status,COUNT(*) count FROM radar_events GROUP BY region,status")).results;
const eligible=(await query("SELECT id,headline,status FROM radar_events WHERE status='ready_for_review' AND json_extract(verification_json,'$.verified')=1 AND length(json_extract(content_package_json,'$.article_markdown'))>=100 AND json_array_length(json_extract(content_package_json,'$.known_facts'))>0")).results;
fs.writeFileSync('uk-archive-preparation.json',JSON.stringify({batchId,prepared,skipped,beforeCounts,afterCounts,eligibleForReview:eligible},null,2));
console.log(JSON.stringify({batchId,prepared,skipped,eligibleForReview:eligible},null,2));
