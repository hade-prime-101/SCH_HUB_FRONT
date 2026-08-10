"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Bell,
  ShoppingBag,
  Calendar,
  BookOpen,
  GraduationCap,
  AlertCircle,
  MessageCircle,
  Info,
  Clock,
  RefreshCw,
  Loader2,
  CheckCircle2,
  Smartphone,
} from "lucide-react";
import RefreshButton from "@/components/shared/RefreshButton";
import { notificationsApi } from "@/lib/api/planner";
import { usersApi } from "@/lib/api/users";

// ─── Types ────────────────────────────────────────────────────────────────────

interface NotificationSettings {
  marketplace?: boolean;
  community?:   boolean;
  events?:      boolean;
  study?:       boolean;
  grades?:      boolean;
  emergency?:   boolean;
  reminders?:   boolean;
  system?:      boolean;
  emailDigest?: boolean;
  pushEnabled?: boolean;
  quietHoursEnabled?: boolean;
  quietHoursStart?:   string;
  quietHoursEnd?:     string;
}

// ─── Config ───────────────────────────────────────────────────────────────────

const CHANNEL_SETTINGS: {
  key: keyof NotificationSettings;
  label: string;
  description: string;
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
}[] = [
  {
    key: "emergency",
    label: "Emergency Alerts",
    description: "Critical campus safety and emergency notices",
    icon: AlertCircle,
    iconBg: "bg-destructive/10",
    iconColor: "text-destructive",
  },
  {
    key: "grades",
    label: "Grades & Results",
    description: "When new grades or results are posted",
    icon: GraduationCap,
    iconBg: "bg-amber-100",
    iconColor: "text-amber-600",
  },
  {
    key: "events",
    label: "Events",
    description: "Event reminders and new campus events",
    icon: Calendar,
    iconBg: "bg-emerald-100",
    iconColor: "text-emerald-600",
  },
  {
    key: "community",
    label: "Community",
    description: "Replies, mentions, and new posts in groups you follow",
    icon: MessageCircle,
    iconBg: "bg-blue-100",
    iconColor: "text-blue-600",
  },
  {
    key: "study",
    label: "Study Materials",
    description: "New uploads, quizzes, and study group activity",
    icon: BookOpen,
    iconBg: "bg-violet-100",
    iconColor: "text-violet-600",
  },
  {
    key: "marketplace",
    label: "Marketplace",
    description: "Activity on your listings and saved items",
    icon: ShoppingBag,
    iconBg: "bg-accent",
    iconColor: "text-primary",
  },
  {
    key: "reminders",
    label: "Reminders",
    description: "Planner reminders and due-date alerts",
    icon: Clock,
    iconBg: "bg-muted",
    iconColor: "text-muted-foreground",
  },
  {
    key: "system",
    label: "System & Updates",
    description: "App updates, maintenance notices, and account alerts",
    icon: Info,
    iconBg: "bg-muted",
    iconColor: "text-muted-foreground",
  },
];

// ─── Toggle Component ─────────────────────────────────────────────────────────

