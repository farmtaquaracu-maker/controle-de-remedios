const CACHE='remedios-v9-100-offline';
const FILES=['/','/index.html','/manifest.json','/icon-192.png','/icon-512.png'];

self.addEventListener('install', e=>{
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE).then(cache=>{
      return cache.addAll(FILES).catch(()=>cache.addAll(['./','./index.html']));
    })
  );
});

self.addEventListener('activate', e=>{
  e.waitUntil(
    caches.keys().then(keys=>Promise.all(
      keys.map(k=>{ if(k!==CACHE) return caches.delete(k); })
    )).then(()=>self.clients.claim())
  );
});

self.addEventListener('fetch', e=>{
  if(e.request.method!=='GET') return;
  // NUNCA tenta rede primeiro se for navegação - sempre cache
  e.respondWith(
    caches.match(e.request).then(cacheRes=>{
      return cacheRes || caches.match('/index.html') || caches.match('./index.html') || caches.match('/') || fetch(e.request).then(netRes=>{
        // se conseguiu rede, guarda pro offline futuro
        if(netRes && netRes.ok){
          caches.open(CACHE).then(c=>c.put(e.request, netRes.clone()));
        }
        return netRes;
      }).catch(()=>{
        // offline e não achou nada: retorna index
        return caches.match('/index.html') || caches.match('./index.html');
      });
    })
  );
});
