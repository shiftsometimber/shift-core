const MAX_ROWS=250;
const OFFER_TYPES=new Set(['new_customer','switcher','continuation_only']);
const STOCK_STATES=new Set(['tbc','review','confirmed','unavailable']);
const PARTNER_STATES=new Set(['tbc','review','suspended']);
const clean=(value,max=160)=>String(value??'').trim().slice(0,max);
const integer=value=>Number.isInteger(value)&&value>=0;

export function validateTreatmentIntake(payload){
  const errors=[];
  if(!payload||typeof payload!=='object'||Array.isArray(payload))return {ok:false,errors:[{code:'invalid_payload'}],rows:[]};
  const supplier=payload.supplier||{},externalKey=clean(supplier.externalKey,80);
  if(!/^[a-z0-9][a-z0-9._-]{2,79}$/i.test(externalKey))errors.push({field:'supplier.externalKey',code:'invalid_supplier_key'});
  if(!clean(supplier.legalName,160))errors.push({field:'supplier.legalName',code:'required'});
  if(supplier.status&&!PARTNER_STATES.has(supplier.status))errors.push({field:'supplier.status',code:'approval_not_importable'});
  if(!clean(payload.sourceReference,240))errors.push({field:'sourceReference',code:'required'});
  const inputRows=Array.isArray(payload.rows)?payload.rows:[];
  if(!inputRows.length||inputRows.length>MAX_ROWS)errors.push({field:'rows',code:'row_count',max:MAX_ROWS});
  const seen=new Set(),rows=inputRows.map((row,index)=>{
    const rowErrors=[],value={
      index,rowKey:clean(row?.rowKey,100),family:clean(row?.family,80),formulation:clean(row?.formulation,80),
      strength:clean(row?.strength,40),offerType:clean(row?.offerType,40),supplierSku:clean(row?.supplierSku,120),
      unitCostPence:row?.unitCostPence,dispensingCostPence:row?.dispensingCostPence,
      deliveryCostPence:row?.deliveryCostPence,paymentCostPence:row?.paymentCostPence,
      stockState:clean(row?.stockState,30)||'tbc',stockReference:clean(row?.stockReference,240),
      stockObservedAt:clean(row?.stockObservedAt,40),evidenceReference:clean(row?.evidenceReference,240)
    };
    for(const key of ['rowKey','family','formulation','strength','offerType','supplierSku','evidenceReference'])if(!value[key])rowErrors.push({field:key,code:'required'});
    if(seen.has(value.rowKey))rowErrors.push({field:'rowKey',code:'duplicate'});seen.add(value.rowKey);
    if(!OFFER_TYPES.has(value.offerType))rowErrors.push({field:'offerType',code:'invalid'});
    for(const key of ['unitCostPence','dispensingCostPence','deliveryCostPence','paymentCostPence'])if(!integer(value[key]))rowErrors.push({field:key,code:'non_negative_integer_required'});
    if(!STOCK_STATES.has(value.stockState))rowErrors.push({field:'stockState',code:'invalid'});
    if(value.stockState==='confirmed'&&(!value.stockReference||!/^\d{4}-\d{2}-\d{2}T/.test(value.stockObservedAt)))rowErrors.push({field:'stockEvidence',code:'confirmed_stock_evidence_required'});
    return {...value,errors:rowErrors,ok:rowErrors.length===0};
  });
  return {ok:errors.length===0&&rows.every(row=>row.ok),errors,rows,supplier:{externalKey,legalName:clean(supplier.legalName,160),tradingName:clean(supplier.tradingName,160),status:supplier.status||'tbc',companyNumber:clean(supplier.companyNumber,40),contactEmail:clean(supplier.contactEmail,160)},sourceReference:clean(payload.sourceReference,240)};
}

