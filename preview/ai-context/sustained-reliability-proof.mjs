import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
import {fixture,ask} from '../../tests/helpers/ai-member-fixture.mjs';
import {storePublicPage} from '../../member-experience/ai-site-knowledge.mjs';
assert(process.env.SHIFT_EVAL_URL&&process.env.SHIFT_EVAL_KEY,'Authenticated temporary evaluator URL and key are required; no local fixture can establish real-model capacity');
const roundCount=10,intervalMs=60000;
const cleanups=[],{env,DB}=fixture({after:fn=>cleanups.push(fn)});
env.SHIFT_AI_PRACTICAL_CONTEXT='true';env.SHIFT_AI_CONVERSATION_MEMORY='true';
DB.sqlite.exec('CREATE TABLE ai_knowledge_documents(id INTEGER PRIMARY KEY,title,source_uri,category,trust_tier,status,checksum UNIQUE,updated_at);CREATE TABLE ai_knowledge_chunks(id INTEGER PRIMARY KEY,document_id,chunk_index,content,search_text);');
await storePublicPage(DB,{url:'https://shiftsometimber.co.uk/life-back',title:'Life Back | Progress Beyond Weight',chunks:['Life Back lets you choose a personal goal and record small wins alongside weight. Energy, confidence, clothes and movement are self-reported progress, not a clinical outcome.']});
let calls=0;
env.AI.run=async(model,input,options)=>{
 calls++;assert.equal(model,'@cf/meta/llama-3.3-70b-instruct-fp8-fast');assert.deepEqual(options,{gateway:{id:'shift-ai',skipCache:true}});
 const r=await fetch(process.env.SHIFT_EVAL_URL+'/run',{method:'POST',headers:{Authorization:'Bearer '+process.env.SHIFT_EVAL_KEY,'Content-Type':'application/json'},body:JSON.stringify(input),signal:AbortSignal.timeout(16000)});
 if(!r.ok){const detail=(await r.text()).slice(0,500);throw Error('Evaluator HTTP '+r.status+' '+detail)}return r.body;
};
async function probe(message,token,scenario){
 const start=performance.now(),r=await ask(env,{message,useJourney:false,stream:true},token);let firstTextMs,done,pending='';const decoder=new TextDecoder();
 if(r.headers.get('content-type')?.includes('text/event-stream')){
  for await(const bytes of r.body){pending+=decoder.decode(bytes,{stream:true});let end;
   while((end=pending.indexOf('\n\n'))>=0){const frame=pending.slice(0,end);pending=pending.slice(end+2);const event=frame.match(/^event: (.+)$/m)?.[1],raw=frame.match(/^data: (.+)$/m)?.[1];if(!raw)continue;const value=JSON.parse(raw);assert.notEqual(event,'error');if(event==='delta'&&value.text.trim()&&firstTextMs===undefined)firstTextMs=Math.round(performance.now()-start);if(event==='done')done=value}
  }
 }else done=await r.json();
 const receipt={scenario,firstTextMs,elapsedMs:Math.round(performance.now()-start),...done};report.results.push(receipt);
 // A reviewed fallback is useful failure handling, never fresh-model acceptance.
 assert.equal(done?.delivery,'streamed',scenario+' did not complete a fresh model answer');assert(done.answer.length>60);
 assert(firstTextMs<=3200,scenario+' first useful text exceeded the model opening budget plus test transport allowance');
 assert.doesNotMatch(done.answer,/OTHER_MEMBER_PRIVATE|PRIVATE_EMAIL|PRIVATE_DOB|PRIVATE_POSTCODE/);
 if(!token){assert.equal(done.journeyUsed,false);assert.match(done.answer,/\[1\]/);assert.equal(done.sources.length,1)}
 else{assert.equal(done.journeyUsed,true);assert.match(done.answer,/weekend[ -]walks?/i);assert.doesNotMatch(done.answer,/completed.*walk|ate.*Lentil/i)}
 return receipt;
}
const report={source:process.env.GITHUB_SHA,at:new Date().toISOString(),model:'@cf/meta/llama-3.3-70b-instruct-fp8-fast',maximumConcurrency:4,rounds:roundCount,intervalMs,retries:0,customerReads:0,customerWrites:0,expectedRequests:41,openingBudgetMs:3200,roundStarts:[],results:[],scope:'Ten rounds over at least nine minutes, each with four simultaneous uncached requests from one fictional-member fixture, plus one uncached public request. Real provider/handler evidence under this bounded synthetic load; not production-scale, multiple-member capacity, human or clinical acceptance. Existing gateway privacy and $2/day spend guard must pass before execution.'};
try{
 await probe('What is Life Back?',null,'fresh-public');
 for(let round=0;round<roundCount;round++){
 const roundStart=Date.now();
 report.roundStarts.push(new Date(roundStart).toISOString());
 const parallel=await Promise.allSettled([
  probe('Help me make time for my saved personal goal on a busy evening.','synthetic-1','fresh-member-a-round-'+(round+1)),
  probe('Help me work towards my saved personal goal on a rainy day.','synthetic-1','fresh-member-b-round-'+(round+1)),
  probe('Help me take a small step towards my saved personal goal during a short lunch break.','synthetic-1','fresh-member-c-round-'+(round+1)),
  probe('Help me plan a simple weekend step towards my saved personal goal.','synthetic-1','fresh-member-d-round-'+(round+1))
 ]);
 const failures=parallel.filter(result=>result.status==='rejected');
 report.rejected=(report.rejected||0)+failures.length;
 if(failures.length)throw new AggregateError(failures.map(result=>result.reason),failures.map(result=>result.reason.message).join('; '));
 if(round<roundCount-1)await new Promise(resolve=>setTimeout(resolve,Math.max(0,intervalMs-(Date.now()-roundStart))));
 }
 report.sustainedWindowMs=Date.parse(report.roundStarts.at(-1))-Date.parse(report.roundStarts[0]);
 assert(report.sustainedWindowMs>=(roundCount-1)*intervalMs,'The sustained window was shorter than nine minutes');
 assert.equal(report.results.length,report.expectedRequests);assert.equal(calls,report.expectedRequests);
 report.completed=report.results.length;report.rejected=0;report.passed=true;
}catch(error){report.passed=false;report.error=error.message;throw error}
finally{report.calls=calls;report.completed=report.results.filter(result=>result.delivery==='streamed').length;mkdirSync('evidence/priority-closeout',{recursive:true});writeFileSync('evidence/priority-closeout/sustained-ai.json',JSON.stringify(report,null,2));for(const fn of cleanups)fn()}
