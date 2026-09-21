import {client} from './ui.mjs';
import {serviceWorker} from './service-worker.mjs';

export const manifest={id:'/my-timber',name:'My Timber',short_name:'My Timber',description:'Your daily check-in, food, movement and progress with Shift Some Timber.',start_url:'/member/dashboard#today',scope:'/',display:'standalone',background_color:'#050505',theme_color:'#050505',lang:'en-GB',icons:[{src:'/assets/favicon.svg',sizes:'any',type:'image/svg+xml',purpose:'any'},{src:'/assets/apple-touch-icon.png',sizes:'180x180',type:'image/png',purpose:'any'}],shortcuts:[{name:'Today',url:'/member/dashboard#today'},{name:'Check in',url:'/member/check-in'}]};
export const styles=String.raw`
#myTimberApp{box-sizing:border-box;max-width:1120px;margin:20px auto;padding:16px 20px;border:1px solid #707762;border-radius:12px;background:#050505;color:#e7e3da;font:16px/1.5 Arial,sans-serif}
#myTimberApp *{box-sizing:border-box}#myTimberApp [hidden]{display:none!important}
#myTimberApp summary{cursor:pointer;min-height:44px;display:flex;align-items:center;gap:12px;font-weight:700;color:#e7e3da}
#myTimberApp summary img{width:40px;height:40px}#myTimberApp :is(p,h2,label,a,small){color:#e7e3da!important}#myTimberApp h2{font-size:22px;margin:20px 0 8px}
#myTimberApp button,#myTimberApp select{min-height:44px;border:1px solid #707762;border-radius:8px;padding:10px 14px;font:inherit;background:#e7e3da;color:#050505;margin:6px 8px 6px 0;max-width:100%}
#myTimberApp button:disabled{opacity:.6}#myTimberApp :is(button,select,a,summary):focus-visible{outline:3px solid #e7e3da;outline-offset:3px}
#myTimberApp label{display:block;margin:12px 0 4px}#myTimberApp [role=status]{min-height:24px}#myTimberApp a{text-decoration:underline}#myTimberApp .pwa-actions{display:flex;gap:8px;flex-wrap:wrap}
@media(max-width:650px){#myTimberApp{margin:16px 12px;padding:14px}#myTimberApp .pwa-actions button{flex:1 1 150px}}
`;
export const card=`<details id="myTimberApp"><summary><img src="/assets/apple-touch-icon.png" alt="" width="40" height="40">My Timber on your phone</summary><h2>One tap back to your day.</h2><p>Add the S-in-a-circle icon to your home screen. Your existing account and saved progress stay together.</p><button type="button" id="pwaInstall">Add My Timber to home screen</button><p id="pwaInstallHelp" role="status"></p><noscript><p>On iPhone: open My Timber in Safari, choose Share, then Add to Home Screen and Open as Web App. On Android: use your browser’s Install app or Add to Home screen menu.</p></noscript><section id="pwaReminders"><h2>A useful nudge. Your choice.</h2><p>One optional check-in reminder a day on this device. No email subscription, no health details on your lock screen. A saved check-in stops that day’s reminder.</p><p id="pwaCapability" role="status">Open this section to check notification support.</p><label for="pwaHour">Reminder time — UK time</label><select id="pwaHour" disabled>${Array.from({length:15},(_,i)=>i+7).map(h=>`<option value="${h}"${h===19?' selected':''}>${String(h).padStart(2,'0')}:00</option>`).join('')}</select><small>Usually within 15 minutes of your chosen hour. Focus, connectivity and phone settings can delay or hide it.</small><div class="pwa-actions"><button type="button" id="pwaEnable" disabled>Turn on check-in reminders</button><button type="button" id="pwaDisable" hidden>Turn off on this device</button><button type="button" id="pwaTest" hidden>Send test notification</button><button type="button" id="pwaRetry" hidden>Retry notification setup</button></div><p id="pwaStatus" role="status" aria-live="polite"></p></section></details>`;
const headers={'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','X-Robots-Tag':'noindex, nofollow'};
export function pwaAssets(request){
 const path=new URL(request.url).pathname;
 const asset={'/manifest.webmanifest':[JSON.stringify(manifest),'application/manifest+json'],'/my-timber.webmanifest':[JSON.stringify(manifest),'application/manifest+json'],'/assets/my-timber-pwa.js':[client,'application/javascript'],'/assets/my-timber-pwa.css':[styles,'text/css'],'/shift-push-sw-v1.js':[serviceWorker,'application/javascript']}[path];
 if(!asset)return null;
 if(!['GET','HEAD'].includes(request.method))return new Response('Method not allowed',{status:405,headers:{...headers,Allow:'GET, HEAD'}});
 return new Response(request.method==='HEAD'?null:asset[0],{headers:{...headers,'Content-Type':asset[1]+'; charset=utf-8',...(path==='/shift-push-sw-v1.js'?{'Service-Worker-Allowed':'/'}:{})}});
}
export async function withPwa(request,response){
 const path=new URL(request.url).pathname;
 if(request.method!=='GET'||!response.ok||!response.headers.get('Content-Type')?.includes('text/html')||!/^\/(?:my-timber|member-login|member-register|member\/[^/]+)(?:\.html)?\/?$/.test(path))return response;
 let html=await response.text();
 if(!html.includes('</head>')||!html.includes('</body>')||html.includes('id="myTimberApp"'))return new Response(html,response);
 html=html.replace(/<link\b(?=[^>]*\brel=["'](?:manifest|apple-touch-icon)["'])[^>]*>/gi,'').replace(/<meta\b(?=[^>]*\bname=["'](?:theme-color|apple-mobile-web-app-title)["'])[^>]*>/gi,'');
 html=html.replace('</head>','<link rel="manifest" href="/my-timber.webmanifest"><link rel="apple-touch-icon" href="/assets/apple-touch-icon.png"><meta name="apple-mobile-web-app-title" content="My Timber"><meta name="theme-color" content="#050505"><link rel="stylesheet" href="/assets/my-timber-pwa.css"></head>');
 // Keep the established header and the Today action order. The compact disclosure
 // sits before main rather than inside a renderer-owned panel that is replaced.
 html=html.replace(/<main\b/,card+'<main').replace('</body>','<script defer src="/assets/my-timber-pwa.js"></script></body>');
 const h=new Headers(response.headers);for(const key of ['Content-Length','ETag','Last-Modified'])h.delete(key);h.set('Cache-Control','no-store');
 return new Response(html,{status:response.status,headers:h});
}
