import Link from "next/link";
import { SectionHeader, LoadingState, EmptyState } from "@/components/shared/DashboardPrimitives";
import { MapPin } from "lucide-react";
import { formatTime, getReminderStatus } from "@/lib/dashboard-utils";

interface ReminderItem {
  id: string;
  title: string;
  startTime?: string | null;
  venue?: string | null;
}

interface RemindersPreviewProps {
  items: ReminderItem[];
  loading: boolean;
}

export function RemindersPreview({ items, loading }: RemindersPreviewProps) {
  return (
    <section className="bg-card rounded-2xl p-5">
      <SectionHeader title="Due Reminders" action="View planner" href="/dashboard/planner" />

      {loading ? (
        <LoadingState label="Loading reminders" />
      ) : items.length === 0 ? (
        <EmptyState>Nothing due today. You&apos;re clear.</EmptyState>
      ) : (
        <div className="flex flex-col gap-3">
          {items.slice(0, 3).map((item) => {
            const status = getReminderStatus(item.startTime);
            return (
              <div
                key={item.id}
                className="flex items-start gap-3 bg-muted/30 rounded-2xl p-3 transition-colors hover:bg-muted/50"
              >
                <div className="flex flex-col items-center justify-center w-12 shrink-0">
                  <span className="text-xs font-semibold text-foreground">
                    {item.startTime ? formatTime(item.startTime) : "--"}
                  </span>
                  <span className={`text-[10px] font-medium ${status.color}`}>{status.label}</span>
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{item.title}</p>
                  {item.venue && (
                    <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                      <MapPin className="w-3 h-3 shrink-0" />
                      <span className="truncate">{item.venue}</span>
                    </p>
                  )}
                </div>

                {item.venue && (
                  <Link
                    href={`/campus/map?q=${encodeURIComponent(item.venue)}`}
                    className="w-8 h-8 rounded-full bg-accent flex items-center justify-center shrink-0 hover:bg-accent/70 transition-colors"
                    aria-label={`Open ${item.venue} in map`}
                  >
                    <MapPin className="w-4 h-4 text-primary" />
                  </Link>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}