const HQ_ORIGINS=new Set(['https://hq.shiftsometimber.co.uk']);
export const TREATMENT_JOURNEY_TRANSITIONS=Object.freeze({
  route_started:['options_shown','expired','cancelled'],
  options_shown:['account_created','expired','cancelled'],
  account_created:['selection_saved','expired','cancelled'],
  selection_saved:['terms_accepted','stock_blocked','expired','cancelled'],
  terms_accepted:['payment_pending','stock_blocked','expired','cancelled'],
  payment_pending:['payment_authorised','payment_failed','stock_blocked','cancelled'],
  payment_failed:['payment_pending','cancelled','expired'],
  payment_authorised:['assessment_in_progress','refund_pending'],
  assessment_in_progress:['assessment_submitted','expired','cancelled'],
  assessment_submitted:['more_information_required','under_clinical_review','expired'],
  more_information_required:['assessment_submitted','expired','cancelled'],
  under_clinical_review:['prescribed','not_prescribed','more_information_required'],
  not_prescribed:['refund_pending'],
  refund_pending:['refunded'],
  prescribed:['dispensing','pharmacy_unable_to_fulfil','cancelled'],
  pharmacy_unable_to_fulfil:['dispensing','refund_pending'],
  dispensing:['dispatched','pharmacy_unable_to_fulfil'],
  dispatched:['delivered','delivery_exception'],
  delivery_exception:['dispatched','delivered','refund_pending'],
  delivered:['maintenance_review'],
  stock_blocked:['selection_saved','refund_pending','cancelled','expired'],
  maintenance_review:['maintenance_review'],
  refunded:[],cancelled:[],expired:[]
});
const STATES=new Set(Object.keys(TREATMENT_JOURNEY_TRANSITIONS));
const json=(data,status=200,headers={})=>new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff',...headers}});
const clean=(value,max=120)=>String(value??'').trim().slice(0,max);
const encode=value=>new TextEncoder().encode(String(value));

export function canTransitionTreatmentJourney(from,to){
  return STATES.has(from)&&STATES.has(to)&&TREATMENT_JOURNEY_TRANSITIONS[from].includes(to);
}
export function neutralTreatmentJourneyEvent({journeyId,fromStatus,toStatus,source='hq',reasonCode='',idempotencyKey}={}){
  if(!Number.isInteger(Number(journeyId))||Number(journeyId)<=0)throw new TypeError('invalid_journey');
  if(!canTransitionTreatmentJourney(fromStatus,toStatus))throw new TypeError('invalid_transition');
  const key=clean(idempotencyKey,120),sourceValue=clean(source,40),reason=clean(reasonCode,80);
  if(!key||!sourceValue)throw new TypeError('invalid_event');
  return{journeyId:Number(journeyId),fromStatus,toStatus,source:sourceValue,reasonCode:reason,idempotencyKey:key};
}
async function digest(value){return new Uint8Array(await crypto.subtle.digest('SHA-256',encode(value)))}
async function sameSecret(a,b){const [left,right]=await Promise.all([digest(a),digest(b)]);let diff=left.length^right.length;for(let i=0;i<Math.max(left.length,right.length);i++)diff|=(left[i%left.length]??0)^(right[i%right.length]??0);return diff===0}
async function authorised(request,env){const expected=clean(env.ADMIN_API_KEY,500),supplied=clean(request.headers.get('x-shift-admin-key'),500);return Boolean(expected&&supplied&&await sameSecret(expected,supplied))}
function cors(request){const origin=request.headers.get('Origin')||'';return HQ_ORIGINS.has(origin)?{'Access-Control-Allow-Origin':origin,'Access-Control-Allow-Credentials':'true','Access-Control-Allow-Methods':'GET, PATCH, OPTIONS','Access-Control-Allow-Headers':'Content-Type, X-Shift-Admin-Key, Idempotency-Key','Vary':'Origin'}:{}}
async function input(request){const declared=Number(request.headers.get('content-length')||0);if(declared>16384)return null;const text=await request.text();if(encode(text).length>16384)return null;try{return JSON.parse(text)}catch{return null}}

