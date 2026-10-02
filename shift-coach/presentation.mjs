import {client} from './ui.mjs';
export const assetPath='/assets/shift-coach.mjs';
export const styles=String.raw`
#shiftCoach{box-sizing:border-box;margin:0 0 22px;padding:24px;border:1px solid #707762;border-radius:16px;background:#e7e3da;color:#050505;font:inherit;line-height:1.5;scroll-margin-top:110px}
body[data-shift-coach-session] #previewMember{display:block!important}
body[data-shift-coach-session] #previewAuth{display:none!important}
#shiftCoach[hidden]{display:none!important}#shiftCoach *{box-sizing:border-box}
#shiftCoach :is(h2,h3,p,small,label,summary,li,strong,a){color:#050505!important;-webkit-text-fill-color:#050505!important}
#shiftCoach h2{font:800 24px/1.2 Arial,sans-serif!important;margin:8px 0 12px}#shiftCoach h3{font:700 18px/1.3 Arial,sans-serif!important}
#shiftCoach .coach-kicker{font-size:12px;font-weight:800;letter-spacing:.08em}#shiftCoach .coach-reason{border-left:3px solid #707762;padding-left:12px}
#shiftCoach :is(input,select){display:block;width:100%;max-width:100%;background:#fff;color:#050505!important;font:inherit;min-height:44px;border:1px solid #707762;border-radius:8px;padding:10px;margin:5px 0 12px}
#shiftCoach input[type=checkbox]{display:inline-block;width:20px;height:20px;min-height:20px;margin:0 8px 0 0;vertical-align:middle}
#shiftCoach :is(button,.coach-button){font:700 14px/1.3 Arial,sans-serif!important;cursor:pointer;border:1px solid #050505!important;border-radius:8px;padding:12px 16px;min-height:44px;max-width:100%;background:#050505!important;color:#e7e3da!important;-webkit-text-fill-color:#e7e3da!important;text-decoration:none}
#shiftCoach button.secondary{background:transparent!important;color:#050505!important;-webkit-text-fill-color:#050505!important}#shiftCoach button:disabled{opacity:.55;cursor:wait}
#shiftCoach .coach-buttons{display:flex;flex-wrap:wrap;gap:8px;margin:14px 0}#shiftCoach details{padding:12px 0;border-top:1px solid #b4b7ac}#shiftCoach summary{cursor:pointer;min-height:44px;font-weight:700;padding:8px 0}
#shiftCoach fieldset{border:0;padding:0;margin:12px 0}#shiftCoach label{display:block;margin:8px 0}#shiftCoach :focus-visible{outline:3px solid #707762;outline-offset:3px}
body[data-app-tool]:not([data-app-tool="today"]) #shiftCoach{display:none!important}
#panel-today[data-shift-coach-enabled] .mtm-next{display:none!important}
@media(max-width:500px){#shiftCoach{padding:18px}#shiftCoach .coach-buttons>*{width:100%}}
`;
const markup='<section id="shiftCoach" aria-label="Shift AI coaching" hidden><p class="coach-kicker">SHIFT AI · ONE THING FOR TODAY</p><div data-coach-content></div><p data-coach-status role="status" aria-live="polite"></p></section>';
export function coachingAsset(request){if(!['GET','HEAD'].includes(request.method)||new URL(request.url).pathname!==assetPath)return null;return new Response(request.method==='HEAD'?null:client,{headers:{'Content-Type':'text/javascript; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});}
export async function withCoaching(request,response,seed=null){
 if(request.method!=='GET'||!/^\/member\/dashboard(?:\.html)?$/.test(new URL(request.url).pathname)||response.status!==200||!response.headers.get('Content-Type')?.includes('text/html'))return response;
 const html=await response.clone().text();
 if(html.includes('id="shiftCoach"')||!/<(?:section|div)\b[^>]*id="todayActions"/.test(html))return response;
 // A fresh session/consent-checked snapshot avoids a second serial request.
 // JSON is inert and escaped so a confirmed string can never close its script.
 const initial=seed?'<script type="application/json" id="shiftCoachInitial">'+JSON.stringify(seed).replace(/</g,'\\u003c').replace(/>/g,'\\u003e').replace(/&/g,'\\u0026')+'</script>':'';
 // The seed is fetched through the original member session and current consent.
 // Expose the authenticated shell immediately; its original session/bootstrap
 // still loads the other tools and every mutation keeps its original checks.
 let prepared=seed?html.replace(/<body\b([^>]*)>/, '<body$1 data-shift-coach-session>').replace(/<section\b[^>]*\bid=["']previewMember["'][^>]*>/i,tag=>tag.replace(/\shidden(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+))?/i,'')):html;
 const changed=prepared.replace('</head>','<style data-shift-coach-styles>'+styles+'</style></head>').replace(/(<(?:section|div)\b[^>]*id="todayActions"[^>]*>)/,'$1'+markup+initial+'<script data-shift-coach-client>'+client.replace(/<\/script/gi,'<\\/script')+'</script>');
 const headers=new Headers(response.headers);headers.set('Cache-Control','no-store, private');headers.set('Vary','Cookie, Accept-Encoding');
 // Start the same existing stylesheets with the document headers, before the
 // browser reaches parser-blocking scripts. No scripts or tracking are moved.
 const preloads=[...html.matchAll(/<link\b[^>]*rel=["']stylesheet["'][^>]*href=["']([^"']+)["'][^>]*>/gi)].map(m=>m[1]).filter(href=>/^\/[A-Za-z0-9/_.,=?&%+-]+$/.test(href)).slice(0,8).map(href=>'<'+href+'>; rel=preload; as=style');
 if(preloads.length)headers.set('Link',[headers.get('Link'),...preloads].filter(Boolean).join(', '));
 for(const h of ['Content-Length','Content-Encoding','ETag','Last-Modified'])headers.delete(h);
 // Compress the private dashboard at its source so the prepared action does
 // not depend on an assumed CDN compression setting. Never gzip twice.
 const gzip=(request.cf?.clientAcceptEncoding??request.headers.get('Accept-Encoding')??'').split(',').some(value=>{const m=value.trim().match(/^gzip(?:\s*;\s*q=(0(?:\.\d+)?|1(?:\.0+)?))?$/i);return m&&Number(m[1]??1)>0;});
 if(gzip){headers.set('Content-Encoding','gzip');headers.set('Vary','Cookie, Accept-Encoding');return new Response(new Response(changed).body.pipeThrough(new CompressionStream('gzip')),{status:response.status,headers,encodeBody:'manual'});}
 return new Response(changed,{status:response.status,headers});
}
