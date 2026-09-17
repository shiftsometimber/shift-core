import {myTimberRedirect,publicTickerAsset,withPublicTicker,tickerClient,tickerAsset} from '../../public-navigation-policy.mjs';
const production='https://shiftsometimber.co.uk';
export default {async fetch(request){
 const url=new URL(request.url);
 if(!['GET','HEAD'].includes(request.method))return new Response('Read-only preview',{status:405});
 const local=myTimberRedirect(request)||publicTickerAsset(request);
 if(local)return local;
 if(url.pathname==='/__qa/ticker-feed')return Response.json({current:true,items:[{headline:'Preview headline one — fixture data',url:'/shift-newsroom'},{headline:'Preview headline two — fixture data',url:'/medicine-news'}]},{headers:{'X-Robots-Tag':'noindex, nofollow'}});
 if(url.pathname==='/__qa/ticker-demo.js')return new Response(tickerClient.replace("'/v1/radar/ticker'","'/__qa/ticker-feed'"),{headers:{'Content-Type':'application/javascript','X-Robots-Tag':'noindex, nofollow'}});
 if(url.pathname==='/__qa/ticker-demo'){
  const response=await withPublicTicker(request,new Response('<!doctype html><html><head><title>Ticker interaction fixture</title></head><body style="margin:0;background:#050505;color:#e7e3da"><header><p>Interaction test · fixture headlines only</p></header><main><h1>Pause and motion check</h1></main></body></html>',{headers:{'Content-Type':'text/html'}}));
  return new Response((await response.text()).replace(tickerAsset,'/__qa/ticker-demo.js'),{headers:{'Content-Type':'text/html','X-Robots-Tag':'noindex, nofollow'}});
 }
 if(url.pathname==='/__qa'){
  const width=Number(url.searchParams.get('width')),path=url.searchParams.get('path')||'/programme';
  if(![360,390,768,1024,1440].includes(width)||!/^\/[a-z0-9\/-]*$/.test(path))return new Response('Invalid preview',{status:400});
  return new Response(`<html><head><meta name="robots" content="noindex"></head><body style="margin:0;background:#050505"><iframe title="Responsive public-page preview" src="${path}" style="display:block;width:${width}px;height:1000px;border:0"></iframe></body></html>`,{headers:{'Content-Type':'text/html','X-Robots-Tag':'noindex, nofollow'}});
 }
 if(url.pathname.startsWith('/v1/')&&url.pathname!=='/v1/radar/ticker')return new Response('Read-only public preview',{status:404});
 // Deliberately omit browser credentials, production data bindings and all write methods.
 const upstream=await fetch(production+url.pathname+url.search,{method:request.method,headers:{Accept:request.headers.get('Accept')||'*/*'},redirect:'manual'});
 const headers=new Headers(upstream.headers);headers.delete('Set-Cookie');headers.set('X-Robots-Tag','noindex, nofollow');headers.set('Cache-Control','no-store');
 const location=headers.get('Location');if(location&&location.startsWith(production+'/'))headers.set('Location',url.origin+location.slice(production.length));
 return withPublicTicker(request,new Response(upstream.body,{status:upstream.status,headers}));
}};
