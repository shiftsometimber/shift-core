import {categories} from './catalogue.mjs';
export const json=(body,status=200)=>new Response(JSON.stringify(body),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
const clean=(v,n)=>String(v??'').trim().slice(0,n);
export function validateDraft(body){
 const text={name:160,description:800,shift_says:700,supplier_sku:100,supplier_pack:100,ean:40,internal_notes:1500};const data={};
 for(const [key,max]of Object.entries(text))if(Object.hasOwn(body,key)){if(typeof body[key]!=='string'&&body[key]!==null)throw Error('Invalid '+key);data[key]=clean(body[key],max)||null;}
 if(Object.hasOwn(data,'name')&&!data.name)throw Error('Product name is required');
 if(Object.hasOwn(body,'category')){if(!categories.some(([id])=>id!=='all'&&id===body.category))throw Error('Invalid category');data.category=body.category;}
 if(Object.hasOwn(body,'format')){if(!['powder','sachets','tablets','bars','capsules','other'].includes(body.format))throw Error('Invalid format');data.format=body.format;}
 if(Object.hasOwn(body,'visibility')){if(!['hidden','proposed'].includes(body.visibility))throw Error('Invalid visibility');data.visibility=body.visibility;}
 for(const key of ['checkout_recommendation','checkout_priority'])if(Object.hasOwn(body,key)){const value=body[key];if(!Number.isSafeInteger(value)||value<0||value>(key==='checkout_recommendation'?1:10000))throw Error('Invalid '+key);data[key]=value;}
 for(const key of ['trade_price_pence','retail_price_pence','delivery_cost_pence','stock_quantity'])if(Object.hasOwn(body,key)){const value=body[key];if(value!==null&&(!Number.isSafeInteger(value)||value<0||value>1e8))throw Error('Invalid '+key);data[key]=value;}
 if(Object.hasOwn(body,'vat_rate')){const v=body.vat_rate;if(v!==null&&(!Number.isFinite(v)||v<0||v>100))throw Error('Invalid VAT rate');data.vat_rate=v;}
 if(Object.hasOwn(body,'sale_enabled')&&body.sale_enabled!==0&&body.sale_enabled!==false)throw Error('Purchasing is not connected');
 return data;
}
export function cors(response,request){const headers=new Headers(response.headers);if(request.headers.get('Origin')==='https://hq.shiftsometimber.co.uk'){headers.set('Access-Control-Allow-Origin','https://hq.shiftsometimber.co.uk');headers.set('Access-Control-Allow-Credentials','true');headers.set('Access-Control-Allow-Methods','GET,PATCH,OPTIONS');headers.set('Access-Control-Allow-Headers','Content-Type');headers.set('Vary','Origin');}return new Response(response.body,{status:response.status,headers});}
export async function hqRoute(request,env){
 const origin=request.headers.get('Origin'),path=new URL(request.url).pathname.replace(/\/+$/,''),method=request.method;
 if(method==='OPTIONS')return origin==='https://hq.shiftsometimber.co.uk'?cors(new Response(null,{status:204}),request):json({error:'forbidden'},403);
 if(!['GET','PATCH'].includes(method))return json({error:'method_not_allowed'},405);
 if(origin&&origin!=='https://hq.shiftsometimber.co.uk')return json({error:'forbidden'},403);
 if(method==='PATCH'&&origin!=='https://hq.shiftsometimber.co.uk')return json({error:'origin_required'},403);
 const auth=await env.CORE.fetch(new Request('https://api.shiftsometimber.co.uk/v1/hq/me',{headers:request.headers}));
 if(!auth.ok)return cors(auth,request);
 const identity=await auth.json(),user=identity.user||{},permissions=identity.permissions||[];
 const manage=['owner','admin','operations'].includes(user.role),read=manage||permissions.includes('*')||permissions.includes('commerce_read');
 if(!read||method==='PATCH'&&!manage)return cors(json({error:'forbidden'},403),request);
 if(path==='/v1/hq/supplements/orders'&&method==='GET'){
  const {results=[]}=await env.DB.prepare('SELECT order_number,channel,total_pence,status,quote_json,created_at FROM supplement_checkout_orders ORDER BY created_at DESC,id DESC LIMIT 100').all();
  return cors(json({ok:true,orders:results.map(({quote_json,...order})=>({...order,items:JSON.parse(quote_json).items.map(({id,name,pack,quantity})=>({id,name,pack,quantity}))}))}),request);
 }
 if(path==='/v1/hq/supplements'&&method==='GET'){
  const {results=[]}=await env.DB.prepare('SELECT * FROM supplement_products ORDER BY sort_order,id').all();
  return cors(json({ok:true,products:results,canManage:manage,integration:{supplier:'Olivit',apiConnected:false,dropshipTermsConfirmed:false,purchasingEnabled:false}}),request);
 }
 const match=path.match(/^\/v1\/hq\/supplements\/([a-z0-9-]{1,80})$/);
 if(!match||method!=='PATCH')return cors(json({error:'not_found'},404),request);
 if(!request.headers.get('Content-Type')?.startsWith('application/json'))return cors(json({error:'json_required'},415),request);
 const raw=await request.text();if(raw.length>12000)return cors(json({error:'body_too_large'},413),request);
 let body,data;try{body=JSON.parse(raw);if(!body||Array.isArray(body)||typeof body!=='object'||!Number.isSafeInteger(body.revision)||body.revision<1)throw Error('A current record revision is required');data=validateDraft(body);if(!Object.keys(data).length)throw Error('No editable fields supplied');}catch(e){return cors(json({error:'invalid_draft',message:e.message},400),request);}
 const id=match[1],who=String(user.id||user.email||'hq-user'),keys=Object.keys(data);
 const updated=await env.DB.batch([
  env.DB.prepare('UPDATE supplement_products SET '+keys.map(k=>k+'=?').join(',')+",revision=revision+1,updated_at=CURRENT_TIMESTAMP,updated_by=? WHERE id=? AND revision=?").bind(...keys.map(k=>data[k]),who,id,body.revision),
  env.DB.prepare("INSERT OR IGNORE INTO supplement_product_history(product_id,revision,changed_by,record_json) SELECT id,revision,?,json_object('checkout_recommendation',checkout_recommendation,'checkout_priority',checkout_priority,'name',name,'description',description,'shift_says',shift_says,'category',category,'visibility',visibility,'trade_price_pence',trade_price_pence,'retail_price_pence',retail_price_pence,'delivery_cost_pence',delivery_cost_pence,'supplier_sku',supplier_sku,'supplier_pack',supplier_pack,'stock_quantity',stock_quantity,'vat_rate',vat_rate,'internal_notes',internal_notes) FROM supplement_products WHERE id=? AND revision=?").bind(who,id,body.revision+1)
 ]);
 if(updated[0].meta.changes!==1)return cors(json({error:'record_changed',message:'This record changed. Refresh before saving.'},409),request);
 const product=await env.DB.prepare('SELECT * FROM supplement_products WHERE id=?').bind(id).first();
 return cors(json({ok:true,product}),request);
}
