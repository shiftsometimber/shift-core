import core from './worker.js';
import {memberProductStructuredRoutes} from './member-product-structured-v1.js';

const OWNED=new Set(['/v1/grub/plan','/v1/grub/replace','/v1/grub/feedback','/v1/fit/plan','/v1/fit/replace','/v1/fit/feedback']);
const ORIGINS=new Set(['https://shiftsometimber.co.uk','https://www.shiftsometimber.co.uk','https://shiftsometimber.com','https://www.shiftsometimber.com']);

export async function memberProductV5Routes(request,env,ctx){
  const path=new URL(request.url).pathname.replace(/\/+$/,'')||'/';
  if(!OWNED.has(path))return memberProductStructuredRoutes(request,env,ctx);
  if(request.method==='OPTIONS')return new Response(null,{status:204,headers:cors(request)});
  if(request.method!=='POST')return json({ok:false,error:'method_not_allowed'},405,request);
  const auth=await authenticate(request,env,ctx);if(auth.response)return withCors(auth.response,request);
  await ensureFeedbackSchema(env.DB);
  const body=await read(request);
  if(path==='/v1/grub/feedback')return saveFeedbackResponse(request,env,auth.user.id,'grub',body);
  if(path==='/v1/fit/feedback')return saveFeedbackResponse(request,env,auth.user.id,'fit',body);
  if(path==='/v1/grub/replace')return replaceWithLearning(request,env,ctx,auth.user.id,'grub',body);
  if(path==='/v1/fit/replace')return replaceWithLearning(request,env,ctx,auth.user.id,'fit',body);
  if(path==='/v1/grub/plan')return planWithLearning(request,env,ctx,auth.user.id,'grub',body);
  return planWithLearning(request,env,ctx,auth.user.id,'fit',body);
}

async function saveFeedbackResponse(request,env,userId,product,body){
  const entityId=clean(body.entity_id||body.id,120),sentiment=String(body.sentiment||'').toLowerCase();
  if(!entityId||!['yay','nay'].includes(sentiment))return json({ok:false,error:'invalid_feedback'},400,request);
  await saveFeedback(env,userId,product,entityId,sentiment,body.reason,body.context);
  return json({ok:true,product,entity_id:entityId,sentiment},200,request);
}

async function replaceWithLearning(request,env,ctx,userId,product,body){
  const historical=await negativeIds(env,userId,product);
  const current=clean(body.current_id||body.rejected_id||body.entity_id,120);
  if(current)await saveFeedback(env,userId,product,current,'nay',body.reason,{source:'replacement'});
  const exclude=[...new Set([...(Array.isArray(body.exclude)?body.exclude:[]),...historical,current].filter(Boolean).map(String))];
  const forwarded=cloneJsonRequest(request,{...body,exclude});
  const response=await memberProductStructuredRoutes(forwarded,env,ctx);
  return withCors(response,request);
}

async function planWithLearning(request,env,ctx,userId,product,body){
  const historical=await negativeIds(env,userId,product);
  const forwarded=cloneJsonRequest(request,body);
  const base=await memberProductStructuredRoutes(forwarded,env,ctx);
  if(!base?.ok||!historical.length)return withCors(base,request);
  const payload=await base.clone().json().catch(()=>null);if(!payload?.plan)return withCors(base,request);
  let changed=false;
  if(product==='grub'){
    const allUsed=new Set(payload.plan.days.flatMap(d=>d.meals||[]).map(m=>m.id));
    for(const day of payload.plan.days){
      for(let i=0;i<(day.meals||[]).length;i++){
        const meal=day.meals[i];if(!historical.includes(meal.id))continue;
        const r=await memberProductStructuredRoutes(cloneJsonRequest(request,{type:meal.type,exclude:[...historical,...allUsed],preferences:body.preferences,dislikes:body.dislikes,dietaryRequirements:body.dietaryRequirements}),env,ctx);
        const j=await r.json().catch(()=>null);if(j?.meal){day.meals[i]=j.meal;allUsed.add(j.meal.id);changed=true;}
      }
      day.totals={kcal:(day.meals||[]).reduce((a,m)=>a+Number(m.kcal||m.nutrition?.kcal||0),0),protein_g:(day.meals||[]).reduce((a,m)=>a+Number(m.protein||m.nutrition?.protein_g||0),0)};
    }
  }else{
    for(const session of payload.plan.sessions||[]){
      for(let i=0;i<(session.exercises||[]).length;i++){
        const ex=session.exercises[i];if(!historical.includes(ex.id))continue;
        const r=await memberProductStructuredRoutes(cloneJsonRequest(request,{group:ex.group,exclude:historical,location:body.location,equipment:body.equipment,limitations:body.limitations,preferences:body.preferences}),env,ctx);
        const j=await r.json().catch(()=>null);if(j?.exercise){session.exercises[i]=j.exercise;changed=true;}
      }
      session.estimated_minutes=(session.exercises||[]).reduce((a,x)=>a+Number(x.minutes||0),0);
    }
  }
  payload.plan.learning={durable_feedback:true,historical_nays_applied:historical.length};
  if(changed)await replaceLatestPlan(env,userId,product,payload.plan);
  return json(payload,200,request);
}

