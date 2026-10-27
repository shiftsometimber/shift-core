const oldRule="form.elements.password.pattern=registering?'(?=.*[A-Z])(?=.*[\\\\p{P}\\\\p{S}]).{10,}':'';";
const fixedRule="if(registering)form.elements.password.pattern='(?=.*[A-Z])(?=.*[\\\\p{P}\\\\p{S}]).{10,}';else form.elements.password.removeAttribute('pattern');";
export function repairLoginHTML(html){
 const count=html.split(oldRule).length-1;
 if(count!==1)return {html,changed:false,matched:html.includes(fixedRule)};
 return {html:html.replace(oldRule,fixedRule),changed:true,matched:true};
}
export async function repairLoginResponse(request,response){
 const u=new URL(request.url);
 if(request.method!=='GET'||u.pathname!=='/member-login'||!['shiftsometimber.co.uk','www.shiftsometimber.co.uk'].includes(u.hostname)||response.status!==200||!response.headers.get('Content-Type')?.includes('text/html'))return response;
 const repaired=repairLoginHTML(await response.clone().text());
 if(!repaired.changed)return response;
 const headers=new Headers(response.headers);for(const name of ['Content-Length','Content-Encoding','ETag'])headers.delete(name);
 return new Response(repaired.html,{status:response.status,statusText:response.statusText,headers});
}
