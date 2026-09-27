import navigationPreview from '../public-navigation/worker.mjs';
export default {async fetch(request,env){
 const url=new URL(request.url);
 if(!['GET','HEAD'].includes(request.method))return new Response('Read-only preview',{status:405});
 if(['/','/shift-newsroom','/report.json'].includes(url.pathname)){
  url.pathname=url.pathname==='/report.json'?'/report.json':'/index.html';
  const response=await env.ASSETS.fetch(new Request(url,{method:request.method}));
  const headers=new Headers(response.headers);headers.set('X-Robots-Tag','noindex, nofollow');headers.set('Cache-Control','no-store');
  return new Response(response.body,{status:response.status,headers});
 }
 return navigationPreview.fetch(request);
}};
