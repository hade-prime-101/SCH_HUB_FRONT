"use client";

import { useState } from "react";
import { useQuery } from "@/lib/hooks/useQuery";
import { getMyProfile, updateSettings } from "@/lib/api/users.api";
import type { UserProfile } from "@/types/users";
import { PageHeader } from "@/components/shared/PageHeader";
import { LoadingState } from "@/components/shared/DashboardPrimitives";
import { ErrorState } from "@/components/shared/ErrorState";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function SettingsPage() {
  const { data: profile, loading, error, refetch } = useQuery<UserProfile>(
    () => getMyProfile(),
    []
  );

  const [emailEnabled, setEmailEnabled] = useState(true);
  const [pushEnabled, setPushEnabled] = useState(true);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateSettings({ emailEnabled, pushEnabled });
      alert("Settings saved");
    } catch (err) {
      alert("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingState label="Loading settings" />;
  if (error) return <ErrorState title="Failed to load settings" description={error.message} onRetry={refetch} />;

  return (
    <div className="max-w-md mx-auto p-4 md:p-6">
      <PageHeader title="Settings" description="Manage your preferences" />

      <Card className="mt-4">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <input
              id="emailEnabled"
              type="checkbox"
              checked={emailEnabled}
              onChange={(e) => setEmailEnabled(e.target.checked)}
              className="h-4 w-4 text-primary rounded border-border focus:ring-primary"
            />
            <label htmlFor="emailEnabled" className="text-sm text-foreground cursor-pointer">
              Email notifications
            </label>
          </div>
          <div className="flex items-center gap-2">
            <input
              id="pushEnabled"
              type="checkbox"
              checked={pushEnabled}
              onChange={(e) => setPushEnabled(e.target.checked)}
              className="h-4 w-4 text-primary rounded border-border focus:ring-primary"
            />
            <label htmlFor="pushEnabled" className="text-sm text-foreground cursor-pointer">
              Push notifications
            </label>
          </div>
          <Button onClick={handleSave} disabled={saving} className="w-full">
            {saving ? "Saving..." : "Save Settings"}
          </Button>
        </div>
      </Card>
    </div>
  );
}