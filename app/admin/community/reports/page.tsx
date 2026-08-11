"use client";

import { useState, useEffect } from "react";
import { Loader2, CheckCircle, Trash2 } from "lucide-react";
import { communityApi } from "@/lib/api/community";
import type { Report } from "@/types/community";

export default function AdminReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"pending" | "resolved">("pending");

  useEffect(() => {
    const loadReports = async () => {
      try {
        const data = await communityApi.getReports({ limit: "100" });
        setReports(Array.isArray(data) ? data : data?.data ?? []);
      } catch (error) {
        console.error("Failed to load reports:", error);
      } finally {
        setLoading(false);
      }
    };
    loadReports();
  }, []);

  const handleResolve = async (reportId: string) => {
    try {
      await communityApi.resolveReport(reportId);
      setReports(
        reports.map((r) =>
          r.id === reportId ? { ...r, resolved: true } : r
        )
      );
    } catch (error) {
      console.error("Failed to resolve report:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const filteredReports = reports.filter((r) => {
    if (filter === "pending") return !r.resolved;
    return r.resolved;
  });

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-foreground">Reports Management</h2>
        <span className="text-sm text-muted-foreground">{filteredReports.length} reports</span>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-3 mb-6">
        {(["pending", "resolved"] as const).map((tab) => (
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

      {filteredReports.length === 0 ? (
        <div className="bg-card rounded-2xl p-12 text-center">
          <p className="text-muted-foreground">
            {filter === "pending" ? "No pending reports" : "No resolved reports"}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredReports.map((report) => (
            <div
              key={report.id}
              className={`bg-card rounded-2xl p-6 border-l-4 ${
                report.resolved
                  ? "border-l-green-500"
                  : "border-l-amber-500"
              }`}
            >
              <div className="flex justify-between items-start gap-4 mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-bold text-foreground capitalize">
                      {report.reason?.toLowerCase().replace(/_/g, " ")}
                    </h3>
                    <span className={`text-xs font-medium px-2 py-1 rounded ${
                      report.resolved
                        ? "bg-green-100 text-green-700"
                        : "bg-amber-100 text-amber-700"
                    }`}>
                      {report.resolved ? "Resolved" : "Pending"}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {report.targetType} • {new Date(report.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {report.details && (
                <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                  {report.details}
                </p>
              )}

              <div className="flex gap-3">
                <button className="text-sm px-3 py-1 rounded border border-border text-foreground hover:bg-accent transition-colors">
                  View Content
                </button>
                {!report.resolved && (
                  <button
                    onClick={() => handleResolve(report.id)}
                    className="text-sm px-3 py-1 rounded bg-green-100 text-green-700 hover:bg-green-200 transition-colors flex items-center gap-1"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Resolve
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
