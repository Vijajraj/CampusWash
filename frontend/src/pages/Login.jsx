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

  useEffect(() => {
    if (!supabase) return;

    const processOAuthCallback = async () => {
      const fullUrl = window.location.href;
      const urlParams = new URLSearchParams(window.location.search);
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const code = urlParams.get("code");
      const accessTokenInHash = hashParams.get("access_token");

      console.log("[Auth] Page loaded. URL:", fullUrl);
      console.log("[Auth] Code param:", code ? "present" : "absent");
      console.log("[Auth] Hash token:", accessTokenInHash ? "present" : "absent");

      if (!code && !accessTokenInHash) {
        console.log("[Auth] No OAuth callback detected — showing login button");
        return;
      }

      setLoading(true);
      console.log("[Auth] OAuth callback detected, processing...");

      try {
        if (code) {
          console.log("[Auth] Exchanging PKCE code for session...");
          const { data: exchangeData, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          console.log("[Auth] Exchange result:", exchangeData ? "success" : "no data", "error:", exchangeError);
          if (exchangeError) throw exchangeError;
        }

        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        console.log("[Auth] Session:", session ? "found" : "null", "error:", sessionError);
        if (sessionError) throw sessionError;

        if (session) {
          console.log("[Auth] Sending token to backend for login...");
          const user = await login(session.access_token);
          console.log("[Auth] Backend login success, profile_complete:", user.profile_complete);
          if (user.profile_complete) {
            navigate("/dashboard");
          } else {
            navigate("/complete-profile");
          }
          return;
        } else {
          console.log("[Auth] No session after code exchange — login failed");
        }
      } catch (err) {
        console.error("[Auth] OAuth callback error:", err);
        if (err.error === "INVALID_COLLEGE_EMAIL") {
          setError("Access restricted. Only @citchennai.net accounts are permitted.");
        } else {
          setError(err.message || "Authentication failed. Please try again.");
        }
        try { await supabase.auth.signOut(); } catch (_) {}
      }
      setLoading(false);
    };

    processOAuthCallback();
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
