"use client";

import { useState, useEffect } from "react";
import { Loader2, CheckCircle, Trash2, AlertCircle } from "lucide-react";
import { communityApi } from "@/lib/api/community";
import type { Mentor } from "@/types/community";

export default function AdminMentorsPage() {
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"pending" | "approved" | "all">("all");

  useEffect(() => {
    const loadMentors = async () => {
      try {
        const data = await communityApi.getMentors({ limit: "100" });
        setMentors(Array.isArray(data) ? data : data?.data ?? []);
      } catch (error) {
        console.error("Failed to load mentors:", error);
      } finally {
        setLoading(false);
      }
    };
    loadMentors();
  }, []);

  const handleApprove = async (mentorId: string) => {
    try {
      await communityApi.approveMentor(mentorId);
      setMentors(
        mentors.map((m) =>
          m.id === mentorId ? { ...m, verified: true } : m
        )
      );
    } catch (error) {
      console.error("Failed to approve mentor:", error);
    }
  };

  const handleReject = async (mentorId: string) => {
    if (!confirm("Are you sure you want to reject this mentor?")) return;
    try {
      await communityApi.rejectMentor(mentorId);
      setMentors(mentors.filter((m) => m.id !== mentorId));
    } catch (error) {
      console.error("Failed to reject mentor:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const filteredMentors = mentors.filter((mentor) => {
    if (filter === "pending") return !mentor.verified;
    if (filter === "approved") return mentor.verified;
    return true;
  });

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-foreground">Mentors Management</h2>
        <span className="text-sm text-muted-foreground">{filteredMentors.length} mentors</span>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-3 mb-6">
        {(["all", "pending", "approved"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors capitalize ${
              filter === tab
                ? "bg-primary text-primary-foreground"
                : "bg-card text-foreground hover:bg-accent"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {filteredMentors.length === 0 ? (
        <div className="bg-card rounded-2xl p-12 text-center">
          <p className="text-muted-foreground">
            {filter === "pending" ? "No pending requests" : "No mentors found"}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredMentors.map((mentor) => (
            <div
              key={mentor.id}
              className={`bg-card rounded-2xl p-6 border-l-4 ${
                mentor.verified ? "border-l-green-500" : "border-l-amber-500"
              }`}
            >
              <div className="flex justify-between items-start gap-4 mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-bold text-lg text-foreground">
                      {mentor.user?.fullName ?? "Unknown"}
                    </h3>
                    {mentor.verified && (
                      <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" />
                        Verified
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{mentor.user?.email}</p>
                </div>
              </div>

              {mentor.bio && (
                <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                  {mentor.bio}
                </p>
              )}

              <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Expertise:</span>
                  <p className="font-medium text-foreground capitalize">
                    {mentor.expertise?.toLowerCase().replace(/_/g, " ")}
                  </p>
                </div>
                {mentor.courseTag && (
                  <div>
                    <span className="text-muted-foreground">Course:</span>
                    <p className="font-medium text-foreground">{mentor.courseTag}</p>
                  </div>
                )}
              </div>

              {!mentor.verified && (
                <div className="flex gap-2">
                  <button
                    onClick={() => handleApprove(mentor.id)}
                    className="flex-1 px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors font-medium flex items-center justify-center gap-2"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Approve
                  </button>
                  <button
                    onClick={() => handleReject(mentor.id)}
                    className="flex-1 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors font-medium flex items-center justify-center gap-2"
                  >
                    <AlertCircle className="w-4 h-4" />
                    Reject
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
