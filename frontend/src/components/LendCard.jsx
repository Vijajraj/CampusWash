import React, { useState } from "react";
import useAuth from "../hooks/useAuth";
import StatusBadge from "./StatusBadge";
import { requestBorrow, deleteListing } from "../api/borrow";
import { showToast } from "../hooks/useBorrow";
import { Calendar, User, Trash2, Clock, Eye } from "lucide-react";

export default function LendCard({ listing, onRefresh }) {
  const { user } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [reason, setReason] = useState("");
  const [from, setFrom] = useState("");
  const [until, setUntil] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isOwner = user?.id === listing.owner_id || user?.id === listing.owner?.id;
  const isAvailable = listing.status === "available";

  const handleRequestSubmit = async (e) => {
    e.preventDefault();
    if (!reason || !from || !until) {
      setError("Please fill all fields");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await requestBorrow(listing.id, reason, from, until);
      showToast("Borrow request sent successfully");
      setShowForm(false);
      setReason("");
      setFrom("");
      setUntil("");
      if (onRefresh) onRefresh();
    } catch (err) {
      setError(err.message || "Failed to request borrow");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this listing?")) return;
    try {
      await deleteListing(listing.id);
      showToast("Listing deleted successfully");
      if (onRefresh) onRefresh();
    } catch (err) {
      showToast(err.message || "Failed to delete listing");
    }
  };

  // Build API image URL if exists, else placeholder
  const imageSrc = listing.image_url
    ? listing.image_url.startsWith("http")
      ? listing.image_url
      : `${import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api/v1"}/static/${listing.image_url}`
    : null;

  return (
    <div className="bg-surface border border-border rounded-xl shadow-sm overflow-hidden flex flex-col justify-between hover:shadow-md transition-all duration-300">
      <div>
        {/* Listing Image */}
        <div className="h-48 w-full bg-bg relative flex items-center justify-center border-b border-border">
          {imageSrc ? (
            <img
              src={imageSrc}
              alt={listing.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="text-center p-6 text-text-muted flex flex-col items-center gap-2">
              <span className="text-xs uppercase font-semibold tracking-wider bg-border/40 px-2.5 py-1 rounded text-text">
                {listing.item_type}
              </span>
            </div>
          )}
          <div className="absolute top-3 right-3 bg-surface/90 backdrop-blur-xs py-1 px-2.5 rounded-lg border border-border">
            <StatusBadge status={listing.status} />
          </div>
        </div>

        {/* Listing Content */}
        <div className="p-6">
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-accent">
              {listing.color} • Size {listing.size}
            </span>
          </div>

          <h3 className="text-lg font-bold text-text mb-2 line-clamp-1">
            {listing.title}
          </h3>

          <p className="text-sm text-text-muted mb-4 line-clamp-2 leading-relaxed">
            {listing.description}
          </p>

          <div className="space-y-2 border-t border-border pt-4 text-xs text-text-muted">
            <div className="flex items-center gap-2">
              <User size={14} className="text-primary-lt" />
              <span>
                Lent by: <span className="font-semibold text-text">{listing.owner?.name || "Student"}</span>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Clock size={14} className="text-primary-lt" />
              <span>
                Max Borrow: <span className="font-semibold text-text">{listing.max_borrow_days} days</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="p-6 pt-0 border-t border-border/50">
        {!showForm ? (
          <div className="pt-4 flex gap-2">
            {isOwner ? (
              <button
                onClick={handleDelete}
                className="w-full flex items-center justify-center gap-2 py-2 px-4 border border-error/20 hover:bg-red-50 text-error font-semibold text-sm rounded-lg transition-all duration-200 cursor-pointer"
              >
                <Trash2 size={16} />
                <span>Delete Listing</span>
              </button>
            ) : isAvailable ? (
              <button
                onClick={() => setShowForm(true)}
                className="w-full py-2.5 px-4 bg-primary hover:bg-primary-lt text-surface font-semibold text-sm rounded-lg transition-all duration-200 cursor-pointer active:scale-98 shadow-sm"
              >
                Request Borrow
              </button>
            ) : (
              <button
                disabled
                className="w-full py-2.5 px-4 bg-border text-text-muted font-semibold text-sm rounded-lg cursor-not-allowed text-center"
              >
                Unavailable
              </button>
            )}
          </div>
        ) : (
          <form onSubmit={handleRequestSubmit} className="pt-4 space-y-4">
            <h4 className="text-xs font-bold text-primary uppercase tracking-wider">
              Request Borrow Details
            </h4>

            {error && (
              <div className="p-2 bg-red-50 border border-error/20 text-error text-xs rounded">
                {error}
              </div>
            )}

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] font-bold text-text-muted uppercase mb-1">
                  From Date
                </label>
                <input
                  type="date"
                  required
                  value={from}
                  onChange={(e) => setFrom(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-border rounded text-xs focus:outline-none focus:border-primary-lt bg-surface text-text"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-text-muted uppercase mb-1">
                  Until Date
                </label>
                <input
                  type="date"
                  required
                  value={until}
                  onChange={(e) => setUntil(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-border rounded text-xs focus:outline-none focus:border-primary-lt bg-surface text-text"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-text-muted uppercase mb-1">
                Reason for Borrowing
              </label>
              <textarea
                required
                rows={2}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. Need it for the upcoming college symposium"
                className="w-full px-2.5 py-1.5 border border-border rounded text-xs focus:outline-none focus:border-primary-lt bg-surface text-text resize-none"
              />
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="w-1/2 py-2 border border-border hover:bg-bg text-text font-semibold text-xs rounded-lg transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="w-1/2 py-2 bg-primary hover:bg-primary-lt text-surface font-semibold text-xs rounded-lg transition-all cursor-pointer disabled:bg-border disabled:text-text-muted"
              >
                {loading ? "Sending..." : "Confirm"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
