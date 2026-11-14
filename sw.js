const CACHE = "bill-cal-v1";
const SHELL = ["./", "./index.html", "./manifest.json", "./icon-192.png", "./icon-512.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  // Supabase ও অন্য বাইরের রিকোয়েস্ট সরাসরি নেটওয়ার্কে যাবে (ডেটা/লগইন ক্যাশ হবে না)
  if (url.origin !== self.location.origin) return;
  // নেটওয়ার্ক আগে, না পেলে ক্যাশ — এতে আপডেট সবসময় সঙ্গে সঙ্গে আসবে
  e.respondWith(
    fetch(req).then(res => {
      const copy = res.clone();
      caches.open(CACHE).then(c => c.put(req, copy));
      return res;
    }).catch(() => caches.match(req).then(r => r || caches.match("./index.html")))
  );
});
