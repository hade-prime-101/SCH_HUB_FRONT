import { Badge } from "@/components/ui/badge";
import { CommunityCard } from "./CommunityCard";
import type { Mentor } from "@/types/community";

interface MentorCardProps {
  mentor: Mentor;
}

export function MentorCard({ mentor }: MentorCardProps) {
  return (
    <CommunityCard>
      <div className="flex items-start gap-3">
        {mentor.avatar && (
          <img
            src={mentor.avatar}
            alt={mentor.name}
            className="w-12 h-12 rounded-full object-cover"
          />
        )}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-foreground">{mentor.name}</h3>
          <div className="flex flex-wrap gap-1.5 mt-1">
            {mentor.expertise.map((exp) => (
              <Badge key={exp} variant="secondary" size="sm">
                {exp}
              </Badge>
            ))}
          </div>
          <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{mentor.bio}</p>
          <div className="mt-2">
            <Badge
              variant={mentor.available ? "success" : "subtle"}
              size="sm"
            >
              {mentor.available ? "Available" : "Unavailable"}
            </Badge>
          </div>
        </div>
      </div>
    </CommunityCard>
  );
}