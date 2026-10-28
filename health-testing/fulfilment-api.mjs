import {configProjection,validateConfig,parseJSON,lineValues,lineIssues,csvText,sha256,syntheticRows,emailDraft,emailFile,exportFields,text} from './fulfilment-model.mjs';

const ROOT='/v1/hq/testing/fulfilment';
const catalogue="SELECT id,sku,name,supplier_sku,supplier_state FROM testing_products UNION ALL SELECT id,sku,name,supplier_sku,supplier_state FROM testing_range_extras";
const sourceSQL=`WITH catalogue AS (${catalogue}) SELECT oi.id source_line_id,o.id source_order_id,o.order_number,o.customer_name,o.customer_email,o.created_at,o.updated_at order_updated_at,o.payment_status,o.status order_status,oi.sku,oi.quantity,p.id catalogue_id,p.name,p.supplier_sku,p.supplier_state,d.shipping_name,d.shipping_address_json,d.stripe_checkout_session_id,d.stripe_payment_status,COALESCE((SELECT SUM(amount_pence) FROM commerce_refunds WHERE order_id=o.id),0) refunded_pence FROM orders o JOIN commerce_order_items oi ON oi.order_id=o.id LEFT JOIN catalogue p ON p.sku=oi.sku LEFT JOIN commerce_order_details d ON d.order_id=o.id WHERE (p.id IS NOT NULL OR oi.sku LIKE 'SST-NF-%')`;
const fail=(message,status=400,code='invalid_request')=>Object.assign(new Error(message),{status,code});
const json=(body,status=200)=>new Response(JSON.stringify(body),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
function cors(response,request){const headers=new Headers(response.headers);headers.set('X-Shift-Testing-Fulfilment','csv-draft-20261028');if(request.headers.get('Origin')==='https://hq.shiftsometimber.co.uk'){headers.set('Access-Control-Allow-Origin','https://hq.shiftsometimber.co.uk');headers.set('Access-Control-Allow-Credentials','true');headers.set('Access-Control-Allow-Methods','GET,POST,PATCH,OPTIONS');headers.set('Access-Control-Allow-Headers','Content-Type');headers.set('Vary','Origin');}return new Response(response.body,{status:response.status,headers});}
const all=async(DB,sql,args=[])=>((await DB.prepare(sql).bind(...args).all()).results||[]);
const config=async DB=>configProjection(await DB.prepare('SELECT * FROM testing_fulfilment_config WHERE id=1').first());
const batchProjection=b=>{const {csv_text,snapshot_json,config_json,request_hash,...row}=b;return row;};
const getBatch=async(DB,id)=>{const b=await DB.prepare('SELECT * FROM testing_fulfilment_batches WHERE id=?').bind(id).first();if(!b)throw fail('Export batch not found.',404,'not_found');return b;};
const sourceRows=(DB,ids)=>all(DB,sourceSQL+' AND o.id IN (SELECT value FROM json_each(?)) ORDER BY o.id,oi.id',[JSON.stringify(ids)]);
function guards(rows){return rows.map(r=>({line_id:r.source_line_id,order_id:r.source_order_id,sku:r.sku,quantity:r.quantity,supplier_sku:r.supplier_sku,order_updated_at:r.order_updated_at,customer_name:r.customer_name,customer_email:r.customer_email,shipping_name:r.shipping_name,shipping_address_json:r.shipping_address_json,session:r.stripe_checkout_session_id}));}
function liveGuard(snapshot,revision,ownBatch=''){
 const ids=JSON.stringify(snapshot.order_ids),expected=JSON.stringify(snapshot.guards);
 return {sql:`EXISTS(SELECT 1 FROM testing_fulfilment_config WHERE id=1 AND revision=? AND template_confirmed=1 AND delivery_confirmed=1)
 AND NOT EXISTS(SELECT 1 FROM testing_fulfilment_items WHERE active=1 AND source_order_id IN (SELECT value FROM json_each(?)) AND batch_id<>?)
 AND NOT EXISTS(SELECT 1 FROM json_each(?) s LEFT JOIN commerce_order_items oi ON oi.id=json_extract(s.value,'$.line_id') LEFT JOIN orders o ON o.id=oi.order_id LEFT JOIN commerce_order_details d ON d.order_id=o.id LEFT JOIN catalogue p ON p.sku=oi.sku
 WHERE oi.id IS NULL OR o.id IS NOT json_extract(s.value,'$.order_id') OR oi.sku IS NOT json_extract(s.value,'$.sku') OR oi.quantity IS NOT json_extract(s.value,'$.quantity') OR p.supplier_sku IS NOT json_extract(s.value,'$.supplier_sku') OR o.updated_at IS NOT json_extract(s.value,'$.order_updated_at') OR o.customer_name IS NOT json_extract(s.value,'$.customer_name') OR o.customer_email IS NOT json_extract(s.value,'$.customer_email') OR d.shipping_name IS NOT json_extract(s.value,'$.shipping_name') OR d.shipping_address_json IS NOT json_extract(s.value,'$.shipping_address_json') OR d.stripe_checkout_session_id IS NOT json_extract(s.value,'$.session') OR o.payment_status<>'paid' OR d.stripe_payment_status<>'paid' OR d.stripe_checkout_session_id NOT LIKE 'cs_live_%' OR o.status NOT IN ('new','paid','processing') OR p.supplier_state='coming_soon' OR EXISTS(SELECT 1 FROM commerce_refunds WHERE order_id=o.id AND amount_pence>0))
 AND (SELECT COUNT(*) FROM commerce_order_items oi LEFT JOIN catalogue p ON p.sku=oi.sku WHERE oi.order_id IN (SELECT value FROM json_each(?)) AND (p.id IS NOT NULL OR oi.sku LIKE 'SST-NF-%'))=json_array_length(?)`,args:[revision,ids,ownBatch,expected,ids,expected]};
}
async function fresh(DB,b){
 if(b.status==='cancelled')throw fail('This export was cancelled. Prepare a new batch.',409,'batch_cancelled');
 if(b.mode==='test'||b.status!=='prepared')return;
 const guard=liveGuard(parseJSON(b.snapshot_json),b.config_revision,b.id);
 const row=await DB.prepare(`WITH catalogue AS (${catalogue}) SELECT 1 valid WHERE ${guard.sql}`).bind(...guard.args).first();
 if(!row)throw fail('An order, product code or CSV setup changed. Cancel this draft and prepare a fresh export.',409,'batch_outdated');
}
async function requestBody(request){if(!request.headers.get('Content-Type')?.startsWith('application/json'))throw fail('JSON is required.',415);const raw=await request.text();if(raw.length>32000)throw fail('Request is too large.',413);let body;try{body=JSON.parse(raw);}catch{throw fail('Invalid JSON.');}if(!body||typeof body!=='object'||Array.isArray(body))throw fail('Invalid request.');return body;}
const event=(DB,batchId,kind,actor,detail,now)=>DB.prepare('INSERT INTO testing_fulfilment_events(batch_id,event,actor,detail_json,created_at) VALUES(?,?,?,?,?)').bind(batchId,kind,actor,JSON.stringify(detail),now);

async function prepareBatch(DB,body,mode,actor){
 const key=text(body.requestKey,80);if(!/^[a-zA-Z0-9-]{16,80}$/.test(key))throw fail('A unique request key is required.');
 const ids=mode==='test'?[-1]:body.orderIds;
 if(!Array.isArray(ids)||!ids.length||ids.length>25||mode==='live'&&ids.some(n=>!Number.isSafeInteger(n)||n<1)||new Set(ids).size!==ids.length)throw fail('Select between 1 and 25 whole orders.');
 const ordered=[...ids].sort((a,b)=>a-b),hash=await sha256(JSON.stringify({mode,orderIds:ordered,configRevision:body.configRevision}));
 const previous=await DB.prepare('SELECT * FROM testing_fulfilment_batches WHERE request_key=?').bind(key).first();
 if(previous){if(previous.request_hash!==hash)throw fail('This request key was already used for a different selection.',409,'idempotency_conflict');return {batch:batchProjection(previous),replayed:true};}
 const cfg=await config(DB);
 if(body.configRevision!==cfg.revision)throw fail('CSV setup changed. Refresh before preparing a batch.',409,'revision_conflict');
 if(mode==='live'&&(!cfg.template_confirmed||!cfg.delivery_confirmed))throw fail('Confirm the partner CSV template and submission destination before exporting real orders.',409,'setup_incomplete');
 const source=mode==='test'?syntheticRows():await sourceRows(DB,ordered);
 if(!source.length||source.length>200||new Set(source.map(r=>r.source_order_id)).size!==ordered.length)throw fail('One or more orders are missing or have too many product lines.',409,'selection_changed');
 if(mode==='live')for(const row of source){const issues=lineIssues(row,cfg);if(issues.length)throw fail(row.order_number+': '+issues.join(' '),409,'order_held');}
 const exportRows=source.map(r=>{const values=lineValues(r);return Object.fromEntries(cfg.columns.map(c=>[c.source,values[c.source]]));});
 const snapshot={order_ids:ordered,guards:mode==='live'?guards(source):[],rows:exportRows,orders:ordered.map(id=>({id,reference:source.find(r=>r.source_order_id===id).order_number,products:source.filter(r=>r.source_order_id===id).map(r=>({name:r.name,quantity:r.quantity}))}))};
 const csv=csvText(exportRows,cfg),csvHash=await sha256(csv),id=(mode==='test'?'TEST-':'TF-')+new Date().toISOString().slice(0,10).replaceAll('-','')+'-'+crypto.randomUUID().slice(0,8),now=new Date().toISOString();
 const cols=['id','request_key','request_hash','mode','config_revision','config_json','snapshot_json','csv_text','csv_sha256','row_count','order_count','created_by','created_at'];
 const values=[id,key,hash,mode,cfg.revision,JSON.stringify(cfg),JSON.stringify(snapshot),csv,csvHash,source.length,ordered.length,actor,now];
 const guard=mode==='live'?liveGuard(snapshot,cfg.revision):{sql:'1=1',args:[]};
 const parent=DB.prepare(`WITH catalogue AS (${catalogue}) INSERT INTO testing_fulfilment_batches(${cols.join(',')}) SELECT ${cols.map(()=>'?').join(',')} WHERE ${guard.sql}`).bind(...values,...guard.args);
 const statements=[parent];
 if(mode==='live')statements.push(DB.prepare("INSERT INTO testing_fulfilment_items(batch_id,source_line_id,source_order_id,order_reference) SELECT ?,json_extract(value,'$.source_line_id'),json_extract(value,'$.source_order_id'),json_extract(value,'$.order_number') FROM json_each(?) WHERE EXISTS(SELECT 1 FROM testing_fulfilment_batches WHERE id=?)").bind(id,JSON.stringify(source.map(r=>({source_line_id:r.source_line_id,source_order_id:r.source_order_id,order_number:r.order_number}))),id));
 statements.push(DB.prepare("INSERT INTO testing_fulfilment_tracking(batch_id,source_order_id,updated_by,updated_at) SELECT ?,value,?,? FROM json_each(?) WHERE EXISTS(SELECT 1 FROM testing_fulfilment_batches WHERE id=?)").bind(id,actor,now,JSON.stringify(ordered),id));
 statements.push(DB.prepare("INSERT INTO testing_fulfilment_events(batch_id,event,actor,detail_json,created_at) SELECT ?,'prepared',?,?,? WHERE EXISTS(SELECT 1 FROM testing_fulfilment_batches WHERE id=?)").bind(id,actor,JSON.stringify({mode,orders:ordered.length,rows:source.length,sha256:csvHash}),now,id));
 try{const result=await DB.batch(statements);if(result[0].meta.changes!==1)throw fail('An order changed or is already in a batch. Refresh the queue.',409,'selection_changed');}catch(error){if(error.status)throw error;const retry=await DB.prepare('SELECT * FROM testing_fulfilment_batches WHERE request_key=?').bind(key).first();if(retry&&retry.request_hash===hash)return {batch:batchProjection(retry),replayed:true};throw fail('These orders changed or another export already contains them. Refresh the queue.',409,'selection_changed');}
 return {batch:batchProjection(await getBatch(DB,id)),replayed:false};
}

async function dispatch(request,env,path,actor){
 const DB=env.DB,method=request.method,now=new Date().toISOString();
 if(path===ROOT&&method==='GET')return json({ok:true,config:await config(DB),fields:exportFields,purchasingEnabled:false,emailSendingEnabled:false});
 if(path===ROOT+'/config'&&method==='PATCH'){
  const body=await requestBody(request);let cfg;try{cfg=validateConfig(body);}catch(error){throw fail(error.message);}if(!Number.isSafeInteger(body.revision))throw fail('A current setup revision is required.');
  const keys=['template_name','columns_json','delimiter','utf8_bom','template_confirmed','delivery_method','destination','delivery_confirmed'],data={...cfg,columns_json:JSON.stringify(cfg.columns)};
  const result=await DB.batch([DB.prepare('UPDATE testing_fulfilment_config SET '+keys.map(k=>k+'=?').join(',')+',revision=revision+1,updated_by=?,updated_at=? WHERE id=1 AND revision=?').bind(...keys.map(k=>data[k]),actor,now,body.revision),DB.prepare("INSERT INTO testing_fulfilment_events(event,actor,detail_json,created_at) SELECT 'config_saved',?,?,? WHERE changes()=1").bind(actor,JSON.stringify({previousRevision:body.revision,templateConfirmed:Boolean(cfg.template_confirmed),deliveryConfirmed:Boolean(cfg.delivery_confirmed)}),now)]);
  if(result[0].meta.changes!==1)throw fail('CSV setup changed. Refresh before saving.',409,'revision_conflict');
  return json({ok:true,config:await config(DB)});
 }
 if(path===ROOT+'/queue'&&method==='GET'){
  const cursor=Number(new URL(request.url).searchParams.get('after')||0);if(!Number.isSafeInteger(cursor)||cursor<0)throw fail('Invalid queue cursor.');
  const ids=await all(DB,`WITH catalogue AS (${catalogue}) SELECT DISTINCT o.id FROM orders o JOIN commerce_order_items oi ON oi.order_id=o.id LEFT JOIN catalogue p ON p.sku=oi.sku WHERE (p.id IS NOT NULL OR oi.sku LIKE 'SST-NF-%') AND o.payment_status='paid' AND o.id>? AND NOT EXISTS(SELECT 1 FROM testing_fulfilment_items f WHERE f.source_order_id=o.id AND f.active=1) ORDER BY o.id LIMIT 101`,[cursor]);
  const cfg=await config(DB),rows=ids.length?await sourceRows(DB,ids.slice(0,100).map(r=>r.id)):[];
  const orders=ids.slice(0,100).map(({id})=>{const lines=rows.filter(r=>r.source_order_id===id),issues=[...new Set(lines.flatMap(r=>lineIssues(r,cfg)))];return {id,reference:lines[0].order_number,createdAt:lines[0].created_at,recipient:lineValues(lines[0]).recipient,postcode:lineValues(lines[0]).postcode,lines:lines.map(r=>({productId:r.catalogue_id,name:r.name||r.sku,quantity:r.quantity,supplierSku:r.supplier_sku||null})),issues,ready:issues.length===0};});
  return json({ok:true,orders,nextCursor:ids.length>100?ids[99].id:null,configRevision:cfg.revision,setupReady:Boolean(cfg.template_confirmed&&cfg.delivery_confirmed),purchasingEnabled:false,emailSendingEnabled:false});
 }
 if(path===ROOT+'/batches'&&method==='GET'){
  const before=Number(new URL(request.url).searchParams.get('before')||Number.MAX_SAFE_INTEGER);if(!Number.isSafeInteger(before)||before<1)throw fail('Invalid history cursor.');
  const rows=await all(DB,'SELECT seq,id,mode,status,revision,config_revision,row_count,order_count,created_by,created_at,submitted_at,submission_reference,acknowledged_at,csv_sha256 FROM testing_fulfilment_batches WHERE seq<? ORDER BY seq DESC LIMIT 21',[before]);
  return json({ok:true,batches:rows.slice(0,20),nextCursor:rows.length>20?rows[19].seq:null});
 }
 if((path===ROOT+'/batches'||path===ROOT+'/batches/test')&&method==='POST'){const result=await prepareBatch(DB,await requestBody(request),path.endsWith('/test')?'test':'live',actor);return json({ok:true,...result},result.replayed?200:201);}
 const match=path.match(/^\/v1\/hq\/testing\/fulfilment\/batches\/([a-zA-Z0-9-]{8,80})(?:\/(csv|email|email\.eml|actions|tracking))?$/);
 if(!match)throw fail('Not found.',404,'not_found');
 const b=await getBatch(DB,match[1]),action=match[2];
 if(!action&&method==='GET'){
  let issue=null;try{await fresh(DB,b);}catch(error){issue=error.message;}
  return json({ok:true,batch:batchProjection(b),columns:parseJSON(b.config_json).columns,preview:parseJSON(b.snapshot_json).rows,orders:parseJSON(b.snapshot_json).orders,email:emailDraft(b),issue,tracking:await all(DB,'SELECT * FROM testing_fulfilment_tracking WHERE batch_id=? ORDER BY source_order_id',[b.id]),events:await all(DB,'SELECT event,actor,detail_json,created_at FROM testing_fulfilment_events WHERE batch_id=? ORDER BY id DESC LIMIT 100',[b.id])});
 }
 if(['csv','email','email.eml'].includes(action)&&method==='GET'){
  await fresh(DB,b);
  if(action==='email')return json({ok:true,draft:emailDraft(b)});
  let contents=b.csv_text,filename=emailDraft(b).attachments[0].filename,type='text/csv; charset=utf-8';
  if(action==='email.eml'){try{contents=emailFile(b);}catch(error){throw fail(error.message,409,'recipient_unconfirmed');}filename=filename.replace('.csv','.eml');type='message/rfc822';}
  await event(DB,b.id,action==='csv'?'csv_downloaded':'email_draft_downloaded',actor,{sha256:b.csv_sha256},now).run();
  return new Response(contents,{headers:{'Content-Type':type,'Content-Disposition':'attachment; filename="'+filename+'"','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Content-Security-Policy':"default-src 'none'"}});
 }
 if(action==='actions'&&method==='POST'){
  const body=await requestBody(request);if(body.revision!==b.revision)throw fail('This batch changed. Refresh before updating.',409,'revision_conflict');
  const kind=body.action,reference=text(body.reference,300);let sql,values=[];
  if(kind==='cancel'){
   if(b.status!=='prepared'||!reference)throw fail('Only an unsent draft can be cancelled, with a reason.',409);
   sql="UPDATE testing_fulfilment_batches SET status='cancelled',cancelled_by=?,cancelled_at=?,cancellation_reason=?,revision=revision+1 WHERE id=? AND revision=? AND status='prepared'";values=[actor,now,reference,b.id,b.revision];
  }else if(kind==='submitted'){
   if(b.status!=='prepared'||!reference||body.confirmActuallySubmitted!==true)throw fail('Record a submission reference only after the CSV has actually been sent or uploaded.',409);
   await fresh(DB,b);const guard=b.mode==='live'?liveGuard(parseJSON(b.snapshot_json),b.config_revision,b.id):{sql:'1=1',args:[]};
   sql=`WITH catalogue AS (${catalogue}) UPDATE testing_fulfilment_batches SET status='submitted',submitted_by=?,submitted_at=?,submission_reference=?,revision=revision+1 WHERE id=? AND revision=? AND status='prepared' AND ${guard.sql}`;values=[actor,now,reference,b.id,b.revision,...guard.args];
  }else if(kind==='acknowledged'){
   if(b.status!=='submitted'||!reference)throw fail('Record the partner acknowledgement after submission.',409);
   sql="UPDATE testing_fulfilment_batches SET status='acknowledged',acknowledged_by=?,acknowledged_at=?,acknowledgement_reference=?,revision=revision+1 WHERE id=? AND revision=? AND status='submitted'";values=[actor,now,reference,b.id,b.revision];
  }else throw fail('Unknown batch action.');
  const statements=[DB.prepare(sql).bind(...values),DB.prepare('INSERT INTO testing_fulfilment_events(batch_id,event,actor,detail_json,created_at) SELECT ?,?,?,?,? WHERE changes()=1').bind(b.id,kind,actor,JSON.stringify({reference}),now)];
  if(kind==='cancel')statements.push(DB.prepare("UPDATE testing_fulfilment_items SET active=0 WHERE batch_id=? AND EXISTS(SELECT 1 FROM testing_fulfilment_batches WHERE id=? AND status='cancelled')").bind(b.id,b.id));
  const result=await DB.batch(statements);if(result[0].meta.changes!==1)throw fail('This batch or an included order changed. Refresh before updating.',409,'revision_conflict');
  return json({ok:true,batch:batchProjection(await getBatch(DB,b.id)),emailSendingEnabled:false});
 }
 if(action==='tracking'&&method==='PATCH'){
  const body=await requestBody(request);if(!['submitted','acknowledged'].includes(b.status))throw fail('Record submission before updating partner fulfilment.',409);
  if(!Number.isSafeInteger(body.orderId)||!Number.isSafeInteger(body.revision)||!['awaiting_confirmation','accepted','dispatched','exception'].includes(body.status))throw fail('Invalid tracking update.');
  const carrier=text(body.carrier,100),tracking=text(body.trackingReference,200),partner=text(body.partnerReference,200),note=text(body.note,500);
  if(body.status==='dispatched'&&!tracking&&!partner)throw fail('Enter a tracking or partner dispatch reference.');
  const result=await DB.batch([DB.prepare('UPDATE testing_fulfilment_tracking SET status=?,carrier=?,tracking_reference=?,partner_reference=?,note=?,updated_by=?,updated_at=?,revision=revision+1 WHERE batch_id=? AND source_order_id=? AND revision=?').bind(body.status,carrier||null,tracking||null,partner||null,note||null,actor,now,b.id,body.orderId,body.revision),DB.prepare("INSERT INTO testing_fulfilment_events(batch_id,event,actor,detail_json,created_at) SELECT ?,'tracking_updated',?,?,? WHERE changes()=1").bind(b.id,actor,JSON.stringify({orderId:body.orderId,status:body.status,carrier,tracking,partner,note}),now)]);
  if(result[0].meta.changes!==1)throw fail('Tracking changed. Refresh before saving.',409,'revision_conflict');
  return json({ok:true,tracking:await DB.prepare('SELECT * FROM testing_fulfilment_tracking WHERE batch_id=? AND source_order_id=?').bind(b.id,body.orderId).first()});
 }
 throw fail('Method not allowed.',405,'method_not_allowed');
}

export async function fulfilmentRoute(request,env){
 const origin=request.headers.get('Origin'),method=request.method,path=new URL(request.url).pathname.replace(/\/+$/,'');
 if(method==='OPTIONS')return origin==='https://hq.shiftsometimber.co.uk'?cors(new Response(null,{status:204}),request):json({error:'forbidden'},403);
 if(origin&&origin!=='https://hq.shiftsometimber.co.uk'||['POST','PATCH'].includes(method)&&origin!=='https://hq.shiftsometimber.co.uk')return json({error:'forbidden'},403);
 if(!['GET','POST','PATCH'].includes(method))return cors(json({error:'method_not_allowed'},405),request);
 const auth=await env.CORE.fetch(new Request('https://api.shiftsometimber.co.uk/v1/hq/me',{headers:request.headers}));if(!auth.ok)return cors(auth,request);
 const identity=await auth.json(),user=identity.user||{};
 if(!['owner','admin','operations'].includes(user.role))return cors(json({error:'forbidden'},403),request);
 try{return cors(await dispatch(request,env,path,String(user.email||user.id||'hq-user')),request);}catch(error){if(error.status)return cors(json({ok:false,error:error.code,message:error.message},error.status),request);console.error('Testing fulfilment request failed');return cors(json({ok:false,error:'fulfilment_unavailable',message:'Testing fulfilment is temporarily unavailable. Please refresh or try again shortly.'},503),request);}
}
