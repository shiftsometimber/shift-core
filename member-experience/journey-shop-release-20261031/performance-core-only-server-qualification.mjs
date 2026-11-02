import https from 'node:https';
import {gunzipSync} from 'node:zlib';
import {readFileSync,writeFileSync} from 'node:fs';
import assert from 'node:assert/strict';
const state=JSON.parse(readFileSync('performance-release-state.json')),rows=[],live=false,file='performance-core-only-server-qualification.json',profiles=['live','candidate'];
const pct=(a,q)=>a.toSorted((a,b)=>a-b)[Math.ceil(a.length*q)-1];
async function sample(profile,n){
 const start=performance.now(),timings={},versions=state.owners.slice(0,1).map(o=>o.name+'="'+o.versionId+'"').join(', ');
 const row=await new Promise((resolve,reject)=>{
  const headers={'Accept-Encoding':'gzip'};if(profile!=='live')headers['Cloudflare-Workers-Version-Overrides']=versions;
  if(profile==='instrumented-original')headers['X-My-Timber-Profile-Original']='1';
  const req=https.get('https://shiftsometimber.co.uk/member/dashboard?view=app',{headers,agent:false},res=>{
   timings.finalHeadersMs=performance.now()-start;const chunks=[];let wireBytes=0;
   res.on('data',b=>{timings.firstBodyMs??=performance.now()-start;chunks.push(b);wireBytes+=b.length;});
   res.on('error',reject);res.on('end',()=>{
    try{
     timings.completeMs=performance.now()-start;let body=Buffer.concat(chunks);for(let i=0;i<2&&body[0]===31&&body[1]===139;i++)body=gunzipSync(body);
     assert.equal(res.statusCode,200);assert.match(body.toString(),/<!doctype html>/i);if(profile==='live')assert.equal(res.headers['x-my-timber-performance'],'20261101','Expected ordinary production performance release');
     const tlsReady=timings.tlsReadyMs||0,headersAt=timings.finalHeadersMs;
     resolve({profile,screen:'today',sample:n,status:res.statusCode,...Object.fromEntries(Object.entries(timings).map(([k,v])=>[k,Math.round(v)])),postTlsFinalHeadersMs:Math.round(headersAt-tlsReady),bodyAfterHeadersMs:Math.round(timings.completeMs-headersAt),wireBytes,decodedBytes:body.length,serverTiming:res.headers['server-timing']||'',edge:(res.headers['cf-ray']||'').split('-').at(-1)});
    }catch(e){reject(e);}
   });
  });
  req.on('socket',s=>{s.on('lookup',()=>timings.dnsReadyMs=performance.now()-start);s.on('connect',()=>timings.tcpReadyMs=performance.now()-start);s.on('secureConnect',()=>timings.tlsReadyMs=performance.now()-start);});
  req.on('information',info=>{if(info.statusCode===103)timings.earlyHintsMs??=performance.now()-start;});req.on('error',reject);req.setTimeout(30000,()=>req.destroy(Error('Stage-profile request exceeded 30 seconds')));
 });
 rows.push(row);writeFileSync(file,JSON.stringify({at:new Date().toISOString(),source:state.source,scope:'CORE_PUBLIC_IMMUTABLE_COMPATIBILITY_ONLY',coreOverride:state.owners[0].versionId,privateMemberVersions:'ordinary production, no member version override',conditions:live?'Twenty ordinary live production HTTPS requests from SST Mac; no version overrides, cookies or API stubs. New connection per sample; final HTTP 200 headers separated from interim hints. No private API reads or production writes.':'Anonymous compressed HTTPS from SST Mac, new connection per request, profiles alternated per sample. Final HTTP 200 headers and body completion are measured separately from HTTP 103 Early Hints. Only Core uses its exact zero-traffic candidate override; member services use their ordinary current production releases. No cookies, production API reads or writes.',rows},null,2)+'\n');
}
for(let n=0;n<20;n++)for(const profile of profiles)await sample(profile,n);
for(const profile of profiles){
 const group=rows.filter(r=>r.profile===profile),summary={};
 for(const metric of ['finalHeadersMs','bodyAfterHeadersMs','completeMs','postTlsFinalHeadersMs','tlsReadyMs'])summary[metric]={median:pct(group.map(r=>r[metric]),.5),p95:pct(group.map(r=>r[metric]),.95)};
 console.log('FINAL_RESPONSE_STAGE',profile,JSON.stringify({n:group.length,summary,earlyHints:group.filter(r=>r.earlyHintsMs!==undefined).length}));
}
