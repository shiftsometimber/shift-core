// Add the support client to the existing member document without replacing its
// account, orders, public cover or retained programme handlers.
export async function withSupportMarkup(request,response){
 const path=new URL(request.url).pathname;
 if(request.method!=='GET'||!['/member/dashboard','/member/grub','/member/fit','/member/ask-timber','/member/life-back/support'].includes(path)||!response.ok||!response.headers.get('Content-Type')?.includes('text/html'))return response;
 let html=await response.text();
 if(path==='/member/dashboard'&&!html.includes('src="/assets/member-experience/programme-support-plan.mjs"'))html=html.replace('</body>','<link rel="stylesheet" href="/assets/member-experience/programme-support-plan.css"><script type="module" src="/assets/member-experience/programme-support-plan.mjs"></script></body>');
 if(!html.includes('src="/assets/member-experience/programme-shed.mjs"'))html=html.replace('</body>','<link rel="stylesheet" href="/assets/member-experience/programme-shed.css"><script type="module" src="/assets/member-experience/programme-shed.mjs"></script></body>');
 const h=new Headers(response.headers);for(const name of ['Content-Length','Content-Encoding','ETag','Last-Modified'])h.delete(name);h.set('Cache-Control','no-store, private');h.set('X-My-Timber-Support','v6');return new Response(html,{status:response.status,headers:h});
}
export function wrapSupportMarkup(original){return {...original,async fetch(request,env,ctx){return withSupportMarkup(request,await original.fetch(request,env,ctx));}};}
