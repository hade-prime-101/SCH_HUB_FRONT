"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Bookmark,
  Settings,
  User,
  BookOpen,
  Lock,
  Loader2,
  Camera,
  LogOut,
  Trash2,
  ChevronRight,
  ChevronLeft,
  AlertTriangle,
  Laptop,
  Smartphone,
  Search,
  Undo2,
  Moon,
  Wifi,
  Bell,
  Mail,
  SlidersHorizontal,
  AlertCircle,
  X,
  MapPin,
  Navigation,
} from "lucide-react";
import { usersApi } from "@/lib/api/users";
import { studyApi } from "@/lib/api";
import { notificationsApi } from "@/lib/api/planner";
import { useAuth } from "@/lib/hooks/useAuth";
import { useTheme } from "@/lib/hooks/useTheme";
import BottomNav from "@/components/shared/BottomNav";
import type { User as UserType } from "@/types/auth";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Material {
  id: string;
  title: string;
  courseCode?: string;
  fileType?: string;
  downloadCount?: number;
  createdAt?: string;
}

interface Session {
  id: string;
  device?: string;
  ipAddress?: string;
  createdAt: string;
  isCurrent?: boolean;
}

type Tab = "profile" | "bookmarks" | "sessions" | "settings";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatFileType(raw?: string): string {
  if (!raw) return "FILE";
  return raw.replace(/^application\//, "").replace(/\+.*$/, "").toUpperCase().slice(0, 5);
}

function formatJoined(iso?: string): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-NG", { month: "short", year: "numeric" });
}

