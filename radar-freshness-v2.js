export const RADAR_SLO={scanHours:24,eventHours:48,publicationHours:72,tickerHours:72};
export function ageHours(value,now=Date.now()){if(!value)return null;const t=Date.parse(value);return Number.isFinite(t)?Math.max(0,(now-t)/3600000):null}
export function radarFreshnessState({lastScan,lastEvent,lastPublication,lastTickerItem,failures=0},now=Date.now()){
 const ages={scan:ageHours(lastScan,now),event:ageHours(lastEvent,now),publication:ageHours(lastPublication,now),ticker:ageHours(lastTickerItem,now)};
 const reasons=[];if(failures>0)reasons.push({code:'publication_failures',level:'RED',count:failures});
 if(ages.scan===null||ages.scan>RADAR_SLO.scanHours)reasons.push({code:'scan_stale',level:'AMBER',ageHours:ages.scan});
 if(ages.event!==null&&ages.event>RADAR_SLO.eventHours)reasons.push({code:'event_stale',level:'AMBER',ageHours:ages.event});
 if(ages.publication!==null&&ages.publication>RADAR_SLO.publicationHours)reasons.push({code:'publication_stale',level:'AMBER',ageHours:ages.publication});
 if(ages.ticker!==null&&ages.ticker>RADAR_SLO.tickerHours)reasons.push({code:'ticker_stale',level:'AMBER',ageHours:ages.ticker});
 const status=reasons.some(x=>x.level==='RED')?'RED':reasons.length?'AMBER':'GREEN';return{status,current:status==='GREEN',ages,sloHours:RADAR_SLO,reasons};
}
export async function readRadarFreshness(DB){const first=async sql=>{try{return await DB.prepare(sql).first()}catch{return null}},count=async sql=>{try{return Number((await DB.prepare(sql).first())?.c||0)}catch{return 0}};const [scan,event,pub,ticker,failures]=await Promise.all([first(`SELECT created_at FROM radar_audit WHERE action='scan' ORDER BY id DESC LIMIT 1`),first(`SELECT updated_at FROM radar_events ORDER BY updated_at DESC LIMIT 1`),first(`SELECT COALESCE(completed_at,created_at) at FROM radar_publication_jobs WHERE status IN ('complete','completed') ORDER BY COALESCE(completed_at,created_at) DESC LIMIT 1`),first(`SELECT COALESCE(reviewed_at,updated_at) at FROM radar_events WHERE status IN ('approved','published') ORDER BY COALESCE(reviewed_at,updated_at) DESC LIMIT 1`),count(`SELECT COUNT(*) c FROM radar_publication_jobs WHERE status='failed' OR error_text IS NOT NULL`)]);return radarFreshnessState({lastScan:scan?.created_at,lastEvent:event?.updated_at,lastPublication:pub?.at,lastTickerItem:ticker?.at,failures});}
