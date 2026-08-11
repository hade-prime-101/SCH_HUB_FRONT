"use client";

import { useState, useEffect } from "react";
import { Loader2, Trash2, Edit, Plus } from "lucide-react";
import { communityApi } from "@/lib/api/community";
import type { FAQ } from "@/types/community";

export default function AdminFAQPage() {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ question: "", answer: "" });

  useEffect(() => {
    const loadFAQs = async () => {
      try {
        const data = await communityApi.getFAQs();
        setFaqs(Array.isArray(data) ? data : data?.data ?? []);
      } catch (error) {
        console.error("Failed to load FAQs:", error);
      } finally {
        setLoading(false);
      }
    };
    loadFAQs();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.question.trim() || !formData.answer.trim()) {
      alert("Please fill in both fields");
      return;
    }

    try {
      if (editingId) {
        await communityApi.updateFAQ(editingId, formData);
        setFaqs(
          faqs.map((f) =>
            f.id === editingId ? { ...f, ...formData } : f
          )
        );
      } else {
        const newFAQ = await communityApi.createFAQ(formData);
        setFaqs([...faqs, newFAQ]);
      }
      setFormData({ question: "", answer: "" });
      setEditingId(null);
      setShowForm(false);
    } catch (error) {
      console.error("Failed to save FAQ:", error);
    }
  };

  const handleDelete = async (faqId: string) => {
    if (!confirm("Are you sure you want to delete this FAQ?")) return;
    try {
      await communityApi.deleteFAQ(faqId);
      setFaqs(faqs.filter((f) => f.id !== faqId));
    } catch (error) {
      console.error("Failed to delete FAQ:", error);
    }
  };

  const handleEdit = (faq: FAQ) => {
    setFormData({ question: faq.question, answer: faq.answer });
    setEditingId(faq.id);
    setShowForm(true);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-foreground">FAQ Management</h2>
        <button
          onClick={() => {
            setShowForm(!showForm);
            if (showForm) {
              setEditingId(null);
              setFormData({ question: "", answer: "" });
            }
          }}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
        >
          <Plus className="w-4 h-4" />
          Add FAQ
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-card rounded-2xl p-6 mb-6 border border-border">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Question
              </label>
              <input
                type="text"
                value={formData.question}
                onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                placeholder="Enter FAQ question"
                className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Answer
              </label>
              <textarea
                value={formData.answer}
                onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
                placeholder="Enter FAQ answer"
                rows={4}
                className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
              >
                {editingId ? "Update" : "Create"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingId(null);
                  setFormData({ question: "", answer: "" });
                }}
                className="px-4 py-2 border border-border text-foreground rounded-lg hover:bg-accent transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* FAQs List */}
      {faqs.length === 0 ? (
        <div className="bg-card rounded-2xl p-12 text-center">
          <p className="text-muted-foreground">No FAQs yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {faqs.map((faq) => (
            <div key={faq.id} className="bg-card rounded-2xl p-6 border border-border">
              <div className="flex justify-between items-start gap-4 mb-3">
                <div className="flex-1">
                  <h3 className="font-bold text-foreground mb-2">{faq.question}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {faq.answer}
                  </p>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(faq)}
                  className="p-2 hover:bg-accent rounded-lg transition-colors"
                >
                  <Edit className="w-5 h-5 text-blue-600" />
                </button>
                <button
                  onClick={() => handleDelete(faq.id)}
                  className="p-2 hover:bg-red-100 rounded-lg transition-colors"
                >
                  <Trash2 className="w-5 h-5 text-red-600" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
