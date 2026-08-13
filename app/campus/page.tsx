"use client";
import Link from "next/link";

export default function SchoolOverview() {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">School Dashboard</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Link href="/campus/timetable" className="bg-card shadow rounded p-6 hover:shadow-md">
          <h2 className="text-xl font-semibold">Timetable</h2>
          <p className="text-muted-foreground">View & manage your class schedule</p>
        </Link>
        <Link href="/campus/events" className="bg-card shadow rounded p-6 hover:shadow-md">
          <h2 className="text-xl font-semibold">Events</h2>
          <p className="text-muted-foreground">Upcoming school events</p>
        </Link>
        <Link href="/campus/emergency" className="bg-card shadow rounded p-6 hover:shadow-md">
          <h2 className="text-xl font-semibold">Emergency Contacts</h2>
          <p className="text-muted-foreground">Important school numbers</p>
        </Link>
      </div>
    </div>
  );
}