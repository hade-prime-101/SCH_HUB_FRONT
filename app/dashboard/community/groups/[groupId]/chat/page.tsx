"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Sparkles,
  MoreVertical,
  ChevronUp,
  Paperclip,
  Wand2,
  BookOpen,
  Send,
  FileText,
  Bot,
  Loader2,
  AlertTriangle,
  RefreshCw,
  X,
  ClipboardList,
  CheckCircle2,
  ChevronDown,
} from "lucide-react";
import { communityApi } from "@/lib/api/community";
import { studyApi } from "@/lib/api";

// ─── Types ────────────────────────────────────────────────────────────────────

type MessageKind = "USER" | "AI";

interface Attachment {
  name: string;
  url?: string;
}

interface ChatMessage {
  id:          string;
  senderId:    string;
  senderName:  string;
  content:     string;
  kind:        MessageKind;
  attachment?: Attachment;
  sentAt:      string;
  delivered?:  boolean;
}

interface GroupInfo {
  id:          string;
  name:        string;
  memberCount: number;
}

interface Material {
  id:         string;
  title:      string;
  courseCode: string;
  type:       string;
}

type QuizSheetStep = "form" | "generating" | "success" | "error";

// ─── Mock data ────────────────────────────────────────────────────────────────

const MOCK_GROUP: GroupInfo = {
  id: "g1", name: "LOOPZ Study Group", memberCount: 24,
};

const MOCK_ME = "me";