function Toggle({
  enabled,
  onChange,
  disabled,
}: {
  enabled: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      role="switch"
      aria-checked={enabled}
      disabled={disabled}
      onClick={() => onChange(!enabled)}
      className={`relative w-12 h-6 rounded-full transition-colors shrink-0 disabled:opacity-40 ${
        enabled ? "bg-primary" : "bg-muted-foreground/30"
      }`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
          enabled ? "translate-x-6" : "translate-x-0"
        }`}
      />
    </button>
  );
}

// ─── Section Divider ─────────────────────────────────────────────────────────

function SectionHeader({ title }: { title: string }) {
  return (
    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide px-1 pt-2">
      {title}
    </p>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function NotificationSettingsPage() {
  const router = useRouter();

  const [settings, setSettings]       = useState<NotificationSettings>({});
  const [loading, setLoading]         = useState(true);
  const [saving, setSaving]           = useState(false);
  const [error, setError]             = useState<string | null>(null);
  const [saved, setSaved]             = useState(false);
  const [deviceStatus, setDeviceStatus] = useState<"idle" | "registering" | "registered" | "denied">("idle");

  // ── fetch ──────────────────────────────────────────────────────────────────

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const data = await notificationsApi.getSettings();
      setSettings(data ?? {});
    } catch (e: any) {
      setError("Could not load settings. Using defaults.");
      // Fall back to all-on defaults
      setSettings({
        marketplace: true, community: true, events: true,
        study: true, grades: true, emergency: true,
        reminders: true, system: true,
        emailDigest: false, pushEnabled: true,
        quietHoursEnabled: false, quietHoursStart: "22:00", quietHoursEnd: "07:00",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // ── save ───────────────────────────────────────────────────────────────────

  async function save(patch: Partial<NotificationSettings>) {
    const next = { ...settings, ...patch };
    setSettings(next); // optimistic
    setSaving(true); setSaved(false); setError(null);
    try {
      await notificationsApi.updateSettings(next as Record<string, unknown>);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e: any) {
      setError("Failed to save. Please try again.");
      setSettings(settings); // revert
    } finally {
      setSaving(false);
    }
  }

  async function registerDevice() {
    if (!("Notification" in window)) { setDeviceStatus("denied"); return; }
    setDeviceStatus("registering");
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") { setDeviceStatus("denied"); return; }
      // Retrieve the real FCM/Web Push token here in production.
      const mockToken = `web-push-${Date.now()}`;
      await usersApi.registerFcmToken(mockToken);
      setDeviceStatus("registered");
    } catch {
      setDeviceStatus("denied");
    }
  }

  function toggle(key: keyof NotificationSettings) {
    save({ [key]: !settings[key] });
  }

  // ── derived ────────────────────────────────────────────────────────────────

  const allChannelsOn = CHANNEL_SETTINGS.every(c => settings[c.key] !== false);

  function toggleAll() {
    const next = !allChannelsOn;
    const patch = Object.fromEntries(CHANNEL_SETTINGS.map(c => [c.key, next]));
    save(patch);
  }

  return (
    <div className="min-h-screen w-full bg-muted pb-10">

      {/* ── Header ── */}
      <div className="bg-card px-5 pt-8 pb-4 sticky top-0 z-20 shadow-sm">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} aria-label="Go back">
            <ArrowLeft className="w-6 h-6 text-foreground" />
          </button>
          <div className="flex-1">
            <h1 className="font-serif text-2xl font-bold text-foreground">Notification Settings</h1>
            <p className="text-muted-foreground text-xs">Control what you get notified about</p>
          </div>
          <div className="flex items-center gap-2">
            {saving && <Loader2 className="w-4 h-4 text-muted-foreground animate-spin" />}
            {saved  && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
            <RefreshButton onClick={() => load()} loading={loading} />
          </div>
        </div>
      </div>

      <div className="px-5 pt-4 flex flex-col gap-3">

        {/* Error */}
        {error && (
          <div className="bg-destructive/10 text-destructive rounded-2xl px-4 py-3 flex items-center gap-2 text-sm">
            <AlertCircle className="w-4 h-4 shrink-0" /> {error}
          </div>
        )}

        {/* Loading skeleton */}
        {loading ? (
          <div className="flex flex-col gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-card rounded-2xl p-4 h-16 animate-pulse" />
            ))}
          </div>
        ) : (
          <>
            {/* ── Global controls ── */}
            <SectionHeader title="General" />

            {/* Push notifications master switch */}
            <div className="bg-card rounded-2xl px-4 py-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <Bell className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">Push Notifications</p>
                <p className="text-xs text-muted-foreground mt-0.5">Receive alerts on this device</p>
              </div>
              <Toggle
                enabled={settings.pushEnabled !== false}
                onChange={v => save({ pushEnabled: v })}
                disabled={saving}
              />
            </div>

            {/* Email digest */}
            <div className="bg-card rounded-2xl px-4 py-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
                <Info className="w-5 h-5 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">Email Digest</p>
                <p className="text-xs text-muted-foreground mt-0.5">Daily summary delivered to your email</p>
              </div>
              <Toggle
                enabled={settings.emailDigest === true}
                onChange={v => save({ emailDigest: v })}
                disabled={saving}
              />
            </div>

            {/* Register this device */}
            <div className="bg-card rounded-2xl px-4 py-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
                <Smartphone className="w-5 h-5 text-emerald-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">This Device</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {deviceStatus === "registered" ? "Device registered for push notifications" :
                   deviceStatus === "denied"     ? "Permission denied — enable in browser settings" :
                   "Register this browser to receive push alerts"}
                </p>
              </div>
              {deviceStatus === "registered" ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
              ) : (
                <button
                  onClick={registerDevice}
                  disabled={deviceStatus === "registering" || deviceStatus === "denied"}
                  className="shrink-0 px-3 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity flex items-center gap-1.5"
                >
                  {deviceStatus === "registering" && <Loader2 className="w-3 h-3 animate-spin" />}
                  {deviceStatus === "registering" ? "Registering…" : "Register"}
                </button>
              )}
            </div>

            {/* ── Quiet hours ── */}
            <SectionHeader title="Quiet Hours" />

            <div className="bg-card rounded-2xl px-4 py-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center shrink-0">
                  <Clock className="w-5 h-5 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground">Quiet Hours</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Pause non-emergency notifications</p>
                </div>
                <Toggle
                  enabled={settings.quietHoursEnabled === true}
                  onChange={v => save({ quietHoursEnabled: v })}
                  disabled={saving}
                />
              </div>

              {settings.quietHoursEnabled && (
                <div className="flex gap-3 pt-2 border-t border-border">
                  <div className="flex-1 flex flex-col gap-1">
                    <label className="text-xs font-medium text-muted-foreground">From</label>
                    <input
                      type="time"
                      value={settings.quietHoursStart ?? "22:00"}
                      onChange={e => save({ quietHoursStart: e.target.value })}
                      className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                  <div className="flex-1 flex flex-col gap-1">
                    <label className="text-xs font-medium text-muted-foreground">Until</label>
                    <input
                      type="time"
                      value={settings.quietHoursEnd ?? "07:00"}
                      onChange={e => save({ quietHoursEnd: e.target.value })}
                      className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* ── Per-channel ── */}
            <div className="flex items-center justify-between px-1">
              <SectionHeader title="Notification Types" />
              <button
                onClick={toggleAll}
                disabled={saving}
                className="text-xs text-primary font-semibold disabled:opacity-40"
              >
                {allChannelsOn ? "Disable all" : "Enable all"}
              </button>
            </div>

            <div className="bg-card rounded-2xl overflow-hidden divide-y divide-border">
              {CHANNEL_SETTINGS.map(({ key, label, description, icon: Icon, iconBg, iconColor }) => (
                <div key={key} className="flex items-center gap-3 px-4 py-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${iconBg}`}>
                    <Icon className={`w-5 h-5 ${iconColor}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground">{label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{description}</p>
                  </div>
                  <Toggle
                    enabled={settings[key] !== false}
                    onChange={() => toggle(key)}
                    disabled={saving}
                  />
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
