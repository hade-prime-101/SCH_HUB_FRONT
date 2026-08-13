// app/study/summaries/request/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiPost } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";

export default function RequestSummaryPage() {
  const router = useRouter();
  const [materialId, setMaterialId] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!materialId) return setError("Material ID is required");
    setLoading(true);
    setError("");
    try {
      const res = await apiPost("/ai/summarize", { materialId });
      router.push("/study/summaries");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Request AI Summary</h1>
      <Card>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-destructive/5 border border-destructive/20 rounded-xl p-3 text-destructive text-sm">
                {error}
              </div>
            )}
            <div>
              <Label htmlFor="materialId">Material ID *</Label>
              <Input
                id="materialId"
                value={materialId}
                onChange={(e) => setMaterialId(e.target.value)}
                placeholder="Enter material ID"
                required
              />
            </div>
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "Requesting..." : "Request Summary"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}