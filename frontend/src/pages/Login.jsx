import React, { useState, useEffect, useRef } from "react";
import useAuth from "../hooks/useAuth";

export default function Login() {
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const googleBtnRef = useRef(null);
  const callbackRef = useRef(null);

  // Keep the callback ref updated with the latest closure
  callbackRef.current = async (response) => {
    if (!response.credential) {
      setError("Google Sign-In did not return a credential. Please try again.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      // login() updates AuthContext user state.
      // PublicOnlyRoute will automatically redirect once isAuthenticated=true.
      await login(response.credential);
    } catch (err) {
      console.error("[Auth] Google login error:", err);
      if (err.error === "INVALID_COLLEGE_EMAIL") {
        setError("Access restricted. Only @citchennai.net accounts are permitted.");
      } else {
        setError(err.message || "Authentication failed. Please try again.");
      }
      setLoading(false);
    }
  };

  useEffect(() => {
    let retryCount = 0;
    const maxRetries = 50; // 5 seconds max wait

    const initGoogle = () => {
      if (!window.google?.accounts?.id) {
        retryCount++;
        if (retryCount < maxRetries) {
          setTimeout(initGoogle, 100);
        } else {
          setError("Failed to load Google Sign-In. Please refresh the page.");
        }
        return;
      }

      window.google.accounts.id.initialize({
        client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
        callback: (response) => callbackRef.current(response),
        auto_select: false,
        ux_mode: "popup",
      });

      if (googleBtnRef.current) {
        window.google.accounts.id.renderButton(googleBtnRef.current, {
          theme: "outline",
          size: "large",
          width: 360,
          text: "signin_with",
          shape: "rectangular",
          logo_alignment: "left",
        });
      }
    };

    initGoogle();
  }, []);

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
            <div className="h-12 bg-border animate-pulse rounded-lg w-full"></div>
            <p className="text-sm text-text-muted animate-pulse">
              Signing you in...
            </p>
          </div>
        ) : (
          <div className="flex justify-center">
            <div ref={googleBtnRef}></div>
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
