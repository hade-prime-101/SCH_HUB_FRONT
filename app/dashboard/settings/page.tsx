"use client";
import { useEffect, useState } from "react";
import { getMyProfile, updateSettings } from "@/lib/api/users.api";
import type { UserSettings } from "@/types/users";

export default function SettingsPage() {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [pushEnabled, setPushEnabled] = useState(true);

  useEffect(() => {
    // Assuming getMyProfile includes settings? We'll fetch settings separately if available.
    // For demo, we use local state.
  }, []);

  const handleSave = async () => {
    await updateSettings({ emailEnabled, pushEnabled });
    alert("Settings saved");
  };

  return (
    <div className="max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-4">Settings</h1>
      <div className="bg-card shadow rounded p-6 space-y-4">
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={emailEnabled} onChange={(e) => setEmailEnabled(e.target.checked)} />
          Email notifications
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={pushEnabled} onChange={(e) => setPushEnabled(e.target.checked)} />
          Push notifications
        </label>
        <button onClick={handleSave} className="bg-primary text-primary-foreground px-4 py-2 rounded w-full">Save</button>
      </div>
    </div>
  );
}