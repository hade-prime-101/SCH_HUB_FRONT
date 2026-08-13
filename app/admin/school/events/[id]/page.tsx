// app/dashboard/admin/school/events/[id]/page.tsx
"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  getEvent,
  uploadEventImage,
  listTickets,
  approveTicket,
  rejectTicket,
  deleteEvent,
} from "@/lib/api/school.api";
import type { SchoolEvent, Ticket } from "@/types/school";

export default function AdminEventDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [event, setEvent] = useState<SchoolEvent | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);

  const refresh = () => {
    getEvent(id).then(setEvent);
    listTickets(id).then(setTickets).catch(() => setTickets([]));
  };

  useEffect(() => { refresh(); }, [id]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !event) return;
    await uploadEventImage(event.id, file);
    refresh();
  };

  const handleApprove = async (ticketId: string) => {
    await approveTicket(ticketId);
    refresh();
  };

  const handleReject = async (ticketId: string) => {
    const reason = prompt("Rejection reason?");
    if (!reason) return;
    await rejectTicket(ticketId, { reason });
    refresh();
  };

  const handleDeleteEvent = async () => {
    if (!confirm("Delete this event?")) return;
    await deleteEvent(id);
    router.push("/dashboard/admin/school/events");
  };

  if (!event) return <p>Loading...</p>;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-start mb-4">
        <h1 className="text-2xl font-bold">{event.title}</h1>
        <div className="flex gap-2">
          <Link href={`/dashboard/admin/school/events/${id}/edit`} className="bg-primary text-primary-foreground px-3 py-1 rounded">
            Edit
          </Link>
          <button onClick={handleDeleteEvent} className="bg-destructive text-primary-foreground px-3 py-1 rounded">
            Delete
          </button>
        </div>
      </div>

      <p className="text-muted-foreground mb-2">{event.description}</p>
      <p className="text-sm text-muted-foreground">{new Date(event.date).toLocaleString()} @ {event.venue}</p>
      {event.imageUrl && <img src={event.imageUrl} className="mt-4 max-w-md rounded" />}

      {/* Image upload */}
      <div className="mt-4">
        <label className="block text-sm font-medium mb-1">Upload/Change Event Image</label>
        <input type="file" onChange={handleImageUpload} />
      </div>

      {/* Tickets section */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-3">Tickets ({tickets.length})</h2>
        {tickets.length === 0 && <p className="text-muted-foreground">No tickets submitted yet.</p>}
        {tickets.map((ticket) => (
          <div key={ticket.id} className="border rounded p-3 mb-2 flex justify-between items-center">
            <div>
              <p className="font-medium">User: {ticket.userId}</p>
              <p className="text-sm">Status: <span className={`font-semibold ${ticket.status === 'APPROVED' ? 'text-green-600' : ticket.status === 'REJECTED' ? 'text-red-600' : 'text-yellow-600'}`}>{ticket.status}</span></p>
              {ticket.rejectionReason && <p className="text-xs text-red-500">Reason: {ticket.rejectionReason}</p>}
            </div>
            {ticket.status === 'PENDING' && (
              <div className="flex gap-2">
                <button onClick={() => handleApprove(ticket.id)} className="bg-success text-primary-foreground px-3 py-1 rounded text-sm">Approve</button>
                <button onClick={() => handleReject(ticket.id)} className="bg-destructive text-primary-foreground px-3 py-1 rounded text-sm">Reject</button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}