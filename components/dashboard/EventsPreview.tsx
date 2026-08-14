import Link from "next/link";
import { SectionHeader, LoadingState } from "@/components/shared/DashboardPrimitives";
import { Calendar, Clock, MapPin, ChevronRight } from "lucide-react";
import { formatEventDate } from "@/lib/dashboard-utils";

interface EventItem {
  id: string;
  title: string;
  startDate: string;
  venue?: string | null;
  time?: string | null;
}

interface EventsPreviewProps {
  items: EventItem[];
  loading: boolean;
}

export function EventsPreview({ items, loading }: EventsPreviewProps) {
  return (
    <section className="bg-card rounded-2xl p-5">
      <SectionHeader title="Upcoming events" href="/campus/events" />

      {loading ? (
        <LoadingState label="Loading upcoming events" />
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-6 text-center">
          <Calendar className="w-10 h-10 text-muted-foreground/50 mb-2" />
          <p className="text-sm text-muted-foreground">No upcoming events.</p>
          <p className="text-xs text-muted-foreground/70 mt-1">
            Check back later or{" "}
            <Link href="/campus/events/new" className="text-primary hover:underline">
              create one
            </Link>
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {items.slice(0, 2).map((event) => {
            const { day, month } = formatEventDate(event.startDate);
            return (
              <div key={event.id} className="flex items-start gap-4 bg-muted/30 rounded-2xl p-3">
                <div className="w-14 shrink-0 rounded-xl bg-category-events-bg text-category-events flex flex-col items-center justify-center py-1.5">
                  <span className="text-lg font-bold">{day}</span>
                  <span className="text-[10px] font-medium uppercase">{month}</span>
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground truncate">{event.title}</p>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-0.5 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {event.time || "All day"}
                    </span>
                    {event.venue && (
                      <Link
                        href={`/campus/map?q=${encodeURIComponent(event.venue)}`}
                        className="flex items-center gap-1 hover:text-primary transition-colors"
                      >
                        <MapPin className="w-3.5 h-3.5" />
                        <span className="truncate max-w-[120px]">{event.venue}</span>
                      </Link>
                    )}
                  </div>
                </div>

                <ChevronRight className="w-4 h-4 text-muted-foreground/30 shrink-0 self-center" />
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}