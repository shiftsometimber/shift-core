const HOSTS=new Set(['shiftsometimber.co.uk','www.shiftsometimber.co.uk']);
// Run at the public entry point, before guide/sitemap fallbacks can handle HTTP.
export function publicHttpsRedirect(request){
 const url=new URL(request.url);
 if(url.protocol!=='http:'||!HOSTS.has(url.hostname)||!['GET','HEAD'].includes(request.method))return null;
 url.protocol='https:';
 return Response.redirect(url.href,301);
}
