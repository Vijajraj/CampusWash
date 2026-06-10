import React, { useState } from "react";
import { X, Star } from "lucide-react";
import { submitFeedback } from "../api/feedback";

export default function FeedbackModal({ onClose }) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim()) {
      setError("Please enter your feedback comments.");
      return;
    }
    if (rating === 0) {
      setError("Please select a star rating.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await submitFeedback(message.trim(), rating);
      setSuccess(true);
    } catch (err) {
      setError(err.message || "Failed to submit feedback. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs transition-opacity duration-300">
      <div className="relative w-full max-w-md bg-surface border border-border rounded-xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h3 className="text-lg font-bold text-primary">Submit Feedback</h3>
          <button
            onClick={onClose}
            className="p-1 border border-border rounded-lg text-text-muted hover:text-text hover:bg-bg transition-all active:scale-95 cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        {success ? (
          <div className="p-6 text-center space-y-4">
            <div className="w-12 h-12 bg-success/10 text-success flex items-center justify-center rounded-full mx-auto">
              <Star size={24} className="fill-accent text-accent animate-pulse" />
            </div>
            <h4 className="text-lg font-bold text-text">Thank you!</h4>
            <p className="text-sm text-text-muted">
              Your feedback has been submitted successfully. We appreciate your response to help improve CampusWash!
            </p>
            <button
              onClick={onClose}
              className="py-2 px-6 bg-primary hover:bg-primary-lt text-surface font-semibold text-sm rounded-lg transition-all duration-200 cursor-pointer"
            >
              Close
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {error && (
              <div className="p-3 bg-red-50 border border-error/20 text-error text-xs rounded-lg font-sans">
                {error}
              </div>
            )}

            {/* Star Rating Selector */}
            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-text">
                How would you rate your experience? <span className="text-error">*</span>
              </label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="p-1 hover:scale-110 active:scale-95 transition-all cursor-pointer text-gray-300"
                  >
                    <Star
                      size={24}
                      className={
                        star <= (hoverRating || rating)
                          ? "fill-accent text-accent"
                          : "fill-transparent text-gray-300"
                      }
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Feedback Message */}
            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-text">
                Comments / Suggestions <span className="text-error">*</span>
              </label>
              <textarea
                required
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Tell us what you like, or what we can improve..."
                className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:border-primary-lt bg-surface text-text text-sm resize-none font-sans"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-4 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="w-1/2 py-2.5 px-4 border border-border hover:bg-bg text-text font-semibold text-sm rounded-lg transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="w-1/2 py-2.5 px-4 bg-primary hover:bg-primary-lt text-surface font-semibold text-sm rounded-lg transition-all duration-200 cursor-pointer disabled:bg-border disabled:text-text-muted flex justify-center items-center gap-2"
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-surface border-t-transparent rounded-full animate-spin"></span>
                    <span>Submitting...</span>
                  </>
                ) : (
                  <span>Submit</span>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
