import React, { useState } from "react";
import { MessageSquare } from "lucide-react";
import FeedbackModal from "./FeedbackModal";

export default function HeaderActions() {
  const [showFeedback, setShowFeedback] = useState(false);

  return (
    <div className="flex items-center gap-2">
      {/* GitHub Star Button */}
      <a
        href="https://github.com/Vijajraj/CampusWash"
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1.5 py-1 px-3 bg-surface border border-border hover:border-primary-lt hover:bg-bg rounded-lg text-xs font-semibold text-text shadow-sm transition-all duration-200 active:scale-95 cursor-pointer"
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
          <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
          <path d="M9 18c-4.51 2-5-2-7-2" />
        </svg>
        <span className="hidden sm:inline text-text">Star</span>
        <span className="w-1.5 h-1.5 bg-accent rounded-full animate-pulse"></span>
      </a>

      {/* Feedback Button */}
      <button
        onClick={() => setShowFeedback(true)}
        className="flex items-center gap-1.5 py-1 px-3 bg-surface border border-border hover:border-primary-lt hover:bg-bg rounded-lg text-xs font-semibold text-text shadow-sm transition-all duration-200 active:scale-95 cursor-pointer"
      >
        <MessageSquare size={13} className="text-primary" />
        <span className="hidden sm:inline text-text">Feedback</span>
      </button>

      {/* Feedback Modal Overlay */}
      {showFeedback && (
        <FeedbackModal onClose={() => setShowFeedback(false)} />
      )}
    </div>
  );
}
