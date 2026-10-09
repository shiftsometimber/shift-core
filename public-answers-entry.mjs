import {wrapAnswerDepthWorker,ANSWER_DEPTH_ADDITIONS} from './public-seo-answer-depth.mjs';
export default wrapAnswerDepthWorker({
 async fetch(request,env){
  const url=new URL(request.url);
  if(url.hostname.endsWith('.workers.dev')){
   if(url.pathname==='/__answer-depth-preview'){
    const addition=ANSWER_DEPTH_ADDITIONS.find(x=>x.path===url.searchParams.get('path'))||ANSWER_DEPTH_ADDITIONS[0];
    const width=url.searchParams.get('width')==='1280'?1280:390;
    const frameUrl=addition.path+'#'+addition.id;
    return new Response('<!doctype html><html lang="en"><head><meta name="viewport" content="width=device-width,initial-scale=1"><title>SST approved answer layout check</title><style>body{margin:12px;font:16px system-ui;background:#ddd;color:#111}iframe{display:block;width:'+width+'px;height:780px;border:1px solid #555;background:#fff}a{margin-right:20px}</style></head><body><p>Preview check: '+width+' CSS pixels. Existing page inside a responsive frame.</p><p><a href="?path='+addition.path+'&width=390">390 pixels</a><a href="?path='+addition.path+'&width=1280">1280 pixels</a></p><iframe title="Approved page layout" src="'+frameUrl+'"></iframe></body></html>',{headers:{'content-type':'text/html; charset=utf-8','cache-control':'no-store','x-robots-tag':'noindex'}});
   }
   url.hostname='shiftsometimber.co.uk';url.protocol='https:';url.port='';
   request=new Request(url,request);
  }
  return env.CORE.fetch(request);
 }
});
