import {analyticsSnapshot} from './product-analytics-v1.js';

const safeCount=async(DB,sql,bind=[])=>{try{const r=await DB.prepare(sql).bind(...bind).first();return Number(r?.c||0)}catch{return null}};
const safeFirst=async(DB,sql,bind=[])=>{try{return await DB.prepare(sql).bind(...bind).first()}catch{return null}};

export async function watchtowerSnapshot(env){
  const now=new Date(),warnings=[];
  const [users,activePlans,ai24,feedback24,radarQueue,radarPublishFailed,lastRadarEvent,lastPublication,lastKnowledge,analytics]=await Promise.all([
    safeCount(env.DB,'SELECT COUNT(*) c FROM users'),
    safeCount(env.DB,"SELECT COUNT(*) c FROM shift_plans WHERE status='active'"),
    safeCount(env.DB,"SELECT COUNT(*) c FROM shift_ai_conversations WHERE created_at>=datetime('now','-24 hours')"),
    safeCount(env.DB,"SELECT COUNT(*) c FROM product_feedback WHERE updated_at>=datetime('now','-24 hours')"),
    safeCount(env.DB,"SELECT COUNT(*) c FROM radar_events WHERE status IN ('detected','verified','needs_more_evidence','ready_for_review','hold','publish_failed')"),
    safeCount(env.DB,"SELECT COUNT(*) c FROM radar_publication_jobs WHERE status='failed' OR error_text IS NOT NULL"),
    safeFirst(env.DB,'SELECT id,status,headline,updated_at FROM radar_events ORDER BY updated_at DESC LIMIT 1'),
    safeFirst(env.DB,"SELECT id,event_id,status,completed_at,created_at FROM radar_publication_jobs WHERE status='completed' ORDER BY COALESCE(completed_at,created_at) DESC LIMIT 1"),
    safeFirst(env.DB,"SELECT id,label,updated_at FROM shift_knowledge_nodes WHERE status='active' ORDER BY updated_at DESC LIMIT 1"),
    analyticsSnapshot(env.DB,{hours:24}).catch(()=>({windowHours:24,activeMembers:null,errors:null,events:[],surfaces:[]}))
  ]);

  const radarAge=ageHours(lastRadarEvent?.updated_at),publicationAge=ageHours(lastPublication?.completed_at||lastPublication?.created_at),knowledgeAge=ageHours(lastKnowledge?.updated_at);
  if(radarAge!==null&&radarAge>48)warnings.push(alert('radar_stale','AMBER',`No Radar event update for ${Math.round(radarAge)}h`,{ageHours:radarAge}));
  if(radarPublishFailed>0)warnings.push(alert('radar_publication_failures','RED',`${radarPublishFailed} Radar publication job(s) have failed`,{count:radarPublishFailed}));
  if(analytics.errors!==null&&analytics.errors>=5)warnings.push(alert('member_errors','AMBER',`${analytics.errors} member-facing errors recorded in 24h`,{count:analytics.errors}));
  if(knowledgeAge!==null&&knowledgeAge>24*14)warnings.push(alert('knowledge_stale','AMBER',`No Knowledge Graph update for ${Math.round(knowledgeAge/24)} days`,{ageHours:knowledgeAge}));

  return{
    ok:!warnings.some(x=>x.level==='RED'),
    status:warnings.some(x=>x.level==='RED')?'RED':warnings.length?'AMBER':'GREEN',
    generatedAt:now.toISOString(),
    platform:{database:'connected',workersAiBound:!!env.AI,emailBound:!!env.EMAIL},
    members:{registered:users,activePlans},
    intelligence:{aiTurns24h:ai24,feedbackSignals24h:feedback24,knowledge:{latest:lastKnowledge,ageHours:knowledgeAge}},
    radar:{queue:radarQueue,publishFailures:radarPublishFailed,lastEvent:lastRadarEvent,lastPublication,ages:{lastEventHours:radarAge,lastPublicationHours:publicationAge}},
    product:analytics,
    alerts:warnings,
    rule:'GREEN means no currently detected Watchtower condition. It does not by itself mean the full platform is commissioned.'
  };
}

function alert(code,level,message,detail={}){return{code,level,message,detail}}
function ageHours(value){if(!value)return null;const t=Date.parse(value);if(!Number.isFinite(t))return null;return Math.max(0,(Date.now()-t)/3600000)}
