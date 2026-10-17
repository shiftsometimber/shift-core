const CACHE='sst-public-public-feedback-20261017-b7d5bf35aac0';
const CORE=['/','/styles.css','/app.js','/offline'];
self.addEventListener('install',event=>{
  event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(CORE)).catch(()=>{}));
  self.skipWaiting();
});
self.addEventListener('activate',event=>{
  event.waitUntil(
    caches.keys()
      .then(keys=>Promise.all(keys.filter(key=>key!==CACHE).map(key=>caches.delete(key))))
      .then(()=>self.clients.claim())
  );
});
self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET') return;
  const req=event.request;
  // Always use the network for page navigations. Do not cache HTML responses.
  if(req.mode==='navigate'){
    event.respondWith(fetch(req,{cache:'no-store'}).catch(()=>caches.match('/offline')));
    return;
  }
  event.respondWith(
    fetch(req).then(response=>{
      const type=(response.headers.get('content-type')||'').toLowerCase();
      if(response.ok && !type.includes('text/html')){
        const copy=response.clone();
        caches.open(CACHE).then(cache=>cache.put(req,copy)).catch(()=>{});
      }
      return response;
    }).catch(()=>caches.match(req).then(r=>r||caches.match('/offline')))
  );
});
