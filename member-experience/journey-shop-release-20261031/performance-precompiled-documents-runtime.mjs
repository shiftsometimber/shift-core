// Build-proved public markup only. Session identity and private APIs stay with the existing owner.
const hosts=new Set(['shiftsometimber.co.uk','www.shiftsometimber.co.uk']);
const routes=new Map([
 ['/member/dashboard?view=app','shift-hq-member-comms-20261023'],
 ['/member/dashboard','shift-hq-member-comms-20261023'],
 ['/member/dashboard?timber=support','shift-hq-member-comms-20261023'],
 ['/member/dashboard?timber=stuff','shift-hq-member-comms-20261023'],
 ['/member/grub','shift-programme-member-20261023'],
 ['/member/fit','shift-programme-member-20261023']
]);
const ignored=new Set(['date','cf-ray','server','server-timing','alt-svc','nel','report-to','connection','transfer-encoding','content-length','content-encoding','etag','last-modified']);
export function wrapPrecompiledMemberDocuments(original,manifest,owner,{enabled=false}={}){
 if(manifest?.format!==1||manifest?.proof!=='EXACT_CURRENT_MEMBER_DOCUMENT_PRECOMPILATION_PROOF'||manifest?.verified!==true)throw Error('Unproved member document manifest');
 if(!Array.isArray(manifest.sourceOwners)||!manifest.sourceOwners.some(s=>s.name===owner&&s.version))throw Error('Missing source ownership');
 function variant(entry){
  if(typeof entry.html!=='string'||!/<!doctype html>/i.test(entry.html)||!/^[a-f0-9]{64}$/.test(entry.sha256))throw Error('Invalid member document');
  const headers=new Headers(entry.headers);if(!headers.get('Content-Type')?.includes('text/html'))throw Error('Non-HTML member document');
  const cookie=headers.get('Set-Cookie');
  if(cookie&&cookie!=='shift_app_view=1; Path=/member; Secure; HttpOnly; SameSite=Lax; Max-Age=2592000')throw Error('A private cookie must never be embedded in a public template');
  for(const key of ignored)headers.delete(key);
  headers.set('Cache-Control','no-store, private');
  const vary=new Set((headers.get('Vary')||'').split(',').map(v=>v.trim()).filter(Boolean));vary.add('Cookie');headers.set('Vary',[...vary].join(', '));
  headers.set('X-My-Timber-Document-Delivery','precompiled-20261103');
  return {html:entry.html,headers:[...headers]};
 }
 const documents=new Map();
 for(const [key,entry]of Object.entries(manifest.documents||{})){
  if(routes.get(key)!==entry.owner)throw Error('Unexpected member document route');if(entry.owner!==owner)continue;
  const base=variant(entry);documents.set(key,{base,app:entry.appView?variant(entry.appView):base});
 }
 return {...original,async fetch(request,env,ctx){
  const u=new URL(request.url);
  if(request.method!=='GET'||u.protocol!=='https:'||!hosts.has(u.hostname)||enabled!==true||env.MY_TIMBER_V6_RELEASE_ENABLED!=='true'||env.WORK_V1_ENABLED==='true'||env.PROGRAMME_V1_ENABLED==='true'||request.headers.get('X-My-Timber-Profile-Original')==='1'||request.headers.has('Authorization'))return original.fetch(request,env,ctx);
  const document=documents.get(u.pathname+u.search);if(!document)return original.fetch(request,env,ctx);
  // Match the existing public presentation preference exactly; no session token is used as a cache key or retained.
  const app=/(?:^|;\s*)shift_app_view=1(?:;|$)/.test(request.headers.get('Cookie')||''),entry=app?document.app:document.base;
  return new Response(entry.html,{status:200,headers:entry.headers});
 }};
}
