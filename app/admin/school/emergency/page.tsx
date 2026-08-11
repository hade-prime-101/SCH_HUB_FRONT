"use client";
import { useEffect, useState } from "react";
import {
  listEmergencyContacts,
  createEmergencyContact,
  updateEmergencyContact,
  deleteEmergencyContact,
} from "@/lib/school.api";
import type { EmergencyContact, CreateEmergencyContactPayload } from "@/types/school";

export default function AdminEmergencyContactsPage() {
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<CreateEmergencyContactPayload>({ name: "", phone: "", role: "" });

  const refresh = () => listEmergencyContacts().then(setContacts);
  useEffect(() => { refresh(); }, []);

  const handleSave = async () => {
    if (editingId) {
      await updateEmergencyContact(editingId, form);
    } else {
      await createEmergencyContact(form);
    }
    setShowForm(false);
    setEditingId(null);
    setForm({ name: "", phone: "", role: "" });
    refresh();
  };

  const handleEdit = (c: EmergencyContact) => {
    setForm({ name: c.name, phone: c.phone, role: c.role });
    setEditingId(c.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    await deleteEmergencyContact(id);
    refresh();
  };

  return (
    <div>
      <div className="flex justify-between mb-4">
        <h1 className="text-2xl font-bold">Emergency Contacts</h1>
        <button onClick={() => { setShowForm(true); setEditingId(null); setForm({ name: "", phone: "", role: "" }); }} className="bg-blue-600 text-white px-4 py-2 rounded">Add Contact</button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded p-6 w-96">
            <h2 className="text-lg font-semibold mb-4">{editingId ? "Edit" : "New"} Contact</h2>
            <input type="text" placeholder="Name" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="border p-2 w-full mb-2" />
            <input type="text" placeholder="Phone" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className="border p-2 w-full mb-2" />
            <input type="text" placeholder="Role (e.g. Security)" value={form.role} onChange={e => setForm({...form, role: e.target.value})} className="border p-2 w-full mb-4" />
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowForm(false)} className="bg-gray-200 px-4 py-2 rounded">Cancel</button>
              <button onClick={handleSave} className="bg-green-600 text-white px-4 py-2 rounded">Save</button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {contacts.map(c => (
          <div key={c.id} className="bg-white shadow rounded p-3 flex justify-between items-center">
            <div>
              <p className="font-medium">{c.name} ({c.role})</p>
              <p className="text-blue-600">{c.phone}</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => handleEdit(c)} className="text-blue-600">Edit</button>
              <button onClick={() => handleDelete(c.id)} className="text-red-600">Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}