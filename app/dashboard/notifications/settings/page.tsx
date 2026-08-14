"use client";

import { useState } from "react";
import { useQuery } from "@/lib/hooks/useQuery";
import {
  getNotificationSettings,
  updateNotificationSettings,
} from "@/lib/api/notifications.api";
import type { NotificationSettings, UpdateSettingsPayload } from "@/types/notifications";
import { PageHeader } from "@/components/shared/PageHeader";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { LoadingState, EmptyState } from "@/components/shared/DashboardPrimitives";
import { ErrorState } from "@/components/shared/ErrorState";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function NotificationSettingsPage() {
  const { data: settings, loading, error, refetch } = useQuery<NotificationSettings>(
    () => getNotificationSettings(),
    []
  );

  const [emailEnabled, setEmailEnabled] = useState(true);
  const [pushEnabled, setPushEnabled] = useState(true);
  const [typeToggles, setTypeToggles] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);

  // Initialise state when settings load
  useState(() => {
    if (settings) {
      setEmailEnabled(settings.emailEnabled);
      setPushEnabled(settings.pushEnabled);
      if (settings.types) setTypeToggles(settings.types);
    }
  });

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload: UpdateSettingsPayload = { emailEnabled, pushEnabled, types: typeToggles };
      await updateNotificationSettings(payload);
      alert("Settings saved");
      await refetch();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (err) {
      alert("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const toggleType = (type: string) => {
    setTypeToggles((prev) => ({ ...prev, [type]: !prev[type] }));
  };

  if (loading) return <LoadingState label="Loading settings" />;
  if (error) return <ErrorState title="Failed to load settings" description={error.message} onRetry={refetch} />;
  if (!settings) return null;

  return (
    <div className="max-w-md mx-auto p-4 md:p-6">
      <PageHeader title="Notification Settings" backHref="/dashboard/notifications" />

      <Card className="mt-4 space-y-4">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={emailEnabled}
            onChange={(e) => setEmailEnabled(e.target.checked)}
            className="h-4 w-4 text-primary rounded border-border focus:ring-primary"
          />
          <span>Email notifications</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={pushEnabled}
            onChange={(e) => setPushEnabled(e.target.checked)}
            className="h-4 w-4 text-primary rounded border-border focus:ring-primary"
          />
          <span>Push notifications</span>
        </label>

        <div className="border-t border-border pt-4">
          <h2 className="font-semibold mb-2">Notification Types</h2>
          {Object.keys(typeToggles).length === 0 ? (
            <p className="text-sm text-muted-foreground">No specific types configured.</p>
          ) : (
            Object.keys(typeToggles).map((type) => (
              <label key={type} className="flex items-center gap-2 cursor-pointer mb-1">
                <input
                  type="checkbox"
                  checked={typeToggles[type]}
                  onChange={() => toggleType(type)}
                  className="h-4 w-4 text-primary rounded border-border focus:ring-primary"
                />
                <span className="text-sm capitalize">{type.replace(/_/g, " ")}</span>
              </label>
            ))
          )}
        </div>

        <Button onClick={handleSave} disabled={saving} className="w-full">
          {saving ? "Saving..." : "Save Settings"}
        </Button>
      </Card>
    </div>
  );
}