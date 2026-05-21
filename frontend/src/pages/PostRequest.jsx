import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { createRequest } from "../api/requests";
import { showToast } from "../hooks/useBorrow";
import { ArrowLeft, CheckCircle2 } from "lucide-react";

export default function PostRequest() {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [itemType, setItemType] = useState("shirt");
  const [size, setSize] = useState("M");
  const [color, setColor] = useState("");
  const [neededBy, setNeededBy] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || !description || !itemType || !size || !color) {
      setError("All fields except needed by date are required");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const payload = {
        title: title.trim(),
        description: description.trim(),
        item_type: itemType,
        size,
        color: color.trim(),
        needed_by: neededBy ? neededBy : null,
      };

      await createRequest(payload);
      showToast("Item request posted successfully");
      setSuccess(true);
    } catch (err) {
      setError(err.message || "Failed to post request. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-bg font-sans flex flex-col items-center justify-center px-4">
        <div className="max-w-md w-full bg-surface border border-border rounded-xl shadow-sm p-8 text-center">
          <div className="w-16 h-16 bg-green-50 text-success flex items-center justify-center rounded-full mx-auto mb-6">
            <CheckCircle2 size={36} className="text-accent" />
          </div>
          <h2 className="text-2xl font-bold text-primary mb-2">Request Posted</h2>
          <p className="text-sm text-text-muted mb-6">
            Your item request has been published on the board. Other students will be able to see it and respond.
          </p>
          <div className="bg-bg border border-border p-4 rounded-lg text-xs font-semibold text-text mb-6">
            Important: This request expires in 7 days.
          </div>
          <Link
            to="/requests"
            className="w-full inline-block py-2.5 px-4 bg-primary hover:bg-primary-lt text-surface font-semibold text-sm rounded-lg shadow-sm transition-all duration-200"
          >
            Back to Request Board
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg font-sans flex flex-col">
      {/* Top Header */}
      <header className="bg-surface border-b border-border py-4 px-6 md:px-12 flex items-center gap-3">
        <Link
          to="/requests"
          className="p-1.5 border border-border rounded-lg text-text-muted hover:text-text hover:bg-bg transition-all active:scale-95 cursor-pointer"
        >
          <ArrowLeft size={16} />
        </Link>
        <span className="text-xl font-bold text-primary">Post an Item Request</span>
      </header>

      {/* Main Form Container */}
      <main className="flex-1 max-w-lg w-full mx-auto px-6 py-12 flex flex-col justify-center">
        <div className="bg-surface border border-border rounded-xl shadow-sm p-8">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-primary">Request Details</h2>
            <p className="text-sm text-text-muted mt-1">
              Describe the item you are looking for so other students can help.
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-error/20 text-error text-sm rounded-lg">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Title */}
            <div>
              <label className="block text-sm font-semibold text-text mb-1">
                Request Title
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Lab Coat for Chemistry session"
                className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:border-primary-lt bg-surface text-text text-sm"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-semibold text-text mb-1">
                Description
              </label>
              <textarea
                required
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Specify the use case, required condition, washing/return timeline..."
                className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:border-primary-lt bg-surface text-text text-sm resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Item Type */}
              <div>
                <label className="block text-sm font-semibold text-text mb-1">
                  Item Type
                </label>
                <select
                  value={itemType}
                  onChange={(e) => setItemType(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:border-primary-lt bg-surface text-text text-sm"
                >
                  <option value="shirt">Shirt</option>
                  <option value="tshirt">T-Shirt</option>
                  <option value="jeans">Jeans</option>
                  <option value="trousers">Trousers</option>
                  <option value="jacket">Jacket</option>
                  <option value="saree">Saree</option>
                  <option value="kurta">Kurta</option>
                  <option value="other">Other</option>
                </select>
              </div>

              {/* Size */}
              <div>
                <label className="block text-sm font-semibold text-text mb-1">
                  Size
                </label>
                <select
                  value={size}
                  onChange={(e) => setSize(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:border-primary-lt bg-surface text-text text-sm"
                >
                  <option value="XS">XS</option>
                  <option value="S">S</option>
                  <option value="M">M</option>
                  <option value="L">L</option>
                  <option value="XL">XL</option>
                  <option value="XXL">XXL</option>
                  <option value="Free">Free Size</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Color */}
              <div>
                <label className="block text-sm font-semibold text-text mb-1">
                  Preferred Color
                </label>
                <input
                  type="text"
                  required
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  placeholder="e.g. White"
                  className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:border-primary-lt bg-surface text-text text-sm"
                />
              </div>

              {/* Needed By Date */}
              <div>
                <label className="block text-sm font-semibold text-text mb-1">
                  Needed By <span className="text-text-muted font-normal">(Optional)</span>
                </label>
                <input
                  type="date"
                  value={neededBy}
                  onChange={(e) => setNeededBy(e.target.value)}
                  className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:border-primary-lt bg-surface text-text text-sm"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="pt-2">
              {loading ? (
                <div className="space-y-2">
                  <div className="h-10 bg-border animate-pulse rounded-lg w-full"></div>
                  <p className="text-center text-xs text-text-muted animate-pulse">
                    Posting your request...
                  </p>
                </div>
              ) : (
                <div className="flex gap-4">
                  <Link
                    to="/requests"
                    className="w-1/2 text-center py-2.5 px-4 border border-border hover:bg-bg text-text font-semibold rounded-lg transition-all cursor-pointer"
                  >
                    Cancel
                  </Link>
                  <button
                    type="submit"
                    className="w-1/2 py-2.5 px-4 bg-primary hover:bg-primary-lt text-surface font-semibold rounded-lg shadow-sm transition-all duration-250 cursor-pointer"
                  >
                    Post Request
                  </button>
                </div>
              )}
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
