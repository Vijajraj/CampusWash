import React from "react";
import { Link } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import { Shirt, MessageSquare, Compass, ShieldAlert, LogOut } from "lucide-react";

export default function Dashboard() {
  const { user, logout } = useAuth();

  const isModeratorOrAdmin = user?.role === "moderator" || user?.role === "admin";

  return (
    <div className="min-h-screen bg-bg font-sans flex flex-col">
      {/* Header Bar */}
      <header className="bg-surface border-b border-border py-4 px-6 md:px-12 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-4">
          <span className="text-2xl font-bold text-primary tracking-tight">CampusWash</span>
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
            <span>Star</span>
            <span className="w-1.5 h-1.5 bg-accent rounded-full animate-pulse"></span>
          </a>
        </div>


        
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-4">
          <div className="text-right sm:block hidden">
            <p className="text-sm font-semibold text-text">{user?.name}</p>
            <p className="text-xs text-text-muted">{user?.register_number} • {user?.department}</p>
          </div>
          
          <button
            onClick={logout}
            className="flex items-center gap-2 py-1.5 px-4 text-xs font-semibold border border-border rounded-lg text-text hover:bg-bg hover:text-error hover:border-error/20 active:scale-95 transition-all cursor-pointer"
          >
            <LogOut size={14} />
            <span>Sign Out</span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 md:px-12 py-12">
        {/* Welcome Section */}
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-primary tracking-tight">
            Welcome back, {user?.name || "Student"}
          </h1>
          <p className="text-sm text-text-muted mt-2">
            Select a module to share clothes, respond to requests, or find items inside the CIT Chennai campus.
          </p>
        </div>

        {/* 3-Column Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Borrow & Lend */}
          <div className="bg-surface border border-border rounded-xl shadow-sm p-6 flex flex-col justify-between hover:shadow-md transition-all duration-300">
            <div>
              <div className="w-12 h-12 bg-bg text-primary flex items-center justify-center rounded-lg mb-4">
                <Shirt size={24} />
              </div>
              <h2 className="text-lg font-bold text-text mb-2">Borrow & Lend</h2>
              <p className="text-sm text-text-muted mb-6 leading-relaxed">
                Post clothes you want to lend, browse available listings, or request a borrow.
              </p>
            </div>
            <Link
              to="/borrow"
              className="w-full inline-block text-center py-2.5 px-4 bg-primary hover:bg-primary-lt text-surface font-semibold text-sm rounded-lg transition-all duration-200"
            >
              Enter Module
            </Link>
          </div>

          {/* Card 2: Item Requests */}
          <div className="bg-surface border border-border rounded-xl shadow-sm p-6 flex flex-col justify-between hover:shadow-md transition-all duration-300">
            <div>
              <div className="w-12 h-12 bg-bg text-primary flex items-center justify-center rounded-lg mb-4">
                <MessageSquare size={24} />
              </div>
              <h2 className="text-lg font-bold text-text mb-2">Item Request Board</h2>
              <p className="text-sm text-text-muted mb-6 leading-relaxed">
                Looking for a specific cloth? Post a request or help other students fulfill theirs.
              </p>
            </div>
            <Link
              to="/requests"
              className="w-full inline-block text-center py-2.5 px-4 bg-primary hover:bg-primary-lt text-surface font-semibold text-sm rounded-lg transition-all duration-200"
            >
              Enter Module
            </Link>
          </div>

          {/* Card 3: Lost & Found */}
          <div className="bg-surface border border-border rounded-xl shadow-sm p-6 flex flex-col justify-between hover:shadow-md transition-all duration-300">
            <div>
              <div className="w-12 h-12 bg-bg text-primary flex items-center justify-center rounded-lg mb-4">
                <Compass size={24} />
              </div>
              <h2 className="text-lg font-bold text-text mb-2">Lost & Found</h2>
              <p className="text-sm text-text-muted mb-6 leading-relaxed">
                Report lost clothes, list found belongings, or claim missing clothes.
              </p>
            </div>
            <Link
              to="/lost-found"
              className="w-full inline-block text-center py-2.5 px-4 bg-primary hover:bg-primary-lt text-surface font-semibold text-sm rounded-lg transition-all duration-200"
            >
              Enter Module
            </Link>
          </div>
        </div>

        {/* Admin Moderation Panel Section (Only visible to admin/moderator) */}
        {isModeratorOrAdmin && (
          <div className="mt-8 border-t border-border pt-8">
            <div className="bg-surface border border-border rounded-xl shadow-sm p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-red-50 text-error flex items-center justify-center rounded-lg">
                  <ShieldAlert size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-text">Moderation Desk</h3>
                  <p className="text-sm text-text-muted mt-0.5">
                    Role check: {user.role.toUpperCase()}. You have access to review pending reports and manage user permissions.
                  </p>
                </div>
              </div>
              <Link
                to="/admin"
                className="py-2 px-6 border border-error text-error hover:bg-red-50 font-semibold text-sm rounded-lg transition-all duration-200 active:scale-95 whitespace-nowrap"
              >
                Go to Moderation Queue
              </Link>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-6 px-6 text-center text-xs text-text-muted bg-surface mt-auto">
        <p>CampusWash © 2026 • CIT Chennai Clothes Exchange & Reporting System</p>
      </footer>
    </div>
  );
}
