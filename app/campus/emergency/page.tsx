"use client";

import { useEffect, useState } from "react";
import { Phone, AlertTriangle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import BackButton from "@/components/shared/BackButton";
import { listEmergencyContacts } from "@/lib/api/school.api";
import type { EmergencyContact } from "@/types/school";

export default function EmergencyPage() {
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchContacts = async () => {
      try {
        const data = await listEmergencyContacts();
        setContacts(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load contacts");
      } finally {
        setLoading(false);
      }
    };
    fetchContacts();
  }, []);

  if (error) return <ErrorMessage message={error} />;

  return (
    <div className="min-h-screen bg-muted pb-24">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-card border-b border-border px-4 py-3 flex items-center gap-3">
        <BackButton variant="icon" />
        <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-destructive" />
          Emergency Contacts
        </h1>
      </div>

      <div className="px-4 py-6 max-w-3xl mx-auto space-y-4">
        <p className="text-sm text-muted-foreground">
          Keep these numbers handy for urgent situations.
        </p>

        {loading ? (
          <LoadingSkeleton count={3} height="h-16" />
        ) : contacts.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              No emergency contacts available.
            </CardContent>
          </Card>
        ) : (
          contacts.map((contact) => (
            <Card key={contact.id} className="border-destructive/20 hover:border-destructive/50">
              <CardContent className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-bold text-foreground">{contact.name}</p>
                  <p className="text-sm text-muted-foreground">{contact.role}</p>
                </div>
                <a
                  href={`tel:${contact.phone}`}
                  className="inline-flex items-center gap-2 rounded-lg bg-destructive/10 px-4 py-2 text-sm font-semibold text-destructive hover:bg-destructive/20 transition-colors"
                >
                  <Phone className="w-4 h-4" />
                  {contact.phone}
                </a>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}