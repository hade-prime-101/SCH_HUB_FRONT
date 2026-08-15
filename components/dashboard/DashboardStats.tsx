import Link from "next/link";
import { SectionHeader } from "@/components/shared/DashboardPrimitives";

interface StatItem {
  value: number;
  label: string;
  href: string;
}

interface DashboardStatsProps {
  stats: StatItem[];
  loading: boolean;
}

export function DashboardStats({ stats, loading }: DashboardStatsProps) {
  return (
    <section>
      <SectionHeader title="Today at a glance" />
      <div className="grid grid-cols-4 gap-2">
        {stats.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className="bg-card rounded-2xl px-2 py-3 text-center active:scale-95 transition-transform"
          >
            <p className="text-xl font-bold text-foreground">
              {loading ? "—" : item.value}
            </p>
            <p className="text-[11px] text-muted-foreground font-medium mt-0.5">
              {item.label}
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}