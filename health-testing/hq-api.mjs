import {cors,json} from '../health-nutrition/hq-api.mjs';
export function validateTestingDraft(body){
 const data={};
 for(const [key,max] of Object.entries({supplier_sku:100,internal_notes:1500}))if(Object.hasOwn(body,key)){
  if(typeof body[key]!=='string'&&body[key]!==null)throw Error('Invalid '+key);
  data[key]=String(body[key]??'').trim().slice(0,max)||null;
 }
 for(const key of ['trade_price_pence','retail_price_pence','delivery_cost_pence'])if(Object.hasOwn(body,key)){
  const v=body[key];if(v!==null&&(!Number.isSafeInteger(v)||v<0||v>1e8))throw Error('Invalid '+key);data[key]=v;
 }
 if(Object.hasOwn(body,'vat_rate')){const v=body.vat_rate;if(v!==null&&(!Number.isFinite(v)||v<0||v>100))throw Error('Invalid VAT rate');data.vat_rate=v;}
 if(Object.hasOwn(body,'sale_enabled')&&body.sale_enabled!==0&&body.sale_enabled!==false)throw Error('Purchasing is not connected');
 if(Object.hasOwn(body,'status')&&body.status!=='draft')throw Error('Testing products must remain drafts');
 return data;
}
export async function testingHQRoute(request,env){
 const origin=request.headers.get('Origin'),path=new URL(request.url).pathname.replace(/\/+$/,''),method=request.method;
 if(method==='OPTIONS')return origin==='https://hq.shiftsometimber.co.uk'?cors(new Response(null,{status:204}),request):json({error:'forbidden'},403);
 if(!['GET','PATCH'].includes(method))return json({error:'method_not_allowed'},405);
 if(origin&&origin!=='https://hq.shiftsometimber.co.uk')return json({error:'forbidden'},403);
 if(method==='PATCH'&&origin!=='https://hq.shiftsometimber.co.uk')return json({error:'origin_required'},403);
 const auth=await env.CORE.fetch(new Request('https://api.shiftsometimber.co.uk/v1/hq/me',{headers:request.headers}));
 if(!auth.ok)return cors(auth,request);
 const identity=await auth.json(),user=identity.user||{},permissions=identity.permissions||[];
 const manage=['owner','admin','operations'].includes(user.role),read=manage||permissions.includes('*')||permissions.includes('commerce_read');
 if(!read||(method==='PATCH'&&!manage))return cors(json({error:'forbidden'},403),request);
 if(path==='/v1/hq/testing'&&method==='GET'){
  const {results=[]}=await env.DB.prepare('SELECT * FROM testing_products ORDER BY sort_order,id').all();
  return cors(json({ok:true,products:results,canManage:manage,integration:{supplier:'Newfoundland',fulfilment:'daily_csv',supplierCodesConfirmed:false,orderExportEnabled:false,purchasingEnabled:false,labResults:'Newfoundland Health Hub'}}),request);
 }
 const match=path.match(/^\/v1\/hq\/testing\/([a-z0-9-]{1,80})$/);
 if(!match||method!=='PATCH')return cors(json({error:'not_found'},404),request);
 if(!request.headers.get('Content-Type')?.startsWith('application/json'))return cors(json({error:'json_required'},415),request);
 const raw=await request.text();if(raw.length>12000)return cors(json({error:'body_too_large'},413),request);
 let body,data;try{body=JSON.parse(raw);if(!body||Array.isArray(body)||typeof body!=='object'||!Number.isSafeInteger(body.revision)||body.revision<1)throw Error('A current record revision is required');data=validateTestingDraft(body);if(!Object.keys(data).length)throw Error('No editable fields supplied');}catch(e){return cors(json({error:'invalid_draft',message:e.message},400),request);}
 const id=match[1],who=String(user.id||user.email||'hq-user'),keys=Object.keys(data);
 const rows=await env.DB.batch([
  env.DB.prepare('UPDATE testing_products SET '+keys.map(k=>k+'=?').join(',')+',revision=revision+1,updated_at=CURRENT_TIMESTAMP,updated_by=? WHERE id=? AND revision=?').bind(...keys.map(k=>data[k]),who,id,body.revision),
  env.DB.prepare("INSERT OR IGNORE INTO testing_product_history(product_id,revision,changed_by,record_json) SELECT id,revision,?,json_object('supplier_sku',supplier_sku,'trade_price_pence',trade_price_pence,'retail_price_pence',retail_price_pence,'delivery_cost_pence',delivery_cost_pence,'vat_rate',vat_rate,'internal_notes',internal_notes) FROM testing_products WHERE id=? AND revision=? AND updated_by=?").bind(who,id,body.revision+1,who)
 ]);
 if(rows[0].meta.changes!==1)return cors(json({error:'record_changed',message:'This record changed. Refresh before saving.'},409),request);
 const product=await env.DB.prepare('SELECT * FROM testing_products WHERE id=?').bind(id).first();
 return cors(json({ok:true,product}),request);
}
