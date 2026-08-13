// app/dashboard/community/mentors/register/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
      router.push("/dashboard/community/mentors");
    } catch (err: any) {
      setError(err.message || "Failed to register as mentor");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Become a Mentor</h1>

      {error && (
        <div className="bg-destructive/10 text-destructive p-3 rounded mb-4">
          {error}
          <button onClick={() => setError("")} className="ml-2 font-bold">
            ×
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-card shadow rounded p-6 space-y-6">
        <div>
          <label className="block text-sm font-medium mb-1">Areas of Expertise</label>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              value={expertiseInput}
              onChange={(e) => setExpertiseInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddExpertise())}
              placeholder="e.g. JavaScript, Calculus"
              className="border p-2 flex-1"
            />
            <button
              type="button"
              onClick={handleAddExpertise}
              className="bg-secondary/50 px-3 py-2 rounded"
            >
              Add
            </button>
          </div>
          {expertiseList.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {expertiseList.map((item) => (
                <span
                  key={item}
                  className="bg-primary/10 text-primary px-2 py-1 rounded-full text-sm flex items-center gap-1"
                >
                  {item}
                  <button
                    type="button"
                    onClick={() => removeExpertise(item)}
                    className="text-primary hover:text-primary"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Bio</label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Tell students about yourself, your experience, and how you can help..."
            className="border p-2 w-full h-32"
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="bg-primary text-primary-foreground px-6 py-2 rounded disabled:opacity-50"
        >
          {loading ? "Registering..." : "Register as Mentor"}
        </button>
      </form>
    </div>
  );
}