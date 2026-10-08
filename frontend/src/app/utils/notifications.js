import { getToken } from "firebase/messaging";
import { messaging } from "./firebase";
import api from "../utils/api";

function getOrCreateDeviceId() {
    if (typeof window === "undefined") return null;

    let deviceId = localStorage.getItem("device_id");
    if (!deviceId) {
        deviceId = typeof crypto !== "undefined" && crypto.randomUUID
            ? crypto.randomUUID()
            : `device-${Date.now()}-${Math.random().toString(16).slice(2)}`;
        localStorage.setItem("device_id", deviceId);
    }

    return deviceId;
}

function getLoggedInUserId() {
    if (typeof window === "undefined") return null;

    try {
        const savedUser = localStorage.getItem("user");
        if (savedUser) {
            const parsedUser = JSON.parse(savedUser);
            if (parsedUser?.id) return String(parsedUser.id);
            if (parsedUser?.user?.id) return String(parsedUser.user.id);
        }

        const token = localStorage.getItem("token");
        if (!token) return null;

        const payload = token.split(".")[1];
        if (!payload) return null;

        const decodedPayload = JSON.parse(atob(payload));
        return decodedPayload?.id || decodedPayload?.userId || null;
    } catch (error) {
        console.warn("Unable to read logged-in user from storage", error);
        return null;
    }
}

async function clearFirebaseMessagingState() {
    if (typeof window === "undefined") return;

    try {
        if ("serviceWorker" in navigator) {
            const registrations = await navigator.serviceWorker.getRegistrations();
            await Promise.all(registrations.map((registration) => registration.unregister()));
        }
    } catch (error) {
        console.warn("Unable to unregister service workers", error);
    }

    try {
        if ("indexedDB" in window) {
            const dbNames = ["firebase-messaging-database"];
            await Promise.all(dbNames.map((dbName) => new Promise((resolve) => {
                const request = indexedDB.deleteDatabase(dbName);
                request.onsuccess = () => resolve();
                request.onerror = () => resolve();
                request.onblocked = () => resolve();
            })));
        }
    } catch (error) {
        console.warn("Unable to clear Firebase messaging IndexedDB", error);
    }
}

export async function requestNotificationPermission() {

    if (typeof window === "undefined" || !("Notification" in window)) {
        console.log("Browser doesn't support notifications");
        return null;
    }

    await clearFirebaseMessagingState();

    const permission = await Notification.requestPermission();

    if (permission !== "granted") {
        console.log("Permission denied");
        return null;
    }

    try {

        const token = await getToken(messaging, {
            vapidKey: "BDBLONSOxw_zIQmuGMS9y7wZLb39KVXcNbudp7m3GH_VZw8Su8cjPdXmTFqMwLl2btO-EeyZGUTln3LGVu0-vdU"
        });

        console.log("FCM Token:", token);

        const deviceId = getOrCreateDeviceId();
        const userId = getLoggedInUserId();
        if (token) {
            try {
                await api.post('/token-save', { fcmToken: token, deviceId, userId });
                console.log('FCM token saved to backend');
            } catch (saveError) {
                console.error('Failed to save FCM token to backend', saveError);
            }
        }

        return token;

    } catch (error) {

        console.log(error);

    }

}