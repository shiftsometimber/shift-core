const ORIGIN='https://shiftsometimber.co.uk';
export const APPROVED_LINK_EDITS={
 '/mens-mental-health':['<a href="/mental-health/urgent-help">urgent support guide for your nation</a>','<a href="/mental-health/urgent-mental-health-help">urgent support guide for your nation</a>'],
 '/medicine-news/cagrilintide-and-semaglutide-clinical-trial-update':['<section><h2>Sources and evidence</h2>','<p>For the wider picture, read our <a href="/guides/cagrisema-uk-guide">CagriSema UK guide: availability, trial evidence and alternatives</a>.</p><section><h2>Sources and evidence</h2>']
};
export function repairApprovedLinks(path,html){const pair=APPROVED_LINK_EDITS[path];if(!pair||html.includes(pair[1])||html.split(pair[0]).length!==2)return html;return html.replace(pair[0],pair[1]);}
export function preserveApprovedLinks(path,input){const pair=APPROVED_LINK_EDITS[path];if(!pair)return input;const s=input.toString('utf8');const out=s.split(pair[1]).length===2?s.replace(pair[1],pair[0]):s;return input instanceof Uint8Array?input.constructor.from(new TextEncoder().encode(out)):out;}
export async function withApprovedLinkRepairs(response,request){
 const u=new URL(request.url);if(u.origin!==ORIGIN||request.method!=='GET'||response.status!==200||!response.headers.get('Content-Type')?.includes('text/html')||!APPROVED_LINK_EDITS[u.pathname])return response;
 const before=await response.text(),after=repairApprovedLinks(u.pathname,before);const headers=new Headers(response.headers);if(after!==before){for(const n of ['Content-Length','ETag','Content-MD5','Digest'])headers.delete(n);headers.set('X-Shift-Approved-Link-Repairs','2026-10-07');}return new Response(after,{status:response.status,statusText:response.statusText,headers});
}
