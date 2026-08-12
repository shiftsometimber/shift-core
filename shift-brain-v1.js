import core from './worker.js';
import {listIntelligentMemories} from './intelligent-memory.js';
import {getMemoryPrivacy} from './memory-privacy.js';

const ORIGINS=new Set(['https://shiftsometimber.co.uk','https://www.shiftsometimber.co.uk','https://shiftsometimber.com','https://www.shiftsometimber.com','https://hq.shiftsometimber.co.uk']);
const safe=v=>{try{return typeof v==='string'?JSON.parse(v):v??{}}catch{return{}}};
const rows=x=>x?.results||[];

export async function shiftBrainRoutes(request,env,ctx){
  const u=new URL(request.url),path=u.pathname.replace(/\/+$/,'')||'/';
  if(path!=='/v1/shift/brain/context')return null;
  if(request.method==='OPTIONS')return new Response(null,{status:204,headers:cors(request)});
  if(request.method!=='GET')return json({ok:false,error:'method_not_allowed'},405,request);
  const a=await authenticate(request,env,ctx);if(a.response)return withCors(a.response,request);
  const context=await buildShiftBrainContext(env,Number(a.user.id),u.searchParams.get('q')||'',{knowledgeLimit:Number(u.searchParams.get('knowledgeLimit')||8)});
  return json({ok:true,brain:context},200,request);
}

export async function buildShiftBrainContext(env,userId,question='',opts={}){
  const knowledgeLimit=Math.max(0,Math.min(20,Number(opts.knowledgeLimit??8)));
  const [profile,state,progress,plans,feedback,legacyNotes,privacy,intelligentMemories,knowledge]=await Promise.all([
    first(env.DB,`SELECT u.id,u.first_name,u.last_name,u.date_of_birth,u.postcode,u.email,ms.lifecycle_stage,ms.membership_status FROM users u LEFT JOIN member_status ms ON ms.user_id=u.id WHERE u.id=?`,[userId]),
    first(env.DB,`SELECT my_why,roadmap,treatment_finder,decision_readiness,preferences FROM member_state WHERE user_id=?`,[userId]),
    all(env.DB,`SELECT recorded_on,weight_kg,waist_cm,systolic,diastolic,resting_hr,steps,protein_g,sleep_hours,mood_score,source FROM progress_entries WHERE user_id=? ORDER BY recorded_on DESC,id DESC LIMIT 60`,[userId]),
    all(env.DB,`SELECT id,plan_type,starts_on,ends_on,status,plan_json,created_at FROM shift_plans WHERE user_id=? ORDER BY id DESC LIMIT 60`,[userId]),
    all(env.DB,`SELECT product,entity_id,sentiment,reason,context_json,updated_at FROM product_feedback WHERE user_id=? ORDER BY updated_at DESC LIMIT 250`,[userId]),
    all(env.DB,`SELECT memory_key,memory_value,updated_at FROM shift_ai_member_memory WHERE user_id=? ORDER BY updated_at DESC LIMIT 30`,[userId]),
    getMemoryPrivacy(env.DB,userId).catch(()=>({auto_memory:1,proactive_insights:1,proactive_cooldown_hours:48})),
    listIntelligentMemories(env.DB,userId,80).catch(()=>[]),
    knowledgeLimit?retrieveUnifiedKnowledge(env.DB,question,knowledgeLimit):Promise.resolve([])
  ]);

  const parsedState={
    myWhy:safe(state?.my_why),roadmap:safe(state?.roadmap),treatmentFinder:safe(state?.treatment_finder),decisionReadiness:safe(state?.decision_readiness),preferences:safe(state?.preferences)
  };
  const parsedPlans=plans.map(p=>({...p,plan:safe(p.plan_json)}));
  const activePlans=Object.fromEntries(parsedPlans.filter(p=>p.status==='active').map(p=>[p.plan_type,{id:p.id,starts_on:p.starts_on,ends_on:p.ends_on,created_at:p.created_at,...p.plan}]));
  const yay=feedback.filter(x=>x.sentiment==='yay'),nay=feedback.filter(x=>x.sentiment==='nay');

  return {
    contract:'one-shift-brain/v1',
    generatedAt:new Date().toISOString(),
    member:{profile:profile||{},state:parsedState},
    progress:{latest:progress[0]||null,history:progress},
    plans:{active:activePlans,recent:parsedPlans.slice(0,30)},
    behaviour:{feedback:{yay,nay,summary:summariseFeedback(feedback)}},
    memory:{privacy,intelligent:intelligentMemories,explicitNotes:legacyNotes},
    knowledge:{query:String(question||'').slice(0,500),items:knowledge},
    provenance:{
      profile:'users/member_status',state:'member_state',progress:'progress_entries',plans:'shift_plans',feedback:'product_feedback',intelligentMemory:'shift_ai_memory_v2',explicitNotes:'shift_ai_member_memory',knowledge:'unified reviewed knowledge retrieval'
    },
    rules:{currentMemberStatementOverridesMemory:true,healthKnowledgeRequiresReviewedProvenance:true,clinicalDecisionsRemainOutsideShiftAI:true}
  };
}

