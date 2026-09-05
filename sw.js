// 아주 최소한의 서비스워커입니다.
// 목적: (1) 안드로이드에서 '홈 화면에 추가/앱 설치'가 뜨도록 PWA 조건을 만족시키고,
//       (2) 오프라인이거나 네트워크가 느릴 때도 앱 화면 자체는 뜨게 해줍니다.
// 실제 명대사 데이터는 Firebase에서 받아오므로, 여기서는 화면(껍데기)만 캐시합니다.

const CACHE_NAME = "myeongdaesa-shell-v3";
const APP_SHELL = ["./index.html", "./manifest.json", "./icon-192.png", "./icon-512.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  // 앱 화면(HTML/아이콘/매니페스트) 요청은 '네트워크 우선'으로 처리합니다.
  // 즉 인터넷이 되면 항상 최신 파일을 먼저 받아오고(그리고 캐시도 갱신),
  // 네트워크가 안 될 때만 예전에 저장해둔 캐시를 보여줍니다.
  // Firebase 등 그 외 요청(실제 데이터)은 서비스워커가 손대지 않고 그대로 통과시킵니다.
  const url = new URL(event.request.url);
  const isAppShellRequest = APP_SHELL.some((path) => url.pathname.endsWith(path.replace("./", "")));

  if (event.request.method === "GET" && isAppShellRequest) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          return response;
        })
        .catch(() => caches.match(event.request))
    );
  }
});
