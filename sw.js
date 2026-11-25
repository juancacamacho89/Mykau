// Guarda la "cÃƒÆ’Ã‚Â¡scara" de la app para que abra rÃƒÆ’Ã‚Â¡pido.
// Los datos de Supabase nunca se guardan aquÃƒÆ’Ã‚Â­: siempre se piden en vivo.
const CACHE = "mykau-v172";
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
  // los datos de Supabase y los cuadros del mapa satelital no se guardan (serÃƒÆ’Ã‚Â­an demasiados)
  if (e.request.method !== "GET" || url.hostname.endsWith("supabase.co") || url.hostname.endsWith("arcgisonline.com")) return;
  // Primero la red (para recibir actualizaciones); si no hay seÃƒÆ’Ã‚Â±al, la copia guardada
  e.respondWith(
    // no-cache: pregunta siempre al servidor si hay versiÃƒÆ’Ã‚Â³n nueva (sin quedarse con la copia vieja del navegador)
    fetch(e.request, url.origin === location.origin ? { cache: "no-cache" } : {})
      .then(r => { const copy = r.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); return r; })
      .catch(() => caches.match(e.request))
  );
});

// Notificaciones push (avisos de Mykau aunque la app estÃƒÂ© cerrada): las manda la Edge Function send-push
self.addEventListener("push", e => {
  let d = {}; try { d = e.data ? e.data.json() : {}; } catch (x) { d = { title: "Mykau", body: e.data ? e.data.text() : "" }; }
  e.waitUntil(self.registration.showNotification(d.title || "Mykau", {
    body: d.body || "", icon: "icon-192.png", badge: "icon-192.png", tag: d.tag || undefined, renotify: true,
    vibrate: [200, 100, 200], data: { url: d.url || "./" } }));
});
// al tocar el aviso: abre Mykau (o la trae al frente) en la pantalla del aviso
self.addEventListener("notificationclick", e => {
  e.notification.close();
  const target = new URL(e.notification.data?.url || "./", self.registration.scope).href;
  e.waitUntil(self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(cs => {
    const c = cs.find(x => x.url.startsWith(self.registration.scope));
    if (c) { c.focus(); return c.navigate ? c.navigate(target) : null; }
    return self.clients.openWindow(target);
  }));
});
