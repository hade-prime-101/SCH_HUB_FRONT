"use client";
import { useEffect, useState } from "react";
import { listEmergencyContacts } from "@/lib/school.api";
import type { EmergencyContact } from "@/types/school";

export default function EmergencyContactsPage() {
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);

  useEffect(() => { listEmergencyContacts().then(setContacts); }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Emergency Contacts</h1>
      <div className="space-y-2">
        {contacts.map(c => (
          <div key={c.id} className="bg-white shadow rounded p-3">
            <p className="font-medium">{c.name} ({c.role})</p>
            <p className="text-blue-600">{c.phone}</p>
          </div>
        ))}
      </div>
    </div>
  );
}