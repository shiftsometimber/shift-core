import {client} from './ui.mjs';
import {serviceWorker} from './service-worker.mjs';

export const manifest={id:'/my-timber',name:'My Timber',short_name:'My Timber',description:'Your daily check-in, food, movement and progress with Shift Some Timber.',start_url:'/member/dashboard#today',scope:'/',display:'standalone',background_color:'#050505',theme_color:'#050505',lang:'en-GB',icons:[{src:'/assets/favicon.svg',sizes:'any',type:'image/svg+xml',purpose:'any'},{src:'/assets/apple-touch-icon.png',sizes:'180x180',type:'image/png',purpose:'any'}],shortcuts:[{name:'Today',url:'/member/dashboard#today'},{name:'Check in',url:'/member/check-in'}]};
export const styles=String.raw`
#myTimberApp{box-sizing:border-box;max-width:1120px;margin:8px auto;padding:16px 20px;border:1px solid #707762;border-radius:12px;background:#050505;color:#e7e3da;font:inherit;line-height:1.5;scroll-margin-top:110px}
/* The signed-out shell hides these links with visibility:hidden. Remove their
   reserved rows too, so the install CTA follows the header rather than a void. */
body:not(.member-ready):has(#myTimberApp) :is(.sst-portal-tabs,.sst-portal-tools){display:none!important}
#myTimberApp *{box-sizing:border-box}#myTimberApp [hidden]{display:none!important}
#myTimberApp summary{cursor:pointer;min-height:44px;display:flex;align-items:center;gap:12px;font-weight:700;color:#e7e3da}
#myTimberApp summary img{width:40px;height:40px}#myTimberApp :is(p,h2,label,a,small){color:#e7e3da!important}#myTimberApp h2{font-size:22px;margin:20px 0 8px}
#myTimberApp summary span{flex:1}#myTimberApp summary strong,#myTimberApp summary small{display:block}#myTimberApp summary small{font-size:14px;font-weight:400}#myTimberApp summary::after{content:'+';font-size:24px}#myTimberApp[open] summary::after{content:'−'}
#myTimberApp .pwa-steps{padding-left:24px}#myTimberApp .pwa-steps li{padding:5px 0}#myTimberApp .pwa-steps p{margin:4px 0 8px}
.my-timber-app-footer{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;max-width:1120px;margin:16px auto 0;padding:12px 16px;border-top:1px solid #707762;background:#050505;color:#e7e3da;font:inherit;line-height:1.5}.my-timber-app-footer span{display:flex;align-items:center;gap:10px}.my-timber-app-footer img{width:28px!important;height:28px!important;margin:0!important}.my-timber-app-footer a{display:inline-flex;align-items:center;min-height:44px;color:#e7e3da!important;text-decoration:underline!important}.my-timber-app-footer a:focus-visible{outline:2px solid #e7e3da;outline-offset:4px}
#myTimberApp button,#myTimberApp select{min-height:44px;border:1px solid #707762;border-radius:8px;padding:10px 14px;font:inherit;background:#e7e3da;color:#050505;margin:6px 8px 6px 0;max-width:100%}
#myTimberApp button:disabled{opacity:.6}#myTimberApp :is(button,select,a,summary):focus-visible{outline:3px solid #e7e3da;outline-offset:3px}
#myTimberApp label{display:block;margin:12px 0 4px}#myTimberApp [role=status]{min-height:24px}#myTimberApp a{text-decoration:underline}#myTimberApp .pwa-actions{display:flex;gap:8px;flex-wrap:wrap}
#pwaReminderSettings{box-sizing:border-box;max-width:920px;width:100%;margin:0 auto 32px;padding:24px;border:1px solid #707762;border-radius:16px;background:#050505;color:#e7e3da}
#pwaReminderSettings *{box-sizing:border-box}#pwaReminderSettings [hidden]{display:none!important}#pwaReminderSettings :is(h3,p,label,small){color:#e7e3da!important}
#pwaReminderSettings h3{font-size:21px;margin:0 0 8px}#pwaReminderSettings label{display:block;font-weight:700;margin:14px 0 6px}
#pwaReminderSettings select,#pwaReminderSettings button{min-height:44px;border:1px solid #707762;border-radius:8px;padding:10px 14px;font:inherit;margin:6px 8px 6px 0}
#pwaReminderSettings select{background:#e7e3da;color:#050505}#pwaReminderSettings button{background:#e7e3da;color:#050505;font-weight:700;cursor:pointer}
#pwaReminderSettings button:disabled,#pwaReminderSettings select:disabled{opacity:.6;cursor:not-allowed}
#pwaReminderSettings .pwa-actions{display:flex;gap:8px;flex-wrap:wrap}#pwaReminderSettings :is(button,select):focus-visible{outline:3px solid #e7e3da;outline-offset:3px}
#pwaReminderSummary{font-weight:700;margin:10px 0}#pwaReminderStatus{min-height:24px;margin-bottom:0}
@media(max-width:650px){#myTimberApp{margin:8px 12px;padding:14px}#myTimberApp .pwa-actions button{flex:1 1 150px}}
`;
export const card=`<details id="myTimberApp"><summary><img src="/assets/apple-touch-icon.png" alt="" width="40" height="40"><span><strong>Add My Timber to your phone</strong><small>Your check-ins, Grub, Fit and progress. One tap away.</small></span></summary><p>Your full My Timber account, opened from the S-in-a-circle icon. Same sign-in. Same saved progress.</p><ol class="pwa-steps"><li><strong>Add it to your home screen</strong><button type="button" id="pwaInstall">Add My Timber to home screen</button><p id="pwaInstallHelp" role="status"></p><noscript><p>On iPhone: open My Timber in Safari, choose Share, then Add to Home Screen and Open as Web App. On Android: use your browser’s Install app or Add to Home screen menu.</p></noscript></li><li><strong>Open the icon and sign in</strong><p>Use your existing My Timber account. Your check-ins, food, movement and progress stay together. <a href="/member-login?returnTo=%2Fmember%2Fdashboard%3Fsetup%3Dapp%23myTimberApp">Sign in to My Timber</a>.</p></li></ol></details>`;
export const reminderSettings=`<section id="pwaReminderSettings" aria-labelledby="pwaReminderHeading"><h3 id="pwaReminderHeading">Notifications</h3><p>Optional daily check-in reminder on this device. No health details appear in the notification.</p><p id="pwaReminderSummary">Checking notification settings…</p><div id="pwaReminderEditor"><label for="pwaHour">Reminder time — UK time</label><select id="pwaHour" disabled>${Array.from({length:15},(_,i)=>i+7).map(h=>`<option value="${h}"${h===19?' selected':''}>${String(h).padStart(2,'0')}:00</option>`).join('')}</select><small>A saved check-in stops that day’s reminder. Phone settings, Focus and connectivity can affect delivery.</small></div><div class="pwa-actions"><button type="button" id="pwaEnable" disabled>Turn on notifications</button><button type="button" id="pwaChange" hidden>Change</button><button type="button" id="pwaDisable" hidden>Turn off</button><button type="button" id="pwaRetry" hidden>Retry</button></div><p id="pwaReminderStatus" role="status" aria-live="polite"></p></section>`;
const headers={'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','X-Robots-Tag':'noindex, nofollow'};
export const footerLink='<div class="my-timber-app-footer" data-my-timber-app-footer><span><img src="/assets/apple-touch-icon.png" alt="" width="28" height="28">My Timber, one tap away.</span><a href="/member/dashboard?setup=app#myTimberApp">Add to your phone</a></div>';
export function pwaAssets(request){
 const path=new URL(request.url).pathname;
 const asset={'/manifest.webmanifest':[JSON.stringify(manifest),'application/manifest+json'],'/my-timber.webmanifest':[JSON.stringify(manifest),'application/manifest+json'],'/assets/my-timber-pwa.js':[client,'application/javascript'],'/assets/my-timber-pwa.css':[styles,'text/css'],'/shift-push-sw-v1.js':[serviceWorker,'application/javascript']}[path];
 if(!asset)return null;
 if(!['GET','HEAD'].includes(request.method))return new Response('Method not allowed',{status:405,headers:{...headers,Allow:'GET, HEAD'}});
 return new Response(request.method==='HEAD'?null:asset[0],{headers:{...headers,'Content-Type':asset[1]+'; charset=utf-8',...(path==='/shift-push-sw-v1.js'?{'Service-Worker-Allowed':'/'}:{})}});
}
export async function withPwa(request,response){
 const path=new URL(request.url).pathname;
 if(request.method!=='GET'||!response.ok||!response.headers.get('Content-Type')?.includes('text/html')||/^\/(?:v1|api|hq|admin)(?:\/|$)/.test(path))return response;
 const member=/^\/(?:my-timber|member-login|member-register|member\/[^/]+)(?:\.html)?\/?$/.test(path);
 let html=await response.text();
 if(!html.includes('</head>')||!html.includes('</body>'))return new Response(html,response);
 if(!member&&!html.includes('</footer>'))return new Response(html,response);
 if(!html.includes('data-my-timber-app-footer'))html=html.replace('</footer>',footerLink+'</footer>');
 if(member&&!html.includes('id="myTimberApp"')){
 html=html.replace(/<link\b(?=[^>]*\brel=["'](?:manifest|apple-touch-icon)["'])[^>]*>/gi,'').replace(/<meta\b(?=[^>]*\bname=["'](?:theme-color|apple-mobile-web-app-title)["'])[^>]*>/gi,'');
 html=html.replace('</head>','<link rel="manifest" href="/my-timber.webmanifest"><link rel="apple-touch-icon" href="/assets/apple-touch-icon.png"><meta name="apple-mobile-web-app-title" content="My Timber"><meta name="theme-color" content="#050505"><link rel="stylesheet" href="/assets/my-timber-pwa.css"></head>');
 // Keep the established header and the Today action order. The compact disclosure
 // sits before main rather than inside a renderer-owned panel that is replaced.
 html=html.replace(/<main\b/,card+'<main');
 if(/^\/member\/settings(?:\.html)?\/?$/.test(path)&&!html.includes('id="pwaReminderSettings"'))html=html.replace(/(<main\b[^>]*>)/,'$1'+reminderSettings);
 html=html.replace('</body>','<script defer src="/assets/my-timber-pwa.js"></script></body>');
 }else if(!html.includes('href="/assets/my-timber-pwa.css"'))html=html.replace('</head>','<link rel="stylesheet" href="/assets/my-timber-pwa.css"></head>');
 const h=new Headers(response.headers);for(const key of ['Content-Length','ETag','Last-Modified'])h.delete(key);h.set('Cache-Control','no-store');
 return new Response(html,{status:response.status,headers:h});
}