export async function ensureTreatmentIntakeSchema(env){
  await env.DB.batch([
    env.DB.prepare(`CREATE TABLE IF NOT EXISTS catalogue_supplier_keys (external_key TEXT PRIMARY KEY,supplier_id INTEGER NOT NULL UNIQUE,FOREIGN KEY(supplier_id) REFERENCES catalogue_suppliers(id))`),
    env.DB.prepare(`CREATE TABLE IF NOT EXISTS catalogue_intake_revisions (id INTEGER PRIMARY KEY AUTOINCREMENT,idempotency_key TEXT NOT NULL UNIQUE,payload_hash TEXT NOT NULL,status TEXT NOT NULL CHECK(status IN ('applied','rolled_back')),actor TEXT NOT NULL,source_reference TEXT NOT NULL,row_count INTEGER NOT NULL,rollback_of INTEGER,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,rolled_back_at TEXT,FOREIGN KEY(rollback_of) REFERENCES catalogue_intake_revisions(id))`),
    env.DB.prepare(`CREATE TABLE IF NOT EXISTS catalogue_intake_rows (revision_id INTEGER NOT NULL,row_key TEXT NOT NULL,target_key TEXT NOT NULL,treatment_strength_id INTEGER NOT NULL,offer_id INTEGER NOT NULL,before_json TEXT NOT NULL,after_json TEXT NOT NULL,blockers_json TEXT NOT NULL,PRIMARY KEY(revision_id,row_key),FOREIGN KEY(revision_id) REFERENCES catalogue_intake_revisions(id))`),
    env.DB.prepare(`CREATE TABLE IF NOT EXISTS catalogue_intake_targets (target_key TEXT PRIMARY KEY,last_revision INTEGER NOT NULL,updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,FOREIGN KEY(last_revision) REFERENCES catalogue_intake_revisions(id))`),
    env.DB.prepare('CREATE INDEX IF NOT EXISTS idx_catalogue_intake_rows_target ON catalogue_intake_rows(target_key,revision_id)')
  ]);
}

async function hashPayload(payload){
  const bytes=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(payload)));
  return [...new Uint8Array(bytes)].map(x=>x.toString(16).padStart(2,'0')).join('');
}
async function resolveRows(env,validated){
  const rows=[];
  for(const row of validated.rows){
    const target=await env.DB.prepare(`SELECT ts.*,o.id offer_id,o.availability_state,o.commercial_state,o.partner_id,o.dispensing_cost_pence,o.delivery_cost_pence,o.payment_cost_pence
      FROM treatment_strengths ts JOIN treatment_formulations f ON f.id=ts.formulation_id JOIN treatment_families tf ON tf.id=f.family_id
      JOIN treatment_offers o ON o.strength_id=ts.id AND o.offer_type=? WHERE tf.family_key=? AND f.formulation_key=? AND ts.strength_label=?`)
      .bind(row.offerType,row.family,row.formulation,row.strength).first();
    const errors=[...row.errors];if(!target)errors.push({code:'catalogue_target_not_found'});
    rows.push({...row,target,ok:errors.length===0,errors,blockers:['supplier_requires_approval','cost_requires_review','stock_requires_review','commercial_blocked','purchase_disabled']});
  }
  return rows;
}

export async function prepareTreatmentIntake(env,payload){
  const validated=validateTreatmentIntake(payload);if(!validated.rows.length)return {...validated,mode:'dry_run'};
  const rows=await resolveRows(env,validated);return {...validated,ok:validated.errors.length===0&&rows.every(r=>r.ok),rows,mode:'dry_run',safety:{supplierApprovalImported:false,claimsChanged:false,clinicalChanged:false,medicinePurchaseEnabled:false}};
}

