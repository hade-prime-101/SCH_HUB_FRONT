import Link from "next/link";
import { SectionHeader } from "@/components/shared/DashboardPrimitives";
import { CalendarDays, CheckCircle2, MapPin, GraduationCap, Sparkles, Calendar } from "lucide-react";

const QUICK_ACTIONS = [
  {
    icon: CalendarDays,
    label: "Timetable",
    href: "/campus/timetable",
    accent: "bg-[color-category-timetable-bg] text-[color-category-timetable]",
  },
  {
    icon: CheckCircle2,
    label: "Planner",
    href: "/dashboard/planner",
    accent: "bg-[color-category-planner-bg] text-[color-category-planner]",
  },
  {
    icon: MapPin,
    label: "Campus Map",
    href: "/campus/map",
    accent: "bg-[color-category-campus-bg] text-[color-category-campus]",
  },
  {
    icon: GraduationCap,
    label: "Study",
    href: "/study",
    accent: "bg-primary/10 text-primary",
  },
  {
    icon: Sparkles,
    label: "AI Tools",
    href: "/study",
    accent: "bg-[color-category-ai-bg] text-[color-category-ai]",
  },
  {
    icon: Calendar,
    label: "Events",
    href: "/campus/events",
    accent: "bg-[color-category-events-bg] text-[color-category-events]",
  },
];

export function QuickActions() {
  return (
    <section>
      <SectionHeader title="Quick actions" />
      <div className="grid grid-cols-3 gap-3">
        {QUICK_ACTIONS.map(({ icon: Icon, label, href, accent }) => (
          <Link
            key={label}
            href={href}
            className="bg-card rounded-2xl p-3 flex flex-col items-center gap-2 active:scale-95 transition-transform"
          >
            <span className={`w-11 h-11 rounded-xl flex items-center justify-center ${accent}`}>
              <Icon className="w-5 h-5" />
            </span>
            <span className="text-xs font-semibold text-foreground text-center leading-tight">
              {label}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}