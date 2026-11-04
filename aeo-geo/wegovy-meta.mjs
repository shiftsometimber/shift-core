// Public, metadata-only wrap for the existing exact Wegovy article owner.
// No clinical content, account APIs, routes, source CMS or data are changed.
export const WEGOVY_META=Object.freeze({
 path:'/articles/wegovy-eligibility-uk',
 oldTitle:'Wegovy eligibility for UK men: NHS BMI rules and the two year cap',
 oldDescription:'See who can get Wegovy in the UK, how NHS BMI thresholds and referrals work, what private clinics check, and key treatment limits and safety points.',
 title:'Wegovy BMI Requirements UK: NHS vs Private | SHIFT',
 description:'What BMI do you need for Wegovy in the UK? Understand NHS eligibility, private assessments, and the health factors a qualified prescriber considers.'
});
export const MARKER='approved-wegovy-meta-20261104';
export function repairWegovyMeta(html,path){
 const c=WEGOVY_META;if(path!==c.path)return html;
 const pairs=[
  ['<title>'+c.oldTitle+'</title>','<title>'+c.title+'</title>'],
  ['<meta name="description" content="'+c.oldDescription+'">','<meta name="description" content="'+c.description+'">'],
  ['<meta property="og:title" content="'+c.oldTitle+'">','<meta property="og:title" content="'+c.title+'">'],
  ['<meta property="og:description" content="'+c.oldDescription+'">','<meta property="og:description" content="'+c.description+'">'],
  ['<meta name="twitter:title" content="'+c.oldTitle+'">','<meta name="twitter:title" content="'+c.title+'">'],
  ['<meta name="twitter:description" content="'+c.oldDescription+'">','<meta name="twitter:description" content="'+c.description+'">']
 ];
 if(!pairs.every(([old,next])=>html.split(old).length===2&&!html.includes(next)))return html;
 for(const [old,next] of pairs)html=html.replace(old,next);
 return html;
}
export function withWegovyMeta(original){
 return {...original,async fetch(request,...args){
  const url=new URL(request.url);
  if(request.method!=='GET'||url.origin!=='https://shiftsometimber.co.uk'||url.pathname!==WEGOVY_META.path)
   return original.fetch(request,...args);
  const response=await original.fetch(request,...args);
  if(response.status!==200||!response.headers.get('Content-Type')?.includes('text/html'))return response;
  const before=await response.clone().text(),after=repairWegovyMeta(before,url.pathname);
  if(after===before)return response;
  const headers=new Headers(response.headers);
  for(const h of ['Content-Length','Content-Encoding','ETag','Content-MD5','Digest','Last-Modified'])headers.delete(h);
  headers.set('X-Shift-Wegovy-Metadata',MARKER);
  return new Response(after,{status:response.status,statusText:response.statusText,headers});
 }};
}
