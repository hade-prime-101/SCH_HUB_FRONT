"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Users, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CommunityHeader } from "@/components/community/CommunityHeader";
import { MentorCard } from "@/components/community/MentorCard";
import { CommunityEmptyState } from "@/components/community/CommunityEmptyState";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { listMentors } from "@/lib/api/community.api";
import type { Mentor } from "@/types/community";

export default function MentorsList() {
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMentors = async () => {
      setLoading(true);
      try {
        const data = await listMentors();
        setMentors(data);
      } catch (err: any) {
        setError(err.message || "Failed to load mentors");
      } finally {
        setLoading(false);
      }
    };
    fetchMentors();
  }, []);

  if (error) {
    return <ErrorMessage message={error} />;
  }

  return (
    <div className="pb-24">
      <CommunityHeader
        title="Mentors"
        description="Find mentors or become one for your courses"
        action={
          <Button asChild>
            <Link href="/community/mentors/register">
              <Plus className="w-4 h-4 mr-1.5" />
              Become a Mentor
            </Link>
          </Button>
        }
      />

      {loading ? (
        <LoadingSkeleton count={3} height="h-28" />
      ) : (
        <>
          {mentors.length === 0 ? (
            <CommunityEmptyState
              icon={<Users className="w-8 h-8" />}
              title="No mentors yet"
              description="Be the first to register as a mentor and help fellow students!"
              action={
                <Button asChild>
                  <Link href="/community/mentors/register">Register as Mentor</Link>
                </Button>
              }
            />
          ) : (
            <div className="space-y-4">
              {mentors.map((m) => (
                <MentorCard key={m.id} mentor={m} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}