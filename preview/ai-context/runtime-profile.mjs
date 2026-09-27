import {inferenceText} from '../../member-experience/ai-stream.mjs';
import {PRACTICAL_JUDGEMENT_RULES as BASELINE_RULES} from './prompt-baseline.mjs';
import {JOURNEY_RULES} from '../../member-experience/ai-context.mjs';
import {publishedSiteQuery} from '../../member-experience/ai-site-knowledge.mjs';
import {askTimberRoutes} from '../../ask-timber-v1.js';
// Auth/expiry is enforced by inference.mjs. No request-controlled SQL or question.
// This wrapper permits only the existing public-site SELECT; all other access fails.
export async function runtimeProfile(bindings){
 const results=[];let baselineInput;
 const cache=globalThis.caches?.default;

 const scenarios=[['checked','How can I make protein practical when appetite is low?',false]];
 for(const [round,variants] of [[1,['baseline','candidate']],[2,['candidate','baseline']],[3,['baseline','candidate']]])for(const variant of variants)scenarios.push([variant+'-'+round,'What is Life Back?',true]);
 for(let i=1;i<=5;i++)scenarios.push(['repeat-'+i,'What is Life Back?',false]);
 for(const [scenario,message,fresh] of scenarios){
  const baseline=scenario.startsWith('baseline-');
  const key=k=>new Request(k.url+'?isolated_profile='+encodeURIComponent(bindings.PROFILE_ID)+(baseline?'_baseline':'_candidate'));
  const timings={database:[],cache:[],model:[]},started=Date.now();let denied=0;
  const env={SHIFT_AI_PRACTICAL_CONTEXT:'true',AI:{async run(model,input){if(baseline)input={...input,messages:input.messages.map((m,i)=>i?m:{...m,content:(BASELINE_RULES+'\n'+JOURNEY_RULES).replace(/Return the required JSON\./g,'Return only the answer as natural prose.')})};if(baseline)baselineInput=input;const start=Date.now();const result=await bindings.AI.run(model,input);timings.model.push({headersMs:Date.now()-start,inputCharacters:input.messages.reduce((n,m)=>n+m.content.length,0),stream:input.stream===true});return result}},DB:{prepare(sql){
   const allowed=publishedSiteQuery(message);if(!allowed||sql!==allowed.sql){denied++;throw Error('profile_non_public_query_blocked')}
   return{bind(...args){if(JSON.stringify(args)!==JSON.stringify(allowed.args)){denied++;throw Error('profile_category_blocked')}return{async all(){const start=Date.now();const value=await bindings.PUBLIC_KNOWLEDGE_DB.prepare(sql).bind(...args).all();timings.database.push({wallMs:Date.now()-start,engineMs:value.meta?.duration,rowsRead:value.meta?.rows_read,rowsReturned:value.results?.length,responseBytes:JSON.stringify(value.results||[]).length});return value}}}}}},SHIFT_AI_PUBLIC_CACHE:cache?{async match(k){const t=Date.now();const r=await cache.match(key(k));timings.cache.push({operation:'match',ms:Date.now()-t,hit:!!r});return r},async put(k,v){const t=Date.now();await cache.put(key(k),v);timings.cache.push({operation:'put',ms:Date.now()-t})}}:undefined};
  const response=await askTimberRoutes(new Request('https://api.shiftsometimber.co.uk/v1/ai/chat',{method:'POST',headers:{'Content-Type':'application/json',...(fresh?{'Cache-Control':'no-cache'}:{})},body:JSON.stringify({message,useJourney:false,stream:true})}),env);
  const headersMs=Date.now()-started;let body,firstTextMs;
  if(response.headers.get('content-type')?.includes('text/event-stream')){let pending='';const decoder=new TextDecoder();for await(const chunk of response.body){pending+=decoder.decode(chunk,{stream:true});let end;while((end=pending.indexOf('\n\n'))>=0){const frame=pending.slice(0,end);pending=pending.slice(end+2);const event=frame.match(/^event: (.+)$/m)?.[1],raw=frame.match(/^data: (.+)$/m)?.[1];if(!raw)continue;const value=JSON.parse(raw);if(event==='error')throw Error('profile_stream_failed');if(event==='delta'&&value.text?.trim()&&firstTextMs===undefined)firstTextMs=Date.now()-started;if(event==='done')body=value;}}}else{body=await response.json();firstTextMs=Date.now()-started;}
  if(denied||!body?.ok||body.journeyUsed||!body.sources?.length||timings.database.some(d=>d.rowsReturned>4)||scenario.startsWith('repeat-')&&body.delivery!=='cached_public')throw Error('profile_boundary_or_answer_failed');
  if(scenario.startsWith('candidate-')&&(!/\[1\]/.test(body.answer)||/published_site|external_unreviewed/.test(body.answer)||body.answer.split(/\s+/).length<45))throw Error('profile_answer_quality_failed');
  results.push({scenario,headersMs,firstTextMs,totalMs:Date.now()-started,timings,delivery:body.delivery,sources:body.sources.map(s=>s.url),answer:body.answer});
 }
 const alternate=[];
 for(const model of ['@cf/meta/llama-3.3-70b-instruct-fp8-fast','@cf/mistralai/mistral-small-3.1-24b-instruct','@cf/google/gemma-4-26b-a4b-it']){
  for(let attempt=0;attempt<3;attempt++){
   const start=Date.now();try{
    const stream=await bindings.AI.run(model,baselineInput,{rejectIfBusy:true});const headersMs=Date.now()-start;let answer='',firstTextMs;
    for await(const text of inferenceText(stream)){if(text.trim()&&firstTextMs===undefined)firstTextMs=Date.now()-start;answer+=text;}
    const totalMs=Date.now()-start;alternate.push({model,rejectIfBusy:true,headersMs,firstTextMs,totalMs,answer});if(totalMs>6000)break;
   }catch(error){alternate.push({model,rejectIfBusy:true,totalMs:Date.now()-start,error:String(error.message).slice(0,300)});break;}
  }
 }
 return{alternate,at:new Date().toISOString(),region:bindings.PROFILE_REGION,scope:'Fixed public questions; public knowledge SELECT only; no customer data or database writes',results};
}
