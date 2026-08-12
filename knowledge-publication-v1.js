import {upsertKnowledge} from './knowledge-graph-v1.js';

const safe=(v,d={})=>{try{return typeof v==='string'?JSON.parse(v):v??d}catch{return d}};

export async function publishReviewedKnowledge(env,article,review={}){
  if(!article?.id||!article?.title)return{accepted:false,reason:'article_identity_required'};
  const state=String(review.state||article.review_state||article.status||'').toLowerCase();
  if(!['approved','published'].includes(state))return{accepted:false,reason:'review_required'};
  const health=String(article.domain||article.category||'').toLowerCase()==='health';
  if(health&&!review.verified)return{accepted:false,reason:'health_review_requires_verified_provenance'};
  const sourceRef=article.url||article.source_uri||`cms:${article.id}`;
  const data={title:article.title,summary:article.summary||article.excerpt||'',content:article.content||article.body||'',slug:article.slug||'',contentType:article.content_type||'article',reviewState:state,reviewedBy:review.actor||article.reviewed_by||null,reviewedAt:review.at||article.reviewed_at||new Date().toISOString(),version:article.version||null,tags:Array.isArray(article.tags)?article.tags:safe(article.tags,[])};
  return upsertKnowledge(env,{id:`cms:${article.id}`,type:'reviewed_content',domain:health?'health':String(article.domain||'general'),label:article.title,data,provenance:{verified:health?true:!!review.verified,reviewState:state},sources:[{type:'cms',ref:sourceRef,authority:health?95:80,verified_at:data.reviewedAt,provenance:{reviewState:state,reviewedBy:data.reviewedBy,version:data.version}}]});
}

export async function syncApprovedKnowledgeDocuments(env,{limit=250}={}){
  let rows=[];try{({results:rows=[]}=await env.DB.prepare(`SELECT d.id,d.title,d.source_uri,d.trust_tier,d.status,c.id chunk_id,c.content FROM ai_knowledge_documents d JOIN ai_knowledge_chunks c ON c.document_id=d.id WHERE d.status='approved' ORDER BY d.id,c.id LIMIT ?`).bind(Math.max(1,Math.min(2000,limit))).all())}catch{return{ok:false,reason:'legacy_knowledge_unavailable',synced:0}}
  let synced=0;for(const r of rows){const x=await upsertKnowledge(env,{id:`approved:${r.id}:${r.chunk_id}`,type:'reviewed_content',domain:'general',label:r.title,data:{title:r.title,content:r.content,reviewState:'approved',legacyDocumentId:r.id,legacyChunkId:r.chunk_id},provenance:{verified:true,reviewState:'approved'},sources:[{type:'approved_document',ref:r.source_uri||`document:${r.id}`,authority:100-Math.min(90,Number(r.trust_tier||5)*10),verified_at:new Date().toISOString()}]});if(x.accepted)synced++}
  return{ok:true,synced};
}