const MOCK_MESSAGES: ChatMessage[] = [
  {
    id: "msg1", senderId: "u2", senderName: "Maya Chen",
    kind: "USER", content: "Can someone share the chapter 4 summary?",
    attachment: { name: "chapter-4-notes.pdf" },
    sentAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
  },
  {
    id: "msg2", senderId: MOCK_ME, senderName: "You",
    kind: "USER", content: "I'll upload it in a sec.",
    sentAt: new Date(Date.now() - 8 * 60 * 1000).toISOString(),
    delivered: true,
  },
  {
    id: "msg3", senderId: "ai", senderName: "LOOPZ AI",
    kind: "AI",
    content: "Here's a quick summary of the uploaded material and the key formulas to remember.",
    sentAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTime(iso: string): string {
  try {
    return new Intl.DateTimeFormat("en-NG", {
      hour: "numeric", minute: "2-digit", hour12: true,
    }).format(new Date(iso));
  } catch { return ""; }
}

function initials(name: string): string {
  return name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
}

// ─── AI summary card ──────────────────────────────────────────────────────────

function AISummaryCard() {
  return (
    <div className="bg-muted rounded-xl p-3 mt-3">
      <p className="font-bold text-foreground text-sm mb-1">Chapter 4: Linear Systems</p>
      <p className="text-muted-foreground text-sm leading-relaxed">
        Focus on elimination, substitution, and interpreting solution sets from augmented matrices.
      </p>
    </div>
  );
}

// ─── Message bubble ───────────────────────────────────────────────────────────

function MessageBubble({
  msg,
  isMine,
}: {
  msg:    ChatMessage;
  isMine: boolean;
}) {
  const isAI = msg.kind === "AI";

  if (isMine) {
    return (
      <div className="flex flex-col items-end ml-auto max-w-[85%]">
        <div className="bg-primary rounded-2xl rounded-tr-sm px-4 py-3">
          <p className="text-primary-foreground text-sm">{msg.content}</p>
          {msg.attachment && (
            <div className="flex items-center gap-2 mt-2 bg-primary/80 rounded-lg px-3 py-2">
              <FileText className="w-4 h-4 text-primary-foreground/80 shrink-0" />
              <span className="text-primary-foreground/90 text-xs truncate">{msg.attachment.name}</span>
            </div>
          )}
        </div>
        <p className="text-muted-foreground text-xs mt-1">
          {msg.delivered ? "Delivered" : formatTime(msg.sentAt)}
        </p>
      </div>
    );
  }

  return (
    <div className="flex gap-2 max-w-[90%]">
      {/* Avatar */}
      {isAI ? (
        <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center shrink-0">
          <Bot className="w-4 h-4 text-primary" />
        </div>
      ) : (
        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-foreground shrink-0">
          {initials(msg.senderName)}
        </div>
      )}

      <div className="min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <p className="font-bold text-foreground text-sm">{msg.senderName}</p>
          <p className="text-muted-foreground text-xs">{formatTime(msg.sentAt)}</p>
        </div>
        <div className="bg-card rounded-2xl rounded-tl-sm px-4 py-3">
          <p className="text-foreground text-sm leading-relaxed">{msg.content}</p>
          {msg.attachment && (
            <div className="flex items-center gap-2 mt-2 bg-muted rounded-lg px-3 py-2">
              <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
              <span className="text-foreground text-xs truncate">{msg.attachment.name}</span>
            </div>
          )}
          {/* AI summary card appended to AI messages */}
          {isAI && <AISummaryCard />}
        </div>
      </div>
    </div>
  );
}

// ─── Generate Quiz bottom sheet ───────────────────────────────────────────────

function GenerateQuizSheet({
  groupId,
  onClose,
  onSuccess,
}: {
  groupId:   string;
  onClose:   () => void;
  onSuccess: (quizId: string, quizTitle: string) => void;
}) {
  const [materials,    setMaterials]    = useState<Material[]>([]);
  const [loadingMats,  setLoadingMats]  = useState(true);
  const [materialId,   setMaterialId]   = useState("");
  const [questionCount,setQuestionCount]= useState(15);
  const [step,         setStep]         = useState<QuizSheetStep>("form");
  const [errorMsg,     setErrorMsg]     = useState("");
  const [generatedId,  setGeneratedId]  = useState<string | null>(null);
  const [generatedTitle,setGeneratedTitle]= useState("");

  useEffect(() => {
    studyApi.getMaterials({ limit: "50" })
      .then((res: any) => {
        const arr = Array.isArray(res) ? res : (res?.data ?? res?.items ?? []);
        setMaterials(arr as Material[]);
      })
      .catch(() => setMaterials([]))
      .finally(() => setLoadingMats(false));
  }, []);

  const selectedMaterial = materials.find(m => m.id === materialId);

  async function handleGenerate() {
    if (!materialId) { setErrorMsg("Please select a study material."); return; }
    setStep("generating");
    setErrorMsg("");
    try {
      const res = await studyApi.generateQuiz({
        materialId,
        questionCount,
        departmentId:  "default",
        visibility:    "STUDY_GROUP",
        studyGroupId:  groupId,
      }) as any;
      const id    = res?.id ?? res?.data?.id ?? null;
      const title = selectedMaterial?.title ?? "Quiz";
      setGeneratedId(id);
      setGeneratedTitle(title);
      setStep("success");
      onSuccess(id, title);
    } catch (e: any) {
      setErrorMsg(e?.message || "Failed to generate quiz. Make sure the material has readable content.");
      setStep("error");
    }
  }

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-end justify-center"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Scrim */}
      <div className="absolute inset-0 bg-black/40" />

      {/* Sheet */}
      <div className="relative w-full max-w-lg bg-card rounded-t-3xl px-5 pt-4 pb-8 flex flex-col gap-4 shadow-xl animate-in slide-in-from-bottom-4 duration-300">

        {/* Drag handle */}
        <div className="mx-auto w-10 h-1 rounded-full bg-border mb-1" />

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-accent flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="font-bold text-foreground text-base leading-tight">Generate Quiz</p>
              <p className="text-muted-foreground text-xs">AI-powered · for this group</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-muted flex items-center justify-center"
            aria-label="Close"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        {/* ── Success state ── */}
        {step === "success" && (
          <div className="flex flex-col items-center gap-4 py-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-emerald-500" />
            </div>
            <div className="text-center">
              <p className="font-bold text-foreground text-lg">Quiz Ready!</p>
              <p className="text-muted-foreground text-sm mt-1">
                <span className="font-semibold text-foreground">{generatedTitle}</span> quiz has been
                generated and shared with this group.
              </p>
            </div>
            <div className="flex flex-col gap-2 w-full">
              {generatedId && (
                <a
                  href={`/dashboard/study/quizzes/${generatedId}`}
                  className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground font-bold rounded-2xl py-3.5"
                >
                  <BookOpen className="w-4 h-4" /> Open Quiz
                </a>
              )}
              <button
                onClick={onClose}
                className="w-full bg-muted text-foreground font-semibold rounded-2xl py-3"
              >
                Done
              </button>
            </div>
          </div>
        )}

        {/* ── Generating state ── */}
        {step === "generating" && (
          <div className="flex flex-col items-center gap-4 py-6">
            <div className="w-16 h-16 rounded-full bg-accent flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
            <div className="text-center">
              <p className="font-bold text-foreground">Generating {questionCount} questions…</p>
              <p className="text-muted-foreground text-sm mt-1">
                This usually takes 10–30 seconds.
              </p>
            </div>
          </div>
        )}

        {/* ── Error state ── */}
        {step === "error" && (
          <div className="flex flex-col gap-4">
            <div className="flex items-start gap-3 bg-destructive/10 rounded-2xl px-4 py-3">
              <AlertTriangle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
              <p className="text-sm text-destructive">{errorMsg}</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setStep("form")}
                className="flex-1 bg-primary text-primary-foreground font-bold rounded-2xl py-3 text-sm"
              >
                Try Again
              </button>
              <button
                onClick={onClose}
                className="flex-1 bg-muted text-foreground font-semibold rounded-2xl py-3 text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* ── Form state ── */}
        {step === "form" && (
          <div className="flex flex-col gap-4">

            {/* Material picker */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-foreground">Study Material</label>
              {loadingMats ? (
                <div className="h-12 bg-muted rounded-xl flex items-center justify-center">
                  <Loader2 className="w-4 h-4 text-muted-foreground animate-spin" />
                </div>
              ) : (
                <div className="relative">
                  <select
                    value={materialId}
                    onChange={e => { setMaterialId(e.target.value); setErrorMsg(""); }}
                    className="w-full px-4 py-3 pr-10 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-muted text-foreground appearance-none"
                  >
                    <option value="">Select a material…</option>
                    {materials.map(m => (
                      <option key={m.id} value={m.id}>
                        [{m.courseCode}] {m.title}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                </div>
              )}

              {selectedMaterial && (
                <div className="flex items-center gap-2 bg-accent rounded-xl px-3 py-2.5">
                  <FileText className="w-4 h-4 text-primary shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-primary truncate">{selectedMaterial.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {selectedMaterial.courseCode} · {selectedMaterial.type.replace(/_/g, " ")}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Question count */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-foreground">Questions</label>
                <span className="text-base font-bold text-primary">{questionCount}</span>
              </div>
              <input
                type="range"
                min={5}
                max={30}
                step={5}
                value={questionCount}
                onChange={e => setQuestionCount(parseInt(e.target.value))}
                className="w-full accent-primary"
              />
              <div className="flex justify-between text-xs text-muted-foreground font-medium">
                <span>5 Quick</span>
                <span>15 Standard</span>
                <span>30 Full</span>
              </div>
            </div>

            {/* Inline error */}
            {errorMsg && (
              <div className="flex items-center gap-2 bg-destructive/10 rounded-xl px-3 py-2">
                <AlertTriangle className="w-3.5 h-3.5 text-destructive shrink-0" />
                <p className="text-xs text-destructive">{errorMsg}</p>
              </div>
            )}

            {/* Generate button */}
            <button
              onClick={handleGenerate}
              disabled={!materialId || loadingMats}
              className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground font-bold rounded-2xl py-4 disabled:opacity-40 transition active:opacity-90"
            >
              <Sparkles className="w-5 h-5" />
              Generate Quiz for Group
            </button>

            <p className="text-xs text-muted-foreground text-center">
              The quiz will be visible to all group members.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function GroupChatPage() {
  const router  = useRouter();
  const params  = useParams();
  const groupId = params.groupId as string;

  // ── group info ──────────────────────────────────────────────────────────────
  const [group, setGroup]       = useState<GroupInfo>(MOCK_GROUP);
  const [groupError, setGroupError] = useState<string | null>(null);

  // ── messages ────────────────────────────────────────────────────────────────
  const [messages, setMessages]     = useState<ChatMessage[]>(MOCK_MESSAGES);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [msgError, setMsgError]     = useState<string | null>(null);
  const [hasOlder, setHasOlder]     = useState(true);
  const [loadingOlder, setLoadingOlder] = useState(false);

  // ── compose ─────────────────────────────────────────────────────────────────
  const [message, setMessage]       = useState("");
  const [sending, setSending]       = useState(false);
  const [sendError, setSendError]   = useState<string | null>(null);

  // ── AI ask ──────────────────────────────────────────────────────────────────
  const [aiLoading, setAiLoading]   = useState(false);

  // ── Quiz sheet ──────────────────────────────────────────────────────────────
  const [quizSheetOpen, setQuizSheetOpen] = useState(false);

  // ── refs ────────────────────────────────────────────────────────────────────
  const bottomRef   = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── fetch group info ────────────────────────────────────────────────────────

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await communityApi.getGroup(groupId) as GroupInfo;
        if (!cancelled) setGroup(data);
      } catch {
        if (!cancelled) setGroupError("Couldn't load group info.");
      }
    })();
    return () => { cancelled = true; };
  }, [groupId]);

  // ── fetch messages ──────────────────────────────────────────────────────────

  const fetchMessages = useCallback(async () => {
    setLoadingMsgs(true); setMsgError(null);
    try {
      const data = await communityApi.getGroupMessages(groupId);
      const list: ChatMessage[] = Array.isArray(data)
        ? data
        : data?.messages ?? data?.items ?? [];
      if (list.length > 0) setMessages(list);
    } catch {
      setMsgError("Couldn't load messages.");
    } finally {
      setLoadingMsgs(false);
    }
  }, [groupId]);

  useEffect(() => {
    let cancelled = false;
    fetchMessages().catch(() => {});
    return () => { cancelled = true; };
  }, [fetchMessages]);

  // ── auto-scroll to bottom on new messages ───────────────────────────────────

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ── load older messages ─────────────────────────────────────────────────────

  async function loadOlder() {
    if (loadingOlder || !hasOlder) return;
    setLoadingOlder(true);
    try {
      const oldest = messages[0]?.id;
      const data = await communityApi.getGroupMessages(groupId, { before: oldest });
      const list: ChatMessage[] = Array.isArray(data)
        ? data
        : (data as { messages?: ChatMessage[] })?.messages ?? [];
      if (list.length === 0) { setHasOlder(false); return; }
      setMessages(prev => [...list, ...prev]);
    } catch {
      // silent — user can retry by tapping again
    } finally {
      setLoadingOlder(false);
    }
  }

  // ── quiz generated — post AI notification message into chat ─────────────────

  function handleQuizSuccess(quizId: string, quizTitle: string) {
    const aiMsg: ChatMessage = {
      id:         `ai-quiz-${Date.now()}`,
      senderId:   "ai",
      senderName: "LOOPZ AI",
      kind:       "AI",
      content:    `🎯 A new quiz has been generated for this group: **${quizTitle}** (${quizId ? `ID: ${quizId}` : "ready to take"}).\n\nHead to the Quizzes section to take it!`,
      sentAt:     new Date().toISOString(),
    };
    setMessages(prev => [...prev, aiMsg]);
    setQuizSheetOpen(false);
  }

  // ── send message ─────────────────────────────────────────────────────────────

  async function handleSend() {
    const text = message.trim();
    if (!text || sending) return;

    // Optimistic append
    const tempId = `temp-${Date.now()}`;
    const optimistic: ChatMessage = {
      id: tempId, senderId: MOCK_ME, senderName: "You",
      kind: "USER", content: text,
      sentAt: new Date().toISOString(), delivered: false,
    };
    setMessages(prev => [...prev, optimistic]);
    setMessage("");
    setSendError(null);
    setSending(true);

    try {
      const sent = await communityApi.sendGroupMessage(groupId, text) as ChatMessage;
      // Replace optimistic message with real one
      setMessages(prev => prev.map(m =>
        m.id === tempId ? { ...sent, delivered: true } : m
      ));
    } catch {
      // Revert optimistic message, restore input
      setMessages(prev => prev.filter(m => m.id !== tempId));
      setMessage(text);
      setSendError("Failed to send. Tap send to retry.");
    } finally {
      setSending(false);
    }
  }

  // ── send on Enter (not Shift+Enter) ─────────────────────────────────────────

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  // ── AI ask ───────────────────────────────────────────────────────────────────

  async function handleAiAsk() {
    const question = message.trim();
    if (!question) return;

    setMessage("");
    setAiLoading(true);

    // Show user's question optimistically
    const userMsg: ChatMessage = {
      id: `temp-u-${Date.now()}`, senderId: MOCK_ME, senderName: "You",
      kind: "USER", content: question,
      sentAt: new Date().toISOString(), delivered: true,
    };
    setMessages(prev => [...prev, userMsg]);

    try {
      const res = await communityApi.groupAiAsk(groupId, question) as { answer?: string; content?: string };
      const aiMsg: ChatMessage = {
        id:          `ai-${Date.now()}`,
        senderId:    "ai",
        senderName:  "LOOPZ AI",
        kind:        "AI",
        content:     res?.answer ?? res?.content ?? "Here's what I found.",
        sentAt:      new Date().toISOString(),
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch {
      const errMsg: ChatMessage = {
        id: `ai-err-${Date.now()}`, senderId: "ai", senderName: "LOOPZ AI",
        kind: "AI", content: "Sorry, I couldn't process that right now. Try again.",
        sentAt: new Date().toISOString(),
      };
      setMessages(prev => [...prev, errMsg]);
    } finally {
      setAiLoading(false);
    }
  }

  // ── attach file ──────────────────────────────────────────────────────────────

  async function handleAttach(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Upload the file via studyApi, then send a message with the attachment
    // in the backend-required shape: [{ url, name, size?, mimeType? }]
    try {
      const uploadResult = await studyApi.uploadMaterial({ title: file.name, visibility: "LINK_ONLY" }, file) as any;
      // Prefer a download URL from the upload response; fall back to filename
      const fileUrl: string =
        uploadResult?.downloadUrl ?? uploadResult?.url ?? uploadResult?.data?.url ?? file.name;

      await communityApi.sendGroupMessage(
        groupId,
        `📎 ${file.name}`,
        [{ url: fileUrl, name: file.name, size: file.size, mimeType: file.type }],
      );
      fetchMessages();
    } catch {
      setSendError("Failed to send attachment.");
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  return (
    <div className="min-h-screen w-full bg-muted flex flex-col">

      {/* ── Header ── */}
      <div className="bg-card px-4 py-4 flex items-center justify-between border-b border-border shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} aria-label="Go back">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <div>
            <p className="font-bold text-foreground leading-tight">
              {groupError ? "Study Group" : group.name}
            </p>
            <p className="text-muted-foreground text-xs">
              {group.memberCount} member{group.memberCount !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {/* AI ask shortcut — tapping triggers AI with current input */}
          <button
            onClick={handleAiAsk}
            disabled={!message.trim() || aiLoading}
            aria-label="Ask AI"
            className="disabled:opacity-40"
          >
            {aiLoading
              ? <Loader2 className="w-5 h-5 text-primary animate-spin" />
              : <Sparkles className="w-5 h-5 text-primary" />
            }
          </button>
          <Link
            href={`/dashboard/community/groups/${groupId}/settings`}
            aria-label="Group settings"
          >
            <MoreVertical className="w-5 h-5 text-foreground" />
          </Link>
        </div>
      </div>

      {/* ── Error banners ── */}
      {msgError && (
        <div className="mx-4 mt-3 flex items-center gap-3 bg-destructive/10 rounded-2xl px-4 py-3">
          <AlertTriangle className="w-4 h-4 text-destructive shrink-0" />
          <p className="text-sm text-destructive flex-1">{msgError}</p>
          <button onClick={fetchMessages} aria-label="Retry">
            <RefreshCw className="w-4 h-4 text-destructive" />
          </button>
        </div>
      )}

      {/* ── Message list ── */}
      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-4">

        {/* Load older */}
        {hasOlder && (
          <button
            onClick={loadOlder}
            disabled={loadingOlder}
            className="mx-auto flex items-center gap-2 bg-card rounded-full px-4 py-2 text-muted-foreground font-medium text-sm shadow-sm border border-border"
          >
            {loadingOlder
              ? <Loader2 className="w-4 h-4 animate-spin" />
              : <ChevronUp className="w-4 h-4" />
            }
            {loadingOlder ? "Loading…" : "Load older messages"}
          </button>
        )}

        {/* Initial messages loading */}
        {loadingMsgs && messages.length === 0 && (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 text-primary animate-spin" />
          </div>
        )}

        {/* Messages */}
        {messages.map(msg => (
          <MessageBubble
            key={msg.id}
            msg={msg}
            isMine={msg.senderId === MOCK_ME}
          />
        ))}

        {/* AI thinking indicator */}
        {aiLoading && (
          <div className="flex gap-2 max-w-[90%]">
            <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4 text-primary" />
            </div>
            <div className="bg-card rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-2">
              <Loader2 className="w-4 h-4 text-primary animate-spin" />
              <p className="text-muted-foreground text-sm">SCH Hub AI is thinking…</p>
            </div>
          </div>
        )}

        {/* Scroll anchor */}
        <div ref={bottomRef} />
      </div>

      {/* ── Send error ── */}
      {sendError && (
        <div className="mx-4 mb-1 flex items-center gap-2 bg-destructive/10 rounded-xl px-3 py-2">
          <AlertTriangle className="w-3.5 h-3.5 text-destructive shrink-0" />
          <p className="text-destructive text-xs flex-1">{sendError}</p>
          <button onClick={() => setSendError(null)} aria-label="Dismiss">
            <X className="w-3.5 h-3.5 text-destructive" />
          </button>
        </div>
      )}

      {/* ── Input bar ── */}
      <div className="bg-card border-t border-border px-4 py-3 flex items-center gap-2 shrink-0">

        {/* Attach file */}
        <button
          onClick={() => fileInputRef.current?.click()}
          aria-label="Attach file"
          className="w-10 h-10 rounded-full bg-muted flex items-center justify-center shrink-0"
        >
          <Paperclip className="w-4 h-4 text-muted-foreground" />
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.jpg,.jpeg,.png"
          className="hidden"
          onChange={handleAttach}
        />

        {/* AI ask */}
        <button
          onClick={handleAiAsk}
          disabled={!message.trim() || aiLoading}
          aria-label="Ask AI"
          className="w-10 h-10 rounded-full bg-muted flex items-center justify-center shrink-0 disabled:opacity-40"
        >
          <Wand2 className="w-4 h-4 text-muted-foreground" />
        </button>

        {/* Generate Quiz */}
        <button
          onClick={() => setQuizSheetOpen(true)}
          aria-label="Generate quiz for group"
          className="w-10 h-10 rounded-full bg-muted flex items-center justify-center shrink-0"
        >
          <ClipboardList className="w-4 h-4 text-muted-foreground" />
        </button>

        {/* Materials shortcut */}
        <Link
          href="/dashboard/study/materials"
          aria-label="Browse study materials"
          className="w-10 h-10 rounded-full bg-muted flex items-center justify-center shrink-0"
        >
          <BookOpen className="w-4 h-4 text-muted-foreground" />
        </Link>

        {/* Text input */}
        <input
          value={message}
          onChange={e => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Message…"
          className="flex-1 bg-muted rounded-full px-4 py-2.5 text-foreground placeholder:text-muted-foreground focus:outline-none text-sm"
        />

        {/* Send */}
        <button
          onClick={handleSend}
          disabled={!message.trim() || sending}
          aria-label="Send message"
          className="w-10 h-10 rounded-full bg-foreground flex items-center justify-center shrink-0 disabled:opacity-40 transition-opacity"
        >
          {sending
            ? <Loader2 className="w-4 h-4 text-background animate-spin" />
            : <Send className="w-4 h-4 text-background" />
          }
        </button>
      </div>

      {/* ── Generate Quiz bottom sheet ── */}
      {quizSheetOpen && (
        <GenerateQuizSheet
          groupId={groupId}
          onClose={() => setQuizSheetOpen(false)}
          onSuccess={handleQuizSuccess}
        />
      )}

    </div>
  );
}
