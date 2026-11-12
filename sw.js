// Guarda la "cÃ¡scara" de la app para que abra rÃ¡pido.
// Los datos de Supabase nunca se guardan aquÃ­: siempre se piden en vivo.
const CACHE = "mykau-v137";
const SHELL = ["./", "index.html", "config.js", "manifest.webmanifest", "icon-180.png", "icon-192.png", "logo.png",
  "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.js"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const url = new URL(e.request.url);
  // los datos de Supabase y los cuadros del mapa satelital no se guardan (serÃ­an demasiados)
  if (e.request.method !== "GET" || url.hostname.endsWith("supabase.co") || url.hostname.endsWith("arcgisonline.com")) return;
  // Primero la red (para recibir actualizaciones); si no hay seÃ±al, la copia guardada
  e.respondWith(
    // no-cache: pregunta siempre al servidor si hay versiÃ³n nueva (sin quedarse con la copia vieja del navegador)
    fetch(e.request, url.origin === location.origin ? { cache: "no-cache" } : {})
      .then(r => { const copy = r.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); return r; })
      .catch(() => caches.match(e.request))
  );
});
