import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useRequests } from "../hooks/useRequests";
import RequestCard from "../components/RequestCard";
import { Plus, ArrowLeft, RefreshCw, SlidersHorizontal } from "lucide-react";

export default function ItemRequests() {
  const [page, setPage] = useState(1);
  const [type, setType] = useState("");
  const [size, setSize] = useState("");

  const filters = { type, size };
  const { requests, totalPages, loading, error, refetch } = useRequests(filters, page);

  const handleFilterChange = (field, value) => {
    if (field === "type") setType(value);
    if (field === "size") setSize(value);
    setPage(1);
  };

  const handleReset = () => {
    setType("");
    setSize("");
    setPage(1);
  };

  return (
    <div className="min-h-screen bg-bg font-sans flex flex-col">
      {/* Top Header */}
      <header className="bg-surface border-b border-border py-4 px-6 md:px-12 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            to="/dashboard"
            className="p-1.5 border border-border rounded-lg text-text-muted hover:text-text hover:bg-bg transition-all active:scale-95 cursor-pointer"
          >
            <ArrowLeft size={16} />
          </Link>
          <span className="text-xl font-bold text-primary">Item Request Board</span>
        </div>

        <Link
          to="/requests/post"
          className="flex items-center gap-2 py-2 px-4 bg-primary hover:bg-primary-lt text-surface font-semibold text-sm rounded-lg shadow-sm transition-all duration-200"
        >
          <Plus size={16} />
          <span>Post a Request</span>
        </Link>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 md:px-12 py-10">
        
        {/* Filter Controls Bar */}
        <section className="bg-surface border border-border rounded-xl p-5 mb-8 shadow-sm">
          <div className="flex items-center gap-2 text-xs font-bold text-primary uppercase tracking-wider mb-4">
            <SlidersHorizontal size={14} />
            <span>Filter Requests</span>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            {/* Type Selector */}
            <div className="flex-1">
              <label className="block text-xs font-semibold text-text-muted mb-1">
                Item Type
              </label>
              <select
                value={type}
                onChange={(e) => handleFilterChange("type", e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:border-primary-lt bg-surface text-text text-sm"
              >
                <option value="">All Types</option>
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

            {/* Size Selector */}
            <div className="flex-1">
              <label className="block text-xs font-semibold text-text-muted mb-1">
                Size
              </label>
              <select
                value={size}
                onChange={(e) => handleFilterChange("size", e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:border-primary-lt bg-surface text-text text-sm"
              >
                <option value="">All Sizes</option>
                <option value="XS">XS</option>
                <option value="S">S</option>
                <option value="M">M</option>
                <option value="L">L</option>
                <option value="XL">XL</option>
                <option value="XXL">XXL</option>
                <option value="Free">Free Size</option>
              </select>
            </div>

            {/* Reset / Actions */}
            <div className="flex items-end gap-2">
              <button
                onClick={handleReset}
                className="py-2 px-4 border border-border rounded-lg text-text-muted hover:text-text hover:bg-bg text-sm font-semibold transition-all cursor-pointer"
              >
                Reset
              </button>
              <button
                onClick={refetch}
                className="p-2 border border-border rounded-lg text-text-muted hover:text-text hover:bg-bg transition-all cursor-pointer"
                title="Refresh requests"
              >
                <RefreshCw size={18} />
              </button>
            </div>
          </div>
        </section>

        {/* Requests Grid */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-error/20 text-error text-sm rounded-lg">
            {error}
          </div>
        )}

        {loading ? (
          /* Skeleton placeholders */
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-surface border border-border rounded-xl shadow-sm p-6 space-y-4">
                <div className="h-5 bg-border animate-pulse rounded w-1/3"></div>
                <div className="h-6 bg-border animate-pulse rounded w-2/3"></div>
                <div className="h-16 bg-border animate-pulse rounded w-full"></div>
                <div className="h-4 bg-border animate-pulse rounded w-1/2"></div>
                <div className="h-10 bg-border animate-pulse rounded-lg w-full pt-2"></div>
              </div>
            ))}
          </div>
        ) : requests.length === 0 ? (
          /* Empty state - plain text only */
          <div className="text-center py-16 bg-surface border border-border rounded-xl shadow-sm">
            <p className="text-sm text-text-muted">No open requests found.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {requests.map((request) => (
              <RequestCard key={request.id} request={request} onRefresh={refetch} />
            ))}
          </div>
        )}

        {/* Pagination Section */}
        {!loading && requests.length > 0 && totalPages > 1 && (
          <div className="mt-12 flex justify-center items-center gap-4">
            <button
              onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
              disabled={page === 1}
              className="py-2 px-4 border border-border rounded-lg text-text hover:bg-surface font-semibold text-sm transition-all disabled:bg-border/30 disabled:text-text-muted disabled:cursor-not-allowed cursor-pointer"
            >
              Previous
            </button>
            <span className="text-sm font-semibold text-text-muted">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={page === totalPages}
              className="py-2 px-4 border border-border rounded-lg text-text hover:bg-surface font-semibold text-sm transition-all disabled:bg-border/30 disabled:text-text-muted disabled:cursor-not-allowed cursor-pointer"
            >
              Next
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
