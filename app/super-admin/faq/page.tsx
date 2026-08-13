"use client";
import { useEffect, useState } from "react";
import { listSchoolFaqs, createSchoolFaq, updateSchoolFaq, deleteSchoolFaq } from "@/lib/api/super-admin.api";
import type { FAQ } from "@/types/super-admin";

export default function FaqsPage() {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ question: "", answer: "", category: "", order: 0 });

  const refresh = () => listSchoolFaqs().then(setFaqs);
  useEffect(() => { refresh(); }, []);

  const handleSave = async () => {
    if (editingId) {
      await updateSchoolFaq(editingId, form);
    } else {
      await createSchoolFaq(form);
    }
    setShowForm(false);
    setEditingId(null);
    setForm({ question: "", answer: "", category: "", order: 0 });
    refresh();
  };

  const handleEdit = (faq: FAQ) => {
    setForm({ question: faq.question, answer: faq.answer, category: faq.category || "", order: faq.order || 0 });
    setEditingId(faq.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    await deleteSchoolFaq(id);
    refresh();
  };

  return (
    <div>
      <div className="flex justify-between mb-4">
        <h1 className="text-2xl font-bold">FAQs</h1>
        <button onClick={() => setShowForm(true)} className="bg-primary text-primary-foreground px-4 py-2 rounded">Add FAQ</button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-card rounded p-6 w-96">
            <h2 className="text-lg font-semibold mb-4">{editingId ? "Edit" : "New"} FAQ</h2>
            <input type="text" placeholder="Question" value={form.question} onChange={e => setForm({...form, question: e.target.value})} className="border p-2 w-full mb-2" />
            <textarea placeholder="Answer" value={form.answer} onChange={e => setForm({...form, answer: e.target.value})} className="border p-2 w-full mb-2" />
            <input type="text" placeholder="Category (optional)" value={form.category} onChange={e => setForm({...form, category: e.target.value})} className="border p-2 w-full mb-2" />
            <input type="number" placeholder="Order" value={form.order} onChange={e => setForm({...form, order: parseInt(e.target.value)})} className="border p-2 w-full mb-4" />
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowForm(false)} className="bg-secondary/50 px-4 py-2 rounded">Cancel</button>
              <button onClick={handleSave} className="bg-success text-primary-foreground px-4 py-2 rounded">Save</button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {faqs.map(faq => (
          <div key={faq.id} className="bg-card shadow rounded p-4 flex justify-between">
            <div>
              <p className="font-medium">{faq.question}</p>
              <p className="text-sm text-muted-foreground">{faq.answer}</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => handleEdit(faq)} className="text-primary">Edit</button>
              <button onClick={() => handleDelete(faq.id)} className="text-red-600">Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}