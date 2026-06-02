import React, { useState, useEffect, useRef } from "react";
import { googleLogin } from "../api/auth";

export default function Login() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const googleBtnRef = useRef(null);

  // Pick up any error passed back via URL (e.g. non-college email)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const err = params.get("error");
    if (err) {
      setError(decodeURIComponent(err));
      window.history.replaceState(null, "", "/");
    }
  }, []);

  useEffect(() => {
    let retries = 0;

    const init = () => {
      if (!window.google?.accounts?.id) {
        if (++retries < 60) setTimeout(init, 100);
        else setError("Failed to load Google Sign-In. Please refresh.");
        return;
      }

      window.google.accounts.id.initialize({
        client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
        callback: handleCredential,
        auto_select: false,
        ux_mode: "popup",
        cancel_on_tap_outside: true,
      });

      if (googleBtnRef.current) {
        window.google.accounts.id.renderButton(googleBtnRef.current, {
          theme: "outline",
          size: "large",
          width: googleBtnRef.current.offsetWidth || 340,
          text: "signin_with",
          shape: "rectangular",
          logo_alignment: "left",
        });
      }
    };

    init();
  }, []);

  const handleCredential = async (response) => {
    if (!response?.credential) {
      setError("Google Sign-In failed. Please try again.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const data = await googleLogin(response.credential);
      // Store JWT then do a hard navigate — bypasses ALL React state timing issues
      localStorage.setItem("token", data.access_token);

      if (data.profile_complete) {
        window.location.href = "/dashboard";
      } else {
        window.location.href = "/complete-profile";
      }
    } catch (err) {
      console.error("[Login] Google login error:", err);
      if (err.error === "INVALID_COLLEGE_EMAIL") {
        setError("Access restricted. Only @citchennai.net accounts are permitted.");
      } else {
        setError(err.message || "Authentication failed. Please try again.");
      }
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg font-sans px-4">
      <div className="w-full max-w-md bg-surface border border-border rounded-xl shadow-sm p-8 text-center">
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
          <div className="space-y-3">
            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-sm text-text-muted">Signing you in...</p>
          </div>
        ) : (
          <div className="flex justify-center">
            <div ref={googleBtnRef} className="w-full max-w-[340px]"></div>
          </div>
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