export async function applyTreatmentIntake(env,payload,{idempotencyKey,actor='HQ operator'}={}){
  const key=clean(idempotencyKey,120);if(!key)return {ok:false,status:400,error:'idempotency_key_required'};
  const prepared=await prepareTreatmentIntake(env,payload);if(!prepared.ok)return {ok:false,status:422,error:'intake_validation_failed',...prepared};
  const payloadHash=await hashPayload(payload),existing=await env.DB.prepare('SELECT id,payload_hash,status FROM catalogue_intake_revisions WHERE idempotency_key=?').bind(key).first();
  if(existing){if(existing.payload_hash!==payloadHash)return {ok:false,status:409,error:'idempotency_conflict'};return {ok:true,status:200,replayed:true,revisionId:existing.id,revisionStatus:existing.status,safety:{medicinePurchaseEnabled:false}}}
  const supplier=prepared.supplier;
  await env.DB.batch([
    env.DB.prepare(`INSERT INTO catalogue_suppliers(legal_name,trading_name,company_number,contact_email,status,evidence_json) VALUES(?,?,?,?,?,?)`).bind(supplier.legalName,supplier.tradingName||null,supplier.companyNumber||null,supplier.contactEmail||null,supplier.status,JSON.stringify({sourceReference:prepared.sourceReference,externalKey:supplier.externalKey})),
    env.DB.prepare(`INSERT INTO catalogue_supplier_keys(external_key,supplier_id) VALUES(?,last_insert_rowid())`).bind(supplier.externalKey),
    env.DB.prepare(`INSERT INTO catalogue_intake_revisions(idempotency_key,payload_hash,status,actor,source_reference,row_count) VALUES(?,?,'applied',?,?,?)`).bind(key,payloadHash,clean(actor,120)||'HQ operator',prepared.sourceReference,prepared.rows.length)
  ]).catch(async error=>{
    if(!/UNIQUE|constraint/i.test(String(error)))throw error;
    const mapped=await env.DB.prepare('SELECT supplier_id FROM catalogue_supplier_keys WHERE external_key=?').bind(supplier.externalKey).first();if(!mapped)throw error;
    await env.DB.prepare(`INSERT INTO catalogue_intake_revisions(idempotency_key,payload_hash,status,actor,source_reference,row_count) VALUES(?,?,'applied',?,?,?)`).bind(key,payloadHash,clean(actor,120)||'HQ operator',prepared.sourceReference,prepared.rows.length).run();
  });
  const revision=await env.DB.prepare('SELECT id FROM catalogue_intake_revisions WHERE idempotency_key=?').bind(key).first(),statements=[];
  for(const row of prepared.rows){
    const t=row.target,targetKey=`${row.target.id}:${row.target.offer_id}`;
    const before={strength:{actual_cost_pence:t.actual_cost_pence,cost_status:t.cost_status,stock_state:t.stock_state,stock_source:t.stock_source,stock_confirmed_at:t.stock_confirmed_at,cta_state:t.cta_state},offer:{partner_id:t.partner_id,dispensing_cost_pence:t.dispensing_cost_pence,delivery_cost_pence:t.delivery_cost_pence,payment_cost_pence:t.payment_cost_pence,availability_state:t.availability_state,commercial_state:t.commercial_state}};
    const after={strength:{actual_cost_pence:row.unitCostPence,cost_status:'proposed',stock_state:row.stockState==='unavailable'?'unavailable':'review',stock_source:row.stockReference||null,stock_confirmed_at:row.stockObservedAt||null,cta_state:'blocked'},offer:{dispensing_cost_pence:row.dispensingCostPence,delivery_cost_pence:row.deliveryCostPence,payment_cost_pence:row.paymentCostPence,availability_state:row.stockState==='unavailable'?'unavailable':'review',commercial_state:'blocked'}};
    statements.push(
      env.DB.prepare(`UPDATE treatment_strengths SET actual_cost_pence=?,cost_status='proposed',stock_state=?,stock_source=?,stock_confirmed_at=?,cta_state='blocked',updated_at=CURRENT_TIMESTAMP WHERE id=?`).bind(after.strength.actual_cost_pence,after.strength.stock_state,after.strength.stock_source,after.strength.stock_confirmed_at,t.id),
      env.DB.prepare(`UPDATE treatment_offers SET partner_id=(SELECT supplier_id FROM catalogue_supplier_keys WHERE external_key=?),dispensing_cost_pence=?,delivery_cost_pence=?,payment_cost_pence=?,availability_state=?,commercial_state='blocked',updated_at=CURRENT_TIMESTAMP WHERE id=?`).bind(supplier.externalKey,row.dispensingCostPence,row.deliveryCostPence,row.paymentCostPence,after.offer.availability_state,t.offer_id),
      env.DB.prepare(`INSERT INTO catalogue_intake_rows(revision_id,row_key,target_key,treatment_strength_id,offer_id,before_json,after_json,blockers_json) VALUES(?,?,?,?,?,?,?,?)`).bind(revision.id,row.rowKey,targetKey,t.id,t.offer_id,JSON.stringify(before),JSON.stringify(after),JSON.stringify(row.blockers)),
      env.DB.prepare(`INSERT INTO catalogue_intake_targets(target_key,last_revision) VALUES(?,?) ON CONFLICT(target_key) DO UPDATE SET last_revision=excluded.last_revision,updated_at=CURRENT_TIMESTAMP`).bind(targetKey,revision.id),
      env.DB.prepare(`INSERT INTO catalogue_audit_events(treatment_strength_id,action,actor,request_id,before_json,after_json) VALUES(?,'bulk_intake_apply',?,?,?,?)`).bind(t.id,clean(actor,120)||'HQ operator',`intake:${revision.id}`,JSON.stringify(before),JSON.stringify(after))
    );
  }
  await env.DB.batch(statements);
  return {ok:true,status:201,replayed:false,revisionId:revision.id,rows:prepared.rows.map(r=>({rowKey:r.rowKey,ok:true,blockers:r.blockers})),safety:{supplierStatus:supplier.status,costStatus:'proposed',stockConfirmedImported:false,commercialState:'blocked',ctaState:'blocked',medicinePurchaseEnabled:false}};
}

