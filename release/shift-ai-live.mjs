import {readSiteAnswer,observeEdgeAnswer} from './ai-response-proof.mjs';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {mkdirSync,readFileSync,writeFileSync} from 'node:fs';
import {verifyScope} from '../scripts/b1-release-scope.mjs';
const phase=process.argv[2],dir='b1-runtime-release';
assert(['before','after'].includes(phase));assert.equal(process.env.GITHUB_REF,'refs/heads/main');verifyScope();mkdirSync(dir,{recursive:true});
const paths=['/assets/ask-timber-v1.js','/assets/ask-timber-v1.css','/assets/ask-timber-intent-v2.js','/api-adapter-v33d.js'];
const assets={};for(const path of paths){const r=await fetch('https://shiftsometimber.co.uk'+path,{signal:AbortSignal.timeout(30000)});assert.equal(r.status,200,path);assets[path]=createHash('sha256').update(Buffer.from(await r.arrayBuffer())).digest('hex')}
const report={phase,at:new Date().toISOString(),source:process.env.GITHUB_SHA,assets,customerRecordsRead:0,customerRecordsWritten:0};
if(phase==='before'){
 const query=sql=>{const r=JSON.parse(execFileSync(process.execPath,['node_modules/wrangler/bin/wrangler.js','d1','execute','DB','--remote','--config','wrangler.jsonc','--json','--command',sql],{encoding:'utf8',maxBuffer:4*1024*1024}));assert(r.every(x=>x.success));return r.flatMap(x=>x.results||[])};
 const tables=new Set(query("SELECT name FROM sqlite_schema WHERE type='table' AND name IN ('ai_knowledge_documents','shift_knowledge_nodes','shift_knowledge_sources','structured_content')").map(r=>r.name));
 const knowledge={};
 const queries={ai_knowledge_documents:'SELECT status,COUNT(*) total FROM ai_knowledge_documents GROUP BY status',shift_knowledge_nodes:'SELECT node_type,domain,status,COUNT(*) total FROM shift_knowledge_nodes GROUP BY node_type,domain,status',shift_knowledge_sources:'SELECT source_type,COUNT(*) source_rows,COUNT(DISTINCT node_id) distinct_nodes FROM shift_knowledge_sources GROUP BY source_type',structured_content:'SELECT content_type,status,COUNT(*) total FROM structured_content GROUP BY content_type,status'};
 for(const [table,sql]of Object.entries(queries))knowledge[table]=tables.has(table)?query(sql):{unavailable:true};
 report.knowledge=knowledge;report.knowledgeMeaning='Aggregate inventory, not proof of clinical freshness. Approved-document sync and source discovery are scheduled every fifteen minutes; only reviewed eligible content may support answers.';
}else{
 const before=JSON.parse(readFileSync(dir+'/shift-ai-before.json')).assets;
 const approved={'/assets/ask-timber-v1.js':'frontend/member/assets/ask-timber-v1.js','/api-adapter-v33d.js':'frontend/member/api-adapter-v33d.js'};
 for(const path of paths)assert.equal(assets[path],approved[path]?createHash('sha256').update(readFileSync(approved[path])).digest('hex'):before[path],'Unexpected chat asset: '+path);
 const r=await fetch('https://api.cloudflare.com/client/v4/accounts/'+process.env.CLOUDFLARE_ACCOUNT_ID+'/workers/scripts/shift-core/settings',{headers:{Authorization:'Bearer '+process.env.CLOUDFLARE_API_TOKEN},signal:AbortSignal.timeout(30000)});assert.equal(r.status,200,'Worker settings verification');
 const data=await r.json();assert(data.success);report.flags={};
 for(const name of ['SHIFT_AI_PRACTICAL_CONTEXT','SHIFT_AI_CONVERSATION_MEMORY']){const binding=data.result.bindings.find(x=>x.name===name);assert.equal(binding?.text,'true',name+' is not active in production');report.flags[name]=true;}
 const start=Date.now();const answer=await fetch('https://api.shiftsometimber.co.uk/v1/ai/chat',{method:'POST',headers:{'Content-Type':'application/json',Origin:'https://shiftsometimber.co.uk'},body:JSON.stringify({message:'How can I make protein practical when appetite is low?',useJourney:false}),signal:AbortSignal.timeout(45000)});assert.equal(answer.status,200);const body=await answer.json();assert.equal(body.ok,true);assert.equal(body.mode,'grounded');assert(body.answer?.length>30);assert(body.sources?.some(x=>x.url==='https://www.nhs.uk/live-well/eat-well/food-guidelines-and-food-labels/the-eatwell-guide/'),'Missing relevant protein foundation');assert(body.sources?.some(x=>x.url==='https://cios.icb.nhs.uk/health/nutrition/small-appetite/'),'Missing appetite foundation');assert(body.sources.every(x=>!String(x.citation).startsWith('ShiftBrain:graph:radar:')),'Unrelated news displaced practical evidence');assert.notEqual(body.journeyUsed,true);report.publicAnswer={elapsedMs:Date.now()-start,...body};
 assert.equal(body.delivery,'checked_answer');
 report.quickReplyTimingsMs=[report.publicAnswer.elapsedMs];
 for(let i=0;i<4;i++){const t=Date.now();const response=await fetch('https://api.shiftsometimber.co.uk/v1/ai/chat',{method:'POST',headers:{'Content-Type':'application/json',Origin:'https://shiftsometimber.co.uk'},body:JSON.stringify({message:'How can I make protein practical when appetite is low?',useJourney:false}),signal:AbortSignal.timeout(15000)});assert.equal(response.status,200);assert.equal((await response.json()).delivery,'checked_answer');report.quickReplyTimingsMs.push(Date.now()-t);}
 report.quickReplyMedianMs=[...report.quickReplyTimingsMs].sort((a,b)=>a-b)[2];
 report.quickReplyTargetMet=report.quickReplyMedianMs<1000;
 const siteRequest=async(message,{fresh=false}={})=>{
  const startedAt=Date.now(),response=await fetch('https://api.shiftsometimber.co.uk/v1/ai/chat',{method:'POST',headers:{'Content-Type':'application/json',...(fresh?{'Cache-Control':'no-cache'}:{}),Origin:'https://shiftsometimber.co.uk'},body:JSON.stringify({message,useJourney:false,stream:true}),signal:AbortSignal.timeout(45000)});
  return readSiteAnswer(response,{startedAt,requireStream:fresh,sources:report.siteAnswer?.sources});
 };
 report.siteAnswer=await siteRequest('What is Life Back?',{fresh:true});
 const answers=new Map();observeEdgeAnswer(answers,report.siteAnswer);
 report.repeatedSiteAnswers=[];let verifiedCacheHits=0;
 for(let i=0;i<7;i++){
  const value=await siteRequest('What is Life Back?');if(observeEdgeAnswer(answers,value))verifiedCacheHits++;
  report.repeatedSiteAnswers.push({edge:value.edge,elapsedMs:value.elapsedMs,delivery:value.delivery});
 }
 assert(verifiedCacheHits>0,'No repeated cache reuse was proved within a responding data centre');
 report.normalisedPublicAnswers=[];let normalisedVerified=false;
 for(let i=0;i<3&&!normalisedVerified;i++){
  const value=await siteRequest('WHAT  IS LIFE BACK'),previous=answers.get(value.edge);
  if(value.delivery==='cached_public'&&previous){assert.equal(value.answer,previous.answer,'Normalised question did not reuse the same public answer');normalisedVerified=true;}
  report.normalisedPublicAnswers.push({edge:value.edge,elapsedMs:value.elapsedMs,delivery:value.delivery});
 }
 assert(normalisedVerified,'No normalised-question cache hit matched an original-question receipt in the same data centre');
 const repeatTimings=report.repeatedSiteAnswers.filter(x=>x.delivery==='cached_public').map(x=>x.elapsedMs).sort((a,b)=>a-b);
 report.repeatedSiteLatency={samples:repeatTimings.length,medianMs:repeatTimings[Math.floor(repeatTimings.length/2)],maxMs:repeatTimings.at(-1),allUnderOneSecond:repeatTimings.every(ms=>ms<1000),verifiedCacheHits};
 report.freshSiteTimings=[{edge:report.siteAnswer.edge,firstTextMs:report.siteAnswer.firstTextMs,elapsedMs:report.siteAnswer.elapsedMs}];
 for(let i=0;i<2;i++){const value=await siteRequest('What is Life Back?',{fresh:true});report.freshSiteTimings.push({edge:value.edge,firstTextMs:value.firstTextMs,elapsedMs:value.elapsedMs});}
 const index=JSON.parse(readFileSync(dir+'/shift-ai-public-index.json'));assert(index.indexed>=50);report.publicIndex={indexed:index.indexed,chunks:index.chunks,at:index.at};
 const page=await fetch('https://shiftsometimber.co.uk/ask-timber');assert.equal(page.status,200);assert((await page.text()).includes('timberQuestion'));
 report.authenticatedProductionConversation='No customer session used. Private-memory behaviour verified in authenticated synthetic browser acceptance; live configuration and public inference verified here.';
}
writeFileSync(dir+'/shift-ai-'+phase+'.json',JSON.stringify(report,null,2));console.log('SHIFT_AI_LIVE_PROOF '+JSON.stringify(report));
