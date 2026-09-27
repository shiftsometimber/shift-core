// Source retrieval never amends a reviewed publication or renews its approval.
const safe = (value, fallback = {}) => { try { return JSON.parse(value); } catch { return fallback; } };
const iso = () => new Date().toISOString();
export const pendingSourceChangeSql = eventId => `SELECT a.* FROM radar_audit a WHERE a.event_id=${eventId} AND a.action='source_changed_review_required' AND NOT EXISTS (SELECT 1 FROM radar_audit r WHERE r.event_id=a.event_id AND r.action IN ('source_change_review_started','source_metadata_backfilled') AND CAST(json_extract(r.detail_json,'$.observation_id') AS INTEGER)>=a.id)`;
export async function pendingSourceChange(DB, eventId) {
 const row = await DB.prepare(`${pendingSourceChangeSql('?')} ORDER BY a.id DESC LIMIT 1`).bind(eventId).first();
 return row ? {id:row.id, observed_at:row.created_at, ...safe(row.detail_json)} : null;
}
export async function pendingSourceChangeMap(DB) {
 const {results=[]} = await DB.prepare(`${pendingSourceChangeSql('a.event_id')} AND a.id=(SELECT MAX(n.id) FROM radar_audit n WHERE n.event_id=a.event_id AND n.action='source_changed_review_required')`).all();
 return new Map(results.map(row=>[row.event_id,{id:row.id,observed_at:row.created_at,...safe(row.detail_json)}]));
}
export const sourceReviewGenerationSql = eventId => `COALESCE((SELECT MAX(g.id) FROM radar_audit g WHERE g.event_id=${eventId} AND g.action IN ('source_change_review_started','source_metadata_backfilled')),0)`;
export async function sourceReviewEvent(DB,eventId) {
 return DB.prepare(`SELECT e.*,${sourceReviewGenerationSql('e.id')} source_review_generation FROM radar_events e WHERE e.id=?`).bind(eventId).first();
}
export const sourceReviewGuardSql = (table='radar_events') => `${table}.source_evidence_json=? AND ${sourceReviewGenerationSql(table+'.id')}=? AND NOT EXISTS (${pendingSourceChangeSql(table+'.id')})`;
export const sourceReviewGuardBindings = row => [row.source_evidence_json,Number(row.source_review_generation||0)];
export const retainedReviewGuardSql = (table='radar_events') => ['status','headline','content_package_json','medicine_patch_json','verification_json','updated_at'].map(key=>`${table}.${key} IS ?`).join(' AND ');
export const retainedReviewGuardBindings = row => ['status','headline','content_package_json','medicine_patch_json','verification_json','updated_at'].map(key=>row[key]??null);
export const exactReviewStateMatches = (row,expected) => !expected || (row.source_evidence_json===expected.row.source_evidence_json && Number(row.source_review_generation||0)===Number(expected.row.source_review_generation||0) && retainedReviewGuardBindings(row).every((value,index)=>value===retainedReviewGuardBindings(expected.row)[index]));
export function reviewedSourceSnapshot(row) {
 return Boolean(row.reviewed_at) || !['detected','verified','needs_more_evidence'].includes(row.status) || !['','{}'].includes(row.content_package_json || '{}');
}
export function sourceFingerprint(headline,evidence=[]) {
 return JSON.stringify([headline,evidence.map(x=>[x.url,x.title,x.source_date||null,x.source_updated_at||null,x.summary||'',x.authority,x.source_tier])]);
}
export async function recordSourceChange(DB,row,observation) {
 const pending=await pendingSourceChange(DB,row.id);
 if(pending?.fingerprint===observation.fingerprint)return false;
 // The complete original row remains available even after an operator explicitly
 // starts its correction. Old publication-job payloads are retained for audit.
 const {results:tables=[]}=await DB.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name IN ('shift_knowledge_nodes','ai_knowledge_documents')").all();
 const present=new Set(tables.map(x=>x.name)),knowledge=[];
 // Reuse the existing active/approved retrieval gates. Do not delete article
 // content, provenance or review dates, or touch unrelated knowledge records.
 if(present.has('shift_knowledge_nodes'))knowledge.push(DB.prepare("UPDATE shift_knowledge_nodes SET status='review_required' WHERE (id=? AND node_type='radar_event') OR (node_type='medicine' AND json_extract(data_json,'$.source_radar_event_id')=?)").bind(`radar:${row.id}`,row.id));
 if(present.has('ai_knowledge_documents'))knowledge.push(DB.prepare("UPDATE ai_knowledge_documents SET status='review_required' WHERE source_uri=?").bind(`radar://event/${row.id}`));
 await DB.batch([
  DB.prepare(`INSERT INTO radar_audit(event_id,action,actor,detail_json) VALUES(?,'source_changed_review_required','radar_scanner',?)`).bind(row.id,JSON.stringify({...observation,reviewed_snapshot:row})),
  DB.prepare(`UPDATE radar_publication_jobs SET status='cancelled',error_text='source_changed_review_required' WHERE event_id=? AND status IN ('queued','failed','running')`).bind(row.id),
  DB.prepare(`UPDATE radar_social_approvals SET status='invalidated',updated_at=? WHERE event_id=? AND status='approved'`).bind(iso(),row.id),
  DB.prepare(`UPDATE radar_events SET status='hold',updated_at=? WHERE id=? AND status IN ('approved','publish_failed','ready_for_review')`).bind(iso(),row.id),
  ...knowledge
 ]);
 return true;
}
export async function beginSourceCorrection(DB,row,change,actor,note='') {
 const observed=change.observation,stamp=iso();
 if(!observed?.evidence?.length)throw Error('source_observation_missing');
 const status=observed.verification?.verified?'verified':'needs_more_evidence';
 const [updated]=await DB.batch([
  DB.prepare(`UPDATE radar_events SET headline=?,source_evidence_json=?,verification_json=?,confidence_score=?,relevance_score=?,urgency_score=?,region=?,status=?,medicine_patch_json='{}',content_package_json='{}',review_note=?,reviewed_by=NULL,reviewed_at=NULL,updated_at=? WHERE id=? AND source_evidence_json=? AND ${sourceReviewGenerationSql('radar_events.id')}=? AND EXISTS (${pendingSourceChangeSql('radar_events.id')} AND a.id=?) AND NOT EXISTS (${pendingSourceChangeSql('radar_events.id')} AND a.id>?) AND ${retainedReviewGuardSql()}`).bind(observed.headline,JSON.stringify(observed.evidence),JSON.stringify(observed.verification),observed.confidence,observed.scores.relevance,observed.scores.urgency,observed.region,status,String(note||'Source changed: prepare and review a fresh correction.').slice(0,2000),stamp,row.id,...sourceReviewGuardBindings(row),change.id,change.id,...retainedReviewGuardBindings(row)),
  DB.prepare(`INSERT INTO radar_audit(event_id,action,actor,detail_json) SELECT ?,'source_change_review_started',?,? WHERE changes()>0`).bind(row.id,actor,JSON.stringify({observation_id:change.id,prior_status:row.status,note:String(note).slice(0,2000)})),
  DB.prepare(`UPDATE radar_publication_jobs SET status='cancelled',error_text='source_changed_review_required' WHERE event_id=? AND status IN ('queued','failed','running') AND changes()>0`).bind(row.id)
 ]);
 if(updated.meta?.changes===0)return{ok:false,error:'source_changed_review_required',message:'The correction changed. Reload the source observation before continuing.'};
 return {ok:true,status,source_observation_id:change.id,message:'Correction started from the changed source. A new article package and approval are required.'};
}
