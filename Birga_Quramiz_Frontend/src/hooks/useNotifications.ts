"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { getSocket } from "@/lib/tracking/socket";
import {
  getUnreadCount,
  markNotificationRead,
  markAllNotificationsRead,
  getNotifications,
  type Notification,
} from "@/lib/api/notifications";

const NOTIFICATION_NEW = "notification.new";

export function useNotifications(enabled: boolean) {
  const [unreadCount, setUnreadCount]     = useState(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading]             = useState(false);
  const fetchedRef                        = useRef(false);

  // Fetch initial unread count once
  useEffect(() => {
    if (!enabled || fetchedRef.current) return;
    fetchedRef.current = true;

    getUnreadCount()
      .then((r) => setUnreadCount(r.count))
      .catch(() => {});
  }, [enabled]);

  // Listen for real-time notifications via the shared /tracking socket
  useEffect(() => {
    if (!enabled) return;

    const socket = getSocket();

    function onNew(notification: Notification) {
      setNotifications((prev) => [notification, ...prev]);
      setUnreadCount((n) => n + 1);
    }

    socket.on(NOTIFICATION_NEW, onNew);
    return () => { socket.off(NOTIFICATION_NEW, onNew); };
  }, [enabled]);

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getNotifications(1, 20);
      setNotifications(res.data);
      setUnreadCount(res.meta.unread);
    } catch {
      //
    } finally {
      setLoading(false);
    }
  }, []);

  const markRead = useCallback(async (id: string) => {
    await markNotificationRead(id).catch(() => {});
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, readAt: new Date().toISOString() } : n))
    );
    setUnreadCount((c) => Math.max(0, c - 1));
  }, []);

  const markAllRead = useCallback(async () => {
    await markAllNotificationsRead().catch(() => {});
    setNotifications((prev) => prev.map((n) => ({ ...n, readAt: n.readAt ?? new Date().toISOString() })));
    setUnreadCount(0);
  }, []);

  return { unreadCount, notifications, loading, loadNotifications, markRead, markAllRead };
}
