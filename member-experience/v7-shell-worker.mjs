import {treatmentServiceWorker} from './treatment-service-worker.mjs';
// Extend the existing member-scoped reminder worker. Its push subscription and
// reminder behaviour stay intact; no second registration or notification prompt.
export const shellServiceWorker=treatmentServiceWorker+String.raw`
const MT_CACHE='my-timber-shell-__V7_NATIVE_ASSET_TAG__';
const MT_SHELL='/member/app-shell.html?v=__V7_NATIVE_ASSET_TAG__';
const MT_STATIC=[MT_SHELL,'/assets/member-experience/v7-native.css?v=__V7_NATIVE_ASSET_TAG__','/assets/member-experience/v7-native.mjs?v=__V7_NATIVE_ASSET_TAG__','/assets/member-experience/v7-brand.svg?v=__V7_NATIVE_ASSET_TAG__','/assets/member-experience/v7-heading-font.woff2?v=__V7_NATIVE_ASSET_TAG__','/member/manifest.webmanifest'];
const MT_ROUTES=new Set(['/member/dashboard','/member/grub','/member/fit','/member/life-back','/member/life-back/journey','/member/life-back/shop','/member/life-back/support','/member/life-back/support/league','/member/life-back/preferences','/member/more']);
self.addEventListener('install',event=>event.waitUntil((async()=>{const cache=await caches.open(MT_CACHE);await cache.addAll(MT_STATIC);})()));
self.addEventListener('activate',event=>event.waitUntil((async()=>{const keys=await caches.keys();const old=keys.filter(key=>key.startsWith('my-timber-shell-')&&key!==MT_CACHE);for(const key of old.slice(0,-1))await caches.delete(key);})()));
async function mtNotice(type){for(const client of await self.clients.matchAll({type:'window',includeUncontrolled:true}))client.postMessage({type});}
self.addEventListener('message',event=>{if(event.data?.type==='MT_PURGE_PRIVATE')event.waitUntil(mtNotice('MT_PURGE_PRIVATE'));});
self.addEventListener('fetch',event=>{
 const request=event.request,url=new URL(request.url);if(url.origin!==self.location.origin)return;
 if(request.method!=='GET'){
  if(/\/v1\/(?:auth\/)?(?:logout|privacy\/(?:account|health-tracking)|consent)/.test(url.pathname))event.respondWith((async()=>{const response=await fetch(request);if(response.ok)await mtNotice('MT_PURGE_PRIVATE');return response;})());
  return;
 }
 if(request.mode==='navigate'&&MT_ROUTES.has(url.pathname)&&!url.searchParams.has('tools')&&!url.searchParams.has('view-data')&&!url.searchParams.has('mt-rollback')){
  event.respondWith((async()=>{const cache=await caches.open(MT_CACHE);const shell=await cache.match(MT_SHELL);if(shell)return shell;try{return await fetch(request);}catch{return new Response('<!doctype html><html lang="en"><meta name="theme-color" content="#050505"><body style="background:#050505;color:#E7E3DA;font:16px Arial;padding:24px"><h1>MY TIMBER</h1><p>You’re offline. Reconnect to open your saved shell.</p></body></html>',{headers:{'Content-Type':'text/html'}});}})());return;
 }
 if(url.pathname==='/v1/me'||url.pathname.startsWith('/v1/')){
  // Deliberately network-only: authentication, consent and health data do not
  // enter CacheStorage. The client owns encrypted, account-bound snapshots.
  return;
 }
 if(url.pathname.startsWith('/assets/member-experience/v7-')){event.respondWith((async()=>{const saved=await caches.match(request);if(saved)return saved;return fetch(request);})());return;}
 if(MT_STATIC.some(path=>new URL(path,self.location.origin).href===url.href)){
  event.respondWith((async()=>{const cache=await caches.open(MT_CACHE),saved=await cache.match(request);if(saved)return saved;const response=await fetch(request);if(response.ok)await cache.put(request,response.clone());return response;})());return;
 }
 if(url.pathname.startsWith('/assets/')&&request.destination==='image')event.respondWith((async()=>{const cache=await caches.open(MT_CACHE),saved=await cache.match(request);if(saved)return saved;const response=await fetch(request);const control=response.headers.get('Cache-Control')||'';if(response.ok&&!/private|no-store/i.test(control))await cache.put(request,response.clone());return response;})());
});
`;
export const shellManifest={id:'/member/dashboard',name:'My Timber',short_name:'My Timber',lang:'en-GB',start_url:'/member/dashboard#today',scope:'/member/',display:'standalone',background_color:'#050505',theme_color:'#050505',icons:[{src:'/assets/member-experience/v7-brand.svg?v=__V7_NATIVE_ASSET_TAG__',sizes:'any',type:'image/svg+xml',purpose:'any'}]};
