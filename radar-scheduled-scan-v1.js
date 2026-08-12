import {runRadarFreshness} from './radar-integration-v1.js';
import {runAuthoritativeRadarScan} from './radar-authoritative-scan-v1.js';

/** Scheduled Radar lifecycle: authoritative MHRA/EMA retrieval + deduplicated ingestion + freshness maintenance. */
export async function runRadarScheduledScan(env){
  const scan=await runAuthoritativeRadarScan(env);
  const freshness=await runRadarFreshness(env);
  return{scan,freshness};
}
