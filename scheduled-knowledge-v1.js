import {syncApprovedKnowledgeDocuments} from './knowledge-publication-v1.js';

const safe=(v,d={})=>{try{return typeof v==='string'?JSON.parse(v):v??d}catch{return d}};

export async function runKnowledgeFlywheel(env,{limit=1000}={}){
  const sync=await syncApprovedKnowledgeDocuments(env,{limit});
  if(!sync?.ok)return{ok:false,synced:Number(sync?.synced||0),withdrawn:0,reason:sync?.reason||'knowledge_sync_failed'};

  // Reconcile previously-ingested approved-document nodes when the source document
  // is later withdrawn/unapproved. Scope strictly to the legacy approved:* namespace;
  // reviewed CMS nodes use their own explicit withdrawal lifecycle.
  let nodes=[];
  try{({results:nodes=[]}=await env.DB.prepare(`SELECT id,data_json FROM shift_knowledge_nodes WHERE status='active' AND id LIKE 'approved:%' LIMIT ?`).bind(Math.max(1,Math.min(5000,Number(limit)||1000))).all())}
  catch{return{ok:false,synced:Number(sync.synced||0),withdrawn:0,reason:'knowledge_reconcile_unavailable'}};

  let withdrawn=0;
  for(const node of nodes){
    const data=safe(node.data_json,{}),legacyId=data.legacyDocumentId;
    if(!legacyId)continue;
    const source=await env.DB.prepare(`SELECT status FROM ai_knowledge_documents WHERE id=?`).bind(legacyId).first();
    if(source?.status==='approved')continue;
    data.reviewState='withdrawn';
    data.withdrawnAt=new Date().toISOString();
    data.withdrawnReason=source?'source_no_longer_approved':'source_removed';
    await env.DB.prepare(`UPDATE shift_knowledge_nodes SET status='withdrawn',data_json=?,updated_at=CURRENT_TIMESTAMP WHERE id=?`).bind(JSON.stringify(data),node.id).run();
    withdrawn++;
  }
  return{ok:true,synced:Number(sync.synced||0),withdrawn};
}
