import {fixture,ask} from '../../tests/helpers/ai-member-fixture.mjs';
import {mkdirSync,writeFileSync} from 'node:fs';
const cleanup=[],{env}=fixture({after:fn=>cleanup.push(fn)});env.SHIFT_AI_PRACTICAL_CONTEXT='true';
const models=['@cf/meta/llama-3.3-70b-instruct-fp8-fast','@cf/meta/llama-3.1-8b-instruct'];
const questions=['How can I make protein practical when appetite is low?','What meal have I chosen today and what is my personal goal?','I finish at midnight, have ten minutes and very little money. How can I make my chosen meal easier?'];
const results=[];
for(const model of models)for(const stream of [false,true])for(const question of questions){
 let timing={};env.AI={run:async(_,input)=>{
 const start=performance.now();
 const response=await fetch(process.env.SHIFT_EVAL_URL+'/run',{method:'POST',headers:{Authorization:'Bearer '+process.env.SHIFT_EVAL_KEY,'Content-Type':'application/json'},body:JSON.stringify({...input,benchmarkModel:model,benchmarkStream:stream}),signal:AbortSignal.timeout(45000)});
 if(!response.ok)throw Error('Inference HTTP '+response.status);
 if(!stream){const data=await response.json();timing={totalMs:Math.round(performance.now()-start)};return data;}
 const reader=response.body.getReader(),decoder=new TextDecoder();let buffer='',answer='',firstTextMs=null;
 while(true){const {value,done}=await reader.read();if(done)break;buffer+=decoder.decode(value,{stream:true});let end;while((end=buffer.indexOf('\n'))>=0){const line=buffer.slice(0,end).trim();buffer=buffer.slice(end+1);if(!line.startsWith('data:'))continue;const raw=line.slice(5).trim();if(raw==='[DONE]')continue;try{const chunk=JSON.parse(raw),text=chunk.response||chunk.choices?.[0]?.delta?.content||'';if(text.trim()&&firstTextMs===null)firstTextMs=Math.round(performance.now()-start);answer+=text;}catch{}}}
 timing={firstTextMs,totalMs:Math.round(performance.now()-start)};return{response:{answer,confidence:'low',keyPoints:[],nextSteps:[],followUps:[],limitations:'Benchmark only'}};
 }};
 const start=performance.now();const r=await ask(env,{message:question,useJourney:false},question.startsWith('How can')?null:'synthetic-1');const data=await r.json();results.push({model,stream,question,...timing,routeMs:Math.round(performance.now()-start),mode:data.mode,answer:data.answer});
}
mkdirSync('evidence/shift-ai-real-probe',{recursive:true});writeFileSync('evidence/shift-ai-real-probe/latency.json',JSON.stringify({at:new Date().toISOString(),results},null,2));console.log('AI_LATENCY_BENCHMARK '+JSON.stringify(results));for(const fn of cleanup)fn();