async function saveFeedback(env,userId,product,entityId,sentiment,reason,context){
  await env.DB.prepare(`INSERT INTO product_feedback(user_id,product,entity_id,sentiment,reason,context_json,created_at,updated_at) VALUES(?,?,?,?,?,?,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP) ON CONFLICT(user_id,product,entity_id) DO UPDATE SET sentiment=excluded.sentiment,reason=excluded.reason,context_json=excluded.context_json,updated_at=CURRENT_TIMESTAMP`).bind(userId,product,entityId,sentiment,clean(reason,500),JSON.stringify(context||{})).run();
}
async function negativeIds(env,userId,product){const {results}=await env.DB.prepare(`SELECT entity_id FROM product_feedback WHERE user_id=? AND product=? AND sentiment='nay' ORDER BY updated_at DESC LIMIT 250`).bind(userId,product).all();return (results||[]).map(r=>String(r.entity_id));}
async function replaceLatestPlan(env,userId,product,plan){const row=await env.DB.prepare(`SELECT id FROM shift_plans WHERE user_id=? AND plan_type=? AND status='active' ORDER BY id DESC LIMIT 1`).bind(userId,product).first();if(row?.id)await env.DB.prepare(`UPDATE shift_plans SET plan_json=? WHERE id=?`).bind(JSON.stringify(plan),row.id).run();}
async function ensureFeedbackSchema(DB){await DB.exec(`CREATE TABLE IF NOT EXISTS product_feedback (id INTEGER PRIMARY KEY AUTOINCREMENT,user_id INTEGER NOT NULL,product TEXT NOT NULL,entity_id TEXT NOT NULL,sentiment TEXT NOT NULL CHECK(sentiment IN ('yay','nay')),reason TEXT,context_json TEXT NOT NULL DEFAULT '{}',created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,UNIQUE(user_id,product,entity_id)); CREATE INDEX IF NOT EXISTS idx_product_feedback_user_product ON product_feedback(user_id,product,sentiment,updated_at);`);}
async function authenticate(request,env,ctx){const response=await core.fetch(new Request(new URL('/v1/me',request.url),{method:'GET',headers:request.headers}),env,ctx);if(!response.ok)return{response};return{user:(await response.json()).user};}
function cloneJsonRequest(request,body){const headers=new Headers(request.headers);headers.set('Content-Type','application/json');return new Request(request.url,{method:'POST',headers,body:JSON.stringify(body)});}
async function read(request){try{return await request.json()}catch{return{}}}
function clean(v,max=1000){if(v===undefined||v===null)return null;const s=String(v).trim();return s?s.slice(0,max):null;}
function json(data,status=200,request){return new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store',...cors(request)}});}
function cors(request){const origin=request.headers.get('Origin')||'',h={'Access-Control-Allow-Credentials':'true','Access-Control-Allow-Methods':'POST, OPTIONS','Access-Control-Allow-Headers':'Content-Type','Vary':'Origin'};if(ORIGINS.has(origin))h['Access-Control-Allow-Origin']=origin;return h;}
function withCors(response,request){const h=new Headers(response.headers);for(const[k,v]of Object.entries(cors(request)))h.set(k,v);return new Response(response.body,{status:response.status,statusText:response.statusText,headers:h});}
