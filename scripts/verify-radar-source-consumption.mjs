import {collectorD1} from './radar-collector-d1.mjs';
const deadline=Date.now()+12*60*1000;
while(Date.now()<deadline){
 const rows=collectorD1(['--command',"SELECT created_at,detail_json FROM radar_audit WHERE action='scan' ORDER BY id DESC LIMIT 1"]).flatMap(r=>r.results||[]);
 const latest=rows[0],detail=JSON.parse(latest?.detail_json||'{}'),consumed=(detail.sources||[]).filter(s=>s.ok&&s.transport==='scheduled_collector');
 console.log('SOURCE_CONSUMPTION '+JSON.stringify({scan:latest?.created_at,consumed:consumed.length,failed:detail.coverage?.failed}));
 if(consumed.length===7){console.log('SOURCE_CONSUMPTION_VERIFIED '+JSON.stringify({scan:latest.created_at,detail}));process.exit(0)}
 await new Promise(resolve=>setTimeout(resolve,30000));
}
throw Error('No completed production scan has consumed all seven collector snapshots yet');
