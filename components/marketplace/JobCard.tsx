import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Job } from "@/types/marketplace";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface JobCardProps {
  job: Job;
  className?: string;
}

export function JobCard({ job, className }: JobCardProps) {
  return (
    <Card className={cn("p-4 transition-all hover:shadow-md", className)}>
      <Link href={`/marketplace/jobs/${job.id}`} className="block">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-semibold text-foreground">{job.title}</h3>
            <p className="text-sm text-muted-foreground">{job.company || "Unknown"}</p>
          </div>
          <Badge
            variant={
              job.status === "APPROVED"
                ? "success"
                : job.status === "PENDING"
                ? "warning"
                : "destructive"
            }
          >
            {job.status}
          </Badge>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
          {job.location && <span>📍 {job.location}</span>}
          {job.salary && <span>💰 {job.salary}</span>}
        </div>
      </Link>
    </Card>
  );
}