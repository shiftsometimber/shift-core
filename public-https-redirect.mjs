const HOSTS=new Set(['shiftsometimber.co.uk','www.shiftsometimber.co.uk']);
const ORFORGLIPRON_GUIDE=/^\/guides\/orforglipron-uk-guide(?:\.html)?\/?$/;
// Run at the public entry point, before guide/sitemap fallbacks can handle HTTP.
export function publicHttpsRedirect(request){
 const url=new URL(request.url);
 if(!HOSTS.has(url.hostname)||!['GET','HEAD'].includes(request.method))return null;
 if(ORFORGLIPRON_GUIDE.test(url.pathname)){
  url.protocol='https:';url.hostname='shiftsometimber.co.uk';url.port='';url.pathname='/foundayo';
  return Response.redirect(url.href,301);
 }
 if(url.protocol!=='http:')return null;
 url.protocol='https:';
 return Response.redirect(url.href,301);
}
