import {passportClient} from './client.mjs';
export const passportCSS=`
.hp-v1,.hp-arrival,.hp-draft-choice{box-sizing:border-box;color:#E7E3DA;background:#050505;font:16px/1.6 Arial,Helvetica,sans-serif;overflow-wrap:anywhere}
.hp-v1 *,.hp-arrival *,.hp-draft-choice *{box-sizing:border-box}
.hp-v1{margin:28px 0;min-width:0;max-width:100%}.hp-card,.hp-arrival,.hp-draft-choice{border:1px solid #707762;border-radius:16px;padding:24px}
.hp-card>summary{cursor:pointer;list-style:revert}.hp-card>summary span,.hp-card>summary small{display:block}.hp-card>summary span,.hp-source{font-size:12px;letter-spacing:.08em}.hp-card>summary strong{display:block;font-size:clamp(23px,4vw,34px);line-height:1.2;margin:8px 0}
.hp-v1 h3{font-size:25px;line-height:1.2;margin:0 0 14px}.hp-v1 h4{font-size:18px;margin:8px 0}.hp-v1 p{margin:10px 0}.hp-limits{border-left:3px solid #707762;padding:12px 16px}.hp-section{padding:28px 0;border-top:1px solid #707762}.hp-section:first-of-type{margin-top:20px}.hp-pairs{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin:18px 0}.hp-pairs div{padding:14px;background:#E7E3DA;color:#050505;border-radius:10px}.hp-pairs dt{font-size:13px}.hp-pairs dd{margin:0;font-size:18px;font-weight:700}.hp-actions{display:flex;flex-wrap:wrap;gap:12px;margin:18px 0}.hp-v1 button,.hp-v1 .hp-actions a,.hp-arrival button{display:inline-block;border:1px solid #707762;border-radius:10px;min-height:44px;padding:10px 16px;background:#E7E3DA;color:#050505;font:700 15px/1.4 Arial;cursor:pointer;text-decoration:none;max-width:100%}.hp-v1 button:disabled{opacity:.55;cursor:default}.hp-v1 a{color:#E7E3DA}.hp-v1 :focus-visible,.hp-arrival :focus-visible,.hp-draft-choice :focus-visible{outline:3px solid #707762;outline-offset:4px}.hp-confirm,.hp-draft-choice label{display:flex;gap:12px;align-items:flex-start}.hp-confirm input,.hp-draft-choice input{flex:0 0 auto;width:22px;height:22px;margin-top:3px}.hp-record{border:1px solid #707762;border-radius:12px;padding:18px;margin:16px 0}.hp-form{padding:20px;background:#E7E3DA;color:#050505;border-radius:12px;margin:18px 0}.hp-form label{display:block;font-weight:700}.hp-form-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}.hp-form input,.hp-form select,.hp-form textarea{width:100%;min-width:0;max-width:100%;min-height:44px;padding:10px;border:1px solid #707762;border-radius:8px;background:#E7E3DA;color:#050505;font:16px/1.4 Arial}.hp-form textarea{min-height:90px}.hp-table{max-width:100%;overflow:auto}.hp-table table{width:100%;border-collapse:collapse;text-align:left}.hp-table td,.hp-table th{padding:10px;border-bottom:1px solid #707762;vertical-align:top}.hp-arrival{margin:16px 0}.hp-arrival button{margin-top:10px}.hp-draft-choice{margin-top:20px;text-align:left}.hp-draft-choice p{font-size:13px;line-height:1.5}.hp-v1 [role=alert]{font-weight:700;border-left:3px solid #707762;padding-left:12px}
@media(max-width:560px){.hp-card,.hp-arrival,.hp-draft-choice{padding:16px}.hp-form-grid{grid-template-columns:1fr}.hp-pairs{gap:8px}.hp-pairs div{padding:10px}.hp-pairs dd{font-size:16px}.hp-v1 h3{font-size:22px}.hp-form{padding:14px}.hp-actions>*{flex:1 1 160px}}
`;
const privateHeaders={'Cache-Control':'no-store, must-revalidate','X-Robots-Tag':'noindex, nofollow','X-Content-Type-Options':'nosniff'};
export function passportAssets(request,env){
 if(env.HEALTH_PASSPORT_V1_ENABLED!=='true'||env.MEMBER_EXPERIENCE_V1_ENABLED!=='true'||!['GET','HEAD'].includes(request.method))return null;
 const path=new URL(request.url).pathname;
 const asset=path==='/assets/member-experience/passport.js'?[passportClient,'text/javascript']:path==='/assets/member-experience/passport.css'?[passportCSS,'text/css']:null;
 return asset?new Response(request.method==='HEAD'?null:asset[0],{headers:{...privateHeaders,'Content-Type':asset[1]+'; charset=utf-8'}}):null;
}
export function patchStartHereClient(source){
 // Exact current-source edit: retain matching/navigation, remove raw answers
 // from the old unconsented medicine-match cache. No fuzzy replacement.
 const target='JSON.stringify({recommended,alternative,answers})';
 if(source.split(target).length-1!==2)throw Error('start_here_source_drift');
 return source.split(target).join('JSON.stringify({recommended,alternative})');
}
export async function withPassportPresentation(request,env,response){
 if(env.HEALTH_PASSPORT_V1_ENABLED!=='true'||env.MEMBER_EXPERIENCE_V1_ENABLED!=='true'||request.method!=='GET'||!response.ok)return response;
 const path=new URL(request.url).pathname.replace(/\.html$/,'');
 if(path!=='/start-here-v72.js'&&!['/start-here','/member/dashboard'].includes(path))return response;
 const type=response.headers.get('Content-Type')||'';
 if(path==='/start-here-v72.js'?!/javascript/i.test(type):!/text\/html/i.test(type))return response;
 let text=await response.text();
 if(path==='/start-here-v72.js')text=patchStartHereClient(text);
 else if(!text.includes('data-health-passport-client'))text=text.replace('</head>','<link rel="stylesheet" href="/assets/member-experience/passport.css"><script defer data-health-passport-client src="/assets/member-experience/passport.js"></script></head>');
 const headers=new Headers(response.headers);for(const key of ['ETag','Last-Modified','Content-Length','Content-Encoding'])headers.delete(key);headers.set('Cache-Control','no-store, must-revalidate');
 return new Response(text,{status:response.status,headers});
}
