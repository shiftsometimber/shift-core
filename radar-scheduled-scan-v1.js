import {runRadarFreshness} from './radar-integration-v1.js';

const iso=()=>new Date().toISOString();

/**
 * Execute the scheduled Radar freshness scan and persist a heartbeat even when
 * the scan legitimately finds no new developments. This distinguishes
 * "scanner ran and found nothing" from "scanner never ran", without inventing
 * events or weakening the production freshness SLO.
 */
export async function runRadarScheduledScan(env){
  const startedAt=iso();
  const result=await runRadarFreshness(env);
  const completedAt=iso();
  await env.DB.prepare(`INSERT INTO radar_audit(event_id,action,actor,detail_json,created_at) VALUES(NULL,'scan','scheduler',?,?)`)
    .bind(JSON.stringify({kind:'scheduled_freshness_scan',started_at:startedAt,completed_at:completedAt,freshness_due:Number(result?.freshnessDue||0)}),completedAt)
    .run();
  return {...result,scanRecordedAt:completedAt};
}
