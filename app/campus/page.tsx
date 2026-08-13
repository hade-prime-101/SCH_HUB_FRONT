"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { MapPin, Calendar, Clock, Phone, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { getTimetable, listEvents } from "@/lib/api/school.api";
import type { TimetableEntry, SchoolEvent } from "@/types/school";

export default function CampusHomePage() {
  const [todayClasses, setTodayClasses] = useState<TimetableEntry[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<SchoolEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [timetable, events] = await Promise.all([
          getTimetable(),
          listEvents({ upcoming: true }),
        ]);

        // Filter today's classes (assuming day string like "MONDAY")
        const today = new Date()
          .toLocaleDateString("en-US", { weekday: "long" })
          .toUpperCase();
        const todayEntries = timetable.filter((e) => e.day === today);
        setTodayClasses(todayEntries);

        // Sort events by date and take next 3
        const sorted = events
          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
          .slice(0, 3);
        setUpcomingEvents(sorted);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load campus data");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (error) return <ErrorMessage message={error} />;

  return (
    <div className="min-h-screen bg-muted pb-24">
      {/* Header */}
      <header className="bg-card border-b border-border px-4 py-5">
        <h1 className="text-2xl font-bold text-foreground">Campus</h1>
        <p className="text-sm text-muted-foreground">Your physical campus hub</p>
      </header>

      <div className="px-4 py-6 space-y-6 max-w-5xl mx-auto">
        {/* Map Quick Action – prominently featured */}
        <Link href="/campus/map" className="block">
          <Card className="p-0 overflow-hidden hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-4 p-5 bg-primary/5 dark:bg-primary/10">
              <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center shrink-0">
                <MapPin className="w-7 h-7 text-primary-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-lg text-foreground">Campus Map</h3>
                <p className="text-sm text-muted-foreground">Find buildings, labs, and more</p>
              </div>
              <Button variant="default" size="sm" className="shrink-0">
                Open Map
              </Button>
            </div>
          </Card>
        </Link>

        {/* Today's Timetable */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              Today's Classes
            </h2>
            <Link href="/campus/timetable" className="text-sm text-primary font-medium">
              View all
            </Link>
          </div>
          {loading ? (
            <LoadingSkeleton count={2} height="h-16" />
          ) : todayClasses.length === 0 ? (
            <Card>
              <CardContent className="py-6 text-center text-muted-foreground">
                No classes today. Enjoy your day off!
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {todayClasses.slice(0, 3).map((cls) => (
                <Card key={cls.id} compact>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-category-timetable-bg text-category-timetable flex items-center justify-center font-bold text-sm">
                      {cls.startTime.slice(0, 2)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground">{cls.courseName}</p>
                      <p className="text-sm text-muted-foreground">
                        {cls.startTime} – {cls.endTime} · {cls.venue || "TBA"}
                      </p>
                    </div>
                    {cls.venue && (
                      <Link
                        href={`/campus/map?q=${encodeURIComponent(cls.venue)}`}
                        className="shrink-0 p-2 rounded-lg hover:bg-muted transition-colors"
                      >
                        <MapPin className="w-4 h-4 text-primary" />
                      </Link>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </section>

        {/* Upcoming Events */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              Upcoming Events
            </h2>
            <Link href="/campus/events" className="text-sm text-primary font-medium">
              View all
            </Link>
          </div>
          {loading ? (
            <LoadingSkeleton count={2} height="h-20" />
          ) : upcomingEvents.length === 0 ? (
            <Card>
              <CardContent className="py-6 text-center text-muted-foreground">
                No upcoming events. Check back later!
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {upcomingEvents.map((ev) => (
                <Link key={ev.id} href={`/campus/events/${ev.id}`} className="block">
                  <Card compact interactive>
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-category-events-bg text-category-events flex flex-col items-center justify-center font-bold text-xs">
                        <span className="text-sm">
                          {new Date(ev.date).getDate()}
                        </span>
                        <span className="uppercase text-[10px]">
                          {new Date(ev.date).toLocaleString("default", {
                            month: "short",
                          })}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground truncate">{ev.title}</p>
                        <p className="text-sm text-muted-foreground truncate">
                          {ev.venue || "TBA"} · {ev.time || "All day"}
                        </p>
                      </div>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Emergency Quick Action */}
        <Link href="/campus/emergency" className="block">
          <Card className="border-destructive/20 hover:border-destructive/50 transition-colors">
            <div className="flex items-center gap-4 p-4">
              <div className="w-12 h-12 rounded-2xl bg-destructive/10 flex items-center justify-center shrink-0">
                <Phone className="w-6 h-6 text-destructive" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-foreground flex items-center gap-1">
                  Emergency Contacts
                  <AlertTriangle className="w-4 h-4 text-destructive" />
                </h3>
                <p className="text-sm text-muted-foreground">Quick access to important numbers</p>
              </div>
              <Button variant="destructive" size="sm" className="shrink-0">
                View
              </Button>
            </div>
          </Card>
        </Link>
      </div>
    </div>
  );
}