function formatDownloads(n?: number): string {
  if (!n) return "0";
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

// ─── Sessions Tab ─────────────────────────────────────────────────────────────

function deviceIcon(device?: string) {
  const d = (device ?? "").toLowerCase();
  if (d.includes("iphone") || d.includes("android") || d.includes("mobile")) {
    return <Smartphone className="w-5 h-5 text-slate-600" />;
  }
  return <Laptop className="w-5 h-5 text-slate-600" />;
}

function lastActive(iso?: string): string {
  if (!iso) return "Unknown";
  const diff = Date.now() - new Date(iso).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(mins / 60);
  const days  = Math.floor(hours / 24);
  if (mins  < 5)  return "Last active just now";
  if (mins  < 60) return `Last active ${mins} minutes ago`;
  if (hours < 24) return `Last active ${hours} hour${hours > 1 ? "s" : ""} ago`;
  if (days  === 1) return "Last active yesterday";
  return `Last active ${days} days ago`;
}

function SessionsTab({ onSetTab }: { onSetTab: (t: Tab) => void }) {
  const router = useRouter();
  const { logout } = useAuth();
  const [sessions, setSessions]       = useState<Session[]>([]);
  const [loading, setLoading]         = useState(true);
  const [revoking, setRevoking]       = useState<string | null>(null);
  const [revokingAll, setRevokingAll] = useState(false);

  useEffect(() => {
    usersApi.getSessions()
      .then((d) => setSessions(Array.isArray(d) ? d : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleRevoke(id: string) {
    setRevoking(id);
    try {
      await usersApi.revokeSession(id);
      setSessions((prev) => prev.filter((s) => s.id !== id));
    } catch {} finally { setRevoking(null); }
  }

  async function handleRevokeAll() {
    setRevokingAll(true);
    try {
      await usersApi.revokeAllSessions();
      // Clears localStorage (all 3 keys) + HTTP-only cookie + resets auth state
      await logout();
      router.push("/login");
    } catch {} finally { setRevokingAll(false); }
  }

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="w-7 h-7 text-slate-400 animate-spin" />
    </div>
  );

  return (
    <div>
      {/* ── Header ── */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => onSetTab("profile")}
          className="w-11 h-11 rounded-full bg-slate-50 flex items-center justify-center shrink-0"
        >
          <ChevronLeft className="w-5 h-5 text-slate-800" />
        </button>
        <h1 className="text-2xl font-bold text-slate-900">
          Sessions &amp; Security
        </h1>
      </div>

      {/* ── Session cards ── */}
      {sessions.length === 0 ? (
        <div className="flex flex-col items-center py-16 gap-2">
          <Lock className="w-10 h-10 text-slate-300" />
          <p className="text-slate-400 font-medium">No active sessions</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4 mb-6">
          {sessions.map((s) => (
            <div key={s.id} className="rounded-2xl border border-slate-100 p-5">
              <div className="flex items-start gap-4">
                {/* Device icon */}
                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                  {deviceIcon(s.device)}
                </div>
                {/* Info */}
                <div className="flex-1">
                  <p className="font-bold text-slate-900">
                    {s.device ?? "Unknown device"}
                  </p>
                  <p className="text-slate-400 text-sm">
                    {s.ipAddress ?? "Unknown IP"}
                  </p>
                  <p className="text-slate-500 text-sm mt-1">
                    {lastActive(s.createdAt)}
                  </p>
                </div>
                {/* Action */}
                {s.isCurrent ? (
                  <span className="text-sm font-semibold text-slate-400 shrink-0">
                    Current session
                  </span>
                ) : (
                  <button
                    onClick={() => handleRevoke(s.id)}
                    disabled={revoking === s.id}
                    className="flex items-center gap-1.5 text-rose-500 font-bold shrink-0 disabled:opacity-50"
                  >
                    {revoking === s.id
                      ? <Loader2 className="w-4 h-4 animate-spin" />
                      : <Trash2 className="w-4 h-4" />
                    }
                    {revoking === s.id ? "…" : "Revoke"}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Sign out everywhere ── */}
      <button
        onClick={handleRevokeAll}
        disabled={revokingAll}
        className="w-full flex items-center justify-center gap-2 rounded-2xl border-2 border-rose-500 py-4 font-bold text-rose-500 disabled:opacity-50 transition"
      >
        {revokingAll
          ? <Loader2 className="w-5 h-5 animate-spin" />
          : <LogOut className="w-5 h-5" />
        }
        {revokingAll ? "Signing out…" : "Sign out everywhere"}
      </button>
    </div>
  );
}

// ─── Settings Tab ─────────────────────────────────────────────────────────────

// ─── Toggle component ─────────────────────────────────────────────────────────

function Toggle({
  checked,
  onChange,
  loading = false,
}: {
  checked: boolean;
  onChange: () => void;
  loading?: boolean;
}) {
  return (
    <button
      onClick={onChange}
      disabled={loading}
      className={`w-14 h-8 rounded-full flex items-center px-1 transition-colors shrink-0 disabled:opacity-60 ${
        checked ? "bg-indigo-500 justify-end" : "bg-slate-200 justify-start"
      }`}
    >
      <span className="w-6 h-6 rounded-full bg-white shadow-sm" />
    </button>
  );
}

// ─── Settings Tab ─────────────────────────────────────────────────────────────

function SettingsTab({
  user,
  onSetTab,
  onUserUpdate,
}: {
  user: UserType;
  onSetTab: (t: Tab) => void;
  onUserUpdate: (u: UserType) => void;
}) {
  const router = useRouter();
  const { logout } = useAuth();

  // Profile edit state
  const [fullName, setFullName] = useState(user.fullName);
  const [phone, setPhone]       = useState(user.phone ?? "");
  const [bio, setBio]           = useState(user.bio ?? "");
  const [level, setLevel]       = useState(user.level ?? "");
  const [saving, setSaving]     = useState(false);
  const [saved, setSaved]       = useState(false);

  const { isDark, toggle: toggleDark } = useTheme();

  // Notification settings — loaded from API
  const [notifSettings, setNotifSettings]   = useState<Record<string, boolean>>({});
  const [notifLoading, setNotifLoading]     = useState(true);
  const [savingKey, setSavingKey]           = useState<string | null>(null);
  const [errorMsg, setErrorMsg]             = useState<string | null>(null);

  // Push permission prompt
  const [pushPermission, setPushPermission] = useState<NotificationPermission | "unsupported">("default");
  const [registeringPush, setRegisteringPush] = useState(false);

  // Location permission state
  const [locationPermission, setLocationPermission] = useState<"unknown" | "prompt" | "granted" | "denied">("unknown");
  const [requestingLocation, setRequestingLocation] = useState(false);

  // Load notification settings + check push permission on mount
  useEffect(() => {
    notificationsApi.getSettings()
      .then(data => setNotifSettings(data ?? {}))
      .catch(() => {
        // Defaults
        setNotifSettings({
          notificationsEnabled: true, emailNotifications: true,
          pushNotifications: true, reminderPush: true,
          eventPush: true, announcementPush: true,
          lowDataMode: false,
        });
      })
      .finally(() => setNotifLoading(false));

    if (typeof window !== "undefined" && "Notification" in window) {
      setPushPermission(Notification.permission);
    } else {
      setPushPermission("unsupported");
    }

    // Check geolocation permission
    if (typeof window !== "undefined" && navigator.geolocation) {
      if (navigator.permissions) {
        navigator.permissions.query({ name: "geolocation" }).then((result) => {
          setLocationPermission(result.state as "prompt" | "granted" | "denied");
          result.onchange = () => {
            setLocationPermission(result.state as "prompt" | "granted" | "denied");
          };
        });
      } else {
        setLocationPermission("prompt");
      }
    } else {
      setLocationPermission("denied");
    }
  }, []);

  async function saveProfile() {
    setSaving(true); setSaved(false); setErrorMsg(null);
    try {
      const updated = await usersApi.updateProfile({ fullName, phone, bio, level });
      setSaved(true);
      // Merge the response with existing user. Put local values first so the server
      // response takes precedence, but fall back to the local inputs if the server
      // returns a partial object that omits some fields.
      const merged: UserType = { ...user, fullName, phone, bio, level };
      if (updated && typeof updated === "object") {
        Object.assign(merged, updated);
        // Always keep the bio the user just typed visible (some backends return partial)
        if (!("bio" in updated) || (updated as any).bio === undefined) {
          merged.bio = bio;
        }
      }
      onUserUpdate(merged);
      setTimeout(() => setSaved(false), 2500);
    } catch {
      setErrorMsg("Couldn't save profile — try again.");
    } finally {
      setSaving(false);
    }
  }

  async function toggleNotifSetting(key: string) {
    const current = notifSettings[key] !== false;
    const next    = !current;
    setNotifSettings(p => ({ ...p, [key]: next }));
    setSavingKey(key); setErrorMsg(null);
    try {
      await notificationsApi.updateSettings({ [key]: next });
    } catch {
      setNotifSettings(p => ({ ...p, [key]: current })); // revert
      setErrorMsg("Couldn't save setting — try again.");
    } finally {
      setSavingKey(null);
    }
  }

  async function handleRequestPush() {
    if (!("Notification" in window)) return;
    setRegisteringPush(true);
    try {
      const permission = await Notification.requestPermission();
      setPushPermission(permission);
      if (permission === "granted") {
        // In production replace with real FCM/Web Push token
        const token = `web-push-${Date.now()}`;
        await usersApi.registerFcmToken(token);
        await notificationsApi.updateSettings({ pushNotifications: true });
        setNotifSettings(p => ({ ...p, pushNotifications: true }));
      }
    } catch {
      setErrorMsg("Failed to register push notifications.");
    } finally {
      setRegisteringPush(false);
    }
  }

  function handleRequestLocation() {
    if (!navigator.geolocation) return;
    setRequestingLocation(true);
    navigator.geolocation.getCurrentPosition(
      () => {
        setLocationPermission("granted");
        setRequestingLocation(false);
      },
      () => {
        setLocationPermission("denied");
        setRequestingLocation(false);
      },
    );
  }

  async function toggleLowData() {
    const current = notifSettings.lowDataMode === true;
    const next    = !current;
    setNotifSettings(p => ({ ...p, lowDataMode: next }));
    setSavingKey("lowDataMode"); setErrorMsg(null);
    try {
      await usersApi.updateSettings({ lowDataMode: next });
    } catch {
      setNotifSettings(p => ({ ...p, lowDataMode: current }));
      setErrorMsg("Couldn't save setting — try again.");
    } finally {
      setSavingKey(null);
    }
  }

  async function handleLogout() {
    await logout();
    router.push("/login");
  }

  return (
    <div className="relative">

      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => onSetTab("profile")}
          className="w-9 h-9 rounded-full bg-white shadow-sm flex items-center justify-center shrink-0"
        >
          <ChevronLeft className="w-5 h-5 text-slate-800" />
        </button>
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
      </div>

      {/* Error toast */}
      {errorMsg && (
        <div className="absolute top-0 left-1/2 -translate-x-1/2 bg-slate-900 text-white rounded-2xl px-5 py-3 shadow-xl z-10 flex items-center gap-2 w-[90%]">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <p className="font-medium text-sm flex-1">{errorMsg}</p>
          <button onClick={() => setErrorMsg(null)}>
            <X className="w-4 h-4 text-slate-400" />
          </button>
        </div>
      )}

      {/* APPEARANCE */}
      <p className="text-xs font-bold tracking-widest text-slate-400 mb-2">APPEARANCE</p>
      <div className="bg-white rounded-2xl p-2 mb-6">
        <div className="flex items-center gap-3 px-3 py-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0">
            <Moon className="w-4 h-4 text-indigo-500" />
          </div>
          <span className="flex-1 font-bold text-slate-900">Dark mode</span>
          <Toggle checked={isDark} loading={false} onChange={toggleDark} />
        </div>
      </div>

      {/* DATA */}
      <p className="text-xs font-bold tracking-widest text-slate-400 mb-2">DATA</p>
      <div className="bg-white rounded-2xl p-2 mb-6">
        <div className="flex items-center gap-3 px-3 py-3">
          <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
            <Wifi className="w-4 h-4 text-slate-600" />
          </div>
          <span className="flex-1 font-bold text-slate-900">Low data mode</span>
          <Toggle
            checked={notifSettings.lowDataMode === true}
            loading={savingKey === "lowDataMode"}
            onChange={toggleLowData}
          />
        </div>
      </div>

      {/* LOCATION */}
      <p className="text-xs font-bold tracking-widest text-slate-400 mb-2">LOCATION</p>
      <div className="bg-white rounded-2xl p-2 mb-6">
        <div className="flex items-center gap-3 px-3 py-3">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
            locationPermission === "granted" ? "bg-emerald-50" :
            locationPermission === "denied"  ? "bg-slate-100"  : "bg-indigo-50"
          }`}>
            <MapPin className={`w-4 h-4 ${
              locationPermission === "granted" ? "text-emerald-500" :
              locationPermission === "denied"  ? "text-slate-400"   : "text-indigo-500"
            }`} />
          </div>

          <div className="flex-1 min-w-0">
            <p className="font-bold text-slate-900 text-sm">Campus map location</p>
            <p className={`text-xs mt-0.5 ${
              locationPermission === "granted" ? "text-emerald-600" :
              locationPermission === "denied"  ? "text-slate-400"   : "text-slate-400"
            }`}>
              {locationPermission === "granted" ? "Access granted — your position shows on the map" :
               locationPermission === "denied"  ? "Blocked in browser settings" :
               locationPermission === "unknown" ? "Checking…"                  : "Not yet allowed"}
            </p>
          </div>

          {/* Checking spinner */}
          {locationPermission === "unknown" && (
            <Loader2 className="w-4 h-4 text-slate-400 animate-spin shrink-0" />
          )}

          {/* Allow button — only shown when browser can still prompt */}
          {locationPermission === "prompt" && (
            <button
              onClick={handleRequestLocation}
              disabled={requestingLocation}
              className="shrink-0 px-3 py-1.5 bg-indigo-500 text-white text-xs font-bold rounded-xl disabled:opacity-60 flex items-center gap-1"
            >
              {requestingLocation && <Loader2 className="w-3 h-3 animate-spin" />}
              {requestingLocation ? "Asking…" : "Allow"}
            </button>
          )}

          {/* Granted checkmark */}
          {locationPermission === "granted" && (
            <span className="shrink-0 w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center">
              <svg className="w-3.5 h-3.5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </span>
          )}
        </div>

        {/* Denied — compact instruction, not alarming */}
        {locationPermission === "denied" && (
          <div className="mx-3 mb-2 rounded-xl bg-slate-50 border border-slate-200 px-3 py-2.5 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
            <p className="text-xs text-slate-500 leading-relaxed">
              To enable, open your browser&apos;s <strong>Site Settings</strong>, find <strong>Location</strong>, and set it to Allow for this site. Then reload the page.
            </p>
          </div>
        )}
      </div>

      {/* NOTIFICATIONS */}
      <p className="text-xs font-bold tracking-widest text-slate-400 mb-2">NOTIFICATIONS</p>

      {/* Push permission prompt — shown if permission not yet granted */}
      {pushPermission === "default" && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 flex items-center gap-3 mb-3">
          <Bell className="w-5 h-5 text-amber-600 shrink-0" />
          <p className="flex-1 text-sm font-medium text-amber-800">
            Allow push notifications to get real-time alerts
          </p>
          <button
            onClick={handleRequestPush}
            disabled={registeringPush}
            className="shrink-0 px-3 py-1.5 bg-amber-500 text-white text-xs font-bold rounded-xl disabled:opacity-60 flex items-center gap-1"
          >
            {registeringPush && <Loader2 className="w-3 h-3 animate-spin" />}
            {registeringPush ? "…" : "Allow"}
          </button>
        </div>
      )}
      {pushPermission === "denied" && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-2xl px-4 py-3 flex items-center gap-3 mb-3">
          <AlertCircle className="w-5 h-5 text-destructive shrink-0" />
          <p className="text-sm text-destructive">
            Notifications blocked. Enable them in your browser settings to receive alerts.
          </p>
        </div>
      )}

      {notifLoading ? (
        <div className="bg-white rounded-2xl p-6 mb-6 flex justify-center">
          <Loader2 className="w-5 h-5 text-slate-400 animate-spin" />
        </div>
      ) : (
        <div className="bg-white rounded-2xl p-2 mb-6">
          {/* All notifications */}
          <div className="flex items-center gap-3 px-3 py-3 border-b border-slate-100">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0">
              <Bell className="w-4 h-4 text-indigo-500" />
            </div>
            <span className="flex-1 font-bold text-slate-900">All notifications</span>
            <Toggle
              checked={notifSettings.notificationsEnabled !== false}
              loading={savingKey === "notificationsEnabled"}
              onChange={() => toggleNotifSetting("notificationsEnabled")}
            />
          </div>

          {/* Email notifications */}
          <div className="flex items-center gap-3 px-3 py-3 border-b border-slate-100">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0">
              <Mail className="w-4 h-4 text-indigo-500" />
            </div>
            <span className="flex-1 font-bold text-slate-900">Email notifications</span>
            <Toggle
              checked={notifSettings.emailNotifications !== false}
              loading={savingKey === "emailNotifications"}
              onChange={() => toggleNotifSetting("emailNotifications")}
            />
          </div>

          {/* Push notifications */}
          <div className="flex items-center gap-3 px-3 py-3 border-b border-slate-100">
            <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
              <Smartphone className="w-4 h-4 text-slate-600" />
            </div>
            <span className="flex-1 font-bold text-slate-900">Push notifications</span>
            <Toggle
              checked={notifSettings.pushNotifications !== false}
              loading={savingKey === "pushNotifications"}
              onChange={() => toggleNotifSetting("pushNotifications")}
            />
          </div>

          {/* Reminder push */}
          <div className="flex items-center gap-3 px-3 py-3 border-b border-slate-100">
            <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
              <Bell className="w-4 h-4 text-amber-500" />
            </div>
            <span className="flex-1 font-bold text-slate-900">Reminder alerts</span>
            <Toggle
              checked={notifSettings.reminderPush !== false}
              loading={savingKey === "reminderPush"}
              onChange={() => toggleNotifSetting("reminderPush")}
            />
          </div>

          {/* Event push */}
          <div className="flex items-center gap-3 px-3 py-3 border-b border-slate-100">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
              <Bell className="w-4 h-4 text-emerald-500" />
            </div>
            <span className="flex-1 font-bold text-slate-900">Event alerts</span>
            <Toggle
              checked={notifSettings.eventPush !== false}
              loading={savingKey === "eventPush"}
              onChange={() => toggleNotifSetting("eventPush")}
            />
          </div>

          {/* Announcement push */}
          <div className="flex items-center gap-3 px-3 py-3 border-b border-slate-100">
            <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
              <Bell className="w-4 h-4 text-blue-500" />
            </div>
            <span className="flex-1 font-bold text-slate-900">Announcements</span>
            <Toggle
              checked={notifSettings.announcementPush !== false}
              loading={savingKey === "announcementPush"}
              onChange={() => toggleNotifSetting("announcementPush")}
            />
          </div>

          {/* Notification Preferences — full settings page */}
          <button
            onClick={() => router.push("/dashboard/notifications/settings")}
            className="w-full flex items-center gap-3 px-3 py-3"
          >
            <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
              <SlidersHorizontal className="w-4 h-4 text-emerald-600" />
            </div>
            <span className="flex-1 text-left font-bold text-slate-900">
              Notification Preferences
            </span>
            <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />
          </button>
        </div>
      )}

      {/* ACCOUNT */}
      <p className="text-xs font-bold tracking-widest text-slate-400 mb-2">ACCOUNT</p>
      <div className="bg-white rounded-2xl p-4 flex flex-col gap-4 mb-6">
        {saved && (
          <div className="bg-emerald-50 text-emerald-700 rounded-xl px-4 py-3 text-sm font-medium">
            Profile updated!
          </div>
        )}
        {[
          { label: "Full name", value: fullName, set: setFullName, type: "text" },
          { label: "Phone",     value: phone,    set: setPhone,    type: "tel" },
          { label: "Level",     value: level,    set: setLevel,    type: "text", placeholder: "e.g. 300" },
        ].map(({ label, value, set, type, placeholder }) => (
          <div key={label}>
            <label className="text-sm font-semibold text-slate-700 block mb-1.5">{label}</label>
            <input
              type={type}
              value={value}
              placeholder={placeholder}
              onChange={e => (set as (v: string) => void)(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-300"
            />
          </div>
        ))}
        <div>
          <label className="text-sm font-semibold text-slate-700 block mb-1.5">Bio</label>
          <textarea
            value={bio}
            onChange={e => setBio(e.target.value)}
            rows={3}
            placeholder="Tell people about yourself…"
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-300 resize-none"
          />
        </div>
        <button
          onClick={saveProfile}
          disabled={saving}
          className="w-full rounded-2xl bg-slate-900 py-3.5 font-bold text-white disabled:opacity-50 transition"
        >
          {saving ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" /> Saving…
            </span>
          ) : "Save changes"}
        </button>
      </div>

      {/* Sign out */}
      <button
        onClick={handleLogout}
        className="w-full flex items-center justify-between bg-white rounded-2xl px-5 py-4 text-rose-500 font-semibold mb-4"
      >
        <span className="flex items-center gap-2">
          <LogOut className="w-5 h-5" /> Sign out
        </span>
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}

// ─── Bookmarks Tab ────────────────────────────────────────────────────────────

interface Bookmark {
  id: string;
  material?: {
    id: string;
    title: string;
    type?: string;
    courseCode?: string;
    downloadCount?: number;
    courseTitle?: string;
    uploader?: { fullName: string } | null;
    department?: { name: string } | null;
  } | null;
  post?: { id: string; content: string } | null;
}

function BookmarksTab({ onSetTab }: { onSetTab: (t: Tab) => void }) {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [loading, setLoading]     = useState(true);
  const [query, setQuery]         = useState("");
  const [toast, setToast]         = useState<Bookmark | null>(null);
  const toastTimer                = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    usersApi.getBookmarks()
      .then((d) => setBookmarks(Array.isArray(d) ? d : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  function removeBookmark(bm: Bookmark) {
    setBookmarks((prev) => prev.filter((b) => b.id !== bm.id));
    setToast(bm);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 4000);
    // toggle bookmark off via API (fire and forget)
    if (bm.material?.id) {
      studyApi.bookmarkMaterial(bm.material.id).catch(() => {});
    }
  }

  function undo() {
    if (!toast) return;
    setBookmarks((prev) => [toast, ...prev]);
    // re-add via API
    if (toast.material?.id) {
      studyApi.bookmarkMaterial(toast.material.id).catch(() => {});
    }
    setToast(null);
    if (toastTimer.current) clearTimeout(toastTimer.current);
  }

  const filtered = bookmarks.filter((b) => {
    const q = query.toLowerCase();
    if (!q) return true;
    const m = b.material;
    return (
      m?.title?.toLowerCase().includes(q) ||
      m?.courseCode?.toLowerCase().includes(q) ||
      m?.courseTitle?.toLowerCase().includes(q)
    );
  });

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="w-7 h-7 text-slate-400 animate-spin" />
    </div>
  );

  return (
    <div>
      {/* ── Header ── */}
      <div className="flex items-center gap-4 mb-5">
        <button
          onClick={() => onSetTab("profile")}
          className="w-11 h-11 rounded-full bg-slate-50 flex items-center justify-center shrink-0"
        >
          <ChevronLeft className="w-5 h-5 text-slate-800" />
        </button>
        <h1 className="text-2xl font-bold text-slate-900">My Bookmarks</h1>
      </div>

      {/* ── Search ── */}
      <div className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3 mb-5">
        <Search className="w-5 h-5 text-slate-400 shrink-0" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search bookmarks"
          className="flex-1 bg-transparent text-slate-700 placeholder:text-slate-400 focus:outline-none"
        />
      </div>

      {/* ── List ── */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center py-16 gap-2">
          <Bookmark className="w-10 h-10 text-slate-300" />
          <p className="text-slate-400 font-medium">
            {query ? "No results found" : "No bookmarks yet"}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {filtered.map((bm) => {
            const m = bm.material;
            if (!m) return null;
            return (
              <div key={bm.id} className="rounded-2xl border border-slate-100 p-5">
                {/* Title + bookmark toggle */}
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-xl font-bold text-slate-900 pr-3 leading-snug">
                    {m.title}
                  </h3>
                  <button
                    onClick={() => removeBookmark(bm)}
                    className="shrink-0"
                    aria-label="Remove bookmark"
                  >
                    <Bookmark className="w-5 h-5 fill-slate-900 text-slate-900" />
                  </button>
                </div>

                {/* Course + type */}
                <div className="flex items-center gap-4 mb-2">
                  {m.courseCode && (
                    <span className="font-bold text-slate-700 text-sm">
                      {m.courseCode}
                    </span>
                  )}
                  {m.type && (
                    <span className="font-bold text-slate-700 text-sm">
                      {m.type}
                    </span>
                  )}
                </div>

                {/* Dept + uploader */}
                {m.department?.name && (
                  <p className="text-slate-600">{m.department.name}</p>
                )}
                {m.uploader?.fullName && (
                  <p className="text-slate-600">Uploaded by {m.uploader.fullName}</p>
                )}

                {/* Downloads */}
                <p className="flex items-center gap-1.5 text-slate-500 text-sm mt-1">
                  <BookOpen className="w-3.5 h-3.5" />
                  {formatDownloads(m.downloadCount)} downloads
                </p>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Undo toast ── */}
      {toast && (
        <div className="fixed bottom-20 left-4 right-4 bg-slate-900 text-white rounded-2xl shadow-xl px-4 py-3 flex items-center gap-3 z-50">
          <Undo2 className="w-4 h-4 shrink-0" />
          <p className="flex-1 font-medium text-sm">Bookmark removed</p>
          <button onClick={undo} className="font-bold text-sm shrink-0">
            Undo
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const router = useRouter();

  const [tab, setTab]           = useState<Tab>("profile");
  const [user, setUser]         = useState<UserType | null>(null);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading]   = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [avatarKey, setAvatarKey] = useState(0); // forces img re-render after upload
  const avatarRef               = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setLoadError(null);
    Promise.all([
      usersApi.getMe(),
      usersApi.getMyMaterials(),
    ]).then(([u, mats]) => {
      setUser(u);
      setMaterials(Array.isArray(mats) ? mats : []);
    }).catch((e: any) => {
      const msg: string = e?.message ?? "";
      // 401 means the token is gone — send to login rather than a dead-end error screen
      if (msg.includes("401") || msg.toLowerCase().includes("unauthorized")) {
        router.replace("/login");
        return;
      }
      setLoadError(msg || "Failed to load profile. Please try again.");
    }).finally(() => setLoading(false));
  }, [router]);

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    // Reset input so the same file can be re-selected after an error
    e.target.value = "";
    setUploading(true);
    setUploadError(null);
    try {
      const res = await usersApi.uploadAvatar(file);
      const newUrl = res.profilePictureUrl;
      if (!newUrl) throw new Error("No URL returned from server");
      setUser((prev) => prev ? { ...prev, profilePictureUrl: newUrl } : prev);
      setAvatarKey((k) => k + 1); // bust the img cache
    } catch (err: any) {
      setUploadError(err?.message || "Failed to upload photo. Please try again.");
    } finally {
      setUploading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 text-muted-foreground animate-spin" />
      </div>
    );
  }

  if (loadError || !user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4 px-6">
        <p className="text-muted-foreground font-medium text-center">
          {loadError ?? "Could not load profile."}
        </p>
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-primary font-semibold"
        >
          <ArrowLeft className="w-4 h-4" /> Go back
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-muted px-6 py-6 pb-24">

      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => router.back()}
          className="w-11 h-11 rounded-full bg-card shadow-sm flex items-center justify-center"
        >
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setTab("bookmarks")}
            className="w-11 h-11 rounded-full bg-card shadow-sm flex items-center justify-center"
          >
            <Bookmark className={`w-5 h-5 ${tab === "bookmarks" ? "text-foreground" : "text-muted-foreground"}`} />
          </button>
          <button
            onClick={() => setTab("settings")}
            className="w-11 h-11 rounded-full bg-card shadow-sm flex items-center justify-center"
          >
            <Settings className={`w-5 h-5 ${tab === "settings" ? "text-foreground" : "text-muted-foreground"}`} />
          </button>
        </div>
      </div>

      {/* ── Profile summary — always visible ── */}
      <div className="flex flex-col items-center text-center mb-6">
        {/* Avatar */}
        <div className="relative mb-4">
          <div className="w-24 h-24 rounded-full bg-slate-300 overflow-hidden">
            {user.profilePictureUrl ? (
              <img
                key={avatarKey}
                src={user.profilePictureUrl}
                alt={user.fullName}
                className="w-full h-full object-cover"
                onError={(e) => {
                  // If the image fails to load, fall back to the placeholder icon
                  (e.currentTarget as HTMLImageElement).style.display = "none";
                  const parent = (e.currentTarget as HTMLImageElement).parentElement;
                  if (parent) {
                    const fallback = parent.querySelector("[data-avatar-fallback]") as HTMLElement | null;
                    if (fallback) fallback.style.display = "flex";
                  }
                }}
              />
            ) : null}
            <div
              data-avatar-fallback
              className="w-full h-full flex items-center justify-center"
              style={{ display: user.profilePictureUrl ? "none" : "flex" }}
            >
              <User className="w-10 h-10 text-slate-500" />
            </div>
          </div>
          {/* Camera button */}
          <button
            onClick={() => avatarRef.current?.click()}
            disabled={uploading}
            className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-slate-900 flex items-center justify-center shadow-md disabled:opacity-50"
          >
            {uploading
              ? <Loader2 className="w-4 h-4 text-white animate-spin" />
              : <Camera className="w-4 h-4 text-white" />
            }
          </button>
          <input
            ref={avatarRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={handleAvatarChange}
          />
        </div>

        {/* Upload error */}
        {uploadError && (
          <div className="mb-3 flex items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-2.5 max-w-xs">
            <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
            <p className="text-sm text-rose-600 flex-1">{uploadError}</p>
            <button onClick={() => setUploadError(null)} className="shrink-0">
              <X className="w-4 h-4 text-rose-400" />
            </button>
          </div>
        )}

        <div className="flex items-center gap-2 mb-1">
          <h1 className="text-2xl font-bold text-foreground">{user.fullName}</h1>
          <span className="text-xs font-bold border border-border rounded-lg px-2.5 py-1 text-foreground">
            {user.role.replace("_", " ")}
          </span>
        </div>
        <p className="text-muted-foreground">
          {(user as any).department?.name ?? (user as any).departmentName ?? "Student"}
        </p>
        <p className="text-muted-foreground">
          {user.level ? `Level ${user.level}` : ""}
          {user.level && (user as any).matriculation ? " · " : ""}
          {(user as any).matriculation ? `Matric No. ${(user as any).matriculation}` : ""}
        </p>
      </div>

      {/* ── Tab content ── */}
      {tab === "profile" && (
        <>
          {/* Bio */}
          <div className="bg-card rounded-2xl p-5 mb-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xl font-bold text-foreground">Bio</h2>
              <span className="text-muted-foreground text-sm">
                {(user as any).createdAt
                  ? `Joined ${formatJoined((user as any).createdAt)}`
                  : ""}
              </span>
            </div>
            <p className="text-muted-foreground leading-relaxed">
              {user.bio ?? "No bio yet."}
            </p>
          </div>

          {/* Materials */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-foreground">Materials</h2>
            <span className="text-muted-foreground">{materials.length} uploaded</span>
          </div>

          {materials.length === 0 ? (
            <div className="flex flex-col items-center py-12 gap-2">
              <BookOpen className="w-10 h-10 text-muted-foreground" />
              <p className="text-muted-foreground font-medium">No materials uploaded yet</p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {materials.map((m) => (
                <div key={m.id} className="bg-card rounded-2xl p-5 flex items-center gap-4">
                  <span className="text-xs font-bold border border-border rounded-lg px-2.5 py-1.5 text-foreground shrink-0">
                    {m.courseCode ?? "—"}
                  </span>
                  <div className="flex-1">
                    <p className="font-bold text-foreground leading-snug">{m.title}</p>
                    <p className="flex items-center gap-1.5 text-muted-foreground text-sm mt-1">
                      <BookOpen className="w-3.5 h-3.5" />
                      {formatDownloads(m.downloadCount)} downloads
                    </p>
                  </div>
                  <span className="text-xs font-bold border border-border rounded-lg px-2.5 py-1.5 text-foreground shrink-0">
                    {formatFileType(m.fileType)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {tab === "bookmarks" && <BookmarksTab onSetTab={setTab} />}
      {tab === "sessions"  && <SessionsTab onSetTab={setTab} />}
      {tab === "settings"  && <SettingsTab user={user} onSetTab={setTab} onUserUpdate={u => setUser(u)} />}

      <BottomNav />
    </div>
  );
}
