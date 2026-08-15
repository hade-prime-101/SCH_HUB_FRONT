"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Calendar, MapPin, Clock, Image, Users, Check, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import BackButton from "@/components/shared/BackButton";
import {
  getEvent,
  uploadEventImage,
  setEventReminder,
  submitReceipt,
  getMyTicket,
  listTickets,
  approveTicket,
  rejectTicket,
} from "@/lib/api/school.api";
import type { SchoolEvent, Ticket } from "@/types/school";

export default function EventDetailPage() {
  const { id } = useParams<{ id: string }>();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const router = useRouter();
  const [event, setEvent] = useState<SchoolEvent | null>(null);
  const [myTicket, setMyTicket] = useState<Ticket | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reminderMinutes, setReminderMinutes] = useState(30);
  const [receiptUrl, setReceiptUrl] = useState("");
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [isAdmin, setIsAdmin] = useState(false); // would come from auth

  const refresh = async () => {
    try {
      setLoading(true);
      const [ev, ticket, tix] = await Promise.all([
        getEvent(id),
        getMyTicket(id).catch(() => null),
        listTickets(id).catch(() => []),
      ]);
      setEvent(ev);
      setMyTicket(ticket);
      setTickets(tix);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load event");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !event) return;
    try {
      await uploadEventImage(event.id, file);
      refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload image");
    }
  };

  const handleSetReminder = async () => {
    if (!event) return;
    try {
      await setEventReminder(event.id, { minutesBefore: reminderMinutes });
      alert("Reminder set!");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to set reminder");
    }
  };

  const handleSubmitReceipt = async () => {
    if (!event || !receiptUrl) return;
    try {
      await submitReceipt(event.id, { receiptUrl });
      refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit receipt");
    }
  };

  const handleApprove = async (ticketId: string) => {
    try {
      await approveTicket(ticketId);
      refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to approve");
    }
  };

  const handleReject = async (ticketId: string) => {
    const reason = prompt("Rejection reason?");
    if (!reason) return;
    try {
      await rejectTicket(ticketId, { reason });
      refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reject");
    }
  };

  if (error) return <ErrorMessage message={error} />;
  if (loading) return <LoadingSkeleton count={3} height="h-20" />;
  if (!event) return <ErrorMessage message="Event not found" />;

  return (
    <div className="min-h-screen bg-muted pb-24">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-card border-b border-border px-4 py-3 flex items-center gap-3">
        <BackButton variant="icon" />
        <h1 className="text-xl font-bold text-foreground truncate">{event.title}</h1>
      </div>

      <div className="px-4 py-6 max-w-3xl mx-auto space-y-6">
        {/* Main card */}
        <Card>
          <CardContent className="space-y-4">
            {/* Title and metadata */}
            <div>
              <h2 className="text-2xl font-bold text-foreground">{event.title}</h2>
              <div className="flex flex-wrap gap-3 mt-2 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {new Date(event.date).toLocaleDateString()}
                </span>
                {event.time && (
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {event.time}
                  </span>
                )}
                {event.venue && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {event.venue}
                  </span>
                )}
              </div>
            </div>

            {/* Image */}
            {event.imageUrl && (
               
              <div className="rounded-xl overflow-hidden">
                <img
                  src={event.imageUrl}
                  alt={event.title}
                  className="w-full h-48 object-cover"
                />
              </div>
            )}

            {/* Description */}
            <div>
              <h3 className="font-semibold text-foreground mb-1">Description</h3>
              <p className="text-muted-foreground whitespace-pre-wrap">
                {event.description}
              </p>
            </div>

            {/* Actions: Image upload, reminder */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4 border-t border-border">
              <div>
                <label className="block text-sm font-medium mb-1">Upload Image</label>
                <input
                  type="file"
                  onChange={handleImageUpload}
                  className="block w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-primary file:text-primary-foreground hover:file:bg-primary/80"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Set Reminder (min)</label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    value={reminderMinutes}
                    onChange={(e) => setReminderMinutes(Number(e.target.value))}
                    className="w-24"
                  />
                  <Button onClick={handleSetReminder}>Set</Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Ticket section */}
        <Card>
          <CardContent className="space-y-3">
            <h3 className="font-semibold text-foreground">My Ticket</h3>
            {myTicket ? (
              <div className="flex items-center justify-between bg-muted rounded-xl px-4 py-3">
                <span className="text-sm">Status: {myTicket.status}</span>
                {myTicket.status === "APPROVED" && (
                  <span className="inline-flex items-center gap-1 text-xs text-success">
                    <Check className="w-4 h-4" /> Approved
                  </span>
                )}
                {myTicket.status === "REJECTED" && (
                  <span className="inline-flex items-center gap-1 text-xs text-destructive">
                    <X className="w-4 h-4" /> Rejected
                  </span>
                )}
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                <Input
                  placeholder="Receipt URL"
                  value={receiptUrl}
                  onChange={(e) => setReceiptUrl(e.target.value)}
                  className="flex-1"
                />
                <Button onClick={handleSubmitReceipt}>Submit Receipt</Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Admin ticket management */}
        {isAdmin && (
          <Card>
            <CardContent className="space-y-3">
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <Users className="w-4 h-4" />
                Ticket Management ({tickets.length})
              </h3>
              {tickets.length === 0 ? (
                <p className="text-sm text-muted-foreground">No tickets submitted.</p>
              ) : (
                <div className="space-y-2">
                  {tickets.map((ticket) => (
                    <div
                      key={ticket.id}
                      className="flex items-center justify-between bg-muted rounded-xl px-4 py-3"
                    >
                      <div>
                        <p className="text-sm font-medium">{ticket.userId}</p>
                        <p className="text-xs text-muted-foreground">{ticket.status}</p>
                      </div>
                      {ticket.status === "PENDING" && (
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-success border-success/30 hover:bg-success/10"
                            onClick={() => handleApprove(ticket.id)}
                          >
                            Approve
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleReject(ticket.id)}
                          >
                            Reject
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}