import Link from "next/link";
import { SectionHeader, LoadingState, EmptyState } from "@/components/shared/DashboardPrimitives";
import { MapPin } from "lucide-react";
import { formatTime, getClassStatus } from "@/lib/dashboard-utils";

type AgendaItem = {
  id: string;
  title: string;
  startTime?: string | null;
  endTime?: string | null;
  venue?: string | null;
};

interface SchedulePreviewProps {
  items: AgendaItem[];
  loading: boolean;
}

export function SchedulePreview({ items, loading }: SchedulePreviewProps) {
  return (
    <section className="bg-card rounded-2xl p-5">
      <SectionHeader title="Today's schedule" action="Full timetable" href="/campus/timetable" />

      {loading ? (
        <LoadingState label="Loading today's schedule" />
      ) : items.length === 0 ? (
        <EmptyState>No classes scheduled today.</EmptyState>
      ) : (
        <div className="flex flex-col gap-3">
          {items.slice(0, 4).map((item) => {
            const status = getClassStatus(item.startTime, item.endTime);
            return (
              <div key={item.id} className="flex items-start gap-3 bg-muted/30 rounded-2xl p-3">
                <div className="w-14 shrink-0 rounded-xl bg-category-timetable-bg text-category-timetable flex flex-col items-center justify-center py-1.5">
                  <span className="text-sm font-bold">
                    {formatTime(item.startTime).split(" ")[0] || "--"}
                  </span>
                  <span className="text-[10px] font-medium uppercase">
                    {formatTime(item.startTime).split(" ")[1] || ""}
                  </span>
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground truncate">{item.title}</p>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-0.5 text-xs text-muted-foreground">
                    {item.venue ? (
                      <span className="flex items-center gap-1 min-w-0">
                        <MapPin className="w-3 h-3 shrink-0" />
                        <span className="truncate">{item.venue}</span>
                      </span>
                    ) : (
                      <span>No venue</span>
                    )}
                    <span className={`font-medium ${status.color}`}>• {status.label}</span>
                  </div>
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