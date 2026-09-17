import {collectorD1} from './radar-collector-d1.mjs';
const read=sql=>collectorD1(['--command',sql]).flatMap(x=>x.results||[]);
const endpoint='https://api.github.com/repos/shiftsometimber/shift-core/actions/workflows/radar-discovery-collector.yml';
const response=await fetch(endpoint,{headers:{Accept:'application/vnd.github+json',Authorization:'Bearer '+process.env.GITHUB_TOKEN,'X-GitHub-Api-Version':'2022-11-28'}});
const workflow=await response.json();
console.log('COLLECTOR_REGISTRATION '+JSON.stringify({http:response.status,id:workflow.id,state:workflow.state,path:workflow.path,created_at:workflow.created_at,updated_at:workflow.updated_at,message:workflow.message}));
console.log('COLLECTOR_SNAPSHOTS '+JSON.stringify(read('SELECT source_id,fetched_at,workflow_sha FROM radar_source_snapshots ORDER BY source_id')));
console.log('LATEST_SCANS '+JSON.stringify(read("SELECT created_at,detail_json FROM radar_audit WHERE action='scan' ORDER BY id DESC LIMIT 2")));
console.log('RECENT_UK_CANDIDATES '+JSON.stringify(read("SELECT id,status,headline,region,json_extract(source_evidence_json,'$[0].source_date') source_date,source_evidence_json,json_extract(content_package_json,'$.seo.slug') slug,json_extract(content_package_json,'$.headline') draft_headline FROM radar_events WHERE status IN ('ready_for_review','verified','needs_more_evidence') AND region IN ('UK','England','Scotland','Wales','Northern Ireland') AND json_extract(source_evidence_json,'$[0].source_date')<=date('now')||'T23:59:59Z' ORDER BY json_extract(source_evidence_json,'$[0].source_date') DESC,id DESC LIMIT 12")));
