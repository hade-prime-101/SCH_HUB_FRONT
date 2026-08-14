import Link from "next/link";
import { Clock, MapPin, GraduationCap, ChevronRight } from "lucide-react";
import { formatTime } from "@/lib/dashboard-utils";

type NextUpProps = {
  nextClass: {
    title: string;
    startTime?: string | null;
    endTime?: string | null;
    venue?: string | null;
  } | null;
  loading: boolean;
};

export function NextUp({ nextClass, loading }: NextUpProps) {
  return (
    <section aria-labelledby="next-up-heading">
      <p
        id="next-up-heading"
        className="text-xs font-bold tracking-wider text-muted-foreground uppercase mb-2"
      >
        Next up
      </p>

      <div className="bg-primary text-primary-foreground rounded-3xl p-5 shadow-sm">
        {loading ? (
          <div className="flex justify-center py-5">
            <span className="sr-only">Loading next class</span>
            <div
              className="w-6 h-6 rounded-full border-2 border-current border-t-transparent animate-spin"
              aria-hidden="true"
            />
          </div>
        ) : nextClass ? (
          <>
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-2xl font-bold leading-tight">{nextClass.title}</p>

                <div className="flex items-center gap-2 mt-3 text-sm opacity-90">
                  <Clock className="w-4 h-4 shrink-0" />
                  <span>
                    {formatTime(nextClass.startTime)}
                    {nextClass.endTime ? ` – ${formatTime(nextClass.endTime)}` : ""}
                  </span>
                </div>

                {nextClass.venue && (
                  <div className="flex items-center gap-2 mt-1.5 text-sm opacity-90">
                    <MapPin className="w-4 h-4 shrink-0" />
                    <span className="truncate">{nextClass.venue}</span>
                  </div>
                )}
              </div>

              <div className="w-11 h-11 rounded-2xl bg-primary-foreground/10 flex items-center justify-center shrink-0">
                <GraduationCap className="w-5 h-5" />
              </div>
            </div>

            {nextClass.venue && (
              <Link
                href={`/campus/map?q=${encodeURIComponent(nextClass.venue)}`}
                className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-primary-foreground text-primary px-4 py-2.5 text-sm font-bold"
              >
                Open map
                <ChevronRight className="w-4 h-4" />
              </Link>
            )}
          </>
        ) : (
          <div>
            <p className="text-xl font-bold">You&apos;re all caught up</p>
            <p className="text-sm opacity-80 mt-1">Nothing scheduled for the next few hours.</p>
          </div>
        )}
      </div>
    </section>
  );
}