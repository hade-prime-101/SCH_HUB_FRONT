// app/dashboard/notifications/page.tsx
"use client";
import { useEffect, useState } from "react";
import {
  listNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
} from "@/lib/api/notifications.api";
import type { Notification } from "@/types/notifications";
import Link from "next/link";

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const limit = 10;

  const fetchNotifications = () => {
    listNotifications({ page, limit }).then((res) => {
      setNotifications(res.data);
      setTotal(res.total);
      setUnreadCount(res.unreadCount);
    });
  };

  useEffect(() => {
    fetchNotifications();
  }, [page]);

  const handleMarkRead = async (id: string) => {
    await markAsRead(id);
    fetchNotifications();
  };

  const handleDelete = async (id: string) => {
    await deleteNotification(id);
    fetchNotifications();
  };

  const handleMarkAllRead = async () => {
    await markAllAsRead();
    fetchNotifications();
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Notifications</h1>
        <div className="flex items-center gap-3">
          {unreadCount > 0 && (
            <span className="bg-red-500 text-primary-foreground text-xs font-bold px-2 py-1 rounded-full">
              {unreadCount} unread
            </span>
          )}
          <button
            onClick={handleMarkAllRead}
            className="text-sm bg-secondary/50 px-3 py-1 rounded hover:bg-gray-300"
          >
            Mark all read
          </button>
          <Link
            href="/dashboard/notifications/settings"
            className="text-sm text-primary hover:underline"
          >
            Settings
          </Link>
        </div>
      </div>

      {notifications.length === 0 ? (
        <p className="text-muted-foreground">No notifications.</p>
      ) : (
        <ul className="space-y-2">
          {notifications.map((n) => (
            <li
              key={n.id}
              className={`p-3 rounded border ${
                n.isRead ? "bg-card" : "bg-blue-50 border-blue-200"
              } flex justify-between items-start`}
            >
              <div>
                <p className="font-medium">{n.title}</p>
                <p className="text-sm text-muted-foreground">{n.body}</p>
                <p className="text-xs text-muted-foreground/70 mt-1">
                  {new Date(n.createdAt).toLocaleString()}
                </p>
              </div>
              <div className="flex gap-2 text-sm">
                {!n.isRead && (
                  <button
                    onClick={() => handleMarkRead(n.id)}
                    className="text-primary hover:underline"
                  >
                    Mark read
                  </button>
                )}
                <button
                  onClick={() => handleDelete(n.id)}
                  className="text-red-600 hover:underline"
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Pagination */}
      {total > limit && (
        <div className="flex justify-between mt-6">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="px-3 py-1 bg-secondary/50 rounded disabled:opacity-50"
          >
            Previous
          </button>
          <span className="text-sm">
            Page {page} of {Math.ceil(total / limit)}
          </span>
          <button
            disabled={page * limit >= total}
            onClick={() => setPage((p) => p + 1)}
            className="px-3 py-1 bg-secondary/50 rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}