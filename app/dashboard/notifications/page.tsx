"use client";

import { useState } from "react";
import { usePaginatedQuery } from "@/lib/hooks/usePaginatedQuery";
import {
  listNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
} from "@/lib/api/notifications.api";
import type { Notification } from "@/types/notifications";
import Link from "next/link";
import { PageHeader } from "@/components/shared/PageHeader";
import { LoadingState, EmptyState } from "@/components/shared/DashboardPrimitives";
import { ErrorState } from "@/components/shared/ErrorState";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Pagination } from "@/components/ui/Pagination";

export default function NotificationsPage() {
  const [page, setPage] = useState(1);
  const limit = 10;

  const { data, total, loading, error, refetch } = usePaginatedQuery<Notification>(
    ({ page, limit }) => listNotifications({ page, limit }),
    { page, limit }
  );

  const unreadCount = data?.filter((n) => !n.isRead).length ?? 0;

  const handleMarkRead = async (id: string) => {
    await markAsRead(id);
    refetch();
  };

  const handleDelete = async (id: string) => {
    await deleteNotification(id);
    refetch();
  };

  const handleMarkAllRead = async () => {
    await markAllAsRead();
    refetch();
  };

  if (loading) return <LoadingState label="Loading notifications" />;
  if (error) return <ErrorState title="Failed to load notifications" description={error.message} onRetry={refetch} />;

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-6">
      <PageHeader
        title="Notifications"
        description={unreadCount > 0 ? `${unreadCount} unread` : "All caught up"}
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            {unreadCount > 0 && (
              <Badge variant="destructive" size="sm">
                {unreadCount} unread
              </Badge>
            )}
            <Button variant="outline" size="sm" onClick={handleMarkAllRead}>
              Mark all read
            </Button>
            <Link href="/dashboard/notifications/settings" className="text-sm text-primary hover:underline">
              Settings
            </Link>
          </div>
        }
      />

      {!data || data.length === 0 ? (
        <EmptyState>No notifications.</EmptyState>
      ) : (
        <>
          <div className="space-y-2 mt-4">
            {data.map((n) => (
              <Card
                key={n.id}
                compact
                className={n.isRead ? "" : "border-l-4 border-primary bg-accent/10"}
              >
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                  <div>
                    <p className="font-medium">{n.title}</p>
                    <p className="text-sm text-muted-foreground">{n.body}</p>
                    <p className="text-xs text-muted-foreground/70 mt-1">
                      {new Date(n.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    {!n.isRead && (
                      <Button variant="ghost" size="xs" onClick={() => handleMarkRead(n.id)}>
                        Mark read
                      </Button>
                    )}
                    <Button variant="destructive" size="xs" onClick={() => handleDelete(n.id)}>
                      Delete
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {total > limit && (
            <Pagination
              currentPage={page}
              totalPages={Math.ceil(total / limit)}
              onPageChange={setPage}
              showPageNumber
            />
          )}
        </>
      )}
    </div>
  );
}