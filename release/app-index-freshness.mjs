// Publication remains eligible for at most 48 hours. Reuse must cover the
// existing 60-minute production job, rather than just its early capture step.
export const PUBLIC_INDEX_MAX_AGE_MS=48*60*60*1000;
export const PUBLIC_INDEX_RELEASE_BUDGET_MINUTES=60;
export const PUBLIC_INDEX_FRESHNESS_SQL="SELECT COUNT(*) AS [indexed],SUM(CASE WHEN julianday(updated_at)>=julianday('now','-2 days') THEN 0 ELSE 1 END) AS stale,SUM(CASE WHEN source_uri='https://shiftsometimber.co.uk/life-back' AND julianday(updated_at)>=julianday('now','-2 days') THEN 1 ELSE 0 END) AS lifeBackFresh,(SELECT COUNT(*) FROM ai_knowledge_chunks c JOIN ai_knowledge_documents d ON d.id=c.document_id WHERE d.category='shift_public_site' AND d.status='published_site') chunks,MIN(strftime('%Y-%m-%dT%H:%M:%fZ',updated_at)) AS oldestUpdatedAt,strftime('%Y-%m-%dT%H:%M:%fZ','now') AS checkedAt FROM ai_knowledge_documents WHERE category='shift_public_site' AND status='published_site'";
const count=value=>(typeof value==='number'||typeof value==='string'&&/^\d+$/.test(value))&&Number.isSafeInteger(Number(value))&&Number(value)>=0?Number(value):NaN;
const timestamp=value=>{
 if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/.test(value))return NaN;
 const canonical=value.includes('.')?value:value.replace('Z','.000Z'),parsed=Date.parse(canonical);
 return Number.isFinite(parsed)&&new Date(parsed).toISOString()===canonical?parsed:NaN;
};
export function reusablePublicIndex(index,{now=Date.now()}={}){
 if(!index||!Number.isFinite(now))return false;
 const indexed=count(index.indexed),chunks=count(index.chunks),stale=count(index.stale),lifeBackFresh=count(index.lifeBackFresh),oldest=timestamp(index.oldestUpdatedAt),checked=timestamp(index.checkedAt);
 return indexed>=50&&chunks>=indexed&&stale===0&&lifeBackFresh>=1&&lifeBackFresh<=indexed&&Number.isFinite(oldest)&&Number.isFinite(checked)&&oldest<=checked&&checked<=now&&oldest+PUBLIC_INDEX_MAX_AGE_MS>=now+PUBLIC_INDEX_RELEASE_BUDGET_MINUTES*60*1000;
}
