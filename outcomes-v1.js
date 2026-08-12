import {ensureAnalyticsSchema} from './product-analytics-v1.js';

export async function outcomesSnapshot(DB,{minEntries=2,limit=5000}={}){
  await ensureAnalyticsSchema(DB);limit=Math.max(10,Math.min(20000,Number(limit)||5000));
  const {results=[]}=await DB.prepare(`
    WITH p AS (
      SELECT user_id,COUNT(*) progress_entries,MIN(recorded_on) first_date,MAX(recorded_on) latest_date
      FROM progress_entries GROUP BY user_id HAVING COUNT(*)>=?
    ), first_weight AS (
      SELECT p.user_id,(SELECT weight_kg FROM progress_entries x WHERE x.user_id=p.user_id AND x.weight_kg IS NOT NULL ORDER BY recorded_on,id LIMIT 1) weight_kg FROM p
    ), latest_weight AS (
      SELECT p.user_id,(SELECT weight_kg FROM progress_entries x WHERE x.user_id=p.user_id AND x.weight_kg IS NOT NULL ORDER BY recorded_on DESC,id DESC LIMIT 1) weight_kg FROM p
    ), e AS (
      SELECT user_id,
        SUM(CASE WHEN event_name='today_viewed' THEN 1 ELSE 0 END) today_views,
        SUM(CASE WHEN event_name='grub_plan_generated' THEN 1 ELSE 0 END) grub_plans,
        SUM(CASE WHEN event_name='fit_plan_generated' THEN 1 ELSE 0 END) fit_plans,
        SUM(CASE WHEN event_name='shift_ai_message' THEN 1 ELSE 0 END) ai_messages,
        SUM(CASE WHEN event_name='progress_logged' THEN 1 ELSE 0 END) progress_events,
        COUNT(*) total_events
      FROM product_events GROUP BY user_id
    )
    SELECT p.user_id,p.progress_entries,p.first_date,p.latest_date,fw.weight_kg first_weight_kg,lw.weight_kg latest_weight_kg,
      COALESCE(e.today_views,0) today_views,COALESCE(e.grub_plans,0) grub_plans,COALESCE(e.fit_plans,0) fit_plans,COALESCE(e.ai_messages,0) ai_messages,COALESCE(e.progress_events,0) progress_events,COALESCE(e.total_events,0) total_events
    FROM p LEFT JOIN first_weight fw ON fw.user_id=p.user_id LEFT JOIN latest_weight lw ON lw.user_id=p.user_id LEFT JOIN e ON e.user_id=p.user_id
    LIMIT ?`).bind(Number(minEntries)||2,limit).all();
  const cohort=results.map(r=>{const first=num(r.first_weight_kg),latest=num(r.latest_weight_kg),delta=first!==null&&latest!==null?+(latest-first).toFixed(2):null,pct=first&&delta!==null?+((delta/first)*100).toFixed(2):null;return{...r,first_weight_kg:first,latest_weight_kg:latest,weight_delta_kg:delta,weight_delta_pct:pct,engagement_band:band(Number(r.total_events||0))}});
  const valid=cohort.filter(x=>x.weight_delta_pct!==null),summary={members:cohort.length,withWeightComparison:valid.length,averageWeightDeltaPct:valid.length?+(valid.reduce((a,x)=>a+x.weight_delta_pct,0)/valid.length).toFixed(2):null,engagementBands:group(cohort,'engagement_band')};
  return{ok:true,internalOnly:true,generatedAt:new Date().toISOString(),summary,cohort,warning:'Observational product analytics only. Correlation does not establish causation and this output is not a publishable clinical outcome claim without governance and appropriate analysis.'};
}
function num(v){const n=Number(v);return Number.isFinite(n)?n:null}function band(n){return n>=40?'high':n>=10?'medium':n>0?'low':'none'}function group(rows,key){const o={};for(const r of rows)o[r[key]]=(o[r[key]]||0)+1;return o}
