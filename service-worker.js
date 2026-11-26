const CACHE='b6l-shell-v4-recovery';
const SHELL=['/','/manifest.webmanifest','/b6l-icon.svg?v=20261126','/assets/brand/official-brand.css?v=20261126','/assets/brand/studiosb6l-logo-navy.png','/assets/brand/studiosb6l-icon-192.png','/assets/brand/studiosb6l-icon-512.png'];
async function boundedFetch(request, timeout=6000) {
  const controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(),timeout);
  try { return await fetch(request,{signal:controller.signal}); }
  finally { clearTimeout(timer); }
}
self.addEventListener('install',event=>event.waitUntil((async()=>{
  const cache=await caches.open(CACHE);
  await Promise.allSettled(SHELL.map(async url=>{
    const response=await boundedFetch(url);
    if(response.ok) await cache.put(url,response);
  }));
  await self.skipWaiting();
})()));
self.addEventListener('activate',event=>event.waitUntil((async()=>{
  await self.clients.claim();
  await Promise.all((await caches.keys()).filter(key=>key.startsWith('b6l-shell-')&&key!==CACHE).map(key=>caches.delete(key)));
})()));
self.addEventListener('fetch',event=>{
  const req=event.request;
  if(req.method!=='GET'||new URL(req.url).origin!==self.location.origin)return;
  if(req.mode==='navigate'){
    event.respondWith((async()=>{
      try { return await boundedFetch(req); }
      catch {
        if(new URL(req.url).pathname==='/'){
          const cached=await caches.match('/');
          if(cached)return cached;
        }
        return new Response('<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>STUDIOSB6L</title><body><h1>STUDIOSB6L</h1><p>Connection unavailable. Please try again.</p><a href="/">Open STUDIOSB6L</a></body></html>',{status:503,headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'}});
      }
    })());
    return;
  }
  event.respondWith(boundedFetch(req,10000).catch(async()=>await caches.match(req)||Response.error()));
});
