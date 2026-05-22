import React, { useState } from "react";
import useAuth from "../hooks/useAuth";
import StatusBadge from "./StatusBadge";
import { closeLostItem, claimFoundItem, reportItem } from "../api/items";
import { showToast } from "../hooks/useItems";
import { Calendar, MapPin, User, Mail, Phone, AlertTriangle, ShieldAlert } from "lucide-react";

export default function ItemCard({ item, isLost, onRefresh }) {
  const { user } = useAuth();
  const [showReportForm, setShowReportForm] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState("");

  const isOwner = user?.id === item.user_id;

  const handleClose = async () => {
    if (!window.confirm("Are you sure you want to close this lost item report?")) return;
    setActionLoading(true);
    setActionError("");
    try {
      await closeLostItem(item.id);
      showToast("Lost item report closed successfully");
      if (onRefresh) onRefresh();
    } catch (err) {
      setActionError(err.message || "Failed to close item report");
    } finally {
      setActionLoading(false);
    }
  };

  const handleClaim = async () => {
    if (!window.confirm("Are you sure you want to claim this found item?")) return;
    setActionLoading(true);
    setActionError("");
    try {
      await claimFoundItem(item.id);
      showToast("Found item claimed successfully");
      if (onRefresh) onRefresh();
    } catch (err) {
      setActionError(err.message || "Failed to claim item");
    } finally {
      setActionLoading(false);
    }
  };

  const handleReportSubmit = async (e) => {
    e.preventDefault();
    if (!reportReason.trim()) return;

    setActionLoading(true);
    setActionError("");
    const targetType = isLost ? "lost_item" : "found_item";

    try {
      await reportItem(targetType, item.id, reportReason.trim());
      showToast("Report submitted successfully");
      setShowReportForm(false);
      setReportReason("");
    } catch (err) {
      setActionError(err.message || "Failed to submit report");
    } finally {
      setActionLoading(false);
    }
  };

  // Build image URL or placeholder
  const imageSrc = item.image_url
    ? item.image_url.startsWith("http")
      ? item.image_url
      : `${import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api/v1"}/static/${item.image_url}`
    : null;

  return (
    <div className="bg-surface border border-border rounded-xl shadow-sm overflow-hidden flex flex-col justify-between hover:shadow-md transition-all duration-300">
      <div>
        {/* Item Image */}
        <div className="h-48 w-full bg-bg relative flex items-center justify-center border-b border-border">
          {imageSrc ? (
            <img
              src={imageSrc}
              alt={item.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="text-center p-6 text-text-muted flex flex-col items-center gap-2">
              <span className="text-xs uppercase font-semibold tracking-wider bg-border/40 px-2.5 py-1 rounded text-text font-mono">
                {item.item_type}
              </span>
            </div>
          )}
          <div className="absolute top-3 right-3 bg-surface/90 backdrop-blur-xs py-1 px-2.5 rounded-lg border border-border">
            <StatusBadge status={item.status} />
          </div>
        </div>

        {/* Card Content */}
        <div className="p-6">
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-accent font-mono">
              {item.color || "Any Color"}
            </span>
          </div>

          <h3 className="text-lg font-bold text-text mb-2 line-clamp-1">
            {item.title}
          </h3>

          <p className="text-sm text-text-muted mb-4 line-clamp-2 leading-relaxed">
            {item.description}
          </p>

          <div className="space-y-2 border-t border-border pt-4 text-xs text-text-muted">
            <div className="flex items-center gap-2">
              <MapPin size={14} className="text-primary-lt" />
              <span>
                {isLost ? "Lost at:" : "Found at:"}{" "}
                <span className="font-semibold text-text">
                  {isLost ? item.location_lost : item.location_found}
                </span>
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Calendar size={14} className="text-primary-lt" />
              <span>
                {isLost ? "Lost date:" : "Found date:"}{" "}
                <span className="font-semibold text-text">
                  {new Date(isLost ? item.date_lost : item.date_found).toLocaleDateString()}
                </span>
              </span>
            </div>

            <div className="flex items-center gap-2">
              <User size={14} className="text-primary-lt" />
              <span>
                Posted by: <span className="font-semibold text-text">{item.user_name}</span>
              </span>
            </div>

            {/* Display Contact Info if claiming/contacting is needed */}
            {!isOwner && (item.user_email || item.user_phone) && (
              <div className="pt-2 border-t border-border/50 space-y-1">
                {item.user_email && (
                  <div className="flex items-center gap-2">
                    <Mail size={12} className="text-text-muted" />
                    <span className="text-[11px] select-all">{item.user_email}</span>
                  </div>
                )}
                {item.user_phone && (
                  <div className="flex items-center gap-2">
                    <Phone size={12} className="text-text-muted" />
                    <span className="text-[11px] select-all">{item.user_phone}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="p-6 pt-0 border-t border-border/50">
        {actionError && (
          <div className="mt-4 p-2 bg-red-50 border border-error/20 text-error text-xs rounded">
            {actionError}
          </div>
        )}

        {!showReportForm ? (
          <div className="pt-4 flex gap-2">
            {isLost ? (
              // Lost Item actions
              isOwner ? (
                item.status === "open" ? (
                  <button
                    onClick={handleClose}
                    disabled={actionLoading}
                    className="w-full py-2 px-4 bg-primary hover:bg-primary-lt text-surface font-semibold text-sm rounded-lg transition-all cursor-pointer disabled:bg-border"
                  >
                    Close Report
                  </button>
                ) : (
                  <button
                    disabled
                    className="w-full py-2 px-4 bg-border text-text-muted font-semibold text-sm rounded-lg cursor-not-allowed text-center font-sans"
                  >
                    Closed
                  </button>
                )
              ) : (
                item.status === "open" && (
                  <button
                    onClick={() => setShowReportForm(true)}
                    className="w-full flex items-center justify-center gap-2 py-2 px-4 border border-border hover:bg-bg text-text font-semibold text-sm rounded-lg transition-all cursor-pointer"
                  >
                    <AlertTriangle size={15} className="text-error" />
                    <span>Report Item</span>
                  </button>
                )
              )
            ) : (
              // Found Item actions
              item.status === "unclaimed" ? (
                <div className="w-full flex gap-2">
                  <button
                    onClick={handleClaim}
                    disabled={actionLoading}
                    className="flex-1 py-2 px-4 bg-primary hover:bg-primary-lt text-surface font-semibold text-sm rounded-lg transition-all cursor-pointer disabled:bg-border"
                  >
                    Claim Item
                  </button>
                  {!isOwner && (
                    <button
                      onClick={() => setShowReportForm(true)}
                      className="p-2 border border-border hover:bg-bg text-text rounded-lg transition-all cursor-pointer"
                      title="Report Listing"
                    >
                      <AlertTriangle size={16} className="text-error" />
                    </button>
                  )}
                </div>
              ) : (
                <button
                  disabled
                  className="w-full py-2 px-4 bg-border text-text-muted font-semibold text-sm rounded-lg cursor-not-allowed text-center font-sans"
                >
                  Claimed
                </button>
              )
            )}
          </div>
        ) : (
          <form onSubmit={handleReportSubmit} className="pt-4 space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-bold text-error uppercase tracking-wider">
              <ShieldAlert size={14} />
              <span>Report Listing</span>
            </div>

            <textarea
              required
              rows={2}
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              placeholder="Why are you reporting this item? (e.g. inappropriate item, wrong department, spam)"
              className="w-full px-2.5 py-1.5 border border-border rounded text-xs focus:outline-none focus:border-primary-lt bg-surface text-text resize-none font-sans"
            />

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowReportForm(false)}
                className="w-1/2 py-1.5 border border-border hover:bg-bg text-text font-semibold text-xs rounded-lg transition-all cursor-pointer font-sans"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={actionLoading || !reportReason.trim()}
                className="w-1/2 py-1.5 bg-primary hover:bg-primary-lt text-surface font-semibold text-xs rounded-lg transition-all cursor-pointer disabled:bg-border disabled:text-text-muted font-sans"
              >
                {actionLoading ? "Submitting..." : "Submit"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
