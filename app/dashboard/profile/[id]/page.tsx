"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getProfile, getUserMaterials } from "@/lib/api/users.api";
import type { UserProfile, UserMaterial } from "@/types/users";

export default function UserProfilePage() {
  const { id } = useParams<{ id: string }>();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [materials, setMaterials] = useState<UserMaterial[]>([]);

  useEffect(() => {
    getProfile(id).then(setProfile);
    getUserMaterials(id).then(setMaterials);
  }, [id]);

  if (!profile) return <p>Loading...</p>;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        {profile.avatarUrl ? (
          <img src={profile.avatarUrl} className="w-20 h-20 rounded-full" />
        ) : (
          <div className="w-20 h-20 rounded-full bg-gray-300 flex items-center justify-center text-2xl font-bold">
            {profile.name.charAt(0)}
          </div>
        )}
        <div>
          <h1 className="text-2xl font-bold">{profile.name}</h1>
          <p className="text-muted-foreground">{profile.email}</p>
          <p className="text-sm text-muted-foreground">Role: {profile.role}</p>
        </div>
      </div>

      <div className="bg-card shadow rounded p-6 mb-6">
        <p><strong>Bio:</strong> {profile.bio || "No bio"}</p>
        <p><strong>Department:</strong> {profile.department || "N/A"}</p>
        <p><strong>Level:</strong> {profile.level || "N/A"}</p>
      </div>

      <h2 className="text-lg font-semibold mb-2">Materials ({materials.length})</h2>
      <div className="space-y-2">
        {materials.map((m) => (
          <div key={m.id} className="bg-card shadow rounded p-3">
            {m.title} {m.courseCode && `(${m.courseCode})`}
          </div>
        ))}
      </div>
    </div>
  );
}