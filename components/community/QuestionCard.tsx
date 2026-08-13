import Link from "next/link";
import { ThumbsUp, MessageCircle, CheckCircle } from "lucide-react";
import { CommunityCard } from "./CommunityCard";
import type { Question } from "@/types/community";
import { Link } from 'react-router-dom';

interface QuestionCardProps {
  question: Question;
  onDelete?: (id: string) => void;
  showActions?: boolean;
}

export function QuestionCard({ question, onDelete, showActions = false }: QuestionCardProps) {
  const hasAccepted = !!question.acceptedAnswerId;

  return (
    <CommunityCard>
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <Link
            href={`/community/questions/${question.id}`}
            className="block text-lg font-semibold text-foreground hover:text-primary transition-colors"
          >
            {question.title}
          </Link>
          <p className="text-sm text-muted-foreground line-clamp-2 mt-0.5">{question.content}</p>
          <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
            <span>by {question.author.name}</span>
            <span className="flex items-center gap-1">
              <ThumbsUp className="w-3.5 h-3.5" />
              {question.upvotes}
            </span>
            <span className="flex items-center gap-1">
              <MessageCircle className="w-3.5 h-3.5" />
              {question.answers.length}
            </span>
            {hasAccepted && (
              <span className="flex items-center gap-1 text-success">
                <CheckCircle className="w-3.5 h-3.5" />
                Answered
              </span>
            )}
            <span>{new Date(question.createdAt).toLocaleDateString()}</span>
          </div>
        </div>
        {showActions && onDelete && (
          <button
            onClick={() => onDelete(question.id)}
            className="shrink-0 text-xs px-2 py-1 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors"
          >
            Delete
          </button>
        )}
      </div>
    </CommunityCard>
  );
}