import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { LogIn } from "lucide-react";

export default function Login() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const location = useLocation();

  // Pick up any error passed back from the callback page
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const err = params.get("error");
    if (err) setError(decodeURIComponent(err));
  }, [location.search]);

  const handleSignIn = async () => {
    if (!supabase) {
      setError("Supabase connection is not configured.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const { error: signInError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          // Redirect to our dedicated callback page — fully isolated from route guards
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: { hd: "citchennai.net" },
        },
      });
      if (signInError) throw signInError;
      // Page will redirect to Google — no more code needed here
    } catch (err) {
      console.error(err);
      setError(err.message || "Authentication failed. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg font-sans px-4">
      <div className="w-full max-w-md bg-surface border border-border rounded-xl shadow-sm p-8 text-center transition-all duration-300">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-primary mb-2">
            CampusWash
          </h1>
          <p className="text-sm text-text-muted">
            The exclusive clothing share &amp; board platform for CIT Chennai.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-error/20 text-error text-sm rounded-lg text-left">
            <p className="font-semibold">Sign in failed</p>
            <p className="mt-1">{error}</p>
          </div>
        )}

        {loading ? (
          <div className="space-y-4">
            <div className="h-12 bg-border animate-pulse rounded-lg w-full"></div>
            <p className="text-sm text-text-muted animate-pulse">
              Redirecting to Google...
            </p>
          </div>
        ) : (
          <button
            onClick={handleSignIn}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-primary hover:bg-primary-lt text-surface font-medium rounded-lg shadow-sm transition-all duration-250 cursor-pointer active:scale-[0.98]"
          >
            <LogIn size={20} className="text-accent" />
            <span>Sign in with Google</span>
          </button>
        )}

        <div className="mt-8 border-t border-border pt-6">
          <p className="text-xs text-text-muted">
            By signing in, you agree to share clothes responsibly within the student community.
          </p>
        </div>
      </div>
    </div>
  );
}
