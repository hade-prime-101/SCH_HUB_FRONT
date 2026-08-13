"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { CommunityHeader } from "@/components/community/CommunityHeader";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { registerMentor } from "@/lib/api/community.api";

export default function RegisterMentorPage() {
  const router = useRouter();
  const [expertiseInput, setExpertiseInput] = useState("");
  const [expertiseList, setExpertiseList] = useState<string[]>([]);
  const [bio, setBio] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleAddExpertise = () => {
    const trimmed = expertiseInput.trim();
    if (trimmed && !expertiseList.includes(trimmed)) {
      setExpertiseList([...expertiseList, trimmed]);
      setExpertiseInput("");
    }
  };

  const removeExpertise = (item: string) => {
    setExpertiseList(expertiseList.filter((e) => e !== item));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (expertiseList.length === 0) {
      setError("Add at least one area of expertise.");
      return;
    }
    if (!bio.trim()) {
      setError("Bio is required.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await registerMentor({ expertise: expertiseList, bio });
      router.push("/community/mentors");
    } catch (err: any) {
      setError(err.message || "Failed to register as mentor");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pb-24 max-w-2xl mx-auto">
      <CommunityHeader title="Become a Mentor" />

      <form onSubmit={handleSubmit} className="space-y-5">
        {error && <ErrorMessage message={error} />}

        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            Areas of Expertise
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={expertiseInput}
              onChange={(e) => setExpertiseInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddExpertise())}
              placeholder="e.g. JavaScript, Calculus"
              className="flex-1 rounded-xl border border-border bg-background px-4 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <Button type="button" variant="outline" onClick={handleAddExpertise}>
              Add
            </Button>
          </div>
          {expertiseList.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {expertiseList.map((item) => (
                <span
                  key={item}
                  className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm flex items-center gap-1"
                >
                  {item}
                  <button
                    type="button"
                    onClick={() => removeExpertise(item)}
                    className="text-primary hover:text-primary/70"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        <div>
          <label htmlFor="bio" className="block text-sm font-medium text-foreground mb-1">
            Bio
          </label>
          <textarea
            id="bio"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Tell students about yourself, your experience, and how you can help..."
            className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring h-32 resize-none"
            required
          />
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="outline" type="button" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? "Registering..." : "Register as Mentor"}
          </Button>
        </div>
      </form>
    </div>
  );
}