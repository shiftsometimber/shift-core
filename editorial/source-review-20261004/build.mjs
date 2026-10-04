import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync,writeFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';

export const RELEASE='source-19-20261004';
export const STAMP='2026-10-04T09:30:00.000Z';
export const sha=value=>createHash('sha256').update(value).digest('hex');
export const literal=value=>value===null?'NULL':typeof value==='number'?String(value):"'"+String(value).replaceAll("'","''")+"'";
const equality=(row,keys)=>keys.map(key=>key+' IS '+literal(row[key])).join(' AND ');
const protectedKeys=['id','status','region','regulator','event_type','verification_json','reviewed_at','created_at'];
export function prepareCorrections(items){
 assert.equal(items.length,19);assert.equal(new Set(items.map(a=>a.id)).size,19);assert.equal(new Set(items.map(a=>a.slug)).size,19);
 return items.map(item=>{
  const before=item.before,old=JSON.parse(before.content_package_json),content=structuredClone(item.after_content);
  assert.equal(before.status,'published');assert.equal(before.id,item.id);assert.equal(old.seo.slug,item.slug);assert.equal(content.seo.slug,item.slug);
  for(const key of ['datePublished','canonical','source_url','author'])assert.equal(content.seo[key],old.seo[key],key+' must be preserved');
  assert.equal(content.source_correction.clinical_review,false);assert.equal(content.source_correction.full_paper_reviewed,false);
  assert.equal(content.source_correction.release_id,RELEASE);assert.equal(content.source_correction.original_content_sha256,sha(before.content_package_json));
  assert.equal(item.after_sources.length,JSON.parse(before.source_evidence_json).length);
  JSON.parse(before.source_evidence_json).forEach((source,index)=>{for(const key of Object.keys(source).filter(k=>k!=='authority'))assert.deepEqual(item.after_sources[index][key],source[key]);});
  content.seo.dateModified=STAMP;
  const after={...before,headline:content.headline,content_package_json:JSON.stringify(content),source_evidence_json:JSON.stringify(item.after_sources),updated_at:STAMP};
  const audit={release_id:RELEASE,action_register:'SST-55 / #1065',owner_authorisation:'Matt: publish supported fixes after checks pass; 3–4 October 2026',clinical_review:false,full_paper_reviewed:false,source_url:content.source_correction.source_url,primary_response_sha256:content.source_correction.primary_response_sha256,before_content_sha256:sha(before.content_package_json),after_content_sha256:sha(after.content_package_json),before_sources_sha256:sha(before.source_evidence_json),after_sources_sha256:sha(after.source_evidence_json)};
  return {...item,after,audit};
 });
}
export function correctionSql(items){
 const prepared=prepareCorrections(items),keys=[...protectedKeys,'headline','content_package_json','source_evidence_json','updated_at'];
 // Every selected identity and complete payload must match in this one SQL
 // statement. json(invalid text) aborts the entire UPDATE if any target drifted.
 // This includes missing rows, status changes and a concurrent editorial update.
 // One JSON binding keeps the SQL below D1's 100 KB statement limit without
 // weakening the exact old-row comparison or dividing the atomic UPDATE.
 const guard=keys.map(key=>'e.'+key+" IS json_extract(d.value,'$.before."+key+"')").join(' AND ');
 const choose=key=>"(SELECT json_extract(d.value,'$.after."+key+"') FROM desired d WHERE json_extract(d.value,'$.before.id')=radar_events.id)";
 const sql='WITH desired AS (SELECT value FROM json_each(?)) UPDATE radar_events SET content_package_json=CASE WHEN (SELECT COUNT(*) FROM radar_events e JOIN desired d ON e.id=json_extract(d.value,\'$.before.id\') WHERE '+guard+')=19 THEN '+choose('content_package_json')+" ELSE json('SOURCE_CORRECTION_SNAPSHOT_CHANGED') END,source_evidence_json="+choose('source_evidence_json')+',headline='+choose('headline')+',updated_at='+literal(STAMP)+" WHERE id IN (SELECT json_extract(value,'$.before.id') FROM desired) RETURNING id;";
 const params=[JSON.stringify(prepared.map(a=>({before:a.before,after:a.after})))];
 assert(Buffer.byteLength(sql)<100000);assert(params.length<=100);
 const auditQueries=prepared.map(a=>({sql:"INSERT INTO radar_audit(event_id,action,actor,detail_json,created_at) SELECT "+a.id+",'source_limited_editorial_correction','Matt-authorised AI editorial',"+literal(JSON.stringify(a.audit))+','+literal(STAMP)+' WHERE EXISTS(SELECT 1 FROM radar_events WHERE '+equality(a.after,keys)+") AND NOT EXISTS(SELECT 1 FROM radar_audit WHERE event_id="+a.id+" AND action='source_limited_editorial_correction' AND json_extract(detail_json,'$.release_id')="+literal(RELEASE)+');'}));
 const audits=auditQueries.map(q=>q.sql).join('\n');
 assert(auditQueries.every(q=>Buffer.byteLength(q.sql)<100000));
 return {prepared,sql,params,audits,auditQueries};
}
if(process.argv[1]===fileURLToPath(import.meta.url)){
 const dir=fileURLToPath(new URL('.',import.meta.url)),items=JSON.parse(readFileSync(dir+'corrections.json','utf8')),result=correctionSql(items);
 writeFileSync(dir+'guarded-update.sql',result.sql+'\n');writeFileSync(dir+'guarded-update.json',JSON.stringify({sql:result.sql,params:result.params})+'\n');writeFileSync(dir+'guarded-audit.sql',result.audits+'\n');writeFileSync(dir+'prepared.json',JSON.stringify(result.prepared,null,2)+'\n');
 console.log(JSON.stringify({release:RELEASE,targets:result.prepared.map(a=>a.id),update_sha256:sha(result.sql),audit_sha256:sha(result.audits),productionWrites:0}));
}
