import {memoryStillAllowed,saveConversationTurn} from './ai-memory-bridge.mjs';

// Deadlines bound delivery, not inference cost. Never retry a timed-out model.
function bounded(promise,ms,signal){
 return new Promise((resolve,reject)=>{
  let timer;
  const abort=()=>finish(reject,Error('cancelled'));
  const finish=(fn,value)=>{clearTimeout(timer);signal?.removeEventListener('abort',abort);fn(value)};
  timer=setTimeout(()=>finish(reject,Error('provider_timeout')),Math.max(0,ms));
  if(signal?.aborted)return abort();
  signal?.addEventListener('abort',abort,{once:true});
  Promise.resolve(promise).then(value=>finish(resolve,value),error=>finish(reject,error));
 });
}

export async function* inferenceText(stream,{signal,firstTextTimeoutMs=3000,idleTimeoutMs=5000,totalTimeoutMs=15000}={}){
 const reader=stream.getReader(),decoder=new TextDecoder(),started=Date.now();
 let pending='',first=true,lastText=started,terminal=false;
 const parse=line=>{
  if(!line.startsWith('data:'))return '';
  const raw=line.slice(5).trim();if(!raw)return '';
  if(raw==='[DONE]'){terminal=true;return ''}
  const data=JSON.parse(raw);if(data.error)throw Error('provider_error');
  const choice=data.choices?.[0];
  if(choice?.finish_reason==='length'||choice?.finish_reason==='content_filter')throw Error('incomplete_answer');
  if(choice?.finish_reason==='stop')terminal=true;
  const text=data.response??choice?.delta?.content??'';
  return typeof text==='string'?text:'';
 };
 const cancel=()=>{reader.cancel().catch(()=>{})};
 signal?.addEventListener('abort',cancel,{once:true});
 try{
  while(!terminal){
   if(signal?.aborted)throw Error('cancelled');
   const now=Date.now(),remaining=Math.min(totalTimeoutMs-(now-started),(first?firstTextTimeoutMs:idleTimeoutMs)-(now-lastText));
   const {value,done}=await bounded(reader.read(),remaining,signal);
   pending+=done?decoder.decode():decoder.decode(value,{stream:true});
   if(pending.length>65536)throw Error('invalid_stream');
   let end;
   while((end=pending.indexOf('\n'))>=0){
    const line=pending.slice(0,end).trim();pending=pending.slice(end+1);
    const text=parse(line);if(text){first=false;lastText=Date.now();yield text}
    if(terminal)break;
   }
   if(done){const text=parse(pending.trim());if(text)yield text;break}
  }
 }finally{signal?.removeEventListener('abort',cancel);await reader.cancel().catch(()=>{});reader.releaseLock()}
}

export async function openInference(run,{signal,timeoutMs=3000}={}){
 const started=Date.now(),abort=new AbortController();let abandoned=false;
 const stop=()=>abort.abort();if(signal?.aborted)stop();signal?.addEventListener('abort',stop,{once:true});
 const cleanup=()=>signal?.removeEventListener('abort',stop);
 const pending=Promise.resolve().then(run);
 pending.then(stream=>{if(abandoned)stream?.cancel?.().catch(()=>{})},()=>{});
 let tokens;
 try{
  const upstream=await bounded(pending,timeoutMs,abort.signal);
  if(!upstream?.getReader)throw Error('stream_unavailable');
  tokens=inferenceText(upstream,{signal:abort.signal,firstTextTimeoutMs:Math.max(0,timeoutMs-(Date.now()-started))});
  const first=await tokens.next();if(first.done)throw Error('empty_answer');
  return {async *[Symbol.asyncIterator](){try{yield first.value;yield* tokens}finally{cleanup();await tokens.return()}},cancel:()=>{abort.abort();cleanup();return tokens.return()}};
 }catch(error){abandoned=true;abort.abort();cleanup();await tokens?.return();throw error}
}

export function answerStream(upstream,{headers,requestId,access,meta,request,onComplete}){
 const encoder=new TextEncoder(),abort=new AbortController();let cancelled=false;
 const stop=()=>abort.abort();request.signal.addEventListener('abort',stop,{once:true});
 const tokens=upstream.getReader?inferenceText(upstream,{signal:abort.signal}):upstream;
 const stream=new ReadableStream({async start(controller){
  const emit=(event,data)=>{if(!cancelled)controller.enqueue(encoder.encode('event: '+event+'\ndata: '+JSON.stringify(data)+'\n\n'))};
  let answer='',pending='',last=0;
  try{
   if(!await memoryStillAllowed(access))throw Error('privacy_changed');emit('meta',meta);
   for await(const text of tokens){
    if(cancelled||request.signal.aborted)throw Error('cancelled');answer+=text;pending+=text;
    if(answer.length>5000)throw Error('answer_too_long');
    if(!last||Date.now()-last>=200){if(!await memoryStillAllowed(access))throw Error('privacy_changed');emit('delta',{text:pending});pending='';last=Date.now()}
   }
   if(cancelled||request.signal.aborted)throw Error('cancelled');
   if(!answer.trim())throw Error('empty_answer');if(!await memoryStillAllowed(access))throw Error('privacy_changed');
   if(pending)emit('delta',{text:pending});await saveConversationTurn(access,'assistant',answer);
   if(!await memoryStillAllowed(access))throw Error('privacy_changed');
   const completed={ok:true,requestId,mode:'grounded',...meta,answer:answer.replace(/\[\s*\]/g,'').trim(),keyPoints:[],nextSteps:[],followUps:[],delivery:'streamed'};
   await onComplete?.(completed);emit('done',completed);
  }catch(error){emit('error',{ok:false,error:error.message==='privacy_changed'?'privacy_changed':'answer_interrupted',message:error.message==='privacy_changed'?'Your privacy settings changed. Please ask again.':'The answer was interrupted. Your question is still here; please try again.'})}
  finally{request.signal.removeEventListener('abort',stop);if(!cancelled)controller.close()}
 },cancel(){cancelled=true;abort.abort();upstream.cancel?.().catch(()=>{})}});
 return new Response(stream,{headers:{...headers,'Content-Type':'text/event-stream; charset=utf-8','Cache-Control':'no-store, private','X-Accel-Buffering':'no','X-Content-Type-Options':'nosniff'}});
}
