// One service-worker URL preserves existing Fit push subscriptions. No Cache API,
// offline writes or stored member data. Browser installation is not offline access.
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
 if(event.request.method!=='GET'||event.request.mode!=='navigate'||u.origin!==self.location.origin||!/^\/member\//.test(u.pathname)||u.search)return;
 event.respondWith(fetch(event.request).catch(()=>new Response('<!doctype html><html lang="en"><meta name="viewport" content="width=device-width,initial-scale=1"><title>My Timber — connection needed</title><body style="background:#050505;color:#e7e3da;font:18px/1.6 Arial;padding:28px"><h1>You’re offline.</h1><p>Reconnect to open My Timber. No new changes have been saved by this screen.</p><a style="color:#e7e3da" href="/member/dashboard#today">Try My Timber again</a></body></html>',{status:503,headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'}})));
});
`;
