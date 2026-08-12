"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
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
  const router = useRouter();
  const [event, setEvent] = useState<SchoolEvent | null>(null);
  const [myTicket, setMyTicket] = useState<Ticket | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isAdmin, setIsAdmin] = useState(false); // could be from global state
  const [reminderMinutes, setReminderMinutes] = useState(30);
  const [receiptUrl, setReceiptUrl] = useState("");

  useEffect(() => {
    getEvent(id).then(setEvent);
    getMyTicket(id).then(setMyTicket).catch(() => setMyTicket(null));
    // Admin check: e.g. from user context. Simplified:
    setIsAdmin(true); // placeholder
    listTickets(id).then(setTickets).catch(() => {});
  }, [id]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !event) return;
    await uploadEventImage(event.id, file);
    getEvent(id).then(setEvent);
  };

  const handleSetReminder = async () => {
    if (!event) return;
    await setEventReminder(event.id, { minutesBefore: reminderMinutes });
    alert("Reminder set!");
  };

  const handleSubmitReceipt = async () => {
    if (!event || !receiptUrl) return;
    await submitReceipt(event.id, { receiptUrl });
    getMyTicket(id).then(setMyTicket);
  };

  const handleApprove = async (ticketId: string) => {
    await approveTicket(ticketId);
    listTickets(id).then(setTickets);
  };

  const handleReject = async (ticketId: string) => {
    const reason = prompt("Rejection reason?");
    if (!reason) return;
    await rejectTicket(ticketId, { reason });
    listTickets(id).then(setTickets);
  };

  if (!event) return <p>Loading...</p>;

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold">{event.title}</h1>
      <p className="text-gray-600">{event.description}</p>
      <p className="text-sm mt-2">{new Date(event.date).toLocaleString()} @ {event.venue}</p>
      {event.imageUrl && <img src={event.imageUrl} className="mt-4 max-w-md rounded" />}

      <div className="mt-6 space-y-4">
        <div>
          <label className="block text-sm font-medium">Upload Event Image</label>
          <input type="file" onChange={handleImageUpload} />
        </div>

        <div>
          <label className="block text-sm font-medium">Set Reminder (minutes before)</label>
          <div className="flex gap-2">
            <input type="number" value={reminderMinutes} onChange={e => setReminderMinutes(Number(e.target.value))} className="border p-1 w-24" />
            <button onClick={handleSetReminder} className="bg-blue-600 text-white px-3 py-1 rounded">Set</button>
          </div>
        </div>

        <div>
          <h3 className="font-semibold">My Ticket</h3>
          {myTicket ? (
            <p className="text-sm">Status: {myTicket.status}</p>
          ) : (
            <div className="flex gap-2">
              <input type="text" placeholder="Receipt URL" value={receiptUrl} onChange={e => setReceiptUrl(e.target.value)} className="border p-1 flex-1" />
              <button onClick={handleSubmitReceipt} className="bg-green-600 text-white px-3 py-1 rounded">Submit Receipt</button>
            </div>
          )}
        </div>

        {isAdmin && (
          <div>
            <h3 className="font-semibold">Ticket Management ({tickets.length})</h3>
            {tickets.map(ticket => (
              <div key={ticket.id} className="bg-gray-50 p-2 mb-2 flex justify-between items-center">
                <span>{ticket.userId} - {ticket.status}</span>
                {ticket.status === 'PENDING' && (
                  <div className="flex gap-2">
                    <button onClick={() => handleApprove(ticket.id)} className="text-green-600">Approve</button>
                    <button onClick={() => handleReject(ticket.id)} className="text-red-600">Reject</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}