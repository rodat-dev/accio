/** 
 * @summary a Service Worker with offline capabilities
 * @description implements Stale While Revalidate caching
 * as a strategy: fetch from cache first, then from navigation preload and 
 * spin up a promise to fetch from the actual network in the background
 * it's
 */

/** @typedef {ServiceWorkerGlobalScope} */

let cacheKey = "v1";
let fetchOpts = { method: "GET" };
const __MANIFEST__ = process.env.MANIFEST;

/** 
 * @param {FetchEvent} event
 */
const swrFetch = async(event) => {
    if(event.request.method !== "GET") return;

    const cache = await caches.open(cacheKey);
    const maybeCachedPromise = cache.match(event.request);
    
    const url = new URL(event.request.url);
    if(url.origin === self.location.origin) {
        fetchOpts["mode"] = url.href.endsWith(".html") ? "navigate" : "same-origin";
    } else {
        fetchOpts["mode"] = "cors";
    }
    
    const fetchPromise = fetch(event.request, fetchOpts)
        .then(async res => {
            if(res.ok) {
                await cache.put(event.request, res.clone());
                console.info(`added response for request ${"url" in event.request ? event.request.url : JSON.stringify(event)} to cache...`);
            }
        })
        .catch(err => console.error(`["Likely offline"] failed to fetch - ${err}`));

    const maybeCached = await maybeCachedPromise;
    if(maybeCached) {
        console.info()
        return maybeCached;
    }

    const navPreload = await event.preloadResponse;
    if(navPreload) {
        cache.put(event.request, navPreload.clone());
        return navPreload;
    }

    return fetchPromise;
}

addEventListener("install", function(ev) {
    console.group("[SW:INSTALL]");
    ev.waitUntil(this.caches.open(cacheKey)
        .then(async(c) => {
            console.info("cache key:", cacheKey);
            console.info("precaching manifest...");
            console.info(JSON.stringify(__MANIFEST__, null, "\t"));
            await c.addAll(Object.keys(__MANIFEST__));
        }
    ));
    console.info("installed service worker and added initial caches");
    console.groupEnd();
});

const enableNavigationPreload = async() => {
    if(self.registration.navigationPreload) {
        await self.registration.navigationPreload.enable();
    }
}

addEventListener("activate", function(ev) {
    console.group("[SW:ACTIVATE]");
    ev.waitUntil(enableNavigationPreload());
    console.info("enabled navigation preload...");
    console.groupEnd();
});

addEventListener("fetch", async function(event) {
    console.group("[SW:FETCH]");
    event.respondWith(swrFetch(event));
    console.info("fetched data...");
    console.groupEnd();
});