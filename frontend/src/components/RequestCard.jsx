import React, { useState } from "react";
import useAuth from "../hooks/useAuth";
import StatusBadge from "./StatusBadge";
import { respondToRequest, deleteRequest, fulfillRequest, getResponses } from "../api/requests";
import { showToast } from "../hooks/useBorrow";
import { supabase } from "../lib/supabase";
import { Calendar, User, Trash2, CheckCircle2, MessageCircle, ChevronDown, ChevronUp } from "lucide-react";

export default function RequestCard({ request, onRefresh }) {
  const { user } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [showResponses, setShowResponses] = useState(false);
  const [responses, setResponses] = useState([]);
  const [loadingResponses, setLoadingResponses] = useState(false);

  const isOwner = user?.id === request.requester_id;
  const isOpen = request.status === "open";

  const handleResponseSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    setLoading(true);
    setError("");

    try {
      await respondToRequest(request.id, message.trim());
      showToast("Response sent successfully");
      setShowForm(false);
      setMessage("");
      if (onRefresh) onRefresh();
    } catch (err) {
      if (err.error === "ALREADY_RESPONDED") {
        setError("You have already responded to this request.");
      } else {
        setError(err.message || "Failed to send response.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this request?")) return;
    try {
      await deleteRequest(request.id);
      showToast("Request deleted successfully");
      if (onRefresh) onRefresh();
    } catch (err) {
      showToast(err.message || "Failed to delete request");
    }
  };

  const handleFulfill = async () => {
    try {
      await fulfillRequest(request.id);
      showToast("Request marked as fulfilled");
      if (onRefresh) onRefresh();
    } catch (err) {
      showToast(err.message || "Failed to fulfill request");
    }
  };

  const toggleResponses = async () => {
    if (!showResponses) {
      setLoadingResponses(true);
      setShowResponses(true);
      try {
        const res = await getResponses(request.id);
        if (res.length > 0) {
          const responderIds = [...new Set(res.map((r) => r.responder_id))];
          const { data: userData } = await supabase
            .table("users")
            .select("id, name, email, phone")
            .in("id", responderIds);

          if (userData) {
            const userMap = {};
            userData.forEach((u) => {
              userMap[u.id] = u;
            });
            res.forEach((r) => {
              r.responder_name = userMap[r.responder_id]?.name || "Student";
              r.responder_email = userMap[r.responder_id]?.email || "";
              r.responder_phone = userMap[r.responder_id]?.phone || "";
            });
          }
        }
        setResponses(res);
      } catch (err) {
        showToast("Failed to load responses");
      } finally {
        setLoadingResponses(false);
      }
    } else {
      setShowResponses(false);
    }
  };

  return (
    <div className="bg-surface border border-border rounded-xl shadow-sm overflow-hidden flex flex-col justify-between hover:shadow-md transition-all duration-300">
      <div className="p-6">
        {/* Card Header Info */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-accent">
            {request.color || "Any Color"} • Size {request.size || "Any Size"}
          </span>
          <StatusBadge status={request.status} />
        </div>

        <h3 className="text-lg font-bold text-text mb-2 line-clamp-1">
          {request.title}
        </h3>

        <p className="text-sm text-text-muted mb-4 line-clamp-2 leading-relaxed">
          {request.description}
        </p>

        {/* Technical details metadata */}
        <div className="space-y-2 border-t border-border pt-4 text-xs text-text-muted">
          <div className="flex items-center gap-2">
            <User size={14} className="text-primary-lt" />
            <span>
              Requested by: <span className="font-semibold text-text">{request.requester_name || "Student"}</span>
            </span>
          </div>
          {request.needed_by && (
            <div className="flex items-center gap-2">
              <Calendar size={14} className="text-primary-lt" />
              <span>
                Needed by: <span className="font-semibold text-text">{new Date(request.needed_by).toLocaleDateString()}</span>
              </span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase bg-border/40 text-text px-2 py-0.5 rounded font-semibold tracking-wider">
              {request.item_type}
            </span>
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="p-6 pt-0 border-t border-border/50">
        {!showForm ? (
          <div className="pt-4 space-y-2">
            {isOwner ? (
              <div className="flex gap-2">
                <button
                  onClick={handleDelete}
                  className="w-1/2 flex items-center justify-center gap-2 py-2 px-3 border border-error/20 hover:bg-red-50 text-error font-semibold text-xs rounded-lg transition-all cursor-pointer"
                >
                  <Trash2 size={14} />
                  <span>Delete</span>
                </button>
                {isOpen && (
                  <button
                    onClick={handleFulfill}
                    className="w-1/2 flex items-center justify-center gap-2 py-2 px-3 bg-primary hover:bg-primary-lt text-surface font-semibold text-xs rounded-lg transition-all cursor-pointer"
                  >
                    <CheckCircle2 size={14} className="text-accent" />
                    <span>Fulfill</span>
                  </button>
                )}
              </div>
            ) : isOpen ? (
              <button
                onClick={() => setShowForm(true)}
                className="w-full py-2.5 px-4 bg-primary hover:bg-primary-lt text-surface font-semibold text-sm rounded-lg transition-all duration-200 cursor-pointer active:scale-98 shadow-sm"
              >
                I can help
              </button>
            ) : (
              <button
                disabled
                className="w-full py-2.5 px-4 bg-border text-text-muted font-semibold text-sm rounded-lg cursor-not-allowed text-center"
              >
                Fulfilling or Closed
              </button>
            )}

            {/* Owner Responses section */}
            {isOwner && (
              <div className="pt-2">
                <button
                  onClick={toggleResponses}
                  className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 border border-border hover:bg-bg text-text-muted hover:text-text font-semibold text-xs rounded-lg transition-all cursor-pointer"
                >
                  <MessageCircle size={14} />
                  <span>Responses</span>
                  {showResponses ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>
              </div>
            )}
          </div>
        ) : (
          <form onSubmit={handleResponseSubmit} className="pt-4 space-y-3">
            <h4 className="text-xs font-bold text-primary uppercase tracking-wider">
              Send Help Message
            </h4>

            {error && (
              <div className="p-2 bg-red-50 border border-error/20 text-error text-xs rounded">
                {error}
              </div>
            )}

            <div>
              <textarea
                required
                rows={2}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Let the requester know how you can help or where to collect the item..."
                className="w-full px-2.5 py-1.5 border border-border rounded text-xs focus:outline-none focus:border-primary-lt bg-surface text-text resize-none"
              />
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="w-1/2 py-1.5 border border-border hover:bg-bg text-text font-semibold text-xs rounded-lg transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="w-1/2 py-1.5 bg-primary hover:bg-primary-lt text-surface font-semibold text-xs rounded-lg transition-all cursor-pointer disabled:bg-border disabled:text-text-muted"
              >
                {loading ? "Sending..." : "Send"}
              </button>
            </div>
          </form>
        )}

        {/* Responses Expandable Panel */}
        {showResponses && (
          <div className="mt-4 pt-4 border-t border-border space-y-3 max-h-48 overflow-y-auto">
            {loadingResponses ? (
              <p className="text-xs text-text-muted animate-pulse text-center py-2">
                Loading responses...
              </p>
            ) : responses.length === 0 ? (
              <p className="text-xs text-text-muted text-center py-2">
                No responses received yet.
              </p>
            ) : (
              responses.map((resp) => (
                <div key={resp.id} className="p-2.5 bg-bg/50 border border-border rounded-lg text-xs">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-semibold text-text">{resp.responder_name}</span>
                    <span className="text-[9px] text-text-muted">
                      {new Date(resp.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-text mb-1.5 leading-relaxed">{resp.message}</p>
                  {(resp.responder_email || resp.responder_phone) && (
                    <div className="text-[9px] text-text-muted border-t border-border/50 pt-1 flex flex-wrap gap-2">
                      {resp.responder_email && <span>Email: {resp.responder_email}</span>}
                      {resp.responder_phone && <span>Phone: {resp.responder_phone}</span>}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
