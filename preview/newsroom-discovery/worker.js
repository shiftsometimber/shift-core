export default {async fetch(request,env){
 if(!['GET','HEAD'].includes(request.method))return new Response('Read-only preview',{status:405});
 const response=await env.ASSETS.fetch(request);const headers=new Headers(response.headers);
 headers.set('X-Robots-Tag','noindex, nofollow');headers.set('Cache-Control','no-store');
 headers.set('Content-Security-Policy',"default-src 'self'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; connect-src 'none'; img-src 'none'; frame-ancestors 'none'; form-action 'none'; base-uri 'none'");
 return new Response(response.body,{status:response.status,headers});
}};
