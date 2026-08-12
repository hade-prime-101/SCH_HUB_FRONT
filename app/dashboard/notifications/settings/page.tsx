// app/dashboard/notifications/settings/page.tsx
"use client";
import { useEffect, useState } from "react";
import {
  getNotificationSettings,
  updateNotificationSettings,
} from "@/lib/api/notifications.api";
import type { NotificationSettings, UpdateSettingsPayload } from "@/types/notifications";

export default function NotificationSettingsPage() {
  const [settings, setSettings] = useState<NotificationSettings | null>(null);
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [pushEnabled, setPushEnabled] = useState(true);
  const [typeToggles, setTypeToggles] = useState<Record<string, boolean>>({});

  useEffect(() => {
    getNotificationSettings().then((s) => {
      setSettings(s);
      setEmailEnabled(s.emailEnabled);
      setPushEnabled(s.pushEnabled);
      if (s.types) {
        setTypeToggles(s.types);
      }
    });
  }, []);

  const handleSave = async () => {
    const payload: UpdateSettingsPayload = {
      emailEnabled,
      pushEnabled,
      types: typeToggles,
    };
    await updateNotificationSettings(payload);
    alert("Settings saved");
  };

  const toggleType = (type: string) => {
    setTypeToggles((prev) => ({ ...prev, [type]: !prev[type] }));
  };

  if (!settings) return <p>Loading settings...</p>;

  return (
    <div className="max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-4">Notification Settings</h1>
      <div className="bg-white shadow rounded p-6 space-y-4">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={emailEnabled}
            onChange={(e) => setEmailEnabled(e.target.checked)}
          />
          <span>Email notifications</span>
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={pushEnabled}
            onChange={(e) => setPushEnabled(e.target.checked)}
          />
          <span>Push notifications</span>
        </label>

        <div className="border-t pt-4">
          <h2 className="font-semibold mb-2">Notification Types</h2>
          {Object.keys(typeToggles).map((type) => (
            <label key={type} className="flex items-center gap-2 mb-1">
              <input
                type="checkbox"
                checked={typeToggles[type]}
                onChange={() => toggleType(type)}
              />
              <span className="text-sm capitalize">{type.replace(/_/g, " ")}</span>
            </label>
          ))}
          {Object.keys(typeToggles).length === 0 && (
            <p className="text-sm text-gray-500">No specific types configured.</p>
          )}
        </div>

        <button
          onClick={handleSave}
          className="bg-blue-600 text-white px-4 py-2 rounded w-full"
        >
          Save Settings
        </button>
      </div>
    </div>
  );
}