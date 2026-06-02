import React, { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { supabaseLogin } from "../api/auth";
import useAuth from "../hooks/useAuth";

// Dedicated OAuth callback page — completely isolated from route guards.
// Supabase redirects here after Google authentication with ?code=...
export default function AuthCallback() {
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  const handled = useRef(false);

  useEffect(() => {
    if (handled.current) return;
    handled.current = true;

    const handleCallback = async () => {
      try {
        // Supabase auto-detects ?code= and does the PKCE exchange internally
        // (detectSessionInUrl: true). Poll briefly for the session.
        let session = null;
        for (let i = 0; i < 10; i++) {
          const { data, error } = await supabase.auth.getSession();
          if (error) throw error;
          if (data?.session) {
            session = data.session;
            break;
          }
          await new Promise((r) => setTimeout(r, 300));
        }

        if (!session) throw new Error("No session received from Google. Please try again.");

        // Exchange Supabase session for our app JWT
        const result = await supabaseLogin(session.access_token);
        localStorage.setItem("token", result.access_token);

        // Update the AuthContext user state
        await refreshUser();

        if (result.profile_complete) {
          navigate("/dashboard", { replace: true });
        } else {
          navigate("/complete-profile", { replace: true });
        }
      } catch (err) {
        console.error("[AuthCallback] Error:", err);
        const msg = encodeURIComponent(
          err.message || "Authentication failed. Please try again."
        );
        navigate(`/?error=${msg}`, { replace: true });
      }
    };

    handleCallback();
  }, [navigate, refreshUser]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg font-sans">
      <div className="text-center space-y-4">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="text-text-muted text-sm font-medium">Signing you in...</p>
        <p className="text-text-muted text-xs">Please wait, do not refresh.</p>
      </div>
    </div>
  );
}
