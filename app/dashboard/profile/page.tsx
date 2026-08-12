"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { getMyProfile } from "@/lib/api/users.api";
import type { UserProfile } from "@/types/users";

export default function MyProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    getMyProfile().then(setProfile);
  }, []);

  if (!profile) return <p>Loading...</p>;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        {profile.avatarUrl ? (
          <img src={profile.avatarUrl} className="w-20 h-20 rounded-full object-cover" />
        ) : (
          <div className="w-20 h-20 rounded-full bg-gray-300 flex items-center justify-center text-2xl font-bold">
            {profile.name.charAt(0)}
          </div>
        )}
        <div>
          <h1 className="text-2xl font-bold">{profile.name}</h1>
          <p className="text-gray-600">{profile.email}</p>
          <p className="text-sm text-gray-500">Role: {profile.role}</p>
        </div>
      </div>

      <div className="bg-white shadow rounded p-6 space-y-2">
        <p><strong>Bio:</strong> {profile.bio || "No bio yet"}</p>
        <p><strong>Department:</strong> {profile.department || "N/A"}</p>
        <p><strong>Level:</strong> {profile.level || "N/A"}</p>
      </div>

      <div className="mt-4">
        <Link href="/dashboard/profile/edit" className="text-blue-600 hover:underline">
          Edit Profile
        </Link>
      </div>
    </div>
  );
}