const CACHE='remedios-v7-final';
const ASSETS=[
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', e=>{
  e.waitUntil(
    caches.open(CACHE).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting())
  );
});

self.addEventListener('activate', e=>{
  e.waitUntil(
    caches.keys().then(keys=>Promise.all(
      keys.filter(k=>k!==CACHE).map(k=>caches.delete(k))
    )).then(()=>self.clients.claim())
  );
});

self.addEventListener('fetch', e=>{
  // Navegacao: network first, fallback cache
  if(e.request.mode==='navigate'){
    e.respondWith(
      fetch(e.request).then(r=>{
        return caches.open(CACHE).then(c=>{c.put(e.request, r.clone()); return r;});
      }).catch(()=>caches.match('./index.html'))
    );
    return;
  }
  // Outros: cache first, fallback network
  e.respondWith(
    caches.match(e.request).then(cached=>{
      return cached || fetch(e.request).then(r=>{
        return caches.open(CACHE).then(c=>{c.put(e.request, r.clone()); return r;});
      });
    })
  );
});