export async function rollbackTreatmentIntake(env,revisionId,{actor='HQ operator'}={}){
  const revision=await env.DB.prepare("SELECT * FROM catalogue_intake_revisions WHERE id=? AND status='applied'").bind(revisionId).first();if(!revision)return {ok:false,status:404,error:'applied_revision_not_found'};
  const rows=(await env.DB.prepare(`SELECT r.*,t.last_revision FROM catalogue_intake_rows r LEFT JOIN catalogue_intake_targets t ON t.target_key=r.target_key WHERE r.revision_id=? ORDER BY r.row_key`).bind(revisionId).all()).results||[];
  const conflicts=rows.filter(row=>Number(row.last_revision)!==Number(revisionId)).map(row=>row.row_key);if(conflicts.length)return {ok:false,status:409,error:'rollback_revision_conflict',rows:conflicts};
  const statements=[];for(const row of rows){const before=JSON.parse(row.before_json),s=before.strength,o=before.offer;
    statements.push(
      env.DB.prepare(`UPDATE treatment_strengths SET actual_cost_pence=?,cost_status=?,stock_state=?,stock_source=?,stock_confirmed_at=?,cta_state='blocked',updated_at=CURRENT_TIMESTAMP WHERE id=?`).bind(s.actual_cost_pence,s.cost_status,s.stock_state,s.stock_source,s.stock_confirmed_at,row.treatment_strength_id),
      env.DB.prepare(`UPDATE treatment_offers SET partner_id=?,dispensing_cost_pence=?,delivery_cost_pence=?,payment_cost_pence=?,availability_state=CASE WHEN ?='available' THEN 'review' ELSE ? END,commercial_state='blocked',updated_at=CURRENT_TIMESTAMP WHERE id=?`).bind(o.partner_id,o.dispensing_cost_pence,o.delivery_cost_pence,o.payment_cost_pence,o.availability_state,o.availability_state,row.offer_id),
      env.DB.prepare('DELETE FROM catalogue_intake_targets WHERE target_key=? AND last_revision=?').bind(row.target_key,revisionId),
      env.DB.prepare(`INSERT INTO catalogue_audit_events(treatment_strength_id,action,actor,request_id,before_json,after_json) VALUES(?,'bulk_intake_rollback',?,?,?,?)`).bind(row.treatment_strength_id,clean(actor,120)||'HQ operator',`rollback:${revisionId}`,row.after_json,row.before_json)
    );
  }
  statements.push(env.DB.prepare("UPDATE catalogue_intake_revisions SET status='rolled_back',rolled_back_at=CURRENT_TIMESTAMP WHERE id=? AND status='applied'").bind(revisionId));await env.DB.batch(statements);
  return {ok:true,status:200,revisionId,rolledBack:true,rows:rows.length,safety:{commercialState:'blocked',ctaState:'blocked',medicinePurchaseEnabled:false}};
}
