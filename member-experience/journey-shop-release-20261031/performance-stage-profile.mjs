import{readFileSync,writeFileSync}from'node:fs';import{spawnSync}from'node:child_process';
const state=JSON.parse(readFileSync('performance-release-state.json')),profiles=['baseline','instrumented-original','candidate'],paths=[['today','/member/dashboard?view=app'],['fit','/member/fit'],['journey','/member/life-back/journey']],rows=[],file='performance-stage-raw-v3.json',safe=JSON.parse(readFileSync('performance-build.json')).scope==='static';
for(const profile of profiles)for(const [screen,path]of paths){
 const versions=state.owners.map(o=>o.name+'="'+(profile==='baseline'?o.previousVersion:o.versionId)+'"').join(', ');
 for(let sample=0;sample<20;sample++){
 const args=['--silent','--show-error','--compressed','--max-time','30','--header','Cloudflare-Workers-Version-Overrides: '+versions,'--dump-header','performance-stage-headers.tmp','--output','performance-stage-body.tmp','--write-out','%{json}','https://shiftsometimber.co.uk'+path];
 if(profile==='instrumented-original')args.unshift('--header','X-My-Timber-Profile-Original: 1');
 const r=spawnSync('/usr/bin/curl',args,{encoding:'utf8'});if(r.status!==0)throw Error(r.stderr||'curl failed');
 const body=readFileSync('performance-stage-body.tmp','utf8');if(!/<!doctype html>/i.test(body))throw Error(profile+' '+screen+' returned non-HTML body');if(profile!=='baseline'&&!body.includes('data-mt-performance="'+(safe?'static-20261101':'20261101')+'"'))throw Error('Missing repair marker');
 const m=JSON.parse(r.stdout),headers=readFileSync('performance-stage-headers.tmp','utf8'),timing=headers.match(/^server-timing:\s*(.+)$/im)?.[1]||'',edge=headers.match(/^cf-ray:.*-([A-Z]+)\s*$/im)?.[1];
 const row={profile,screen,sample,status:m.http_code,dnsMs:Math.round(m.time_namelookup*1000),tcpMs:Math.round((m.time_connect-m.time_namelookup)*1000),tlsMs:Math.round((m.time_appconnect-m.time_connect)*1000),ttfbMs:Math.round(m.time_starttransfer*1000),postConnectionWaitMs:Math.round((m.time_starttransfer-m.time_appconnect)*1000),documentMs:Math.round(m.time_total*1000),wireBytes:m.size_download,serverTiming:timing,edge};
 if(row.status!==200)throw Error(profile+' '+screen+' '+row.status);rows.push(row);writeFileSync(file,JSON.stringify({at:new Date().toISOString(),source:state.source,conditions:'Anonymous compressed HTTP GET from SST Mac; curl fresh connection per sample; retained baseline or exact zero-traffic candidate overrides; London edge as observed; no account/customer access or writes',rows},null,2));
 }
 const x=rows.filter(r=>r.profile===profile&&r.screen===screen).map(r=>r.ttfbMs).sort((a,b)=>a-b);console.log('STAGE_PROFILE',profile,screen,'n',x.length,'median',x[9],'p95',x[18],'max',x[19]);
}
