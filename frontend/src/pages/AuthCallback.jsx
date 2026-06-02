import React, { useEffect, useRef } from "react";
import { supabase } from "../lib/supabase";
import { supabaseLogin } from "../api/auth";

// Google redirects here after authentication.
// Supabase has already exchanged the code for a session automatically
// (detectSessionInUrl: true is the default). We just read the session,
// call our backend, store our JWT, then navigate.
export default function AuthCallback() {
  const done = useRef(false);

  useEffect(() => {
    if (done.current) return;
    done.current = true;

    const finish = async () => {
      try {
        // Wait for Supabase to finish its internal code exchange
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;

        if (!data.session) {
          // Give Supabase a moment if session isn't ready yet
          await new Promise((r) => setTimeout(r, 1000));
          const retry = await supabase.auth.getSession();
          if (!retry.data?.session) throw new Error("Sign in failed — please try again.");
          data.session = retry.data.session;
        }

        // Send Supabase access token to our backend, get our app JWT
        const result = await supabaseLogin(data.session.access_token);
        localStorage.setItem("token", result.access_token);

        // Hard navigate so initAuth() in AuthContext reads the new token cleanly
        window.location.href = result.profile_complete ? "/dashboard" : "/complete-profile";

      } catch (err) {
        console.error("[AuthCallback]", err);
        const msg = encodeURIComponent(err.message || "Authentication failed.");
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
