// lib/dashboard-utils.ts

// ── Helpers ──────────────────────────────────────────────────────────────────

export function isUnauthorized(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const candidate = error as { status?: number; statusCode?: number };
  return candidate.status === 401 || candidate.statusCode === 401;
}

export function asArray<T>(value: unknown, keys: string[] = []): T[] {
  if (Array.isArray(value)) return value as T[];
  if (!value || typeof value !== "object") return [];
  const object = value as Record<string, unknown>;
  for (const key of keys) {
    if (Array.isArray(object[key])) {
      return object[key] as T[];
    }
  }
  return [];
}

export function getStoredUser(): DashboardUser | null {
  try {
    const stored = localStorage.getItem("auth_user");
    if (!stored) return null;
    const parsed: unknown = JSON.parse(stored);
    if (!parsed || typeof parsed !== "object") return null;
    const user = parsed as Partial<DashboardUser>;
    if (typeof user.fullName !== "string" || !user.fullName.trim()) return null;
    return {
      fullName: user.fullName,
      profilePictureUrl: user.profilePictureUrl ?? null,
    };
  } catch {
    return null;
  }
}

export function formatTime(time?: string | null): string {
  if (!time) return "";
  const match = /^(\d{1,2}):(\d{2})/.exec(time);
  if (!match) return time;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (Number.isNaN(hours) || Number.isNaN(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
    return time;
  }
  const suffix = hours >= 12 ? "PM" : "AM";
  const hour = hours % 12 || 12;
  return `${hour}:${String(minutes).padStart(2, "0")} ${suffix}`;
}

export function getTimeValue(time?: string | null): number | null {
  if (!time) return null;
  const match = /^(\d{1,2}):(\d{2})/.exec(time);
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (Number.isNaN(hours) || Number.isNaN(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
    return null;
  }
  return hours * 60 + minutes;
}

export function formatDate(iso?: string | null): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-NG", { month: "short", day: "numeric" });
}

export function formatEventDate(iso?: string | null): { day: string; month: string } {
  if (!iso) return { day: "--", month: "" };
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return { day: "--", month: "" };
  return {
    day: date.getDate().toString(),
    month: date.toLocaleString("en-NG", { month: "short" }),
  };
}

export function timeAgo(iso?: string | null): string {
  if (!iso) return "";
  const timestamp = new Date(iso).getTime();
  if (Number.isNaN(timestamp)) return "";
  const diff = Math.max(0, Date.now() - timestamp);
  const minutes = Math.floor(diff / 60_000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

export type Status = { label: string; color: string };

export function getClassStatus(startTime?: string | null, endTime?: string | null): Status {
  const startMinutes = getTimeValue(startTime);
  if (startMinutes === null) {
    return { label: "Unknown", color: "text-muted-foreground" };
  }
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const endMinutes = getTimeValue(endTime);
  if (currentMinutes >= startMinutes && endMinutes !== null && currentMinutes <= endMinutes) {
    return { label: "Ongoing", color: "text-success" };
  }
  if (currentMinutes < startMinutes) {
    return { label: "Upcoming", color: "text-primary" };
  }
  return { label: "Past", color: "text-muted-foreground" };
}

export function getReminderStatus(startTime?: string | null): Status {
  const startMinutes = getTimeValue(startTime);
  if (startMinutes === null) {
    return { label: "Upcoming", color: "text-muted-foreground" };
  }
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const diffMinutes = startMinutes - currentMinutes;
  if (diffMinutes < 0) {
    return { label: "Overdue", color: "text-destructive" };
  }
  if (diffMinutes < 60) {
    return { label: "Due soon", color: "text-warning" };
  }
  if (diffMinutes < 1_440) {
    return { label: "Today", color: "text-primary" };
  }
  return { label: "Upcoming", color: "text-muted-foreground" };
}

export function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export function getInitials(name?: string): string {
  if (!name) return "";
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

// ── Local dashboard view-model type (used by utilities) ──

type DashboardUser = {
  fullName: string;
  profilePictureUrl?: string | null;
};