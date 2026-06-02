import React, { useEffect, useRef } from "react";
import { supabase } from "../lib/supabase";
import { supabaseLogin } from "../api/auth";

// With implicit flow, Supabase returns the token directly in the URL hash:
// /auth/callback#access_token=...&refresh_token=...
// detectSessionInUrl:true makes supabase.auth.getSession() pick it up automatically.
export default function AuthCallback() {
  const done = useRef(false);

  useEffect(() => {
    if (done.current) return;
    done.current = true;

    const finish = async () => {
      try {
        // With implicit flow, Supabase reads #access_token from the URL hash.
        // Poll briefly to let it initialize.
        let session = null;
        for (let i = 0; i < 15; i++) {
          const { data, error } = await supabase.auth.getSession();
          if (error) throw error;
          if (data?.session) { session = data.session; break; }
          await new Promise((r) => setTimeout(r, 300));
        }

        if (!session) throw new Error("Sign in failed — no session received. Please try again.");

        // Exchange Supabase token for our app's JWT
        const result = await supabaseLogin(session.access_token);
        localStorage.setItem("token", result.access_token);

        // Hard navigate — initAuth() in AuthContext will pick up the token cleanly
        window.location.href = result.profile_complete ? "/dashboard" : "/complete-profile";

      } catch (err) {
        console.error("[AuthCallback]", err);
        const msg = encodeURIComponent(err.message || "Authentication failed. Please try again.");
        window.location.href = `/?error=${msg}`;
      }
    };

    finish();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg font-sans">
      <div className="text-center space-y-4">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="text-text-muted text-sm font-medium">Signing you in...</p>
        <p className="text-text-muted text-xs">Please do not close or refresh.</p>
      </div>
    </div>
  );
}
