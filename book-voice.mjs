import edits from './editorial/book-voice/edits.json' with {type:'json'};

// Exact owner-approved editorial changes. No DOM scripts, API writes or account logic.
export const BOOK_VOICE_EDITS=edits;
const assetRoutes={
 '/assets/member-experience/checkin-followup.mjs':'member-experience/checkin-followup-client.mjs',
 '/assets/member-experience/grub.mjs':'member-experience/grub-runtime.mjs',
 '/assets/member-experience/fit.mjs':'member-experience/fit-runtime.mjs'
};
export function bookVoiceEditsFor(path,source=''){
 path=path.replace(/\.html$/,'').replace(/\/+$/,'')||'/';
 return edits.filter(e=>assetRoutes[path]?e.source===assetRoutes[path]:
  e.kind==='news'?path.startsWith('/medicine-news/'):
  e.source==='public-startup-stability.mjs'?source.includes('class="sst-service-bridge"'):
  e.route===path);
}
export function applyBookVoiceCopy(path,source){
 let result=source;
 for(const e of bookVoiceEditsFor(path,source)){
  // Source and rendered counts are checked before release. If an upstream page
  // later changes, retain its content rather than guessing another replacement.
  if(result.split(e.old).length===2&&!result.includes(e.new))result=result.replace(e.old,e.new);
 }
 return result;
}
export function restoreBookVoiceCopy(path,source){
 let result=source;
 for(const e of bookVoiceEditsFor(path,source).reverse()){
  const count=result.split(e.new).length-1;
  if(count){if(count!==1||result.includes(e.old))throw Error('Mixed or repeated reviewed book wording: '+path);result=result.replace(e.new,e.old);}
 }
 return result;
}
export async function withBookVoice(request,response){
 const type=response.headers.get('Content-Type')||'',path=new URL(request.url).pathname;
 if(request.method!=='GET'||response.status!==200||(!type.includes('text/html')&&!(assetRoutes[path]&&/javascript/.test(type))))return response;
 const before=await response.text(),after=applyBookVoiceCopy(path,before);
 const headers=new Headers(response.headers);
 if(after!==before){for(const name of ['Content-Length','Content-Encoding','ETag','Last-Modified'])headers.delete(name);headers.set('X-Shift-Book-Voice','20261002');}
 return new Response(after,{status:response.status,statusText:response.statusText,headers});
}
