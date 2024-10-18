/** @typedef {ServiceWorker} */
function messageServiceWorker(message) {
    if(window.navigator.serviceWorker.controller) {
        window.navigator.serviceWorker.controller.postMessage(message);
    }
}

addEventListener("load", async() => {
    if("serviceWorker" in window.navigator) {
        const swRegistration = await window.navigator.serviceWorker.register("sw.js", {
            scope: "/"
        });

        if(swRegistration.active) {
            console.log("service worker is active...");
        }

        if(swRegistration.waiting) {
            console.info("service worker is in waiting mode...");
        }
    }
});

addEventListener("offline", (_ev) => {
    console.warn("working offline...");
});

addEventListener("online", (_ev) => {
    console.info("back online!");
})