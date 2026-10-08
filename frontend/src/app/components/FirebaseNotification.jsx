"use client";

import { useEffect } from "react";
import { requestNotificationPermission } from "../utils/notifications.js";

export default function FirebaseNotification() {
  useEffect(() => {
    requestNotificationPermission();
  }, []);

  return null;
}