const CACHE='remedios-v8-offline-100';
const ASSETS=[
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', e=>{
  e.waitUntil(
    caches.open(CACHE).then(c=>c.addAll(ASSETS.map(url=>new Request(url, {cache:'reload'}))))
      .then(()=>self.skipWaiting())
      .catch(err=>console.log('Cache fail', err))
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
  // Ignora chrome-extension e outros esquemas
  if(!e.request.url.startsWith('http')) return;

  // Para navegação (abrir o app): CACHE FIRST - 100% offline
  if(e.request.mode==='navigate'){
    e.respondWith(
      caches.match(e.request)
        .then(cached=>{
          if(cached) return cached;
          return caches.match('/index.html')
            .then(m=>m || caches.match('./index.html'))
            .then(m=>m || caches.match('/'))
            .then(m=>m || caches.match('./'))
            .then(m=>{
              if(m) return m;
              // Ultimo recurso: tenta rede
              return fetch(e.request).catch(()=>m);
            });
        })
        .catch(()=>caches.match('/index.html'))
    );
    return;
  }

  // Para CSS, JS, imagens, manifest: CACHE FIRST, depois rede
  e.respondWith(
    caches.match(e.request).then(cached=>{
      if(cached) return cached;
      return fetch(e.request).then(r=>{
        // Guarda no cache pra proxima vez offline
        if(r.ok && r.type==='basic'){
          const clone=r.clone();
          caches.open(CACHE).then(c=>c.put(e.request, clone));
        }
        return r;
      }).catch(()=>{
        // Se offline e não tem no cache, retorna o index pra não quebrar
        if(e.request.destination==='image'){
          return caches.match('/icon-192.png');
        }
      });
    })
  );
});
