// One service-worker URL preserves existing Fit push subscriptions. No Cache API,
// offline writes or stored member data. Browser installation is not offline access.
const offlinePage=`<!doctype html><html lang="en-GB"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><title>My Timber — connection needed</title><body style="margin:0;background:#f5f2eb;color:#050505;font:18px/1.6 Arial,sans-serif"><header style="padding:max(16px,env(safe-area-inset-top)) 20px 16px;background:#050505;color:#e7e3da;font-weight:700">MY TIMBER</header><main style="max-width:560px;margin:auto;padding:32px max(20px,env(safe-area-inset-left)) max(32px,env(safe-area-inset-bottom))"><h1>You’re offline.</h1><p>Reconnect to open My Timber. No new changes have been saved by this screen.</p><form action="/member/dashboard#today" method="get"><button type="submit" style="display:inline-block;min-height:48px;padding:12px 18px;box-sizing:border-box;border:0;border-radius:10px;background:#050505;color:#e7e3da;font:inherit;cursor:pointer">Try My Timber again</button></form></main></body></html>`;
export const serviceWorker=String.raw`
'use strict';
self.addEventListener('install',event=>event.waitUntil(self.skipWaiting()));
self.addEventListener('activate',event=>event.waitUntil(self.clients.claim()));
const today='/member/dashboard#today';
function safeTarget(value){try{const u=new URL(value||today,self.location.origin);if(u.origin===self.location.origin&&!u.search&&['/member/dashboard','/member/check-in','/member/fit'].includes(u.pathname))return u.href}catch{}return new URL(today,self.location.origin).href}
self.addEventListener('push',event=>{
 let data={};try{data=event.data?.json()||{}}catch{}
 const checkin=data.kind==='my-timber-checkin';
 const options={body:checkin?'A minute for you. Open My Timber when you’re ready.':String(data.body||'Open My Timber when you’re ready.').slice(0,240),tag:checkin?'my-timber-checkin':String(data.tag||'shift-fit').slice(0,100),renotify:false,icon:'/assets/apple-touch-icon.png',badge:'/assets/apple-touch-icon.png',data:{url:safeTarget(data.url)}};
 event.waitUntil((async()=>{await self.registration.showNotification(checkin?'Time for your check-in':String(data.title||'My Timber').slice(0,80),options);if(checkin&&self.navigator?.setAppBadge)await self.navigator.setAppBadge(1).catch(()=>{})})());
});
self.addEventListener('notificationclick',event=>{
 event.notification.close();const target=safeTarget(event.notification.data?.url);
 event.waitUntil((async()=>{if(self.navigator?.clearAppBadge)await self.navigator.clearAppBadge().catch(()=>{});const list=await self.clients.matchAll({type:'window',includeUncontrolled:true});const open=list.find(c=>{try{return new URL(c.url).origin===self.location.origin&&new URL(c.url).pathname.startsWith('/member/')}catch{return false}});if(open){const navigated=await open.navigate(target);return (navigated||open).focus()}return self.clients.openWindow(target)})());
});
self.addEventListener('fetch',event=>{
 const u=new URL(event.request.url);
 const panel=['/member/fit','/member/grub','/member/life-back'].includes(u.pathname)&&u.searchParams.get('app_panel')==='1'&&['app','web'].includes(u.searchParams.get('view'))&&u.searchParams.size===2;
 if(event.request.method!=='GET'||event.request.mode!=='navigate'||u.origin!==self.location.origin||!/^\/member\//.test(u.pathname)||(u.search&&!panel))return;
 event.respondWith(fetch(event.request).catch(()=>new Response(${JSON.stringify(offlinePage)},{status:503,headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'}})));
});
`;
