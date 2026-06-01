import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import useAuth from "../hooks/useAuth";
import { LogIn } from "lucide-react";

export default function Login() {
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  // Use a ref to prevent duplicate login calls
  const handledRef = React.useRef(false);

  useEffect(() => {
    if (!supabase) return;

    // Show loading spinner if we detect OAuth callback params in URL
    const urlParams = new URLSearchParams(window.location.search);
    const hashFragment = window.location.hash;
    if (urlParams.get("code") || hashFragment.includes("access_token")) {
      setLoading(true);
    }

    // Let Supabase handle the PKCE exchange automatically (detectSessionInUrl: true).
    // We just listen for the result via onAuthStateChange.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("[Auth] onAuthStateChange:", event, session ? "has session" : "no session");

        // Only process actual sign-in events, not initial empty state
        if (event === "SIGNED_IN" && session && !handledRef.current) {
          handledRef.current = true;
          setLoading(true);
          setError("");

          try {
            console.log("[Auth] Sending Supabase token to backend...");
            const user = await login(session.access_token);
            console.log("[Auth] Backend login success, profile_complete:", user.profile_complete);

            if (user.profile_complete) {
              navigate("/dashboard");
            } else {
              navigate("/complete-profile");
            }
          } catch (err) {
            console.error("[Auth] Backend login error:", err);
            handledRef.current = false;
            if (err.error === "INVALID_COLLEGE_EMAIL") {
              setError("Access restricted. Only @citchennai.net accounts are permitted.");
            } else {
              setError(err.message || "Authentication failed. Please try again.");
            }
            try { await supabase.auth.signOut(); } catch (_) {}
            setLoading(false);
          }
        }

        // If Supabase finished initialization but there's no session and
        // we were showing the loading spinner (because URL had ?code=), stop loading.
        if (event === "INITIAL_SESSION" && !session) {
          setLoading(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [login, navigate]);

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
          redirectTo: `${window.location.origin}/`,
          queryParams: {
            hd: "citchennai.net"
          }
        }
      });
      if (signInError) throw signInError;
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
            The exclusive clothing share & board platform for CIT Chennai.
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
            {/* Elegant skeleton loader replacing standard spinner */}
            <div className="h-12 bg-border animate-pulse rounded-lg w-full"></div>
            <p className="text-sm text-text-muted animate-pulse">
              Authenticating with Google...
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
