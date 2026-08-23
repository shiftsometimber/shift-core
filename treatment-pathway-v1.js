const PATHWAY_COOKIE='sst_treatment_pathway';
const PATHWAY_TTL_SECONDS=2*60*60;
const ROUTES=new Set(['/v1/treatment/pathway/start','/v1/treatment/catalogue']);

const json=(data,status=200,headers={})=>new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff',...headers}});
const encode=value=>new TextEncoder().encode(value);
const hex=bytes=>[...bytes].map(byte=>byte.toString(16).padStart(2,'0')).join('');
const safeKey=value=>String(value||'').replace(/[^a-z0-9_:-]/gi,'').slice(0,80);

export const TREATMENT_FORMULATION_GUIDANCE=Object.freeze({
  daily_tablet:Object.freeze({
    routineLabel:'Once-daily routine',
    routineSummary:'A tablet is taken every day. The exact administration instructions must come from the approved product information and the prescribing clinician.',
    routinePrompts:Object.freeze(['Can I reliably remember a dose every day?','Can I follow the approved timing instructions consistently?','Would work, travel or changing shifts make a daily routine difficult?']),
    strengthBoundary:'The strengths are a governed catalogue ladder, not a menu. A clinician decides whether this route is suitable and which strength is appropriate.',
    switchingBoundary:'Do not overlap, replace or switch from another weight-management medicine without clinical review. Previous medicine, strength and last-dose timing must be checked first.',
    missedDoseBoundary:'Missed-dose advice depends on the approved product information. Do not double a dose or improvise; follow the supplied instructions or seek clinical advice.',
    evidencePrompts:Object.freeze(['Current medicines and relevant health history','Previous weight-management treatment, strength and last-dose timing','Required identity, measurement and treatment evidence'])
  }),
  weekly_injection:Object.freeze({
    routineLabel:'Once-weekly routine',
    routineSummary:'An injection is taken on a weekly routine. The exact administration instructions must come from the approved product information and the prescribing clinician.',
    routinePrompts:Object.freeze(['Can I remember a consistent weekly day?','Am I comfortable following the approved injection instructions?','Would storage or travel make a weekly routine difficult?']),
    strengthBoundary:'The strengths are a governed catalogue ladder, not a menu. A clinician decides whether this route is suitable and which strength is appropriate.',
    switchingBoundary:'Do not overlap, replace or switch from another weight-management medicine without clinical review. Previous medicine, strength and last-dose timing must be checked first.',
    missedDoseBoundary:'Missed-dose advice depends on the approved product information. Do not take an extra dose or improvise; follow the supplied instructions or seek clinical advice.',
    evidencePrompts:Object.freeze(['Current medicines and relevant health history','Previous weight-management treatment, strength and last-dose timing','Required identity, measurement and treatment evidence'])
  })
});

async function sha256(value){return hex(new Uint8Array(await crypto.subtle.digest('SHA-256',encode(String(value)))))}
function token(){const bytes=new Uint8Array(32);crypto.getRandomValues(bytes);return hex(bytes)}
function cookies(request){return Object.fromEntries(String(request.headers.get('cookie')||'').split(';').map(item=>item.trim().split(/=(.*)/s)).filter(pair=>pair[0]).map(([key,value])=>[key,value]))}
function setCookie(value){return `${PATHWAY_COOKIE}=${value}; Max-Age=${PATHWAY_TTL_SECONDS}; Path=/; HttpOnly; Secure; SameSite=Lax`}

async function authorisePathway(request,env){
  const supplied=cookies(request)[PATHWAY_COOKIE];if(!supplied||!/^[a-f0-9]{64}$/.test(supplied))return false;
  const digest=await sha256(supplied),row=await env.DB.prepare('SELECT expires_at FROM treatment_pathway_sessions WHERE token_hash=?').bind(digest).first();
  if(!row||new Date(row.expires_at).getTime()<=Date.now())return false;
  await env.DB.prepare('UPDATE treatment_pathway_sessions SET last_seen_at=CURRENT_TIMESTAMP WHERE token_hash=?').bind(digest).run();
  return true;
}

