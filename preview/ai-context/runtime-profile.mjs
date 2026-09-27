import {publishedSiteQuery} from '../../member-experience/ai-site-knowledge.mjs';
import {askTimberRoutes} from '../../ask-timber-v1.js';
// Auth/expiry is enforced by inference.mjs. No request-controlled SQL or question.
// This wrapper permits only the existing public-site SELECT; all other access fails.
export async function runtimeProfile(bindings){
 const results=[];
 const cache=globalThis.caches?.default;
 const key=k=>new Request(k.url+'?isolated_profile='+encodeURIComponent(bindings.PROFILE_ID));
 for(const [scenario,message,fresh] of [['checked','How can I make protein practical when appetite is low?',false],['cold','What is Life Back?',true],['repeat-1','What is Life Back?',false],['repeat-2','What is Life Back?',false],['repeat-3','What is Life Back?',false],['repeat-4','What is Life Back?',false],['repeat-5','What is Life Back?',false]]){
  const timings={database:[],cache:[],model:[]},started=Date.now();let denied=0;
  const env={SHIFT_AI_PRACTICAL_CONTEXT:'true',AI:{async run(model,input){const start=Date.now();const result=await bindings.AI.run(model,input);timings.model.push({headersMs:Date.now()-start,inputCharacters:input.messages.reduce((n,m)=>n+m.content.length,0),stream:input.stream===true});return result}},DB:{prepare(sql){
   const allowed=publishedSiteQuery(message);if(!allowed||sql!==allowed.sql){denied++;throw Error('profile_non_public_query_blocked')}
   return{bind(...args){if(JSON.stringify(args)!==JSON.stringify(allowed.args)){denied++;throw Error('profile_category_blocked')}return{async all(){const start=Date.now();const value=await bindings.PUBLIC_KNOWLEDGE_DB.prepare(sql).bind(...args).all();timings.database.push({wallMs:Date.now()-start,engineMs:value.meta?.duration,rowsRead:value.meta?.rows_read,rowsReturned:value.results?.length,responseBytes:JSON.stringify(value.results||[]).length});return value}}}}}},SHIFT_AI_PUBLIC_CACHE:cache?{async match(k){const t=Date.now();const r=await cache.match(key(k));timings.cache.push({operation:'match',ms:Date.now()-t,hit:!!r});return r},async put(k,v){const t=Date.now();await cache.put(key(k),v);timings.cache.push({operation:'put',ms:Date.now()-t})}}:undefined};
  const response=await askTimberRoutes(new Request('https://api.shiftsometimber.co.uk/v1/ai/chat',{method:'POST',headers:{'Content-Type':'application/json',...(fresh?{'Cache-Control':'no-cache'}:{})},body:JSON.stringify({message,useJourney:false,stream:true})}),env);
  const headersMs=Date.now()-started;let body,firstTextMs;
  if(response.headers.get('content-type')?.includes('text/event-stream')){let pending='';const decoder=new TextDecoder();for await(const chunk of response.body){pending+=decoder.decode(chunk,{stream:true});let end;while((end=pending.indexOf('\n\n'))>=0){const frame=pending.slice(0,end);pending=pending.slice(end+2);const event=frame.match(/^event: (.+)$/m)?.[1],raw=frame.match(/^data: (.+)$/m)?.[1];if(!raw)continue;const value=JSON.parse(raw);if(event==='error')throw Error('profile_stream_failed');if(event==='delta'&&value.text?.trim()&&firstTextMs===undefined)firstTextMs=Date.now()-started;if(event==='done')body=value;}}}else{body=await response.json();firstTextMs=Date.now()-started;}
  if(denied||!body?.ok||body.journeyUsed||!body.sources?.length||timings.database.some(d=>d.rowsReturned>4)||scenario.startsWith('repeat-')&&body.delivery!=='cached_public')throw Error('profile_boundary_or_answer_failed');
  results.push({scenario,headersMs,firstTextMs,totalMs:Date.now()-started,timings,delivery:body.delivery,sources:body.sources.map(s=>s.url),answer:body.answer});
 }
 return{at:new Date().toISOString(),region:bindings.PROFILE_REGION,scope:'Fixed public questions; public knowledge SELECT only; no customer data or database writes',results};
}
