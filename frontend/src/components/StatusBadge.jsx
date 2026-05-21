import React from "react";

export default function StatusBadge({ status, loading }) {
  if (loading || !status) {
    return (
      <div className="w-20 h-5 bg-border animate-pulse rounded border-l-4 border-l-border pl-2"></div>
    );
  }

  const normalized = status.toLowerCase();

  let borderColor = "var(--color-text-muted)";
  let textColor = "var(--color-text-muted)";

  if (["available", "unclaimed", "open"].includes(normalized)) {
    borderColor = "var(--color-success)";
    textColor = "var(--color-success)";
  } else if (["pending"].includes(normalized)) {
    borderColor = "var(--color-accent)";
    textColor = "var(--color-accent)";
  } else if (["borrowed", "claimed", "fulfilled", "resolved"].includes(normalized)) {
    borderColor = "var(--color-primary-lt)";
    textColor = "var(--color-primary)";
  } else if (["rejected", "overdue", "expired"].includes(normalized)) {
    borderColor = "var(--color-error)";
    textColor = "var(--color-error)";
  }

  return (
    <span
      className="inline-block border-l-4 pl-2 text-xs font-semibold uppercase tracking-wider"
      style={{ borderLeftColor: borderColor, color: textColor }}
    >
      {status}
    </span>
  );
}
