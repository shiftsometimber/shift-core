import {prepareVerifiedRadarQueue,runRadarEditorialCadence,runRadarFreshness} from './radar-integration-v1.js';
import {runAuthoritativeRadarScan} from './radar-authoritative-scan-v1.js';

/** Scheduled Radar lifecycle: authoritative MHRA/EMA retrieval + deduplicated ingestion + freshness maintenance. */
export async function runRadarScheduledScan(env){
  const scan=await runAuthoritativeRadarScan(env);
  // Prepare at most one new review package per scheduled run. The per-event
  // notification audit in sendApprovalEmail is the durable second guard.
  const reviewQueue=await prepareVerifiedRadarQueue(env,{limit:1});
  const editorialCadence=await runRadarEditorialCadence(env);
  const freshness=await runRadarFreshness(env);
  return{scan,reviewQueue,editorialCadence,freshness};
}
