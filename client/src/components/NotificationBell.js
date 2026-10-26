import React, { useState, useEffect, useCallback } from "react";
import api from "../utils/api";
import { getSocket } from "../utils/socket";

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const load = useCallback(async () => {
    try {
      const res = await api.get("/notifications?limit=15");
      setNotifications(res.data.notifications || []);
      setUnreadCount(res.data.unreadCount || 0);
    } catch {
      setNotifications([]);
      setUnreadCount(0);
    }
  }, []);

  useEffect(() => {
    load();
    const socket = getSocket();
    const onNew = () => load();
    socket?.on("notification:new", onNew);
    return () => socket?.off("notification:new", onNew);
  }, [load]);

  const markRead = async (id) => {
    await api.patch(`/notifications/${id}/read`);
    load();
  };

  const markAllRead = async () => {
    await api.post("/notifications/read-all");
    load();
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="relative p-2 rounded-lg hover:bg-cyan-500/10 text-cyan-200"
        aria-label="Notifications"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 max-h-96 overflow-y-auto rounded-xl border border-cyan-300/20 bg-slate-950 shadow-2xl z-50">
          <div className="px-4 py-3 border-b border-cyan-300/10 flex justify-between items-center">
            <p className="text-sm font-semibold text-white">Notifications</p>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllRead}
                className="text-xs text-cyan-300 hover:text-cyan-200"
              >
                Mark all read
              </button>
            )}
          </div>
          {notifications.length === 0 && (
            <p className="px-4 py-6 text-sm text-slate-400 text-center">No notifications</p>
          )}
          {notifications.map((n) => (
            <button
              key={n._id}
              type="button"
              onClick={() => !n.read && markRead(n._id)}
              className={`w-full text-left px-4 py-3 border-b border-cyan-300/5 hover:bg-slate-900 ${
                n.read ? "opacity-70" : "bg-cyan-500/5"
              }`}
            >
              <p className="text-sm font-semibold text-white">{n.title}</p>
              <p className="text-xs text-slate-400 mt-0.5">{n.message}</p>
              <p className="text-[10px] text-slate-500 mt-1">
                {new Date(n.createdAt).toLocaleString("en-IN")}
              </p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
