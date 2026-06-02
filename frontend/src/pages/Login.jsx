import React, { useState, useEffect, useRef } from "react";
import { googleLogin } from "../api/auth";

export default function Login() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [gsiReady, setGsiReady] = useState(false);
  const googleBtnRef = useRef(null);

  // Pick up any error passed back via URL
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
        if (++retries < 80) {
          setTimeout(init, 100);
        } else {
          setError("Google Sign-In failed to load. Please check your internet connection and refresh.");
        }
        return;
      }

      try {
        window.google.accounts.id.initialize({
          client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
          callback: handleCredential,
          auto_select: false,
          ux_mode: "popup",
          cancel_on_tap_outside: true,
        });
        setGsiReady(true);
      } catch (e) {
        setError("Google Sign-In initialization failed: " + e.message);
      }
    };

    init();
  }, []);

  // Render the Google button once GSI is ready and the div is mounted
  useEffect(() => {
    if (gsiReady && googleBtnRef.current && !loading) {
      try {
        window.google.accounts.id.renderButton(googleBtnRef.current, {
          theme: "outline",
          size: "large",
          width: 340,
          text: "signin_with",
          shape: "rectangular",
          logo_alignment: "left",
        });
      } catch (e) {
        setError("Could not render Google Sign-In button: " + e.message);
      }
    }
  }, [gsiReady, loading]);

  const handleCredential = async (response) => {
    if (!response?.credential) {
      setError("Google Sign-In did not return a credential. Please try again.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const data = await googleLogin(response.credential);
      localStorage.setItem("token", data.access_token);

      // Hard navigate — bypasses all React state timing issues completely
      if (data.profile_complete) {
        window.location.href = "/dashboard";
      } else {
        window.location.href = "/complete-profile";
      }
    } catch (err) {
      console.error("[Login] Error:", err);
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
          <div className="space-y-4">
            {/* Google's rendered button */}
            <div className="flex justify-center">
              <div ref={googleBtnRef} className="w-[340px]"></div>
            </div>

            {/* Fallback plain button if Google button doesn't render */}
            {gsiReady && (
              <p className="text-xs text-text-muted">
                If the button above doesn't appear,{" "}
                <button
                  onClick={() => {
                    try {
                      window.google.accounts.id.prompt();
                    } catch (e) {
                      setError("Could not open Google Sign-In: " + e.message);
                    }
                  }}
                  className="text-primary underline cursor-pointer"
                >
                  click here
                </button>
              </p>
            )}

            {!gsiReady && !error && (
              <p className="text-xs text-text-muted animate-pulse">
                Loading Google Sign-In...
              </p>
            )}
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
