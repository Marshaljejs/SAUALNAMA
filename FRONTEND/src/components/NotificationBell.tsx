import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/context/AuthContext";
import { fetchNotifications, markAllNotificationsRead } from "@/lib/api";

interface Notification {
  id: number;
  type: string;
  message: string;
  entity_id: string | null;
  is_read: boolean;
  created_at: string;
}

const POLL_INTERVAL = 30_000; // 30 сек

const NotificationBell = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unread, setUnread] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  const loadNotifications = async () => {
    if (!user) return;
    try {
      const data = await fetchNotifications();
      setNotifications(data.data);
      setUnread(data.unreadCount);
    } catch {
      // Тихая ошибка — не ломаем UI
    }
  };

  useEffect(() => {
    if (!user) return;
    loadNotifications();
    const interval = setInterval(loadNotifications, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [user]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleOpen = async () => {
    setOpen((v) => !v);
    if (!open && unread > 0) {
      try {
        await markAllNotificationsRead();
        setUnread(0);
        setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      } catch {
        // ignore
      }
    }
  };

  if (!user) return null;

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    const now = new Date();
    const diff = Math.floor((now.getTime() - d.getTime()) / 1000);
    if (diff < 60) return `${diff}с`;
    if (diff < 3600) return `${Math.floor(diff / 60)}м`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}ч`;
    return `${Math.floor(diff / 86400)}д`;
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={handleOpen}
        className="relative rounded-lg p-2 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        aria-label={t("notifications.title")}
      >
        <Bell className="h-4 w-4" />
        <AnimatePresence>
          {unread > 0 && (
            <motion.span
              key="badge"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[9px] font-bold text-white"
            >
              {unread > 9 ? "9+" : unread}
            </motion.span>
          )}
        </AnimatePresence>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.96 }}
            transition={{ duration: 0.14 }}
            className="absolute right-0 top-full mt-2 z-50 w-72 rounded-2xl border border-border bg-background shadow-xl overflow-hidden"
          >
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <span className="text-sm font-semibold text-foreground">
                {t("notifications.title")}
              </span>
            </div>

            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="px-4 py-8 text-center">
                  <Bell className="mx-auto h-8 w-8 text-muted-foreground/30 mb-2" />
                  <p className="text-xs text-muted-foreground">
                    {t("notifications.noNotifications")}
                  </p>
                </div>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n.id}
                    className={`flex items-start gap-3 border-b border-border/50 px-4 py-3 last:border-0 ${
                      !n.is_read ? "bg-primary/5" : ""
                    }`}
                  >
                    <div className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
                      n.type === "new_response" ? "bg-green-100 dark:bg-green-900/30" : "bg-amber-100 dark:bg-amber-900/30"
                    }`}>
                      <i className={`text-xs ${
                        n.type === "new_response"
                          ? "fa-solid fa-reply text-green-600 dark:text-green-400"
                          : "fa-solid fa-medal text-amber-600 dark:text-amber-400"
                      }`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-foreground leading-snug line-clamp-2">{n.message}</p>
                      <p className="mt-0.5 text-[10px] text-muted-foreground">{formatTime(n.created_at)}</p>
                    </div>
                    {!n.is_read && (
                      <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
                    )}
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationBell;
