"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

interface BackButtonProps {
  /** "icon" = square icon button (default for sub-pages)
   *  "text" = text link with label (for top-of-page breadcrumb style) */
  variant?: "icon" | "text";
  label?: string;
  /** If provided, navigate to this route instead of router.back() */
  href?: string;
  className?: string;
}

export default function BackButton({
  variant = "icon",
  label = "Back",
  href,
  className,
}: BackButtonProps) {
  const router = useRouter();

  function handleClick() {
    if (href) router.push(href);
    else router.back();
  }

  if (variant === "text") {
    return (
      <button
        onClick={handleClick}
        className={`flex items-center gap-2 text-primary font-semibold text-sm ${className ?? ""}`}
        aria-label={label}
      >
        <ArrowLeft className="w-4 h-4" />
        {label}
      </button>
    );
  }

  return (
    <button
      onClick={handleClick}
      aria-label={label}
      className={`w-11 h-11 rounded-2xl bg-card shadow-sm flex items-center justify-center shrink-0 active:scale-95 transition-transform ${className ?? ""}`}
    >
      <ArrowLeft className="w-5 h-5 text-foreground" />
    </button>
  );
}
