import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StudyGroup } from "@/types/study-groups";

interface GroupCardProps {
  group: StudyGroup;
  onJoin?: (id: string) => void;
  onLeave?: (id: string) => void;
  showActions?: boolean;
}

export function GroupCard({ group, onJoin, onLeave, showActions = false }: GroupCardProps) {
  return (
    <Card compact className="flex flex-col justify-between h-full">
      <div>
        <Link href={`/dashboard/study-groups/${group.id}`} className="font-medium text-primary hover:underline">
          {group.name}
        </Link>
        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{group.description}</p>
        <p className="text-xs text-muted-foreground/70 mt-2">{group.memberCount} members</p>
      </div>
      {showActions && (
        <div className="flex gap-2 mt-3">
          <Button size="sm" variant="default" onClick={() => onJoin?.(group.id)}>Join</Button>
          <Button size="sm" variant="outline" onClick={() => onLeave?.(group.id)}>Leave</Button>
        </div>
      )}
    </Card>
  );
}