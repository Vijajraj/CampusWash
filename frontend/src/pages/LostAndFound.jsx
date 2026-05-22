import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useLostItems, useFoundItems } from "../hooks/useItems";
import ItemCard from "../components/ItemCard";
import { Plus, ArrowLeft, RefreshCw, SlidersHorizontal, Info } from "lucide-react";

export default function LostAndFound() {
  const [activeTab, setActiveTab] = useState("lost"); // "lost" or "found"
  const [lostPage, setLostPage] = useState(1);
  const [foundPage, setFoundPage] = useState(1);
  const [type, setType] = useState("");
  const [color, setColor] = useState("");

  const filters = { type, color };

  const {
    items: lostItems,
    totalPages: lostTotalPages,
    loading: lostLoading,
    error: lostError,
    refetch: refetchLost,
  } = useLostItems(filters, lostPage);

  const {
    items: foundItems,
    totalPages: foundTotalPages,
    loading: foundLoading,
    error: foundError,
    refetch: refetchFound,
  } = useFoundItems(filters, foundPage);

  const handleFilterChange = (field, value) => {
    if (field === "type") setType(value);
    if (field === "color") setColor(value);
    setLostPage(1);
    setFoundPage(1);
  };

  const handleReset = () => {
    setType("");
    setColor("");
    setLostPage(1);
    setFoundPage(1);
  };

  const handleRefresh = () => {
    if (activeTab === "lost") {
      refetchLost();
    } else {
      refetchFound();
    }
  };

  const activeItems = activeTab === "lost" ? lostItems : foundItems;
  const activeLoading = activeTab === "lost" ? lostLoading : foundLoading;
  const activeError = activeTab === "lost" ? lostError : foundError;
  const activePage = activeTab === "lost" ? lostPage : foundPage;
  const activeTotalPages = activeTab === "lost" ? lostTotalPages : foundTotalPages;
  const setActivePage = activeTab === "lost" ? setLostPage : setFoundPage;

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
          <span className="text-xl font-bold text-primary">Lost & Found Board</span>
        </div>

        <Link
          to="/lost-found/post"
          className="flex items-center gap-2 py-2 px-4 bg-primary hover:bg-primary-lt text-surface font-semibold text-sm rounded-lg shadow-sm transition-all duration-200"
        >
          <Plus size={16} />
          <span>Post Lost/Found Item</span>
        </Link>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 md:px-12 py-10">
        
        {/* Board Tabs */}
        <div className="flex border-b border-border mb-8">
          <button
            onClick={() => setActiveTab("lost")}
            className={`py-3 px-6 text-sm font-semibold border-b-2 transition-all cursor-pointer font-sans ${
              activeTab === "lost"
                ? "border-primary text-primary"
                : "border-transparent text-text-muted hover:text-text"
            }`}
          >
            Lost Items
          </button>
          <button
            onClick={() => setActiveTab("found")}
            className={`py-3 px-6 text-sm font-semibold border-b-2 transition-all cursor-pointer font-sans ${
              activeTab === "found"
                ? "border-primary text-primary"
                : "border-transparent text-text-muted hover:text-text"
            }`}
          >
            Found Items
          </button>
        </div>

        {/* Filter Controls Bar */}
        <section className="bg-surface border border-border rounded-xl p-5 mb-8 shadow-sm">
          <div className="flex items-center gap-2 text-xs font-bold text-primary uppercase tracking-wider mb-4">
            <SlidersHorizontal size={14} />
            <span>Filter Listings</span>
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
                <option value="trouser">Trouser</option>
                <option value="towel">Towel</option>
                <option value="bedsheet">Bedsheet</option>
                <option value="blazer">Blazer</option>
                <option value="other">Other</option>
              </select>
            </div>

            {/* Color Selector */}
            <div className="flex-1">
              <label className="block text-xs font-semibold text-text-muted mb-1">
                Color
              </label>
              <select
                value={color}
                onChange={(e) => handleFilterChange("color", e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:border-primary-lt bg-surface text-text text-sm"
              >
                <option value="">All Colors</option>
                <option value="white">White</option>
                <option value="black">Black</option>
                <option value="blue">Blue</option>
                <option value="grey">Grey</option>
                <option value="red">Red</option>
                <option value="green">Green</option>
                <option value="yellow">Yellow</option>
                <option value="other">Other</option>
              </select>
            </div>

            {/* Reset / Actions */}
            <div className="flex items-end gap-2">
              <button
                onClick={handleReset}
                className="py-2 px-4 border border-border rounded-lg text-text-muted hover:text-text hover:bg-bg text-sm font-semibold transition-all cursor-pointer font-sans"
              >
                Reset
              </button>
              <button
                onClick={handleRefresh}
                className="p-2 border border-border rounded-lg text-text-muted hover:text-text hover:bg-bg transition-all cursor-pointer"
                title="Refresh board"
              >
                <RefreshCw size={18} />
              </button>
            </div>
          </div>
        </section>

        {/* Info Box */}
        <div className="mb-6 p-4 bg-surface border border-border rounded-lg text-xs text-text-muted flex gap-2.5 items-start">
          <Info size={16} className="text-primary-lt shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            {activeTab === "lost" ? (
              <span>If you see your lost item in the **Found Items** tab, you can claim it and contact the finder using their email or phone number.</span>
            ) : (
              <span>If you found an item listed here, please ensure you only hand it over after verifying details with the claimant. Mark it as claimed once resolved.</span>
            )}
          </div>
        </div>

        {/* Listings Display Grid */}
        {activeError && (
          <div className="mb-6 p-4 bg-red-50 border border-error/20 text-error text-sm rounded-lg font-sans">
            {activeError}
          </div>
        )}

        {activeLoading ? (
          /* Skeleton Loader cards */
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-surface border border-border rounded-xl shadow-sm p-6 space-y-4">
                <div className="h-40 bg-border animate-pulse rounded-lg w-full"></div>
                <div className="h-6 bg-border animate-pulse rounded w-2/3"></div>
                <div className="h-4 bg-border animate-pulse rounded w-full"></div>
                <div className="h-4 bg-border animate-pulse rounded w-5/6"></div>
                <div className="h-10 bg-border animate-pulse rounded-lg w-full pt-2"></div>
              </div>
            ))}
          </div>
        ) : activeItems.length === 0 ? (
          /* Empty state - plain text only */
          <div className="text-center py-16 bg-surface border border-border rounded-xl shadow-sm">
            <p className="text-sm text-text-muted font-sans">No items found matching your search filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {activeItems.map((item) => (
              <ItemCard
                key={item.id}
                item={item}
                isLost={activeTab === "lost"}
                onRefresh={handleRefresh}
              />
            ))}
          </div>
        )}

        {/* Pagination Section */}
        {!activeLoading && activeItems.length > 0 && activeTotalPages > 1 && (
          <div className="mt-12 flex justify-center items-center gap-4">
            <button
              onClick={() => setActivePage((prev) => Math.max(prev - 1, 1))}
              disabled={activePage === 1}
              className="py-2 px-4 border border-border rounded-lg text-text hover:bg-surface font-semibold text-sm transition-all disabled:bg-border/30 disabled:text-text-muted disabled:cursor-not-allowed cursor-pointer font-sans"
            >
              Previous
            </button>
            <span className="text-sm font-semibold text-text-muted font-sans">
              Page {activePage} of {activeTotalPages}
            </span>
            <button
              onClick={() => setActivePage((prev) => Math.min(prev + 1, activeTotalPages))}
              disabled={activePage === activeTotalPages}
              className="py-2 px-4 border border-border rounded-lg text-text hover:bg-surface font-semibold text-sm transition-all disabled:bg-border/30 disabled:text-text-muted disabled:cursor-not-allowed cursor-pointer font-sans"
            >
              Next
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
