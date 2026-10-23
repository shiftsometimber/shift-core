// Curated clinical projection of existing owned records. No journals, AI chats or community access.
export const CONTEXT_NOTICE='clinical-app-sharing-v1';
export const CONTEXT_SCOPES=['weight','doses','symptoms'];
const fail=(status,code)=>{throw Object.assign(Error(code),{status});};
const rows=async q=>(await q.all()).results;
const hash=async value=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(value)))),b=>b.toString(16).padStart(2,'0')).join('');
export async function contextSharing(env,record){
 if(env.CLINICAL_CONTEXT_ENABLED!=='true')return {enabled:false,revision:0,scopes:[],noticeVersion:CONTEXT_NOTICE};
 const row=await env.DB.prepare('SELECT * FROM clinical_context_sharing WHERE record_id=? ORDER BY revision DESC LIMIT 1').bind(record.id).first();
 return {enabled:true,revision:row?.revision||0,scopes:row?JSON.parse(row.scopes_json):[],noticeVersion:CONTEXT_NOTICE,changedAt:row?.created_at||null};
}
export async function saveContextSharing(env,record,actor,b){
 if(env.CLINICAL_CONTEXT_ENABLED!=='true')fail(503,'clinical_context_not_open');
 if(actor.id!==record.user_id)fail(404,'record_not_found');
 if(!b||Object.keys(b).some(k=>!['revision','scopes','noticeVersion'].includes(k))||!Number.isInteger(b.revision)||b.noticeVersion!==CONTEXT_NOTICE||!Array.isArray(b.scopes)||b.scopes.some(s=>!CONTEXT_SCOPES.includes(s))||new Set(b.scopes).size!==b.scopes.length)fail(422,'invalid_sharing_choice');
 const at=new Date().toISOString(),revision=b.revision+1,scopes=CONTEXT_SCOPES.filter(s=>b.scopes.includes(s));
 const result=await env.DB.batch([
  env.DB.prepare('INSERT INTO clinical_context_sharing SELECT ?,?,?,?,?,? WHERE COALESCE((SELECT MAX(revision) FROM clinical_context_sharing WHERE record_id=?),0)=?').bind(record.id,revision,actor.id,JSON.stringify(scopes),CONTEXT_NOTICE,at,record.id,b.revision),
  env.DB.prepare("INSERT INTO clinical_member_audit SELECT ?,?,?,?, ?,? WHERE EXISTS(SELECT 1 FROM clinical_context_sharing WHERE record_id=? AND revision=? AND created_at=?)").bind(crypto.randomUUID(),record.id,actor.id,'app_sharing_changed',JSON.stringify({actorKind:'member',revision,scopes,noticeVersion:CONTEXT_NOTICE}),at,record.id,revision,at)
 ]);if(Number(result[0].meta?.changes)!==1)fail(409,'sharing_changed');return contextSharing(env,record);
}
async function columns(env,table){return new Set((await rows(env.DB.prepare('PRAGMA table_info('+table+')'))).map(c=>c.name));}
const has=(set,names)=>names.every(n=>set.has(n));
export async function clinicalContext(env,record){
 const sharing=await contextSharing(env,record);if(!sharing.enabled)return {enabled:false,sharing,orders:[],updates:[],sources:[],digest:null};
 const now=new Date(),since=new Date(now.getTime()-90*86400000).toISOString(),until=now.toISOString(),updates=[],sources=[];
 const orderColumns=await columns(env,'medicine_orders');let orders=[],orderSource='unavailable';
 if(has(orderColumns,['order_number','user_id','medicine_name','strength_label','status','created_at'])){
  orders=await rows(env.DB.prepare('SELECT order_number,medicine_name,strength_label,status,created_at'+(orderColumns.has('clinical_status')?',clinical_status':'')+' FROM medicine_orders WHERE user_id=? ORDER BY created_at DESC,order_number DESC LIMIT 201').bind(record.user_id));orderSource='available';
 }
 // Order clinical status is never represented as a legally issued prescription.
 const moreOrders=orders.length>200;orders=orders.slice(0,200).map(o=>({...o,prescriptionStatus:'Issuance not verified in this system'}));
 const scopes=new Set(sharing.scopes),progress=await columns(env,'progress_entries');
 if(scopes.has('weight')){
  if(has(progress,['id','user_id','recorded_on','weight_kg','created_at'])){
   const weights=await rows(env.DB.prepare('SELECT id,recorded_on,weight_kg,created_at'+(progress.has('source')?',source':'')+' FROM progress_entries WHERE user_id=? AND weight_kg IS NOT NULL AND recorded_on>=? AND recorded_on<=? ORDER BY recorded_on DESC,id DESC LIMIT 1001').bind(record.user_id,since.slice(0,10),until.slice(0,10)));
   sources.push({name:'progress_entries',status:'available',truncated:weights.length>1000});
   for(const r of weights.slice(0,1000))updates.push({id:'progress:'+r.id,kind:'weight',occurredAt:r.recorded_on,recordedAt:r.created_at,source:'My Timber weight log',reportedBy:r.source?'recorded source '+r.source:'member',details:{weightKg:r.weight_kg}});
  }else sources.push({name:'progress_entries',status:'unavailable'});
 }
 if(scopes.size){
  const events=await columns(env,'member_treatment_events'),treatments=await columns(env,'member_treatment_records');
  if(has(events,['id','user_id','treatment_id','kind','body_json','source','occurred_at','created_at'])&&has(treatments,['id','user_id','medicine'])){
   const entries=await rows(env.DB.prepare("SELECT e.id,e.kind,e.body_json,e.source,e.occurred_at,e.created_at,t.medicine FROM member_treatment_events e JOIN member_treatment_records t ON t.id=e.treatment_id AND t.user_id=e.user_id WHERE e.user_id=? AND e.kind IN ('dose_taken','checkin') AND e.occurred_at>=? AND e.occurred_at<=? ORDER BY e.occurred_at DESC,e.id DESC LIMIT 1001").bind(record.user_id,since,until));
   sources.push({name:'member_treatment_events',status:'available',truncated:entries.length>1000});
   for(const r of entries.slice(0,1000)){
    const body=JSON.parse(r.body_json),base={id:'treatment:'+r.id,occurredAt:r.occurred_at,recordedAt:r.created_at,source:'My Timber treatment log',reportedBy:r.source==='member'?'member':'recorded source '+r.source,medicine:r.medicine};
    if(r.kind==='dose_taken'&&scopes.has('doses'))updates.push({...base,kind:'dose',details:{doseStrength:body.doseStrength||'Not recorded'}});
    const c=body.checkin;if(r.kind==='checkin'&&c){const details={};if(scopes.has('weight')&&c.weight!=null)details.weightKg=c.weight;if(scopes.has('symptoms'))for(const k of ['sideEffects','symptomType','symptomSeverity','symptomImpact','symptomStartedAt','appetite','energy'])if(c[k]!==undefined)details[k]=c[k];if(Object.keys(details).length)updates.push({...base,kind:'treatment_checkin',details});}
   }
  }else sources.push({name:'member_treatment_events',status:'unavailable'});
 }
 updates.sort((a,b)=>b.occurredAt.localeCompare(a.occurredAt)||a.id.localeCompare(b.id));
 // Bind review to exact values and sharing revision, not just the newest timestamp.
 const latestSharing=await contextSharing(env,record);if(latestSharing.revision!==sharing.revision)fail(409,'sharing_changed');
 const digest=await hash({sharingRevision:sharing.revision,orders,updates,sources,orderSource});
 return {enabled:true,sharing,orders,orderSource,moreOrders,updates,sources,windowDays:90,since:since.slice(0,10),digest,continuousMonitoring:false};
}
