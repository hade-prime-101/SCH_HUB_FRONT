// app/study/personal/[sessionId]/page.tsx
"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { apiGet, apiPost } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { ArrowLeft, Send, Sparkles, Brain } from "lucide-react";
import type { PersonalStudyMessage, PersonalQuiz, PersonalQuizResult } from "@/types/study";

export default function SessionDetailPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const router = useRouter();
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<PersonalStudyMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [quiz, setQuiz] = useState<PersonalQuiz | null>(null);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [quizResult, setQuizResult] = useState<PersonalQuizResult | null>(null);
  const [quizTopic, setQuizTopic] = useState("");
  const [numQuestions, setNumQuestions] = useState(5);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await apiGet(`/personal-study/sessions/${sessionId}`);
        setSession(data);
        if (data.messages) setMessages(data.messages);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [sessionId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleAsk = async () => {
    if (!input.trim() || sending) return;
    const userMsg: PersonalStudyMessage = { role: "user", content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setSending(true);
    try {
      const res = await apiPost(`/personal-study/sessions/${sessionId}/ask`, { question: input });
      const assistantMsg: PersonalStudyMessage = { role: "assistant", content: res.answer || res.response };
      setMessages(prev => [...prev, assistantMsg]);
    } catch (err: any) {
      setMessages(prev => [...prev, { role: "assistant", content: "Error: " + err.message }]);
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
      setError(err.message);
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
      setError(err.message);
    }
  };

  if (loading) return <LoadingSkeleton count={2} height="h-64" radius="rounded-2xl" />;
  if (error) {
    return (
      <div className="bg-destructive/5 border border-destructive/20 rounded-xl p-6 text-destructive">
        <p>{error}</p>
      </div>
    );
  }
  if (!session) return <div className="text-center py-12">Session not found.</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push("/study/personal")}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-xl font-bold">{session.title}</h1>
          <p className="text-sm text-muted-foreground">Session ID: {sessionId}</p>
        </div>
      </div>

      {/* Chat */}
      <Card>
        <CardContent className="p-4 space-y-4">
          <div className="h-80 overflow-y-auto space-y-3">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] p-3 rounded-xl ${
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-foreground"
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {sending && (
              <div className="flex justify-start">
                <div className="bg-muted p-3 rounded-xl text-muted-foreground">...</div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAsk()}
              placeholder="Ask a question about your material..."
              disabled={sending}
            />
            <Button onClick={handleAsk} disabled={sending || !input.trim()}>
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Quiz Section */}
      <Card>
        <CardContent className="p-4 space-y-4">
          <div className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold">Generate Quiz</h2>
          </div>

          <div className="flex flex-wrap gap-3 items-end">
            <div className="flex-1 min-w-[150px]">
              <label className="text-sm font-medium">Topic (optional)</label>
              <Input
                value={quizTopic}
                onChange={(e) => setQuizTopic(e.target.value)}
                placeholder="e.g., Derivatives"
              />
            </div>
            <div className="w-24">
              <label className="text-sm font-medium">Questions</label>
              <Input
                type="number"
                min={1}
                max={10}
                value={numQuestions}
                onChange={(e) => setNumQuestions(Number(e.target.value))}
              />
            </div>
            <Button onClick={generateQuiz}>
              <Sparkles className="w-4 h-4 mr-2" />
              Generate
            </Button>
          </div>

          {quiz && !quizResult && (
            <div className="space-y-4 pt-2">
              {quiz.questions.map((q, idx) => (
                <div key={q.id} className="border-b border-border pb-3">
                  <p className="font-medium">{idx + 1}. {q.text}</p>
                  <div className="ml-4 space-y-1 mt-1">
                    {q.options.map((opt, oi) => {
                      const optText = typeof opt === "string" ? opt : opt.text;
                      return (
                        <label key={oi} className="flex items-center gap-2">
                          <input
                            type="radio"
                            name={q.id}
                            value={oi}
                            checked={answers[q.id] === oi}
                            onChange={() => setAnswers(prev => ({ ...prev, [q.id]: oi }))}
                          />
                          {optText}
                        </label>
                      );
                    })}
                  </div>
                </div>
              ))}
              <Button onClick={submitQuiz} className="w-full sm:w-auto">
                Submit Answers
              </Button>
            </div>
          )}

          {quizResult && (
            <div className="bg-success/5 border border-success/20 rounded-xl p-4">
              <p className="font-bold">Score: {quizResult.score} / {quizResult.total}</p>
              <Button variant="outline" onClick={() => { setQuiz(null); setQuizResult(null); }} className="mt-2">
                Take Another Quiz
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}