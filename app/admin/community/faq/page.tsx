// app/dashboard/admin/community/faq/page.tsx
"use client";

import { useEffect, useState } from "react";
import { listFaqs, createFaq, deleteFaq } from "@/lib/api/community.api";
import type { FAQ } from "@/types/community";

export default function AdminFaqPage() {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");

  useEffect(() => {
    listFaqs().then(setFaqs);
  }, []);

  const handleAdd = async () => {
    if (!question.trim() || !answer.trim()) return;
    const newFaq = await createFaq({ question, answer });
    setFaqs((prev) => [...prev, newFaq]);
    setQuestion("");
    setAnswer("");
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this FAQ?")) return;
    await deleteFaq(id);
    setFaqs((prev) => prev.filter((f) => f.id !== id));
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Manage FAQs</h1>

      <div className="bg-card shadow rounded p-4 mb-6 space-y-2">
        <input
          type="text"
          placeholder="Question"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          className="border p-2 w-full"
        />
        <textarea
          placeholder="Answer"
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          className="border p-2 w-full"
        />
        <button onClick={handleAdd} className="bg-success text-primary-foreground px-4 py-2 rounded">
          Add FAQ
        </button>
      </div>

      {faqs.map((f) => (
        <div
          key={f.id}
          className="bg-card shadow rounded p-4 mb-3 flex justify-between items-start"
        >
          <div>
            <p className="font-medium">{f.question}</p>
            <p className="text-muted-foreground">{f.answer}</p>
          </div>
          <button
            onClick={() => handleDelete(f.id)}
            className="text-red-600 text-sm hover:underline"
          >
            Delete
          </button>
        </div>
      ))}
    </div>
  );
}