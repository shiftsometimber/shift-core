import assert from 'node:assert/strict';
// Cache API objects are local to the responding data centre, not global:
// https://developers.cloudflare.com/workers/runtime-apis/cache/#background
export async function readSiteAnswer(response,{startedAt=Date.now(),requireStream=false,sources}={}){
 assert.equal(response.status,200);
 const edge=response.headers.get('cf-ray')?.split('-').at(-1);assert.match(edge||'',/^[A-Z]{3}$/,'Missing response data-centre receipt');
 const streamed=(response.headers.get('content-type')||'').includes('text/event-stream');
 if(requireStream)assert(streamed,'Fresh answer must stream');
 let value,firstTextMs;
 if(streamed){
  let pending='';const decoder=new TextDecoder();
  for await(const chunk of response.body){pending+=decoder.decode(chunk,{stream:true});let end;
   while((end=pending.indexOf('\n\n'))>=0){const frame=pending.slice(0,end);pending=pending.slice(end+2);const event=frame.match(/^event: (.+)$/m)?.[1],raw=frame.match(/^data: (.+)$/m)?.[1];if(!raw)continue;
    const item=JSON.parse(raw);assert.notEqual(event,'error','Live stream interrupted');if(event==='delta'&&item.text?.trim()&&firstTextMs===undefined)firstTextMs=Date.now()-startedAt;if(event==='done')value=item;
   }
  }
  assert(firstTextMs!==undefined,'Stream emitted no text');assert.equal(value?.delivery,'streamed');
 }else{assert.match(response.headers.get('content-type')||'',/application\/json/);value=await response.json();assert.equal(value.delivery,'cached_public');}
 assert.equal(value?.ok,true);assert.equal(value.mode,'grounded');assert.equal(value.journeyUsed,false);
 assert(typeof value.answer==='string'&&value.answer.length>30&&value.answer.includes('[1]'),'Missing substantive cited public answer');
 assert.equal(value.sources?.length,1);assert.equal(value.sources[0].url,'https://shiftsometimber.co.uk/life-back');assert.equal(value.sources[0].reviewState,'published_site');
 if(sources)assert.deepEqual(value.sources,sources,'Published evidence changed during proof');
 return {...value,edge,firstTextMs,elapsedMs:Date.now()-startedAt};
}
export function observeEdgeAnswer(answers,value){
 const previous=answers.get(value.edge);
 if(value.delivery==='cached_public'&&previous)assert.equal(value.answer,previous.answer,'Cached answer changed within responding data centre '+value.edge);
 if(value.delivery==='streamed'||!previous)answers.set(value.edge,value);
 return value.delivery==='cached_public'&&Boolean(previous);
}
