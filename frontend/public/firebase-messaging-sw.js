importScripts("https://www.gstatic.com/firebasejs/10.13.2/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.13.2/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyCJTfDjjwU_QTD4SzLavnklQ359qvFUHkg",
  authDomain: "star-agro-45476.firebaseapp.com",
  projectId: "star-agro-45476",
  storageBucket: "star-agro-45476.firebasestorage.app",
  messagingSenderId: "291557752026",
  appId: "1:291557752026:web:aac3d2d5ca376eb7f9f9e3",
});

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(Promise.resolve());
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    try {
      await self.clients.claim();
      await caches.keys().then((cacheNames) => Promise.all(cacheNames.map((name) => caches.delete(name))));

      const dbNames = ["firebase-messaging-database"];
      await Promise.all(dbNames.map((dbName) => new Promise((resolve) => {
        const request = indexedDB.deleteDatabase(dbName);
        request.onsuccess = () => resolve();
        request.onerror = () => resolve();
        request.onblocked = () => resolve();
      })));
    } catch (error) {
      console.warn("Service worker cleanup warning", error);
    }
  })());
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const title = payload?.notification?.title || "New notification";
  const body = payload?.notification?.body || "You have a new message";

  self.registration.showNotification(title, {
    body,
    icon: "/logo.png",
  });
});