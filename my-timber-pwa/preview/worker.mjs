// Deliberately small, separate device test. No production routes, records or cron.
import {pwaAssets,withPwa} from '../presentation.mjs';
import {ensurePwaSchema,pwaReminderRoutes,sendPwaPush} from '../reminders.mjs';
import {authenticateMember} from '../../member-state-fast-v1.js';
import webpush from 'web-push';
import {createECDH,randomBytes} from 'node:crypto';
// no-referrer also nulls Origin for native form POSTs. same-origin retains the
// origin for our own forms, while still withholding referrers from other sites.
const page=(content)=>new Response(`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>My Timber — PWA device test</title><style>body{margin:0;background:#050505;color:#e7e3da;font:17px/1.6 Arial}header,main,footer{max-width:1080px;margin:auto;padding:20px}a{color:inherit}button{min-height:44px;background:#e7e3da;color:#050505;padding:12px 18px;border:1px solid #707762;border-radius:8px;font:inherit}header{border-bottom:1px solid #707762}header img{width:48px;vertical-align:middle;margin-right:12px}aside{border:1px solid #707762;padding:16px}h1{font-size:32px}form{margin:20px 0}</style></head><body><header><img src="/assets/apple-touch-icon.png" alt="S in a circle">My Timber · device test</header><main>${content}</main><footer>Separate preview. No live account, health record, email or scheduled reminder is used.</footer></body></html>`,{headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store','X-Robots-Tag':'noindex, nofollow','Referrer-Policy':'same-origin','X-Content-Type-Options':'nosniff'}});
const blockedEntry=()=>{const r=page('<h1>Let’s reopen the device test.</h1><p>This browser did not identify the preview as the source of that action, so nothing was changed.</p><p><a href="/">Return to the device test</a>. On iPhone, open it in Safari before adding it to your home screen.</p>');return new Response(r.body,{status:403,headers:r.headers})};
export default{async fetch(request,env){
 const u=new URL(request.url),path=u.pathname;
 if(!/^shift-my-timber-pwa-preview\.[a-z0-9-]+\.workers\.dev$/.test(u.hostname))return new Response('Preview host required',{status:403});
 if(Date.now()>Date.parse(env.PREVIEW_EXPIRES_AT))return new Response('This device preview has expired. The live website is unchanged.',{status:410});
 if(path==='/__preview/meta')return Response.json({source:env.PREVIEW_SOURCE_SHA,productionBindings:false,scheduledReminders:false,expiresAt:env.PREVIEW_EXPIRES_AT},{headers:{'Cache-Control':'no-store'}});
 // A native-form diagnostic uses the same page policy/security check without
 // creating an account, requesting permission or changing any stored data.
 if(path==='/__preview/entry-check'){
  if(request.method==='GET')return page('<h1>Check this browser’s preview entry</h1><p>This checks the Start button’s browser security context. It creates no account and sends no notification.</p><form action="/__preview/entry-check" method="post"><button>Check preview entry</button></form>');
  if(request.method==='POST')return request.headers.get('Origin')===u.origin?page('<h1>Preview entry check passed</h1><p>The browser supplied the correct same-origin form context. No account was created and no notification was sent.</p><p><a href="/">Return to the device test</a></p>'):blockedEntry();
  return new Response('Method not allowed',{status:405});
 }
 if(path==='/__preview/protocol'&&request.method==='GET'){
  // Exercise the real deployed crypto runtime using ephemeral fixture keys,
  // no database writes, no returned keys and a non-network transport.
  const vapid=webpush.generateVAPIDKeys(),client=createECDH('prime256v1');client.generateKeys();let proof;
  const fakeDB={prepare(){return{}},batch:async()=>[],exec:async()=>{}};
  const result=await sendPwaPush({DB:fakeDB,VAPID_PUBLIC_KEY:vapid.publicKey,VAPID_PRIVATE_KEY:vapid.privateKey},{endpoint:'https://web.push.apple.com/synthetic-no-network',p256dh:client.getPublicKey().toString('base64url'),auth:randomBytes(16).toString('base64url')},async(_,options)=>{const h=new Headers(options.headers);proof={encoding:h.get('Content-Encoding'),modernVapid:h.get('Authorization')?.startsWith('vapid t='),encrypted:options.body.length>86};return new Response(null,{status:201})});
  return Response.json({...proof,transportMocked:true,result},{headers:{'Cache-Control':'no-store'}});
 }
 if(['/assets/favicon.svg','/assets/apple-touch-icon.png'].includes(path)&&['GET','HEAD'].includes(request.method)){
  return env.PREVIEW_ASSETS.fetch(request);
 }
 const asset=pwaAssets(request);if(asset)return asset;
 if(path.startsWith('/v1/my-timber-pwa/'))return pwaReminderRoutes(request,env);
 if(path==='/__preview/start'&&request.method==='POST'){
  if(request.headers.get('Origin')!==u.origin)return blockedEntry();
  const existing=await authenticateMember(request,env);if(!existing.response)return Response.redirect(u.origin+'/member/dashboard#today',303);
  // Fictional per-browser identity, not a route around live sign-in. No personal
  // details or passwords are collected; only explicit device opt-in stores push.
  const token=crypto.randomUUID()+crypto.randomUUID(),hash=[...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(token)))].map(n=>n.toString(16).padStart(2,'0')).join('');
  const at=new Date().toISOString(),email=crypto.randomUUID()+'@example.invalid';
  const result=await env.DB.prepare('INSERT INTO users(email) SELECT ? WHERE (SELECT COUNT(*) FROM users)<200').bind(email).run();
  if(!result.meta.changes)return new Response('Preview capacity reached',{status:429});
  const id=result.meta.last_row_id;
  await env.DB.batch([env.DB.prepare('INSERT INTO user_auth(user_id,email_verified) VALUES(?,1)').bind(id),env.DB.prepare('INSERT INTO user_sessions(user_id,token_hash,expires_at,last_used_at) VALUES(?,?,?,?)').bind(id,hash,env.PREVIEW_EXPIRES_AT,at)]);
  return new Response(null,{status:303,headers:{Location:'/member/dashboard#today','Set-Cookie':`sst_session=${token}; Path=/; Secure; HttpOnly; SameSite=Lax; Max-Age=259200`,'Cache-Control':'no-store'}});
 }
 if(path==='/__preview/finish'&&request.method==='POST'){
  if(request.headers.get('Origin')!==u.origin)return blockedEntry();
  const auth=await authenticateMember(request,env);if(auth.response)return auth.response;
  await ensurePwaSchema(env.DB);
  await env.DB.batch([env.DB.prepare('DELETE FROM my_timber_push_deliveries WHERE endpoint IN (SELECT endpoint FROM my_timber_push_devices WHERE user_id=?)').bind(auth.userId),env.DB.prepare('DELETE FROM my_timber_push_devices WHERE user_id=?').bind(auth.userId),env.DB.prepare('DELETE FROM user_sessions WHERE user_id=?').bind(auth.userId),env.DB.prepare('DELETE FROM user_auth WHERE user_id=?').bind(auth.userId),env.DB.prepare('DELETE FROM users WHERE id=?').bind(auth.userId)]);
  return new Response(null,{status:303,headers:{Location:'/?finished=1','Set-Cookie':'sst_session=; Path=/; Secure; HttpOnly; SameSite=Lax; Max-Age=0','Cache-Control':'no-store'}});
 }
 if(request.method!=='GET')return new Response('Method not allowed',{status:405});
 if(path==='/__preview/review'){
  const r=await withPwa(new Request(u.origin+'/member/dashboard'),page('<h1>Install instructions preview</h1><p>Tap the compact box above to see the setup steps. The small footer link opens the same box.</p><aside>Layout preview only. On the live site, this opens your full My Timber account: check-ins, Grub, Fit and saved progress. Real account sign-in and automatic reminders are not connected to this test site.</aside><p><a href="/">Return to the device test</a></p>'));
  const html=(await r.text()).replace('href="/member/dashboard?setup=app#myTimberApp"','href="/__preview/review#myTimberApp"').replace('href="/member-login?returnTo=%2Fmember%2Fdashboard%3Fsetup%3Dapp%23myTimberApp"','href="/__preview/review#preview-sign-in"').replace('Sign in to My Timber</a>','Sign-in connects to your account on the live site</a>').replace('<aside>Layout preview only.','<aside id="preview-sign-in">Layout preview only.');
  return new Response(html,r);
 }
 if(['/','/my-timber','/member/dashboard','/member/check-in','/__preview/review'].includes(path)){
  const auth=await authenticateMember(request,env);
  if(auth.response&&path!=='/__preview/review')return page('<h1>Try My Timber on your phone.</h1><aside>This is only an install and notification test, not the live My Timber dashboard. It creates an anonymous fictional account on this preview. Do not enter real account details.</aside>'+(u.searchParams.has('finished')?'<p>Your preview account and saved push subscription have been removed.</p>':'')+'<form action="/__preview/start" method="post"><button>Start device test</button></form><p>The test is optional. You choose whether to install and allow notifications. Daily scheduled reminders are disabled here.</p><p><a href="/__preview/review">View the controls without starting a test</a></p>');
  if(auth.response){const r=await withPwa(new Request(u.origin+'/member/dashboard'),page('<h1>Read-only preview</h1><p>No test account has been created, so reminder controls are disabled. <a href="/">Return to the optional device test</a>.</p>'));return new Response((await r.text()).replace('<details id="myTimberApp">','<details id="myTimberApp" open>'),r)}
  const response=await withPwa(new Request(u.origin+'/member/dashboard'),page('<h1>My Timber device test</h1><aside><strong>Preview only.</strong> The panel above is the real candidate install/reminder control. This surrounding page is a test shell, not your dashboard. Daily scheduling is disabled; use <strong>Send test notification</strong> to check this phone.</aside><p>After installing, open the S-in-a-circle icon, enable notifications, then send a test. Lock the phone or switch apps and confirm that the notification arrives and opens this page. Permission or a successful send response alone does not prove delivery.</p><p>No real check-in is saved in this preview.</p><form action="/__preview/finish" method="post"><button>Finish test and remove preview data</button></form><p>When finished, also remove the preview app from your home screen. Installing the live app later will require its own permission.</p>'));
  const html=(await response.text()).replace('<details id="myTimberApp">','<details id="myTimberApp" open>');return new Response(html,response);
 }
 return new Response('Not available in this device test',{status:404});
}};