export async function ensureTreatmentOperationsSchema(env){
  await env.DB.batch([
    env.DB.prepare(`CREATE TABLE IF NOT EXISTS treatment_journeys (
      id INTEGER PRIMARY KEY AUTOINCREMENT, member_id INTEGER, public_reference TEXT NOT NULL UNIQUE,
      status TEXT NOT NULL DEFAULT 'route_started', revision INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      completed_at TEXT, CHECK(status IN ('${[...STATES].join("','")}')))`),
    env.DB.prepare(`CREATE TABLE IF NOT EXISTS treatment_journey_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT, journey_id INTEGER NOT NULL, from_status TEXT NOT NULL,
      to_status TEXT NOT NULL, source TEXT NOT NULL, reason_code TEXT, idempotency_key TEXT NOT NULL,
      revision INTEGER NOT NULL, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(journey_id,idempotency_key), FOREIGN KEY(journey_id) REFERENCES treatment_journeys(id))`),
    env.DB.prepare('CREATE INDEX IF NOT EXISTS idx_treatment_journeys_status ON treatment_journeys(status,updated_at)'),
    env.DB.prepare('CREATE INDEX IF NOT EXISTS idx_treatment_journey_events_journey ON treatment_journey_events(journey_id,id)')
  ]);
}
async function journeyWithEvents(env,id){
  const journey=await env.DB.prepare('SELECT id,public_reference,status,revision,created_at,updated_at,completed_at FROM treatment_journeys WHERE id=?').bind(id).first();
  if(!journey)return null;
  const events=(await env.DB.prepare('SELECT from_status,to_status,source,reason_code,revision,created_at FROM treatment_journey_events WHERE journey_id=? ORDER BY id').bind(id).all()).results||[];
  return{...journey,events};
}
async function transition(request,env,id){
  const body=await input(request),idempotencyKey=clean(request.headers.get('idempotency-key'),120);
  if(!body||!idempotencyKey)return json({ok:false,error:'transition_and_idempotency_required'},400,cors(request));
  const replay=await env.DB.prepare('SELECT to_status,revision FROM treatment_journey_events WHERE journey_id=? AND idempotency_key=?').bind(id,idempotencyKey).first();
  if(replay)return json({ok:true,replayed:true,journey:await journeyWithEvents(env,id)},200,cors(request));
  const current=await env.DB.prepare('SELECT id,status,revision FROM treatment_journeys WHERE id=?').bind(id).first();
  if(!current)return json({ok:false,error:'journey_not_found'},404,cors(request));
  const toStatus=clean(body.toStatus,60);if(!canTransitionTreatmentJourney(current.status,toStatus))return json({ok:false,error:'invalid_status_transition',fromStatus:current.status,toStatus,allowed:TREATMENT_JOURNEY_TRANSITIONS[current.status]},409,cors(request));
  const expectedRevision=Number(body.expectedRevision);if(!Number.isInteger(expectedRevision)||expectedRevision!==Number(current.revision))return json({ok:false,error:'revision_conflict',currentRevision:Number(current.revision)},409,cors(request));
  const event=neutralTreatmentJourneyEvent({journeyId:id,fromStatus:current.status,toStatus,source:body.source||'hq',reasonCode:body.reasonCode,idempotencyKey});
  const nextRevision=Number(current.revision)+1,terminal=['refunded','cancelled','expired'].includes(toStatus);
  const results=await env.DB.batch([
    env.DB.prepare(`UPDATE treatment_journeys SET status=?,revision=?,updated_at=CURRENT_TIMESTAMP,completed_at=CASE WHEN ? THEN CURRENT_TIMESTAMP ELSE completed_at END WHERE id=? AND revision=? AND status=?`).bind(toStatus,nextRevision,terminal?1:0,id,expectedRevision,current.status),
    env.DB.prepare(`INSERT INTO treatment_journey_events(journey_id,from_status,to_status,source,reason_code,idempotency_key,revision)
      SELECT ?,?,?,?,?,?,? WHERE EXISTS(SELECT 1 FROM treatment_journeys WHERE id=? AND revision=? AND status=?)`).bind(id,current.status,toStatus,event.source,event.reasonCode,event.idempotencyKey,nextRevision,id,nextRevision,toStatus)
  ]);
  if(Number(results?.[0]?.meta?.changes||0)!==1||Number(results?.[1]?.meta?.changes||0)!==1)return json({ok:false,error:'transition_conflict'},409,cors(request));
  return json({ok:true,replayed:false,journey:await journeyWithEvents(env,id)},200,cors(request));
}
export async function treatmentOperationsRoutes(request,env){
  const path=new URL(request.url).pathname.replace(/\/+$/,'')||'/';if(!path.startsWith('/v1/hq/treatment-operations'))return null;
  if(request.method==='OPTIONS')return new Response(null,{status:204,headers:cors(request)});
  if(!HQ_ORIGINS.has(request.headers.get('Origin')||''))return json({ok:false,error:'origin_not_allowed'},403,cors(request));
  if(!await authorised(request,env))return json({ok:false,error:'unauthorised'},401,cors(request));
  await ensureTreatmentOperationsSchema(env);
  if(request.method==='GET'&&path==='/v1/hq/treatment-operations'){
    const journeys=(await env.DB.prepare('SELECT id,public_reference,status,revision,created_at,updated_at,completed_at FROM treatment_journeys ORDER BY updated_at DESC LIMIT 250').all()).results||[];
    return json({ok:true,journeys},200,cors(request));
  }
  const match=path.match(/^\/v1\/hq\/treatment-operations\/(\d+)\/transition$/);
  if(request.method==='PATCH'&&match)return transition(request,env,Number(match[1]));
  return json({ok:false,error:'not_found'},404,cors(request));
}
