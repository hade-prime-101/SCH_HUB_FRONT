"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getMyProfile, updateProfile, uploadAvatar } from "@/lib/api/users.api";
import type { UserProfile } from "@/types/users";

export default function EditProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [department, setDepartment] = useState("");
  const [level, setLevel] = useState("");

  useEffect(() => {
    getMyProfile().then((p) => {
      setProfile(p);
      setName(p.name);
      setBio(p.bio || "");
      setDepartment(p.department || "");
      setLevel(p.level || "");
    });
  }, []);

  const handleSave = async () => {
    await updateProfile({ name, bio, department, level });
    router.push("/dashboard/profile");
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await uploadAvatar(file);
    alert("Avatar updated");
    getMyProfile().then(setProfile);
  };

  if (!profile) return <p>Loading...</p>;

  return (
    <div className="max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Edit Profile</h1>
      <div className="bg-card shadow rounded p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium">Avatar</label>
          <input type="file" onChange={handleAvatarUpload} />
        </div>
        <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="border p-2 w-full" />
        <textarea value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Bio" className="border p-2 w-full" />
        <input type="text" value={department} onChange={(e) => setDepartment(e.target.value)} placeholder="Department" className="border p-2 w-full" />
        <input type="text" value={level} onChange={(e) => setLevel(e.target.value)} placeholder="Level" className="border p-2 w-full" />
        <button onClick={handleSave} className="bg-primary text-primary-foreground px-4 py-2 rounded">Save</button>
      </div>
    </div>
  );
}