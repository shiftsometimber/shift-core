import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
import {fixture,ask} from '../../tests/helpers/ai-member-fixture.mjs';
import {storePublicPage} from '../../member-experience/ai-site-knowledge.mjs';
const cleanups=[],{env,DB}=fixture({after:fn=>cleanups.push(fn)});
env.SHIFT_AI_PRACTICAL_CONTEXT='true';env.SHIFT_AI_CONVERSATION_MEMORY='true';
DB.sqlite.exec('CREATE TABLE ai_knowledge_documents(id INTEGER PRIMARY KEY,title,source_uri,category,trust_tier,status,checksum UNIQUE,updated_at);CREATE TABLE ai_knowledge_chunks(id INTEGER PRIMARY KEY,document_id,chunk_index,content,search_text);');
await storePublicPage(DB,{url:'https://shiftsometimber.co.uk/life-back',title:'Life Back | Progress Beyond Weight',chunks:['Life Back lets you choose a personal goal and record small wins alongside weight. Energy, confidence, clothes and movement are self-reported progress, not a clinical outcome.']});
let calls=0;
env.AI.run=async(model,input,options)=>{
 calls++;assert.equal(model,'@cf/meta/llama-3.3-70b-instruct-fp8-fast');assert.deepEqual(options,{gateway:{id:'shift-ai',skipCache:true}});
 const r=await fetch(process.env.SHIFT_EVAL_URL+'/run',{method:'POST',headers:{Authorization:'Bearer '+process.env.SHIFT_EVAL_KEY,'Content-Type':'application/json'},body:JSON.stringify(input),signal:AbortSignal.timeout(16000)});
 assert(r.ok,'Evaluator HTTP '+r.status);return r.body;
};
async function probe(message,token,scenario){
 const start=performance.now(),r=await ask(env,{message,useJourney:false,stream:true},token);let firstTextMs,done,pending='';const decoder=new TextDecoder();
 if(r.headers.get('content-type')?.includes('text/event-stream')){
  for await(const bytes of r.body){pending+=decoder.decode(bytes,{stream:true});let end;
   while((end=pending.indexOf('\n\n'))>=0){const frame=pending.slice(0,end);pending=pending.slice(end+2);const event=frame.match(/^event: (.+)$/m)?.[1],raw=frame.match(/^data: (.+)$/m)?.[1];if(!raw)continue;const value=JSON.parse(raw);assert.notEqual(event,'error');if(event==='delta'&&value.text.trim()&&firstTextMs===undefined)firstTextMs=Math.round(performance.now()-start);if(event==='done')done=value}
  }
 }else done=await r.json();
 const receipt={scenario,firstTextMs,elapsedMs:Math.round(performance.now()-start),...done};
 // A reviewed fallback is useful failure handling, never fresh-model acceptance.
 assert.equal(done?.delivery,'streamed',scenario+' did not complete a fresh model answer');assert(done.answer.length>60);
 assert(firstTextMs<=3200,scenario+' first useful text exceeded the model opening budget plus test transport allowance');
 assert.doesNotMatch(done.answer,/OTHER_MEMBER_PRIVATE|PRIVATE_EMAIL|PRIVATE_DOB|PRIVATE_POSTCODE/);
 if(!token){assert.equal(done.journeyUsed,false);assert.match(done.answer,/\[1\]/);assert.equal(done.sources.length,1)}
 else{assert.equal(done.journeyUsed,true);assert.match(done.answer,/weekend walks/i);assert.doesNotMatch(done.answer,/completed.*walk|ate.*Lentil/i)}
 return receipt;
}
const report={source:process.env.GITHUB_SHA,at:new Date().toISOString(),model:'@cf/meta/llama-3.3-70b-instruct-fp8-fast',maximumConcurrency:2,retries:0,customerReads:0,customerWrites:0,results:[],scope:'One cold public question, then two simultaneous fictional-member questions. A bounded acceptance sample, not a capacity or clinical certification.'};
try{
 report.results.push(await probe('What is Life Back?',null,'fresh-public'));
 report.results.push(...await Promise.all([probe('What does my saved weekend-walk goal mean for a busy evening?','synthetic-1','fresh-member-a'),probe('How can I keep my saved weekend-walk goal in mind on a rainy day?','synthetic-1','fresh-member-b')]));
 report.passed=true;
}catch(error){report.passed=false;report.error=error.message;throw error}
finally{report.calls=calls;mkdirSync('evidence/priority-closeout',{recursive:true});writeFileSync('evidence/priority-closeout/fresh-ai.json',JSON.stringify(report,null,2));for(const fn of cleanups)fn()}
