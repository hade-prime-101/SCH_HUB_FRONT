import Link from "next/link";
import { SectionHeader, LoadingState, EmptyState } from "@/components/shared/DashboardPrimitives";

type Notice = {
  id: string;
  content: string;
};

interface NoticeBoardProps {
  notices: Notice[];
  loading: boolean;
}

export function NoticeBoard({ notices, loading }: NoticeBoardProps) {
  return (
    <section>
      <SectionHeader title="Notice Board" href="/community/posts" />
      {loading ? (
        <LoadingState label="Loading notices" />
      ) : notices.length === 0 ? (
        <EmptyState>No notices at the moment.</EmptyState>
      ) : (
        <div className="flex flex-col divide-y divide-border/50">
          {notices.map((notice) => (
            <Link
              key={notice.id}
              href={`/community/${notice.id}`}
              className="block py-3 first:pt-0 last:pb-0 border-l-4 border-warning pl-3 hover:bg-muted/30 rounded-r-lg transition-colors"
            >
              <p className="text-sm font-medium text-foreground line-clamp-2">{notice.content}</p>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}