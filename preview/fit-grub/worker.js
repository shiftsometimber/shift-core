import assets from './assets.js';
const headers={'X-Robots-Tag':'noindex, nofollow','Cache-Control':'no-store','Content-Security-Policy':"default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'none'; form-action 'none'; frame-src 'self'",'X-Content-Type-Options':'nosniff'};
export default {async fetch(request,env){
  const url=new URL(request.url);
  if(!['GET','HEAD'].includes(request.method))return new Response('Preview is read-only',{status:405,headers});
  if(url.pathname==='/')return new Response(null,{status:302,headers:{...headers,Location:url.origin+'/member/fit'}});
  // The only binding is this preview's uploaded static files. No member or production services.
  if(/^\/catalogue-images\/[a-z0-9-]+\.webp$/.test(url.pathname)){
    const result=await env.PREVIEW_ASSETS.fetch(request);
    const response=new Response(request.method==='HEAD'?null:result.body,result);
    for(const [key,value] of Object.entries(headers))response.headers.set(key,value);
    return response;
  }
  const asset=assets[url.pathname];
  if(!asset)return new Response('Preview route not found',{status:404,headers});
  return new Response(request.method==='HEAD'?null:asset.body,{headers:{...headers,'Content-Type':asset.type+'; charset=utf-8'}});
}};