export async function retrieveUnifiedKnowledge(DB,query,limit=8){
  const tokens=[...new Set(String(query||'').toLowerCase().replace(/[^a-z0-9%]+/g,' ').split(/\s+/).filter(x=>x.length>3))].slice(0,14);
  if(!tokens.length)return[];
  const candidates=[];

  try{
    const legacy=await DB.prepare(`SELECT c.id,c.document_id,c.content,d.title,d.source_uri,d.trust_tier,d.status FROM ai_knowledge_chunks c JOIN ai_knowledge_documents d ON d.id=c.document_id WHERE d.status='approved' ORDER BY d.trust_tier,c.id LIMIT 3000`).all();
    for(const r of rows(legacy)){
      const score=tokenScore(tokens,`${r.title||''} ${r.content||''}`)+Math.max(0,5-Number(r.trust_tier||5));
      if(score>1)candidates.push({id:`legacy:${r.document_id}:${r.id}`,sourceWorld:'reviewed_chunks',title:r.title,content:String(r.content||''),score,reviewState:'approved',authority:100-Math.min(90,Number(r.trust_tier||5)*10),provenance:[{type:'document',ref:r.source_uri||`document:${r.document_id}`} ]});
    }
  }catch{}

  try{
    const graph=await DB.prepare(`SELECT n.id,n.label,n.domain,n.data_json,n.updated_at,s.source_type,s.source_ref,s.authority,s.verified_at,s.expires_at,s.provenance_json FROM shift_knowledge_nodes n LEFT JOIN shift_knowledge_sources s ON s.node_id=n.id WHERE n.status='active' ORDER BY COALESCE(s.authority,50) DESC,n.updated_at DESC LIMIT 3000`).all();
    const grouped=new Map();
    for(const r of rows(graph)){
      const data=safe(r.data_json),text=[r.label,data.title,data.summary,data.content,data.body,JSON.stringify(data)].filter(Boolean).join(' '),score=tokenScore(tokens,text)+Math.max(0,(Number(r.authority||50)-50)/20);
      if(score<=1)continue;
      if(!grouped.has(r.id))grouped.set(r.id,{id:`graph:${r.id}`,sourceWorld:'knowledge_graph',title:r.label,content:String(data.content||data.summary||data.body||''),score,reviewState:r.domain==='health'?(r.verified_at?'verified':'unverified'):'active',authority:Number(r.authority||50),provenance:[]});
      const item=grouped.get(r.id);item.score=Math.max(item.score,score);if(r.source_ref)item.provenance.push({type:r.source_type||'source',ref:r.source_ref,verifiedAt:r.verified_at||null,expiresAt:r.expires_at||null,meta:safe(r.provenance_json)});
    }
    for(const item of grouped.values())if(item.reviewState!=='unverified')candidates.push(item);
  }catch{}

  const deduped=new Map();
  for(const item of candidates.sort((a,b)=>b.score-a.score||b.authority-a.authority)){
    const key=normalise(`${item.title}:${item.content.slice(0,180)}`);if(!deduped.has(key))deduped.set(key,item);
  }
  return [...deduped.values()].slice(0,Math.max(1,Math.min(20,limit))).map(x=>({...x,content:x.content.slice(0,1800),citation:`ShiftBrain:${x.id}`}));
}

function summariseFeedback(items){const out={grub:{yay:0,nay:0},fit:{yay:0,nay:0}};for(const x of items){if(!out[x.product])out[x.product]={yay:0,nay:0};if(x.sentiment==='yay'||x.sentiment==='nay')out[x.product][x.sentiment]++;}return out;}
function tokenScore(tokens,text){const t=String(text||'').toLowerCase();return tokens.reduce((n,x)=>n+(t.includes(x)?1:0),0);}
function normalise(v){return String(v||'').toLowerCase().replace(/[^a-z0-9]+/g,' ').replace(/\s+/g,' ').trim();}
async function first(DB,sql,bind=[]){try{return await DB.prepare(sql).bind(...bind).first()}catch{return null}}
async function all(DB,sql,bind=[]){try{return rows(await DB.prepare(sql).bind(...bind).all())}catch{return[]}}
async function authenticate(request,env,ctx){const r=await core.fetch(new Request(new URL('/v1/me',request.url),{method:'GET',headers:request.headers}),env,ctx);if(!r.ok)return{response:r};return{user:(await r.json()).user}}
function cors(request){const origin=request.headers.get('Origin')||'',h={'Access-Control-Allow-Credentials':'true','Access-Control-Allow-Methods':'GET, OPTIONS','Access-Control-Allow-Headers':'Content-Type','Vary':'Origin'};if(ORIGINS.has(origin))h['Access-Control-Allow-Origin']=origin;return h;}
function json(data,status=200,request){return new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff',...cors(request)}})}
function withCors(response,request){const h=new Headers(response.headers);for(const[k,v]of Object.entries(cors(request)))h.set(k,v);return new Response(response.body,{status:response.status,statusText:response.statusText,headers:h})}