export function groupTreatmentCatalogue(rows=[]){
  const families=new Map();
  for(const row of rows){
    const familyKey=safeKey(row.family_key),formulationKey=safeKey(row.formulation_key);if(!familyKey||!formulationKey)continue;
    const family=families.get(familyKey)||{key:familyKey,name:familyKey==='tirzepatide'?'Tirzepatide':familyKey==='semaglutide'?'Semaglutide':familyKey,governanceState:row.family_governance_state,formulations:new Map()};
    const guidance=TREATMENT_FORMULATION_GUIDANCE[formulationKey];if(!guidance)continue;
    const formulation=family.formulations.get(formulationKey)||{key:formulationKey,label:formulationKey==='daily_tablet'?'Daily tablet':'Weekly injection',route:row.route,routine:row.routine,governanceState:row.formulation_governance_state,guidance,strengths:[]};
    formulation.strengths.push({id:Number(row.id),label:String(row.strength_label),position:formulation.strengths.length+1,selectionState:'clinical_review_required',priceStatus:'unpublished',costStatus:'unpublished',stockState:'unpublished',claimsState:'unpublished',ctaState:'blocked',offers:String(row.offers||'').split('|').filter(Boolean).map(item=>({type:item.split(':')[0],availability:'unpublished',commercialState:'blocked'}))});
    family.formulations.set(formulationKey,formulation);families.set(familyKey,family);
  }
  return [...families.values()].map(family=>({...family,formulations:[...family.formulations.values()]}));
}

async function catalogue(env){
  const result=await env.DB.prepare(`SELECT ts.id,tf.family_key,tf.governance_state family_governance_state,
    tfo.formulation_key,tfo.route,tfo.routine,tfo.governance_state formulation_governance_state,
    ts.strength_label,ts.cost_status,ts.stock_state,ts.claims_state,ts.cta_state,
    GROUP_CONCAT(o.offer_type||':'||o.availability_state||':'||o.commercial_state,'|') offers
    FROM treatment_strengths ts JOIN treatment_formulations tfo ON tfo.id=ts.formulation_id
    JOIN treatment_families tf ON tf.id=tfo.family_id LEFT JOIN treatment_offers o ON o.strength_id=ts.id
    GROUP BY ts.id ORDER BY tf.family_key,tfo.formulation_key,ts.id`).all();
  return groupTreatmentCatalogue(result.results||[]);
}

export async function treatmentPathwayRoutes(request,env){
  const path=new URL(request.url).pathname.replace(/\/+$/,'')||'/';if(!ROUTES.has(path))return null;
  if(path==='/v1/treatment/pathway/start'&&request.method==='POST'){
    const value=token(),digest=await sha256(value),expires=new Date(Date.now()+PATHWAY_TTL_SECONDS*1000).toISOString();
    await env.DB.prepare('INSERT INTO treatment_pathway_sessions(token_hash,expires_at) VALUES(?,?)').bind(digest,expires).run();
    return json({ok:true,pathway:'treatment_information',expiresAt:expires,authority:'Shift HQ treatment catalogue',priceStatus:'unpublished',saleState:'blocked',clinicalAssessmentRequired:true,families:await catalogue(env)},200,{'Set-Cookie':setCookie(value)});
  }
  if(path==='/v1/treatment/catalogue'&&request.method==='GET'){
    if(!await authorisePathway(request,env))return json({ok:false,error:'treatment_pathway_required',message:'Start with the treatment route so information appears in the correct governed journey.'},403);
    return json({ok:true,authority:'Shift HQ treatment catalogue',priceStatus:'unpublished',saleState:'blocked',clinicalAssessmentRequired:true,families:await catalogue(env)});
  }
  return json({ok:false,error:'method_not_allowed'},405);
}

export const treatmentPathwayPolicy=Object.freeze({cookie:PATHWAY_COOKIE,ttlSeconds:PATHWAY_TTL_SECONDS,saleState:'blocked'});
