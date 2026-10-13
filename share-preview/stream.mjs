// Deliver the same two metadata substitutions without waiting for the full HTML.
// A missing, duplicate or unexpected sharing tag errors the response stream.
export function streamRootShareImage(body,replaceRootShareImage){
 const reader=body?.getReader(),decoder=new TextDecoder(),encoder=new TextEncoder(),found={};
 let pending='',finished=false;
 const encode=text=>encoder.encode(text);
 function consume(final){
  const out=[];
  for(;;){
   const start=pending.search(/<meta\b/i);
   if(start<0){
    let cut=final?pending.length:Math.max(0,pending.length-5);
    // Keep UTF-16 surrogate pairs together before encoding each output chunk.
    if(cut>0&&/[\uD800-\uDBFF]/.test(pending[cut-1]))cut--;
    out.push(pending.slice(0,cut));pending=pending.slice(cut);break;
   }
   const end=pending.indexOf('>',start);
   if(end<0){out.push(pending.slice(0,start));pending=pending.slice(start);if(final){out.push(pending);pending='';}break;}
   const tag=pending.slice(start,end+1),key=tag.match(/\b(?:property|name)\s*=\s*["'](og:image|twitter:image)["']/i)?.[1]?.toLowerCase();
   let changed=tag;
   if(key){
    found[key]=(found[key]||0)+1;if(found[key]!==1)throw Error('Root sharing metadata must have exactly one image per platform');
    // Use the unchanged approved parser for each source/content substitution.
    const other=key==='og:image'?'twitter:image':'og:image',dummy='<meta name="'+other+'" content="https://shiftsometimber.co.uk/assets/og-default.jpg">';
    const converted=replaceRootShareImage(tag+dummy),convertedDummy=replaceRootShareImage('<meta name="'+key+'" content="https://shiftsometimber.co.uk/assets/og-default.jpg">'+dummy).split('>').slice(1).join('>');
    changed=converted.slice(0,converted.length-convertedDummy.length);
   }
   out.push(pending.slice(0,start),changed);pending=pending.slice(end+1);
  }
  if(final&&(found['og:image']!==1||found['twitter:image']!==1))throw Error('Root sharing metadata must have exactly one image per platform');
  return out.join('');
 }
 return new ReadableStream({
  async pull(controller){
   if(finished)return;
   try{
    for(;;){
     const next=reader?await reader.read():{done:true};pending+=decoder.decode(next.value,{stream:!next.done});
     const text=consume(next.done);if(text)controller.enqueue(encode(text));
     if(next.done){finished=true;controller.close();reader?.releaseLock();return;}
     if(text)return;
    }
   }catch(error){finished=true;controller.error(error);try{await reader?.cancel(error);}finally{reader?.releaseLock();}}
  },
  async cancel(reason){finished=true;try{await reader?.cancel(reason);}finally{reader?.releaseLock();}}
 });
}
