import assert from'node:assert/strict';
import{readFileSync,writeFileSync,readdirSync}from'node:fs';
import{spawnSync}from'node:child_process';
const screens=['today','journey','shop','grub','fit','support','more'],profiles=[['chromium','good'],['chromium','slow4g']];
export const percentile=(a,q)=>{const n=[...a].sort((a,b)=>a-b);return n[Math.max(0,Math.ceil(n.length*q)-1)];};
export function evaluateBudget(phase,{requireCoverage=true}={}){
 const state=JSON.parse(readFileSync('performance-release-state.json')),files=readdirSync('.').filter(n=>n.startsWith('performance-distribution-')&&n.endsWith('.json')),data=files.map(file=>({...JSON.parse(readFileSync(file)),file}));
 const staticSlice=JSON.parse(readFileSync('performance-build.json')).scope==='static',requiredProfiles=staticSlice?[['chromium','good']]:profiles;
 const valid=r=>r.fixtureRevision===2&&r.verified&&(r.phase==='baseline'?r.variant==='cache':r.variant===(staticSlice?'static':'cache'))&&(r.phase==='baseline'||r.source===state.source)&&r.productionApiRequests===0&&r.productionWrites===0;
 const rows=data.filter(valid).flatMap(r=>r.rows.map(x=>({...x,file:r.file}))),comparisons=[],failures=[],flags=[];
 for(const [engine,profile]of requiredProfiles)for(const screen of screens)for(const visit of ['fresh','warm']){
  const group=p=>rows.filter(x=>x.phase===p&&x.engine===engine&&x.profile===profile&&x.screen===screen&&x.visit===visit),before=group('baseline'),after=group(phase);
  if(before.length<20||after.length<20){if(requireCoverage)failures.push('Missing n20 '+engine+'/'+profile+'/'+screen+'/'+visit);continue;}
  const summarise=g=>({n:g.length,medianMs:percentile(g.map(x=>x.usableMs),.5),p95Ms:percentile(g.map(x=>x.usableMs),.95),slowestMs:Math.max(...g.map(x=>x.usableMs)),ackP95Ms:percentile(g.map(x=>x.ackMs??Infinity),.95),jsMedianBytes:percentile(g.map(x=>x.externalJsTransferredBytes),.5),identityMedianMs:percentile(g.map(x=>x.accountMs),.5),dataMedianMs:percentile(g.map(x=>x.dataMs),.5),serverMedianMs:percentile(g.map(x=>x.ttfbMs),.5),slowest:g.toSorted((a,b)=>b.usableMs-a.usableMs).slice(0,3).map(({sample,usableMs,ttfbMs,accountMs,dataMs,documentRequests,file})=>({sample,usableMs,ttfbMs,accountMs,dataMs,documentRequests,file}))});
  const b=summarise(before),a=summarise(after),limit=visit==='fresh'?2000:500;
  comparisons.push({engine,profile,screen,visit,before:b,after:a,targetMs:limit});
  if(a.p95Ms>b.p95Ms)failures.push('P95 regression '+engine+'/'+profile+'/'+screen+'/'+visit+' '+b.p95Ms+' -> '+a.p95Ms);
  if(a.medianMs>limit)flags.push({engine,profile,screen,visit,reason:'median exceeds engineering target',actual:a.medianMs,target:limit});
  if(a.ackP95Ms>100)flags.push({engine,profile,screen,visit,reason:'tap feedback p95 exceeds 100ms',actual:a.ackP95Ms});
 }
 for(const engine of ['chromium','webkit']){
  const file='performance-'+(phase==='live'?'live':'candidate')+'-'+engine+'.json';let r;try{r=JSON.parse(readFileSync(file));}catch{}
  if(!r?.verified||r.source!==state.source||r.productionWrites!==0)failures.push('Functional/privacy acceptance missing '+engine);
 }
 const security=JSON.parse(readFileSync('performance-'+phase+'-privacy.json'));
 if(!security.verified||security.source!==state.source)failures.push('HTTP auth/privacy acceptance failed');
 const report={at:new Date().toISOString(),phase,source:state.source,passed:failures.length===0,failures,flags,comparisons};
 writeFileSync('performance-'+phase+'-budget.json',JSON.stringify(report,null,2)+'\n');return report;
}
export function rollbackAfterFailure(reason){
 const state=JSON.parse(readFileSync('performance-release-state.json')),actions=[];
 for(let i=2;i>=0;i--){if(!state.owners[i].liveAt||state.owners[i].rollbackAt>=state.owners[i].liveAt)continue;const p=spawnSync(process.execPath,['performance-release.mjs','rollback',String(i)],{encoding:'utf8',timeout:180000});actions.push({owner:state.owners[i].name,status:p.status,stdout:p.stdout,stderr:p.stderr});if(p.status!==0){writeFileSync('performance-automatic-rollback.json',JSON.stringify({at:new Date().toISOString(),reason,actions,verified:false},null,2));throw Error('Automatic rollback failed: '+p.stderr);}}
 writeFileSync('performance-automatic-rollback.json',JSON.stringify({at:new Date().toISOString(),reason,actions,verified:true},null,2)+'\n');
}
if(process.argv[1]?.endsWith('performance-budget.mjs')){
 const phase=process.argv[2]||'candidate';try{const r=evaluateBudget(phase);console.log('PERFORMANCE_BUDGET',phase,r.passed,'comparisons',r.comparisons.length,'flags',r.flags.length);if(!r.passed){if(phase==='live')rollbackAfterFailure(r.failures);process.exitCode=1;}}catch(e){if(phase==='live')rollbackAfterFailure(e.message);throw e;}
}
