// app/dashboard/study/personal/[sessionId]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { apiGet, apiPost } from "@/lib/api";
import type { PersonalStudyMessage, PersonalQuiz, PersonalQuizResult } from "@/types/study";

export default function SessionDetailPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Chat state
  const [messages, setMessages] = useState<PersonalStudyMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);

  // Quiz state
  const [quiz, setQuiz] = useState<PersonalQuiz | null>(null);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [quizResult, setQuizResult] = useState<PersonalQuizResult | null>(null);
  const [quizTopic, setQuizTopic] = useState("");
  const [numQuestions, setNumQuestions] = useState(5);

  useEffect(() => {
    apiGet(`/personal-study/sessions/${sessionId}`).then((data) => {
      setSession(data);
      if (data.messages) setMessages(data.messages);
      setLoading(false);
    });
  }, [sessionId]);

  const handleAsk = async () => {
    if (!input.trim()) return;
    const userMsg: PersonalStudyMessage = { role: "user", content: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setSending(true);
    try {
      const res = await apiPost(`/personal-study/sessions/${sessionId}/ask`, { question: input });
      const assistantMsg: PersonalStudyMessage = { role: "assistant", content: res.answer || res.response };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      setMessages((prev) => [...prev, { role: "assistant", content: "Error: " + err.message }]);
    }
    setSending(false);
  };

  const generateQuiz = async () => {
    try {
      const res = await apiPost(`/personal-study/sessions/${sessionId}/quiz`, {
        numQuestions,
        topic: quizTopic || undefined,
      });
      setQuiz(res);
      setAnswers({});
      setQuizResult(null);
    } catch (err: any) {
      alert("Failed to generate quiz: " + err.message);
    }
  };

  const submitQuiz = async () => {
    if (!quiz) return;
    const payload = {
      answers: quiz.questions.map((q) => ({
        questionId: q.id,
        selected: answers[q.id] ?? 0,
      })),
    };
    try {
      const res = await apiPost(`/personal-study/sessions/${sessionId}/quiz/submit`, payload);
      setQuizResult(res);
    } catch (err: any) {
      alert("Error submitting quiz: " + err.message);
    }
  };

  if (loading) return <p>Loading session...</p>;
  if (!session) return <p>Session not found.</p>;

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-2">{session.title}</h1>
      <p className="text-gray-500 mb-6">Session ID: {sessionId}</p>

      {/* Chat Section */}
      <div className="bg-white shadow rounded p-4 mb-6">
        <h2 className="text-lg font-semibold mb-2">Ask a Question</h2>
        <div className="h-64 overflow-y-auto border p-3 rounded mb-2 space-y-2">
          {messages.map((msg, i) => (
            <div key={i} className={`p-2 rounded ${msg.role === "user" ? "bg-blue-50 ml-8" : "bg-gray-100 mr-8"}`}>
              <strong>{msg.role === "user" ? "You" : "AI"}:</strong> {msg.content}
            </div>
          ))}
          {sending && <div className="text-gray-400">Thinking...</div>}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAsk()}
            placeholder="Ask about the material..."
            className="border p-2 flex-1"
          />
          <button onClick={handleAsk} className="bg-blue-600 text-white px-4 py-2 rounded">
            Send
          </button>
        </div>
      </div>

      {/* Quiz Section */}
      <div className="bg-white shadow rounded p-4">
        <h2 className="text-lg font-semibold mb-2">Generate a Quiz</h2>
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            placeholder="Topic (optional)"
            value={quizTopic}
            onChange={(e) => setQuizTopic(e.target.value)}
            className="border p-2 w-48"
          />
          <input
            type="number"
            min={1}
            max={10}
            value={numQuestions}
            onChange={(e) => setNumQuestions(Number(e.target.value))}
            className="border p-2 w-20"
          />
          <button onClick={generateQuiz} className="bg-purple-600 text-white px-4 py-2 rounded">
            Generate
          </button>
        </div>

        {quiz && !quizResult && (
          <div>
            {quiz.questions.map((q, idx) => (
              <div key={q.id} className="mb-4">
                <p className="font-medium">{idx + 1}. {q.text}</p>
                {q.options.map((opt, oi) => {
                  const optText = typeof opt === "string" ? opt : opt.text;
                  return (
                    <label key={oi} className="block ml-4">
                      <input
                        type="radio"
                        name={q.id}
                        value={oi}
                        checked={answers[q.id] === oi}
                        onChange={() => setAnswers((prev) => ({ ...prev, [q.id]: oi }))}
                        className="mr-2"
                      />
                      {optText}
                    </label>
                  );
                })}
              </div>
            ))}
            <button onClick={submitQuiz} className="bg-green-600 text-white px-4 py-2 rounded">
              Submit Answers
            </button>
          </div>
        )}

        {quizResult && (
          <div className="bg-green-50 p-4 rounded">
            <p className="font-bold">Score: {quizResult.score} / {quizResult.total}</p>
            <button onClick={() => { setQuiz(null); setQuizResult(null); }} className="mt-2 text-blue-600 underline">
              Take Another Quiz
            </button>
          </div>
        )}
      </div>
    </div>
  );
}