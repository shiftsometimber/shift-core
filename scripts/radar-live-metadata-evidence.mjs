import {execFileSync} from 'node:child_process';
import {LEGACY_METADATA_OBSERVATIONS} from '../radar-source-metadata-manifest-v1.js';
const ids=LEGACY_METADATA_OBSERVATIONS.map(x=>x.observation).join(',');
const query="SELECT (SELECT COUNT(*) FROM radar_audit WHERE action='source_metadata_backfilled' AND CAST(json_extract(detail_json,'$.observation_id') AS INTEGER) IN ("+ids+")) applied,(SELECT MAX(id) FROM radar_audit WHERE action='source_metadata_backfilled') last_repair,(SELECT MAX(id) FROM radar_audit WHERE action='scan') last_scan";
let complete=false;
for(let attempt=0;attempt<18;attempt++){
 const raw=execFileSync('npx',['wrangler','d1','execute','DB','--remote','--config','wrangler.jsonc','--json','--command',query],{encoding:'utf8',maxBuffer:1024*1024});
 const row=JSON.parse(raw).flatMap(x=>x.results||[])[0];
 console.log('SCHEDULED_REPAIR_WAIT '+JSON.stringify({at:new Date().toISOString(),...row}));
 if(row.applied===54&&row.last_scan>row.last_repair){complete=true;break;}
 await new Promise(resolve=>setTimeout(resolve,45000));
}
execFileSync(process.execPath,['scripts/radar-feed-diagnostics.mjs'],{stdio:'inherit'});
if(!complete)throw Error('Scheduled metadata repair and subsequent scan not yet confirmed');
