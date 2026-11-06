import {ensureCatalogueGovernanceSchema,readCatalogueAuthority,hasCatalogueWriteGrant,validateSupplierRoutes} from './hq-catalogue-governance-v31.mjs';
const json=(body,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'no-store, private','X-Content-Type-Options':'nosniff'}});
const hash=async value=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value))),x=>x.toString(16).padStart(2,'0')).join('');
export async function auditedCatalogueMutation(DB,user,statements,action,type,id,metadata,date=new Date().toISOString()){
 return DB.batch([...statements,DB.prepare('INSERT INTO hq_audit(hq_user_id,action,entity_type,entity_id,metadata,created_at) VALUES(?,?,?,?,?,?)').bind(user.id,action,type,String(id),JSON.stringify(metadata),date)]);
}
export async function saveTestSupplierRoutes(DB,user,variantId,body,grants,now=new Date()){
 const fail=(status,message)=>{throw Object.assign(Error(message),{status})};
 if(!hasCatalogueWriteGrant(user,grants,now))fail(403,'catalogue_commerce_grant_required');
 if(!body||Object.keys(body).some(k=>!['version','routes','request_id'].includes(k))||!Number.isInteger(body.version)||body.version<1||!/^[a-f0-9-]{36}$/.test(body.request_id||''))fail(422,'version_and_request_id_required');
 let routes;try{routes=validateSupplierRoutes(body.routes,now)}catch(e){fail(422,e.message)}
 const id=String(variantId),requestHash=await hash(JSON.stringify({variantId,routes,version:body.version}));
 const previous=await DB.prepare("SELECT metadata FROM hq_audit WHERE action='catalogue.suppliers_saved' AND entity_type='medicine_variant' AND entity_id=? AND json_extract(metadata,'$.request_id')=? LIMIT 1").bind(id,body.request_id).first();
 if(previous){const prior=JSON.parse(previous.metadata);if(prior.request_hash!==requestHash)fail(409,'idempotency_payload_conflict');return {ok:true,replayed:true,version:prior.version,auditRecorded:true};}
 const item=await DB.prepare("SELECT v.catalogue_version,m.name FROM medicine_variants v JOIN medicine_products m ON m.id=v.medicine_id WHERE v.id=? AND m.name GLOB 'TEST-*'").bind(variantId).first();
 if(!item)fail(404,'test_medicine_variant_required');if(item.catalogue_version!==body.version)fail(409,'catalogue_version_changed');
 const before=(await DB.prepare("SELECT partner_id,role,readiness,stock_on_hand,reserved,authority,availability,authority_until,evidence_ref,version FROM catalogue_supply_routes WHERE item_kind='medicine_variant' AND item_id=?").bind(variantId).all()).results||[];
 for(const route of routes){const supplier=await DB.prepare('SELECT id FROM partner_organisations WHERE id=?').bind(route.partner_id).first();if(!supplier)fail(422,'existing_partner_organisation_required');}
 const date=now.toISOString(),key=crypto.randomUUID(),version=body.version+1,routeJSON=JSON.stringify(routes);
 const guard="EXISTS(SELECT 1 FROM medicine_variants WHERE id=? AND catalogue_version=? AND catalogue_change_key=?)";
 const statements=[DB.prepare(`UPDATE medicine_variants SET catalogue_version=catalogue_version+1,catalogue_change_key=?,updated_at=? WHERE id=? AND catalogue_version=? AND NOT EXISTS(SELECT 1 FROM catalogue_supply_routes old WHERE old.item_kind='medicine_variant' AND old.item_id=? AND old.reserved>0 AND (NOT EXISTS(SELECT 1 FROM json_each(?) n WHERE json_extract(n.value,'$.partner_id')=old.partner_id) OR old.reserved>(SELECT json_extract(n.value,'$.stock_on_hand') FROM json_each(?) n WHERE json_extract(n.value,'$.partner_id')=old.partner_id)))`).bind(key,date,variantId,body.version,variantId,routeJSON,routeJSON),
  DB.prepare(`DELETE FROM catalogue_supply_routes WHERE item_kind='medicine_variant' AND item_id=? AND reserved=0 AND NOT EXISTS(SELECT 1 FROM json_each(?) n WHERE json_extract(n.value,'$.partner_id')=catalogue_supply_routes.partner_id) AND ${guard}`).bind(variantId,routeJSON,variantId,version,key),
  // Clear roles first so changing primary and backup is one atomic operation.
  DB.prepare(`UPDATE catalogue_supply_routes SET role='backup' WHERE item_kind='medicine_variant' AND item_id=? AND ${guard}`).bind(variantId,variantId,version,key),
  ...routes.map(r=>DB.prepare(`INSERT INTO catalogue_supply_routes(item_kind,item_id,partner_id,role,readiness,stock_on_hand,reserved,authority,availability,authority_until,evidence_ref,version,updated_by,updated_at) SELECT 'medicine_variant',?,?,?,?,?,0,?,?,?,?,1,?,? WHERE ${guard} ON CONFLICT(item_kind,item_id,partner_id) DO UPDATE SET role=excluded.role,readiness=excluded.readiness,stock_on_hand=excluded.stock_on_hand,authority=excluded.authority,availability=excluded.availability,authority_until=excluded.authority_until,evidence_ref=excluded.evidence_ref,version=catalogue_supply_routes.version+1,updated_by=excluded.updated_by,updated_at=excluded.updated_at`).bind(variantId,r.partner_id,r.role,r.readiness,r.stock_on_hand,r.authority?1:0,r.availability,r.authority_until,r.evidence_ref,user.id,date,variantId,version,key)),
  DB.prepare(`INSERT INTO hq_audit(hq_user_id,action,entity_type,entity_id,metadata,created_at) SELECT ?,'catalogue.suppliers_saved','medicine_variant',?,?,? WHERE ${guard}`).bind(user.id,id,JSON.stringify({request_id:body.request_id,request_hash:requestHash,version,before,after:routes,signoff_invalidated:true}),date,variantId,version,key)
 ];
 const result=await DB.batch(statements);if(result[0].meta?.changes!==1)fail(409,'version_stock_or_reservation_changed');
 return {ok:true,version,auditRecorded:true,signoffRequired:true,notificationsSent:false};
}
export async function catalogueAdminV31Route(request,env,user,permissions=[]){
 const url=new URL(request.url),match=url.pathname.match(/^\/v1\/hq\/catalogue\/governance\/medicine-variants\/([1-9]\d*)(\/suppliers)?$/);if(!match)return null;
 const read=['owner','admin'].includes(user?.role)||permissions.includes('commerce_read')||permissions.includes('*');
 if(!read)return json({ok:false,error:'catalogue_read_forbidden'},403);
 if(env.HQ_CATALOGUE_V31_TEST_MODE!=='true'||env.DEPLOYMENT_ENVIRONMENT!=='test')return json({ok:false,error:'isolated_catalogue_test_environment_required'},503);
 if(!['GET','POST'].includes(request.method))return json({ok:false,error:'method_not_allowed'},405);
 try{
  if(request.method==='POST'&&request.headers.get('Origin')!=='https://hq.shiftsometimber.co.uk')return json({ok:false,error:'origin_forbidden'},403);
  if(request.method==='POST'&&!hasCatalogueWriteGrant(user,env.HQ_CATALOGUE_EDITOR_GRANTS))return json({ok:false,error:'catalogue_commerce_grant_required'},403);
  await ensureCatalogueGovernanceSchema(env.DB);
  const variantId=Number(match[1]);
  const item=await env.DB.prepare("SELECT v.id FROM medicine_variants v JOIN medicine_products m ON m.id=v.medicine_id WHERE v.id=? AND m.name GLOB 'TEST-*'").bind(variantId).first();if(!item)return json({ok:false,error:'test_medicine_variant_required'},404);
  if(request.method==='GET'&&!match[2]){
   const partners=(await env.DB.prepare("SELECT id,json_extract(state_json,'$.name') name,json_extract(state_json,'$.kind') kind,json_extract(state_json,'$.status') status FROM partner_organisations WHERE json_extract(state_json,'$.kind')='pharmacy' ORDER BY id LIMIT 100").all()).results||[];
   return json({ok:true,partition:'TEST',authority:await readCatalogueAuthority(env.DB,variantId),partners,canEdit:hasCatalogueWriteGrant(user,env.HQ_CATALOGUE_EDITOR_GRANTS),clinical_body_in_hq:false});
  }
  if(request.method==='POST'&&match[2]){
   if(!request.headers.get('Content-Type')?.startsWith('application/json'))return json({ok:false,error:'json_required'},415);
   const text=await request.text();if(text.length>20000)return json({ok:false,error:'request_too_large'},413);
   return json(await saveTestSupplierRoutes(env.DB,user,variantId,JSON.parse(text),env.HQ_CATALOGUE_EDITOR_GRANTS));
  }
  return json({ok:false,error:'method_not_allowed'},405);
 }catch(e){return json({ok:false,error:e.status?e.message:'catalogue_save_or_audit_unavailable'},e.status||503);}
}
