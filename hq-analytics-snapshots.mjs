// Aggregate snapshots from existing authorised analytics connections.
// This is an explicitly dated import, not a claim of an automatic OAuth feed.
export const analyticsSnapshotDDL=`CREATE TABLE IF NOT EXISTS hq_analytics_snapshots(id TEXT PRIMARY KEY,provider TEXT NOT NULL,property_id TEXT NOT NULL,window_start TEXT NOT NULL,window_end TEXT NOT NULL,time_zone TEXT NOT NULL,captured_at TEXT NOT NULL,evidence_sha256 TEXT NOT NULL,payload_json TEXT NOT NULL)`;
const properties={ga4:'properties/549150735',gsc:'sc-domain:shiftsometimber.co.uk'};
export async function importAnalyticsSnapshot(DB,snapshot){
 if(!properties[snapshot.provider]||snapshot.propertyId!==properties[snapshot.provider])throw Error('analytics_property_mismatch');
 for(const value of [snapshot.start,snapshot.end])if(!/^\d{4}-\d{2}-\d{2}$/.test(value)||new Date(value+'T00:00:00Z').toISOString().slice(0,10)!==value)throw Error('invalid_analytics_window');
 new Intl.DateTimeFormat('en-GB',{timeZone:snapshot.timeZone}).format(new Date());
 if(snapshot.start>snapshot.end||!Number.isFinite(Date.parse(snapshot.capturedAt))||typeof snapshot.timeZone!=='string')throw Error('invalid_analytics_window');
 const allowed=snapshot.provider==='ga4'?['sessions','activeUsers','organicSessions','keyEvents']:['clicks','impressions','ctrPercent'];
 if(!snapshot.metrics||Object.keys(snapshot.metrics).length!==allowed.length||Object.keys(snapshot.metrics).some(k=>!allowed.includes(k))||Object.values(snapshot.metrics).some(v=>!Number.isFinite(v)||v<0))throw Error('invalid_aggregate_metrics');
 const payload={metrics:snapshot.metrics,population:snapshot.provider==='ga4'?'Consented browser traffic. Historical staff/test exclusions cannot be proven; not a real-customer count.':'Search Console property totals; clicks are not identified members or sessions.',refreshMode:'authorised_import',automaticRefreshEnabled:false};
 const encoded=JSON.stringify(snapshot),digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(encoded)),hash=[...new Uint8Array(digest)].map(b=>b.toString(16).padStart(2,'0')).join('');
 await DB.prepare(analyticsSnapshotDDL).run();
 await DB.prepare('INSERT OR IGNORE INTO hq_analytics_snapshots(id,provider,property_id,window_start,window_end,time_zone,captured_at,evidence_sha256,payload_json) VALUES(?,?,?,?,?,?,?,?,?)').bind(hash,snapshot.provider,snapshot.propertyId,snapshot.start,snapshot.end,snapshot.timeZone,snapshot.capturedAt,hash,JSON.stringify(payload)).run();
 return{hash,automaticRefreshEnabled:false};
}
export async function appendAnalyticsSnapshots(DB,report,permissions=[],now=new Date()){
 if(!['management','growth'].includes(report.kind))return report;
 if(!permissions.includes('*')&&!permissions.includes('intelligence_read'))return report;
 const unavailable=(key,label,reason)=>report.metrics.push({key,label,status:'unavailable',value:null,reason,scope:'Latest imported analytics window; independent of selected London report dates.'});
 for(const provider of ['ga4','gsc']){
  let row;
  try{row=await DB.prepare('SELECT * FROM hq_analytics_snapshots WHERE provider=? AND property_id=? AND julianday(captured_at)<=julianday(?) ORDER BY captured_at DESC LIMIT 1').bind(provider,properties[provider],now.toISOString()).first()}catch{}
  if(!row){unavailable(provider+'_snapshot',provider.toUpperCase()+' reporting source','No validated analytics snapshot is connected.');continue}
  let payload;try{payload=JSON.parse(row.payload_json);if(!payload.metrics)throw Error('missing_metrics')}catch{unavailable(provider+'_snapshot',provider.toUpperCase()+' reporting source','Imported analytics evidence is invalid.');continue}
  const ageHours=(now.getTime()-Date.parse(row.captured_at))/3600000,scope=`Imported ${row.captured_at}; source dates ${row.window_start}–${row.window_end} (${row.time_zone}). Selected London report dates do not change this source window. ${payload.population}`;
  const metadata={snapshotId:row.id,source:`${provider}: ${row.property_id}`,sourceWindow:{start:row.window_start,end:row.window_end,timeZone:row.time_zone},capturedAt:row.captured_at,ageHours,refreshMode:'authorised_import',automaticRefreshEnabled:false,scope};
  if(ageHours>36){unavailable(provider+'_snapshot',provider.toUpperCase()+' reporting source',`Analytics import is stale (${ageHours.toFixed(1)} hours old); latest capture ${row.captured_at}.`);continue}
  const definitions=provider==='ga4'?[['sessions','ga4_sessions','GA4 sessions'],['activeUsers','ga4_active_users','GA4 active users'],['organicSessions','organic','Organic search sessions — imported GA4 window'],['keyEvents','ga4_key_events','GA4 configured key events — unfiltered browser traffic']]:[['clicks','search_clicks','Search Console property clicks'],['impressions','search_impressions','Search Console property impressions'],['ctrPercent','search_ctr','Search Console property CTR']];
  for(const [field,key,label] of definitions){
   const value=payload.metrics[field];if(!Number.isFinite(value)){unavailable(key,label,'Metric absent from the imported source.');continue}
   const existing=report.metrics.findIndex(x=>x.key===key);if(existing>=0)report.metrics.splice(existing,1);
   report.metrics.push({key,label,value,status:'available',unit:field==='ctrPercent'?'percent':'count',...metadata});
  }
 }
 report.limitations.push('Analytics imports keep their provider calendar/time zone and do not identify real customers. GSC clicks, GA4 sessions, configured key events and first-party verified member actions are distinct. Automatic refresh requires an authorised server-side analytics connection; current imports expire after 36 hours.');
 return report;
}
