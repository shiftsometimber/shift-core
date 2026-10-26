const PATH='/treatment-centre/medicines-watch';
const detailed=new Set(['mounjaro','wegovy-injection','wegovy-tablet','orlistat','foundayo','retatrutide']);
export function repairWatchLinks(html){
 return html.replace(/(<section\b[^>]*\bid=["']watch-evidence-desk["'][^>]*>)([\s\S]*?)(<\/section>)/i,(all,start,body,end)=>start+body.replace(/href=(["'])#industry-([a-z0-9-]+)\1/gi,(match,quote,id)=>'href='+quote+PATH+'#'+(detailed.has(id)?id:'industry-'+id)+quote)+end);
}
export async function repairWatchResponse(request,response){
 const u=new URL(request.url);
 if(request.method!=='GET'||!['shiftsometimber.co.uk','www.shiftsometimber.co.uk'].includes(u.hostname)||!['/treatment-centre/medicines-watch','/treatment-centre/medicines-watch/'].includes(u.pathname)||response.status!==200||!(response.headers.get('Content-Type')||'').includes('text/html'))return response;
 const before=await response.text(),after=repairWatchLinks(before);
 const headers=new Headers(response.headers);
 if(after!==before){for(const k of ['Content-Length','Content-Encoding','ETag','Last-Modified'])headers.delete(k);headers.set('Cache-Control','private, no-store');headers.set('X-Shift-Watch-Links','20261026');}
 return new Response(after,{status:response.status,statusText:response.statusText,headers});
}
