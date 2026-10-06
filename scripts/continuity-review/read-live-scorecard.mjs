import {execFileSync} from 'node:child_process';
import {writeFileSync} from 'node:fs';
import {continuityScorecard} from '../../continuity-measurement/scorecard.mjs';
const startedAt=new Date().toISOString(),reads=[];
const wrangler=process.env.SHIFT_REVIEW_WRANGLER||'./node_modules/.bin/wrangler';
const DB={prepare(sql){if(!/^\s*(SELECT|PRAGMA table_info)/i.test(sql)||/;/.test(sql))throw Error('Read-only query required');return{async all(){const raw=execFileSync(wrangler,['d1','execute','shift-core-db','--remote','--command',sql,'--json'],{encoding:'utf8',maxBuffer:16*1024*1024,stdio:['ignore','pipe','pipe']});const result=JSON.parse(raw);if(result.some(r=>r.success!==true||r.meta?.rows_written>0||r.meta?.changed_db===true))throw Error('Read receipt failed');reads.push({rowsRead:result.reduce((n,r)=>n+(r.meta?.rows_read||0),0),rowsWritten:0});return{results:result.flatMap(r=>r.results||[])}}}}};
try{
const scorecard=await continuityScorecard(DB,{now:startedAt,days:90});
const receipt={source:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),startedAt,completedAt:new Date().toISOString(),method:'Existing continuityScorecard against production D1 using SELECT/PRAGMA only. No raw member records persisted or returned. Sequential reads are not a transactional snapshot.',queryReceipts:reads,scorecard};
writeFileSync('evidence/continuity-scenarios-20261006/live-scorecard.json',JSON.stringify(receipt,null,2)+'\n');
console.log(JSON.stringify(receipt,null,2));
}catch(e){console.error('Aggregate read failed:',e.message?.split('\n')[0]);process.exitCode=1;}

