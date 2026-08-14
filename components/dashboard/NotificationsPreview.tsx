import { SectionHeader, LoadingState, EmptyState } from "@/components/shared/DashboardPrimitives";
import { Bell } from "lucide-react";
import { timeAgo } from "@/lib/dashboard-utils";

interface Notification {
  id: string;
  title?: string | null;
  message?: string | null;
  createdAt: string;
  isRead?: boolean;
}

interface NotificationsPreviewProps {
  notifications: Notification[];
  loading: boolean;
}

export function NotificationsPreview({ notifications, loading }: NotificationsPreviewProps) {
  return (
    <section>
      <SectionHeader title="Recent notifications" href="/dashboard/notifications" />

      {loading ? (
        <LoadingState label="Loading notifications" />
      ) : notifications.length === 0 ? (
        <EmptyState>No new notifications.</EmptyState>
      ) : (
        <div className="flex flex-col divide-y divide-border/50">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={`flex items-start gap-3 py-3 first:pt-0 last:pb-0 ${
                notification.isRead
                  ? ""
                  : "border-l-4 border-primary pl-3 bg-accent/10 -ml-1 rounded-r-lg"
              }`}
            >
              <Bell className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />

              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground leading-tight line-clamp-1">
                  {notification.title ?? notification.message ?? "Notification"}
                </p>
                {notification.title && notification.message && (
                  <p className="text-sm text-muted-foreground line-clamp-2 mt-0.5">
                    {notification.message}
                  </p>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  {timeAgo(notification.createdAt)}
                </p>
              </div>

              {!notification.isRead && (
                <span
                  className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1.5"
                  aria-label="Unread"
                />
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}